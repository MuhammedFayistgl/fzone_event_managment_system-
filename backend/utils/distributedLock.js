import crypto from "crypto";
import { getRedisClient, isRedisEnabled } from "../config/redis.js";

const UNLOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

/** @type {Map<string, { token: string, expiresAt: number }>} */
const memoryLocks = new Map();
let loggedMemoryFallback = false;

function pruneExpiredMemoryLocks() {
  const now = Date.now();
  for (const [key, entry] of memoryLocks) {
    if (entry.expiresAt <= now) memoryLocks.delete(key);
  }
}

function acquireMemoryLock(key, ttlMs) {
  if (!loggedMemoryFallback) {
    console.warn("Distributed lock: in-memory fallback (single instance)");
    loggedMemoryFallback = true;
  }

  pruneExpiredMemoryLocks();

  const now = Date.now();
  if (memoryLocks.has(key)) return null;

  const token = crypto.randomUUID();
  memoryLocks.set(key, { token, expiresAt: now + ttlMs });

  return {
    key,
    token,
    async release() {
      const entry = memoryLocks.get(key);
      if (entry?.token === token) {
        memoryLocks.delete(key);
      }
    },
  };
}

/**
 * Acquire a short-lived distributed lock. Returns null if busy.
 * @param {string} key
 * @param {number} ttlMs
 */
export async function acquireLock(key, ttlMs = 30_000) {
  if (!isRedisEnabled()) {
    return acquireMemoryLock(key, ttlMs);
  }

  try {
    const redis = await getRedisClient();
    if (!redis) {
      return acquireMemoryLock(key, ttlMs);
    }

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
    return acquireMemoryLock(key, ttlMs);
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
