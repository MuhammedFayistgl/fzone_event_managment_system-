# Atlas checklist (complete in MongoDB Atlas UI)

- [ ] Cluster: M0 FREE, region Mumbai (ap-south-1) recommended
- [ ] Network Access: 0.0.0.0/0 (Allow from anywhere) for Render/Vercel
- [ ] Database user: fzoneworldproject_db_user with readWriteAnyDatabase
- [ ] Connection string includes database name: `/fzone` before `?`
- [ ] Password URL-encoded if it contains @ # % etc.

Example URI (replace YOUR_PASSWORD; get replicaSet from Atlas → Connect if different):

```
mongodb+srv://fzoneworldproject_db_user:YOUR_PASSWORD@cluster0.e2loh6w.mongodb.net/fzone?appName=Cluster0
```

**Windows local dev:** if `querySrv ECONNREFUSED`, use **Standard connection string** from Atlas Connect (includes `replicaSet=atlas-...-shard-0`).

Run migration after URI is ready:

```powershell
cd backend
$env:MONGODB_ATLAS_URI="mongodb://...standard-uri-from-atlas..."
npm run migrate:atlas
```
