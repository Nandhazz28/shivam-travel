import Redis from "ioredis";

let client = null;
let ready = false;
let lastErrorLoggedAt = 0;
const ERROR_LOG_THROTTLE_MS = 30_000;

function throttledErrorLog(...args) {
  const now = Date.now();
  if (now - lastErrorLoggedAt > ERROR_LOG_THROTTLE_MS) {
    console.error(...args);
    lastErrorLoggedAt = now;
  }
}

function getTlsOptions(url) {
  const isRediss = typeof url === "string" && url.startsWith("rediss://");
  const isUpstash = typeof url === "string" && url.includes(".upstash.io");
  const isExplicitTls = process.env.REDIS_TLS === "true";

  if (isRediss || isUpstash || isExplicitTls) {
    return process.env.REDIS_TLS_REJECT_UNAUTHORIZED === "false"
      ? { rejectUnauthorized: false }
      : {};
  }
  return undefined;
}

export function getRedisClient() {
  if (client) return client;

  const url = process.env.REDIS_URL;
  if (!url) {
    throttledErrorLog(
      "[Redis] REDIS_URL is not set. Rate limiting will run on a per-instance " +
        "in-memory fallback instead of a shared Redis store. This is fine for " +
        "local development but is NOT recommended for a multi-instance " +
        "production deployment (each instance would track its own counters)."
    );
    return null;
  }

  const tls = getTlsOptions(url);

  client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: false,
    retryStrategy(attempt) {
      return Math.min(attempt * 200, 5000);
    },
    ...(tls ? { tls } : {}),
  });

  client.on("connect", () => {
  });

  client.on("ready", () => {
    ready = true;
    console.log("[Redis] Connected and ready.");
  });

  client.on("error", (err) => {
    ready = false;
    throttledErrorLog("[Redis] Connection error:", err.message);
  });

  client.on("close", () => {
    ready = false;
  });

  client.on("reconnecting", () => {
    ready = false;
  });

  return client;
}

export function isRedisReady() {
  return ready && client !== null && client.status === "ready";
}

export async function initRedis(timeoutMs = 5000) {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn(
      "[Redis] REDIS_URL is not set. Rate limiting will use a per-instance " +
        "in-memory fallback."
    );
    return null;
  }

  const redis = getRedisClient();
  if (!redis) return null;

  if (isRedisReady()) return redis;

  return new Promise((resolve) => {
    let timer = null;

    const onReady = () => {
      cleanup();
      resolve(redis);
    };

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      redis.removeListener("ready", onReady);
    };

    redis.once("ready", onReady);

    timer = setTimeout(() => {
      cleanup();
      console.warn(
        `[Redis] Connection timed out after ${timeoutMs}ms. Continuing server ` +
          "startup with rate-limiter fallback behavior while Redis reconnects."
      );
      resolve(redis);
    }, timeoutMs);
  });
}

export async function closeRedisClient() {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
}

