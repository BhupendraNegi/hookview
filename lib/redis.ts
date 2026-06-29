import { Redis } from "@upstash/redis";

/**
 * Lazily-constructed Redis client, configured purely from env so the exact same
 * code runs against the dockerized SRH proxy locally and a real Upstash DB on
 * Vercel.
 *
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Construction is deferred until first use (not module load) so `next build`'s
 * page-data collection doesn't require the env vars to be present at build time.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis(): Redis {
  if (globalForRedis.redis) return globalForRedis.redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. " +
        "Copy .env.example to .env.local (Docker/SRH) or set them in Vercel.",
    );
  }

  const client = new Redis({ url, token });
  globalForRedis.redis = client;
  return client;
}
