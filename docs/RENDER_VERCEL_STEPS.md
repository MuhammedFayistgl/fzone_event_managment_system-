# Render + Vercel — 10 minute checklist

## Already done (local)

- MongoDB Atlas connected + data migrated
- `npm run test:atlas` — OK
- Deploy config in repo (`render.yaml`, `vercel.json`, docs)
- `npm run env:render` → `backend/.env.render.local` (copy to Render)

---

## 1. GitHub (required first)

Code must be on GitHub before Render/Vercel import.

Branch: `developer` (staging) | `main` (customer production)

---

## 2. Render backend

1. https://dashboard.render.com → **New +** → **Blueprint** (uses `render.yaml`)  
   **OR** **Web Service** (manual):
   - Repo: `MuhammedFayistgl/fzone_event_managment_system-`
   - Branch: `developer`
   - Root Directory: **`backend`**
   - Build: `npm install` | Start: `node index.js` | Plan: **Free**
   - Health check path: `/health`

2. **Environment** → paste all vars from `backend/.env.render.local`  
   (Regenerate: `cd backend && npm run env:render`)

3. Deploy → copy URL: `https://fzone-api-xxxx.onrender.com`

4. Test: `https://YOUR-URL.onrender.com/health` → JSON OK

---

## 3. Vercel frontend

1. https://vercel.com/new → Import same GitHub repo
2. Root Directory: **`frontend`**
3. Framework: Vite | Build: `npm run build` | Output: `dist`
4. Environment variable:
   ```
   VITE_API_BASE_URL=https://YOUR-RENDER-URL.onrender.com
   ```
5. Deploy → copy URL: `https://your-app.vercel.app`

---

## 4. Connect CORS (Render)

Render → Environment → update:

```
CORS_ORIGINS=https://your-app.vercel.app
```

Save → **Manual Deploy**

Regenerate local file with CORS:
```powershell
cd backend
npm run env:render -- --cors=https://your-app.vercel.app
```

---

## 5. Smoke test

- [ ] `/health` on Render
- [ ] Vercel app loads
- [ ] Admin login works
- [ ] Dashboard data loads (Atlas)

---

## Customer link

Merge `developer` → `main`, set Vercel **Production Branch** = `main`.

Note: Render free tier sleeps after 15 min idle (~30–60s first request).
