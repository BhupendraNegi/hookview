import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock only the Redis-touching helpers; keep deriveSource/derivePreview/newInboxId
// real so we test the routes' own logic without a live Redis.
vi.mock("@/lib/inbox", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/inbox")>();
  return {
    ...actual,
    captureRequest: vi.fn(),
    getRequests: vi.fn(),
    clearRequests: vi.fn(),
  };
});

import { captureRequest, getRequests, clearRequests } from "@/lib/inbox";
import * as catcher from "@/app/hook/[...slug]/route";
import { POST as createInbox } from "@/app/api/inbox/create/route";
import { GET as listRequests, DELETE as clearAll } from "@/app/api/inbox/[id]/requests/route";

const ctx = (slug: string[]) => ({ params: Promise.resolve({ slug }) });
const capturedData = () => (captureRequest as ReturnType<typeof vi.fn>).mock.calls[0][1];

beforeEach(() => vi.clearAllMocks());

describe("catcher /hook/[...slug]", () => {
  it("captures a POST with raw body, headers and query; returns 200", async () => {
    const req = new NextRequest("http://localhost/hook/in_abc12345?x=1", {
      method: "POST",
      body: '{"type":"charge.succeeded"}',
      headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=z" },
    });

    const res = await catcher.POST(req, ctx(["in_abc12345"]));
    expect(res.status).toBe(200);

    expect(captureRequest).toHaveBeenCalledTimes(1);
    expect((captureRequest as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe("in_abc12345");
    const data = capturedData();
    expect(data.method).toBe("POST");
    expect(data.path).toBe("/hook/in_abc12345");
    expect(data.query).toEqual({ x: "1" });
    expect(data.body).toBe('{"type":"charge.succeeded"}');
    expect(data.contentType).toBe("application/json");
    expect(data.source).toBe("Stripe"); // real deriveSource
    expect(data.preview).toBe("charge.succeeded"); // real derivePreview
  });

  it("never rejects malformed bodies — stores them raw and still 200s", async () => {
    const req = new NextRequest("http://localhost/hook/in_abc12345", {
      method: "POST",
      body: "{bad json",
      headers: { "content-type": "application/json" },
    });

    const res = await catcher.POST(req, ctx(["in_abc12345"]));
    expect(res.status).toBe(200);
    const data = capturedData();
    expect(data.body).toBe("{bad json");
    expect(data.preview).toBe("POST request");
  });

  it("captures a GET with query and no body, and keeps the subpath", async () => {
    const req = new NextRequest("http://localhost/hook/in_abc12345/events?token=t", {
      method: "GET",
    });

    const res = await catcher.GET(req, ctx(["in_abc12345", "events"]));
    expect(res.status).toBe(200);
    const data = capturedData();
    expect(data.method).toBe("GET");
    expect(data.body).toBeNull();
    expect(data.query).toEqual({ token: "t" });
    expect(data.path).toBe("/hook/in_abc12345/events");
  });

  it("returns 200 but stores nothing for ids that don't match the minted shape", async () => {
    for (const junk of ["wp-login.php", "in_short", "in_ABC12345", "in_toolong123"]) {
      const req = new NextRequest(`http://localhost/hook/${junk}`, {
        method: "POST",
        body: "x",
      });
      const res = await catcher.POST(req, ctx([junk]));
      expect(res.status).toBe(200); // never reject — senders stay satisfied
      expect((await res.json()).received).toBe(false);
    }
    expect(captureRequest).not.toHaveBeenCalled();
  });

  it("truncates oversized bodies by byte length, without splitting a character", async () => {
    // 100K × "€" (3 bytes) = 300KB utf-8 but only 100K chars — a char-based
    // cap would keep it all; the byte cap must truncate it.
    const raw = "€".repeat(100_000);
    const req = new NextRequest("http://localhost/hook/in_abc12345", {
      method: "POST",
      body: raw,
    });

    const res = await catcher.POST(req, ctx(["in_abc12345"]));
    expect(res.status).toBe(200);

    const body = capturedData().body as string;
    expect(body.endsWith("…[truncated by HookView]")).toBe(true);
    const stored = body.slice(0, body.indexOf("\n…[truncated"));
    expect(Buffer.byteLength(stored, "utf8")).toBeLessThanOrEqual(256 * 1024);
    expect(stored).not.toContain("�"); // 256K bytes lands mid-€; the artifact must be stripped
  });

  it("still acknowledges (200) if storage throws", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (captureRequest as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("redis down"));
    const req = new NextRequest("http://localhost/hook/in_abc12345", { method: "POST", body: "x" });
    const res = await catcher.POST(req, ctx(["in_abc12345"]));
    expect(res.status).toBe(200);
    errSpy.mockRestore();
  });

  it("binds every HTTP method to the same handler", () => {
    for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const) {
      expect(typeof catcher[m]).toBe("function");
    }
  });
});

describe("POST /api/inbox/create", () => {
  it("returns a fresh inbox id", async () => {
    const res = await createInbox();
    const json = await res.json();
    expect(json.id).toMatch(/^in_[0-9a-z]{8}$/);
  });
});

describe("/api/inbox/[id]/requests", () => {
  it("GET returns the stored requests", async () => {
    (getRequests as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ id: "r1" }]);
    const res = await listRequests(new NextRequest("http://localhost/api/inbox/x/requests"), {
      params: Promise.resolve({ id: "x" }),
    });
    expect(getRequests).toHaveBeenCalledWith("x");
    expect((await res.json()).requests).toEqual([{ id: "r1" }]);
  });

  it("DELETE clears the inbox", async () => {
    const res = await clearAll(new NextRequest("http://localhost/api/inbox/x/requests"), {
      params: Promise.resolve({ id: "x" }),
    });
    expect(clearRequests).toHaveBeenCalledWith("x");
    expect((await res.json()).ok).toBe(true);
  });
});
