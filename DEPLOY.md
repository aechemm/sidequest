# Deploy SideQuest

## Option A — Public URL (Cloudflare tunnel)

While a cloud agent session is running, the app can be exposed via a temporary public URL on port 4318.

```bash
cloudflared tunnel --url http://127.0.0.1:4318
```

## Option B — Vercel

1. Push this repo to your Git host
2. Import the project in [Vercel](https://vercel.com/new)
3. Add environment variables from `.env.example`
4. Deploy — Vercel auto-detects Next.js

## Option C — Production locally

```bash
npm run build
npm start
```

Serves on [http://127.0.0.1:4318](http://127.0.0.1:4318).
