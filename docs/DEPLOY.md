# Free Live Deploy (Atlas + Render + Vercel)

## 1. MongoDB Atlas (free M0)

1. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
2. **Database Access** → user `fzoneworldproject_db_user` → Read and write to any database
3. Connection string (must include database name **`fzone`**):

```
mongodb+srv://fzoneworldproject_db_user:YOUR_PASSWORD@cluster0.e2loh6w.mongodb.net/fzone?appName=Cluster0
```

URL-encode special characters in the password (`@` → `%40`, etc.).

## 2. Migrate local data to Atlas

From `backend/` folder (PowerShell):

```powershell
$env:MONGODB_ATLAS_URI="mongodb+srv://fzoneworldproject_db_user:YOUR_PASSWORD@cluster0.e2loh6w.mongodb.net/fzone?appName=Cluster0"
npm run migrate:atlas
```

Verify in Atlas → Browse Collections.

## 3. Test Atlas locally

Set in `backend/.env` (never commit):

```env
MONGODB_SERVER_IP=mongodb+srv://fzoneworldproject_db_user:YOUR_PASSWORD@cluster0.e2loh6w.mongodb.net/fzone?appName=Cluster0
```

```powershell
cd backend
npm run test:atlas
npm start
```

Login at https://localhost:5173

## 4. Upstash Redis (free)

1. https://upstash.com → Create database
2. Copy **Redis URL** (`rediss://...`)
3. Set `REDIS_URL` in Render env (optional but recommended)

## 5. Render backend (free)

1. https://render.com → New Web Service → GitHub repo
2. **Root Directory:** `backend`
3. **Build:** `npm install` | **Start:** `node index.js` | **Plan:** Free
4. Or use [`render.yaml`](../render.yaml) Blueprint
5. Environment variables — see [`backend/.env.production.example`](../backend/.env.production.example)
6. Health check: `/health`
7. After deploy: `https://YOUR-SERVICE.onrender.com/health`

## 6. Vercel frontend (free)

1. https://vercel.com → Import repo
2. **Root Directory:** `frontend`
3. **Build:** `npm run build` | **Output:** `dist`
4. Environment:

```
VITE_API_BASE_URL=https://YOUR-SERVICE.onrender.com
```

5. **Production Branch:** `main`
6. Preview deployments: ON for `develop`

[`frontend/vercel.json`](../frontend/vercel.json) handles SPA routing.

## 7. Connect CORS

In Render, set:

```
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app
```

Use your exact Vercel production URL. Redeploy Render.

## 8. Git branches

| Branch | Use |
|--------|-----|
| `develop` | Daily work + Vercel preview |
| `main` | Production — customer link only |

## 9. Customer handoff

- Production Vercel URL (from `main`)
- Admin login (secure channel)
- Note: Render free tier cold start ~30–60s after idle
