import { getRedisClient, isRedisReady } from "../config/redis.js";


const memoryFallback = new Map();

function memoryIncrement(key, windowMs) {
  const now = Date.now();
  const entry = memoryFallback.get(key);
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryFallback.set(key, { count: 1, resetAt });
    return { totalHits: 1, resetTime: new Date(resetAt) };
  }
  entry.count += 1;
  return { totalHits: entry.count, resetTime: new Date(entry.resetAt) };
}

function memoryReset(key) {
  memoryFallback.delete(key);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryFallback) {
    if (entry.resetAt <= now) memoryFallback.delete(key);
  }
}, 60_000).unref();

const lastWarnAt = new Map();
function warnOnce(prefix, message) {
  const now = Date.now();
  const last = lastWarnAt.get(prefix) || 0;
  if (now - last > 30_000) {
    console.error(message);
    lastWarnAt.set(prefix, now);
  }
}

export class RedisRateLimitStore {
  constructor({ prefix, failMode = "open" }) {
    if (!prefix) throw new Error("RedisRateLimitStore requires a unique `prefix`.");
    this.prefix = prefix;
    this.failMode = failMode;
    this.windowMs = 60_000;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  fullKey(key) {
    return `rl:${this.prefix}:${key}`;
  }

  async increment(key) {
    const fullKey = this.fullKey(key);
    const redis = getRedisClient();

    if (!redis || !isRedisReady()) {
      if (this.failMode === "closed") {
        return memoryIncrement(fullKey, this.windowMs);
      }
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }

    try {
      const multiResult = await redis.multi().incr(fullKey).pttl(fullKey).exec();

      if (!multiResult) throw new Error("Redis MULTI returned no result");
      const [[incrErr, totalHits], [pttlErr, ttl]] = multiResult;
      if (incrErr) throw incrErr;
      if (pttlErr) throw pttlErr;

      let resetInMs = ttl;
      if (ttl < 0) {
        await redis.pexpire(fullKey, this.windowMs);
        resetInMs = this.windowMs;
      }

      return { totalHits, resetTime: new Date(Date.now() + resetInMs) };
    } catch (err) {
      warnOnce(
        this.prefix,
        `[RateLimit:${this.prefix}] Redis error, using ${
          this.failMode === "closed" ? "in-memory fallback (fail-closed)" : "fail-open"
        } behavior for this limiter until Redis recovers. Reason: ${err.message}`
      );

      if (this.failMode === "closed") {
        return memoryIncrement(fullKey, this.windowMs);
      }
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key) {
    const redis = getRedisClient();
    if (!redis || !isRedisReady()) return;
    try {
      const value = await redis.decr(this.fullKey(key));
      if (value < 0) await redis.set(this.fullKey(key), 0);
    } catch {
    }
  }

  async resetKey(key) {
    const fullKey = this.fullKey(key);
    memoryReset(fullKey);
    const redis = getRedisClient();
    if (!redis || !isRedisReady()) return;
    try {
      await redis.del(fullKey);
    } catch {
    }
  }
}
