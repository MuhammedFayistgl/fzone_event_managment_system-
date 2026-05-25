# F-Zone Client Handover Guide

Bilingual (Malayalam + English) tutorial for the client.

## Deliverables

| File | Use |
|------|-----|
| `F-Zone-Client-Guide.pdf` | Send to client (with screenshots) |
| `F-Zone-Client-Guide-CopyPaste.txt` | WhatsApp / email body (copy-paste) |
| `F-Zone-Client-Guide.md` | Source document (edit & regenerate) |
| `frontend/public/guides/` | Synced copies served by the live app |

## In-app download (Settings)

After syncing, admin users see **Client Guide / User Manual** on the Settings page with:

- **Download PDF**
- **Download text guide**

Public URLs (after Vercel deploy):

- `https://fzone-event-managment-system.vercel.app/guides/F-Zone-Client-Guide.pdf`
- `https://fzone-event-managment-system.vercel.app/guides/F-Zone-Client-Guide.txt`

## Regenerate & sync

```powershell
cd docs/client-handover
npm run pdf
npm run copypaste
cd ../..
npm run sync:client-guide
```

Or from `docs/client-handover` after editing markdown:

```powershell
npm run build
```

(`build` runs pdf, copypaste, and sync to `frontend/public/guides/`)

Optional live screenshots:

```powershell
npm run capture      # needs SEED_ADMIN_PASSWORD in backend/.env
npm run placeholders # UI mockup screenshots
```

## Send to client

1. **In app:** Settings → Download PDF (or share the public `/guides/` URL after deploy)
2. **Manual:** Attach PDF + paste text from `.txt`
3. Share super admin password via **separate secure channel** (not in PDF)
