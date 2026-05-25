import crypto from "crypto";
import { getRedisClient } from "../config/redis.js";

const UNLOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

/**
 * Acquire a short-lived distributed lock. Returns null if busy.
 * @param {string} key
 * @param {number} ttlMs
 */
export async function acquireLock(key, ttlMs = 30_000) {
  try {
    const redis = await getRedisClient();
    const token = crypto.randomUUID();
    const ok = await redis.set(key, token, { NX: true, PX: ttlMs });
    if (ok !== "OK") return null;
    return {
      key,
      token,
      async release() {
        try {
          await redis.eval(UNLOCK_SCRIPT, { keys: [key], arguments: [token] });
        } catch {
          /* ignore */
        }
      },
    };
  } catch (err) {
    console.warn("Lock acquire failed:", err.message);
    return null;
  }
}

/**
 * Run fn while holding lock. Throws LOCK_BUSY if unavailable.
 */
export async function withLock(key, ttlMs, fn) {
  const lock = await acquireLock(key, ttlMs);
  if (!lock) {
    const err = new Error("Resource is busy — try again");
    err.status = 409;
    err.code = "LOCK_BUSY";
    throw err;
  }
  try {
    return await fn();
  } finally {
    await lock.release();
  }
}
