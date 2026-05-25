# Upstash Redis (free tier)

1. Sign up: https://upstash.com
2. Create Redis database (region: closest to Render — e.g. ap-south-1)
3. Copy **UPSTASH_REDIS_REST_URL** is NOT used — copy the **Redis URL** (TLS):
   ```
   rediss://default:XXXX@XXXX-XXXX.upstash.io:6379
   ```
4. Set in Render environment:
   ```
   REDIS_URL=rediss://default:...@....upstash.io:6379
   ```
5. Redeploy backend

If Redis is unavailable, the app still starts (cache disabled) — see `backend/index.js`.
