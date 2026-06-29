import { Redis } from "@upstash/redis";

/**
 * Single Redis client, configured purely from env so the exact same code runs
 * against the dockerized SRH proxy locally and a real Upstash DB on Vercel.
 *
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */
function makeClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. " +
        "Copy .env.example to .env.local (Docker/SRH) or set them in Vercel.",
    );
  }

  return new Redis({ url, token });
}

// Reuse one client across hot reloads / warm lambdas.
const globalForRedis = globalThis as unknown as { redis?: Redis };
export const redis = globalForRedis.redis ?? makeClient();
if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
