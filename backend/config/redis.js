import { createClient } from "redis";

/** @type {import("redis").RedisClientType | null} */
let client = null;
/** @type {Promise<import("redis").RedisClientType> | null} */
let connectPromise = null;

export async function getRedisClient() {
  if (client?.isOpen) return client;

  if (!connectPromise) {
    connectPromise = (async () => {
      const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
      const next = createClient({ url });
      next.on("error", (err) => console.error("Redis error:", err.message));
      await next.connect();
      client = next;
      return next;
    })().finally(() => {
      connectPromise = null;
    });
  }

  return connectPromise;
}

export async function redisGet(key) {
  try {
    const redis = await getRedisClient();
    return redis.get(key);
  } catch (err) {
    console.warn("Redis GET failed:", err.message);
    return null;
  }
}

export async function redisSetEx(key, ttlSeconds, value) {
  try {
    const redis = await getRedisClient();
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
  get: (...args) => getRedisClient().then((r) => r.get(...args)),
  setEx: (...args) => getRedisClient().then((r) => r.setEx(...args)),
  del: (...args) => getRedisClient().then((r) => r.del(...args)),
  keys: async () => {
    console.warn("redis.keys() is deprecated — use redisDeleteByPattern");
    return [];
  },
};
