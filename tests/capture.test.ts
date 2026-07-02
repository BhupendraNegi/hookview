import { describe, it, expect, beforeEach, vi } from "vitest";

// Fake Redis client: pipeline() returns a chainable that records the queued
// commands; lrange/del are used directly by the read/clear helpers.
const { redis, chain } = vi.hoisted(() => {
  const chain = {
    lpush: vi.fn(),
    ltrim: vi.fn(),
    expire: vi.fn(),
    exec: vi.fn().mockResolvedValue([1, "OK", 1]),
  };
  chain.lpush.mockReturnValue(chain);
  chain.ltrim.mockReturnValue(chain);
  chain.expire.mockReturnValue(chain);
  const redis = {
    pipeline: vi.fn(() => chain),
    lrange: vi.fn(),
    del: vi.fn(),
  };
  return { redis, chain };
});

vi.mock("@/lib/redis", () => ({ getRedis: () => redis }));

import { captureRequest, getRequests, clearRequests } from "@/lib/inbox";
import type { CapturedRequest } from "@/lib/types";

const data: Omit<CapturedRequest, "id"> = {
  method: "POST",
  path: "/hook/in_abc12345",
  query: {},
  headers: { "user-agent": "curl/8.7.1" },
  body: '{"type":"x"}',
  contentType: "application/json",
  timestamp: 1_700_000_000_000,
  source: "curl",
  preview: "x",
};

beforeEach(() => vi.clearAllMocks());

describe("captureRequest", () => {
  it("stores via a single pipeline: lpush → ltrim(0,99) → expire(24h) → exec", async () => {
    const record = await captureRequest("in_abc12345", data);

    expect(redis.pipeline).toHaveBeenCalledTimes(1);
    expect(chain.lpush).toHaveBeenCalledWith("inbox:in_abc12345", JSON.stringify(record));
    expect(chain.ltrim).toHaveBeenCalledWith("inbox:in_abc12345", 0, 99);
    expect(chain.expire).toHaveBeenCalledWith("inbox:in_abc12345", 86400);
    expect(chain.exec).toHaveBeenCalledTimes(1);
  });

  it("returns the stored record with a fresh req_ id", async () => {
    const record = await captureRequest("in_abc12345", data);
    expect(record.id).toMatch(/^req_[0-9a-z]{16}$/);
    expect(record).toMatchObject(data);
  });
});

describe("getRequests", () => {
  it("parses JSON strings, keeps pre-parsed objects, drops corrupt entries", async () => {
    redis.lrange.mockResolvedValueOnce(['{"id":"r1"}', { id: "r2" }, "{corrupt"]);
    const out = await getRequests("in_abc12345");
    expect(redis.lrange).toHaveBeenCalledWith("inbox:in_abc12345", 0, -1);
    expect(out.map((r) => r.id)).toEqual(["r1", "r2"]);
  });
});

describe("clearRequests", () => {
  it("deletes the inbox key", async () => {
    await clearRequests("in_abc12345");
    expect(redis.del).toHaveBeenCalledWith("inbox:in_abc12345");
  });
});
