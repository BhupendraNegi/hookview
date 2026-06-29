import { NextRequest, NextResponse } from "next/server";
import {
  captureRequest,
  deriveSource,
  derivePreview,
} from "@/lib/inbox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Stored body is capped so a giant payload can't blow the Redis free tier.
const MAX_BODY_BYTES = 256 * 1024;

/**
 * THE CATCHER — the critical route.
 *
 * Accepts ANY method, content-type and body. It must never validate, reject,
 * or 500 on bad input; it reads the RAW body first, stores everything verbatim,
 * and always answers 200 so the calling service is satisfied.
 *
 * `slug` is a catch-all: slug[0] is the inbox id, the rest is an optional
 * subpath (so pointing a service at `/hook/<id>/events` still works).
 */
async function handle(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string[] }> },
): Promise<NextResponse> {
  try {
    const { slug } = await ctx.params;
    const inboxId = slug?.[0];
    if (!inboxId) {
      return NextResponse.json({ ok: false, error: "missing inbox id" }, { status: 404 });
    }

    // 1) Read the RAW body BEFORE any parsing. Empty body => null.
    let body: string | null = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const raw = await request.text();
      if (raw.length > 0) {
        body =
          raw.length > MAX_BODY_BYTES
            ? raw.slice(0, MAX_BODY_BYTES) + "\n…[truncated by HookView]"
            : raw;
      }
    }

    // 2) Collect headers (lowercased keys, as delivered) and query params.
    const headers: Record<string, string> = {};
    request.headers.forEach((value, k) => {
      headers[k] = value;
    });

    const query: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, k) => {
      query[k] = value;
    });

    const contentType = headers["content-type"] ?? "";
    const path = "/hook/" + slug.join("/");
    const subpath = "/" + slug.slice(1).join("/");

    // 3) Derive UI-only hints, then store. None of this can reject the request.
    await captureRequest(inboxId, {
      method: request.method,
      path,
      query,
      headers,
      body,
      contentType,
      timestamp: Date.now(),
      source: deriveSource(headers),
      preview: derivePreview(request.method, subpath, headers, body, contentType),
    });

    return NextResponse.json({ ok: true, received: true });
  } catch (err) {
    // Even on an internal failure we acknowledge, so senders don't retry-storm.
    console.error("[catcher] capture failed:", err);
    return NextResponse.json({ ok: true, received: false });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
