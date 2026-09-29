# SideQuest

**Your conversations know who should meet.**

Record chats with Plaud (or paste a transcript). SideQuest builds a living relationship graph across them and surfaces introductions no single conversation would reveal.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://127.0.0.1:4318](http://127.0.0.1:4318).

1. Connect Plaud (or paste a transcript)
2. Sync conversations after you record
3. Review suggested introductions under **SideQuests**

## How it works

```
Plaud → conversations
            ↓
      extract people & topics
            ↓
      relationship graph
            ↓
      cross-conversation matches
            ↓
      verified introductions
```

## Environment

Copy [`.env.example`](.env.example) and fill in the services you use:

- **Plaud** — capture & transcription
- **Crusoe** — entity extraction
- **Neo4j** — relationship memory
- **BAND** — optional coordination workspace

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local app on port 4318 |
| `npm run plaud:login` | Sign in to Plaud for account sync |
| `npm run build` / `npm start` | Production build |
