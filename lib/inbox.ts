import { customAlphabet } from "nanoid";
import { getRedis } from "./redis";
import type { CapturedRequest } from "./types";

const MAX_REQUESTS = 100; // cap list length to stay within the free tier
const TTL_SECONDS = 60 * 60 * 24; // 24h auto-expiry

// Lowercase alphanumerics → ids like `in_4f9c2a` from the design.
const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

export function newInboxId(): string {
  return `in_${nano()}`;
}

/**
 * True if `id` has the exact shape `newInboxId` mints. The catcher uses this
 * to skip storage for scanner/typo paths so junk can't create Redis keys.
 */
export function isInboxId(id: string): boolean {
  return /^in_[0-9a-z]{8}$/.test(id);
}

/** A captured request id (distinct from the inbox id). */
function newRequestId(): string {
  return `req_${nano()}${nano()}`;
}

function key(inboxId: string): string {
  return `inbox:${inboxId}`;
}

/**
 * Persist a captured request: newest-first, capped, with a refreshed 24h TTL.
 * Stored as a JSON string so reads are unambiguous regardless of client
 * auto-deserialization behavior.
 */
export async function captureRequest(
  inboxId: string,
  data: Omit<CapturedRequest, "id">,
): Promise<CapturedRequest> {
  const record: CapturedRequest = { id: newRequestId(), ...data };
  const k = key(inboxId);

  // One pipelined round trip instead of three sequential REST calls.
  await getRedis()
    .pipeline()
    .lpush(k, JSON.stringify(record))
    .ltrim(k, 0, MAX_REQUESTS - 1)
    .expire(k, TTL_SECONDS)
    .exec();

  return record;
}

/** Fetch captured requests for an inbox, newest first. */
export async function getRequests(inboxId: string): Promise<CapturedRequest[]> {
  const raw = await getRedis().lrange<string | CapturedRequest>(key(inboxId), 0, -1);
  return raw
    .map((entry) => {
      // @upstash/redis may hand back either the raw string or a pre-parsed
      // object depending on its deserialization; handle both.
      if (typeof entry === "string") {
        try {
          return JSON.parse(entry) as CapturedRequest;
        } catch {
          return null;
        }
      }
      return entry;
    })
    .filter((r): r is CapturedRequest => r !== null);
}

/** Clear every captured request for an inbox ("Clear all"). */
export async function clearRequests(inboxId: string): Promise<void> {
  await getRedis().del(key(inboxId));
}

/**
 * Best-effort friendly source name from signature/topic headers, falling back
 * to the User-Agent product token. Header keys are expected lowercased.
 */
export function deriveSource(headers: Record<string, string>): string {
  if (headers["stripe-signature"]) return "Stripe";
  if (headers["x-github-event"] || /github-hookshot/i.test(headers["user-agent"] || ""))
    return "GitHub";
  if (headers["x-shopify-topic"] || headers["x-shopify-shop-domain"]) return "Shopify";
  if (headers["x-slack-signature"]) return "Slack";
  if (headers["x-twilio-signature"]) return "Twilio";
  if (headers["x-hub-signature"] || headers["x-hub-signature-256"]) return "Webhook";

  const ua = headers["user-agent"];
  if (ua) {
    // e.g. "UptimeRobot/2.0" -> "UptimeRobot", "curl/8.4.0" -> "curl"
    const token = ua.split(/[/\s]/)[0]?.trim();
    if (token) return token;
  }
  return "Unknown";
}

/**
 * Short human summary for the request list. Prefers semantic event hints
 * (GitHub event header, Shopify topic, a JSON `type`/`event` field), then the
 * request subpath, then the method.
 */
export function derivePreview(
  method: string,
  subpath: string,
  headers: Record<string, string>,
  body: string | null,
  contentType: string,
): string {
  if (headers["x-github-event"]) return headers["x-github-event"];
  if (headers["x-shopify-topic"]) return headers["x-shopify-topic"];

  if (body && /json/i.test(contentType)) {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object") {
        const hint =
          parsed.type ?? parsed.event ?? parsed.event_type ?? parsed.action;
        if (typeof hint === "string" && hint) return hint;
      }
    } catch {
      /* not JSON — fall through */
    }
  }

  if (subpath && subpath !== "/") return subpath;
  return `${method} request`;
}
