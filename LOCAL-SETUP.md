# Run SideQuest locally on Windows

## Quick test — is the API working?

With `npm run dev` running, open in your browser:

```
http://127.0.0.1:4318/api/health
```

You should see JSON like `{"ok":true,"services":{...}}`.

- **404 on `/api/health`** → wrong URL or dev server not running
- **404 on `/api/demo`** → normal on older code; that route was added later. Use `/api/health` instead.

Always use **`http://`** not **`https://`**.

## Demo button does nothing?

### Fix 1 — run the helper (no git pull needed)

```cmd
cd C:\Users\hmord\Documents\GitHub\sidequest
fix-local-demo.bat
```

Then restart `npm run dev` and click **Run Demo Data** again.

This moves `.env` aside so demo uses mock data (no Crusoe/Neo4j keys required).

### Fix 2 — get latest code

Your GitHub copy may be behind the cloud agent. In GitHub Desktop:

1. **Fetch origin**
2. **Pull origin**

If still old, open your **Cursor cloud agent** → Preview → `http://127.0.0.1:4318` (already has latest code + keys).

### Fix 3 — check for errors

1. Press **F12** → **Console** → click Run Demo Data
2. Watch the terminal running `npm run dev` for `POST /api/pipeline`

## Restore live API keys

```cmd
move .env.local-backup .env
```
