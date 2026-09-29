# Run SideQuest locally

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://127.0.0.1:4318](http://127.0.0.1:4318) — use **http**, not https.

## Health check

With the dev server running:

```
http://127.0.0.1:4318/api/health
```

You should see JSON like `{"ok":true,"services":{...}}`.

## Plaud account sync

```bash
npm run plaud:login
```

Authorize in the browser, then use **Sync from Plaud** in the app. Prefer recordings under ~20 minutes so sync finishes quickly.
