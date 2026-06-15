import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "./env";

/**
 * Rate limiting. When Upstash Redis is configured we use a sliding-window
 * limiter that works across serverless instances. Otherwise we fall back to a
 * process-local limiter — fine for dev / single-instance deployments, but it
 * does NOT share state across instances (documented in the README).
 */

type Limiter = {
  limit: (key: string) => Promise<{ success: boolean; reset: number }>;
};

function upstashLimiter(tokens: number, window: `${number} ${"s" | "m" | "h"}`): Limiter {
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  });
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: "rl",
  });
  return {
    async limit(key) {
      const r = await rl.limit(key);
      return { success: r.success, reset: r.reset };
    },
  };
}

function memoryLimiter(tokens: number, windowMs: number): Limiter {
  const hits = new Map<string, number[]>();
  return {
    async limit(key) {
      const now = Date.now();
      const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      arr.push(now);
      hits.set(key, arr);
      const success = arr.length <= tokens;
      return { success, reset: now + windowMs };
    },
  };
}

const useUpstash = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
);

/** Booking creation: 5 per minute per user. */
export const bookingLimiter = useUpstash
  ? upstashLimiter(5, "1 m")
  : memoryLimiter(5, 60_000);

/** Magic-link requests: 3 per 10 minutes per email. */
export const magicLinkLimiter = useUpstash
  ? upstashLimiter(3, "10 m")
  : memoryLimiter(3, 10 * 60_000);

/** Presigned-upload requests: 20 per minute per user. */
export const uploadLimiter = useUpstash
  ? upstashLimiter(20, "1 m")
  : memoryLimiter(20, 60_000);
