# Upstash Redis (free tier, optional)

Redis is **optional**. Without `REDIS_URL`, the app starts normally — cache is disabled and refund locks use an in-memory fallback (fine for single-instance Render free tier).

To enable Redis caching:

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
