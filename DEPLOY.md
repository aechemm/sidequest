# Deploy SideQuest publicly

## Option A — Public URL right now (Cloudflare tunnel)

The cloud agent can expose port 4318 via a temporary public URL:

```
https://stockholm-blocked-jumping-kit.trycloudflare.com
```

This works while the cloud agent session is running. Share this link for demos and judging.

## Option B — Vercel (recommended permanent host)

1. Push this repo to GitHub (`aechemm/sidequest`)
2. Go to [vercel.com/new](https://vercel.com/new) → Import the repo
3. Add environment variables from `.env.example` (Crusoe, Neo4j, Plaud, BAND)
4. Deploy — Vercel auto-detects Next.js

No code changes needed. The app builds with `npm run build`.

## Option C — Run production locally

```bash
npm run build
npm start
```

Serves on http://127.0.0.1:4318 with preloaded demo data.

## Demo note

The homepage **preloads the Alice ↔ Bob SideQuest** on load. Charlie appears as a **+ Charlie** bonus connection and in the second SideQuest card under the **SideQuests** tab.
