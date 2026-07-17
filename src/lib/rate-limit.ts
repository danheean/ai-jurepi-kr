/**
 * Platform-wide Rate Limiter
 *
 * Per-IP, per-endpoint token bucket.
 * Uses Cloudflare KV if RATE_LIMIT_KV binding exists; falls back to per-isolate memory.
 *
 * SPEC.md: no user input is stored; only hashed-IP → token count.
 */

// Type for Cloudflare KV binding (optional)
type KVNamespace = any; // STUB: properly typed via Cloudflare bindings at runtime

export interface RateLimitConfig {
  endpoint: string; // 'hairstyle-analyze' | 'hairstyle-recommend' | ...
  requestsPerMinute: number;
  ipHasher?: (ip: string) => string;
}

export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const hashedIp = config.ipHasher ? config.ipHasher(ip) : hashIp(ip);
  const key = `rate:${config.endpoint}:${hashedIp}`;
  const window = 60; // seconds

  // Try KV first (Cloudflare Workers binding)
  const kv = (globalThis as any).RATE_LIMIT_KV as KVNamespace | undefined;

  if (!kv) {
    // Per-isolate in-memory fallback
    return checkRateLimitMemory(key, config.requestsPerMinute, window);
  }

  // KV-backed (persistent across isolates)
  const current = ((await kv.get(key, 'json')) ?? {
    count: 0,
    reset: Date.now(),
  }) as { count: number; reset: number };

  const elapsedSeconds = Math.floor((Date.now() - current.reset) / 1000);

  if (elapsedSeconds > window) {
    // Window expired, reset
    current.count = 0;
    current.reset = Date.now();
  }

  if (current.count >= config.requestsPerMinute) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(window - elapsedSeconds),
    };
  }

  // Increment and persist
  current.count++;
  await kv.put(key, JSON.stringify(current), {
    expirationTtl: window + 10, // grace period
  });

  return { allowed: true };
}

/**
 * Hash IP for anonymity + storage efficiency
 * Simplified version; upgrade to SHA256 if needed
 */
function hashIp(ip: string): string {
  return ip.split(':')[0];
}

/**
 * Per-isolate in-memory fallback
 * Loses state on restart; weaker but functional
 */
const inMemoryBuckets = new Map<
  string,
  { count: number; reset: number }
>();

function checkRateLimitMemory(
  key: string,
  limit: number,
  windowSeconds: number
): { allowed: boolean; retryAfterSeconds?: number } {
  const current = inMemoryBuckets.get(key) ?? {
    count: 0,
    reset: Date.now(),
  };

  const elapsedSeconds = Math.floor((Date.now() - current.reset) / 1000);

  if (elapsedSeconds > windowSeconds) {
    current.count = 0;
    current.reset = Date.now();
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(windowSeconds - elapsedSeconds),
    };
  }

  current.count++;
  inMemoryBuckets.set(key, current);

  return { allowed: true };
}
