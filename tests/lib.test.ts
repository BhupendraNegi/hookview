import { describe, it, expect, afterEach, vi } from "vitest";
import { methodColors } from "@/lib/method";
import { rel, exact } from "@/lib/time";
import { highlightJson, renderBody } from "@/lib/highlight";
import { newInboxId, isInboxId, deriveSource, derivePreview } from "@/lib/inbox";

describe("methodColors", () => {
  it("returns the exact tint for known methods", () => {
    expect(methodColors("GET")).toEqual({ fg: "#0f9d8f", bg: "#d7f5f0" });
    expect(methodColors("post")).toEqual({ fg: "#2f6bff", bg: "#e0e9ff" });
  });

  it("falls back to grey for unknown methods", () => {
    expect(methodColors("BREW")).toEqual({ fg: "#6a6781", bg: "#efeef5" });
  });
});

describe("rel", () => {
  afterEach(() => vi.useRealTimers());

  it("formats relative times like the prototype", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-30T12:00:00Z"));
    const now = Date.now();
    expect(rel(now)).toBe("just now");
    expect(rel(now - 2000)).toBe("just now"); // < 4s
    expect(rel(now - 5000)).toBe("5s ago");
    expect(rel(now - 120000)).toBe("2m ago");
    expect(rel(now - 7200000)).toBe("2h ago");
  });

  it("never goes negative for a future timestamp", () => {
    expect(rel(Date.now() + 10000)).toBe("just now");
  });
});

describe("exact", () => {
  it("produces a locale string with the time", () => {
    const s = exact(new Date("2026-06-30T12:34:56Z").getTime());
    expect(typeof s).toBe("string");
    expect(s).toMatch(/\d/);
    expect(s).toContain(":");
  });
});

describe("renderBody / highlightJson", () => {
  it("pretty-prints and highlights valid JSON", () => {
    const r = renderBody('{"a":1,"ok":true}');
    expect(r.isJson).toBe(true);
    expect(r.raw).toBe('{\n  "a": 1,\n  "ok": true\n}');
    expect(r.prettyHtml).toContain('color:#7c5cff'); // key
    expect(r.prettyHtml).toContain('color:#ea580c'); // number
    expect(r.prettyHtml).toContain('color:#e11d48'); // boolean
  });

  it("falls back to verbatim text for non-JSON", () => {
    const r = renderBody("not json at all");
    expect(r.isJson).toBe(false);
    expect(r.raw).toBe("not json at all");
  });

  it("escapes HTML so a body can't inject markup", () => {
    const html = highlightJson('"<script>&"');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("newInboxId", () => {
  it("matches the in_xxxxxxxx shape", () => {
    expect(newInboxId()).toMatch(/^in_[0-9a-z]{8}$/);
  });

  it("is unique across calls", () => {
    expect(newInboxId()).not.toBe(newInboxId());
  });
});

describe("isInboxId", () => {
  it("accepts every id newInboxId mints", () => {
    for (let i = 0; i < 20; i++) expect(isInboxId(newInboxId())).toBe(true);
  });

  it("rejects scanner paths, wrong lengths and wrong case", () => {
    for (const junk of ["wp-login.php", "", "in_", "in_short", "in_toolong123", "in_ABC12345", "xx_abc12345"]) {
      expect(isInboxId(junk)).toBe(false);
    }
  });
});

describe("deriveSource", () => {
  it("recognizes services by signature/topic headers", () => {
    expect(deriveSource({ "stripe-signature": "t=1,v1=x" })).toBe("Stripe");
    expect(deriveSource({ "x-github-event": "push" })).toBe("GitHub");
    expect(deriveSource({ "x-shopify-topic": "orders/create" })).toBe("Shopify");
  });

  it("falls back to the User-Agent product token", () => {
    expect(deriveSource({ "user-agent": "UptimeRobot/2.0" })).toBe("UptimeRobot");
    expect(deriveSource({ "user-agent": "curl/8.7.1" })).toBe("curl");
  });

  it("returns Unknown when there's nothing to go on", () => {
    expect(deriveSource({})).toBe("Unknown");
  });
});

describe("derivePreview", () => {
  it("prefers semantic event hints", () => {
    expect(derivePreview("POST", "/", { "x-github-event": "push" }, null, "")).toBe("push");
    expect(
      derivePreview("POST", "/", {}, '{"type":"charge.succeeded"}', "application/json"),
    ).toBe("charge.succeeded");
  });

  it("uses the subpath, then the method, as fallbacks", () => {
    expect(derivePreview("PUT", "/events/sub", {}, null, "")).toBe("/events/sub");
    expect(derivePreview("DELETE", "/", {}, null, "")).toBe("DELETE request");
  });

  it("does not throw on malformed JSON", () => {
    expect(derivePreview("POST", "/", {}, "{bad json", "application/json")).toBe(
      "POST request",
    );
  });
});
