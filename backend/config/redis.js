import { createClient } from "redis";

const CONNECT_TIMEOUT_MS = 5_000;

/** @type {import("redis").RedisClientType | null} */
let client = null;
/** @type {Promise<import("redis").RedisClientType | null> | null} */
let connectPromise = null;

export function isRedisEnabled() {
  return Boolean(process.env.REDIS_URL?.trim());
}

export async function getRedisClient() {
  if (!isRedisEnabled()) return null;
  if (client?.isOpen) return client;

  if (!connectPromise) {
    connectPromise = (async () => {
      const url = process.env.REDIS_URL.trim();
      const next = createClient({ url });
      next.on("error", (err) => console.error("Redis error:", err.message));

      await Promise.race([
        next.connect(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Redis connect timeout (${CONNECT_TIMEOUT_MS}ms)`)),
            CONNECT_TIMEOUT_MS
          )
        ),
      ]);

      client = next;
      return next;
    })().catch((err) => {
      console.warn("Redis connect failed:", err.message);
      return null;
    }).finally(() => {
      connectPromise = null;
    });
  }

  return connectPromise;
}

export async function redisGet(key) {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    return redis.get(key);
  } catch (err) {
    console.warn("Redis GET failed:", err.message);
    return null;
  }
}

export async function redisSetEx(key, ttlSeconds, value) {
  try {
    const redis = await getRedisClient();
    if (!redis) return false;
    await redis.setEx(key, ttlSeconds, value);
    return true;
  } catch (err) {
    console.warn("Redis SET failed:", err.message);
    return false;
  }
}

export async function redisDel(keys) {
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    const list = Array.isArray(keys) ? keys : [keys];
    if (!list.length) return;
    await redis.del(...list);
  } catch (err) {
    console.warn("Redis DEL failed:", err.message);
  }
}

/** Non-blocking SCAN + DEL for key patterns (never use KEYS in production). */
export async function redisDeleteByPattern(pattern) {
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    for await (const keys of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      const batch = Array.isArray(keys) ? keys : [keys];
      if (batch.length) {
        await redis.del(...batch);
      }
    }
  } catch (err) {
    console.warn("Redis SCAN/DEL failed:", err.message);
  }
}

/** @deprecated Use getRedisClient() — lazy connect */
export default {
  get isOpen() {
    return Boolean(client?.isOpen);
  },
  get: (...args) => getRedisClient().then((r) => (r ? r.get(...args) : null)),
  setEx: (...args) => getRedisClient().then((r) => (r ? r.setEx(...args) : false)),
  del: (...args) => getRedisClient().then((r) => (r ? r.del(...args) : undefined)),
  keys: async () => {
    console.warn("redis.keys() is deprecated — use redisDeleteByPattern");
    return [];
  },
};
