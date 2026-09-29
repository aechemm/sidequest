# TalkTrace

Turn meeting audio into a live knowledge graph. Record with **Plaud**, extract facts on **Crusoe**, coordinate agents in **BAND** (with a Critic that can veto), persist relationships in **Neo4j**, and deploy on **DuploCloud**.

Built for [The AI Conference Hack Day 2026](https://theaiconference.com).

## Quick start

```bash
cp .env.example .env
# fill in credentials as you collect them from sponsor booths

npm install
npm run dev
```

Open [http://127.0.0.1:4318](http://127.0.0.1:4318).

### Demo without credentials

1. Click **Sample transcript** — loads a mock founder sync.
2. Click **Run pipeline** — extracts facts with mock/Crusoe, Critic reviews, graph updates (mock graph if Neo4j missing).

## Architecture

```
Plaud (audio) → TalkTrace API → BAND room
                                    ↓
              Extractor → GraphBuilder → Critic (veto)
                                    ↓
              Crusoe LLM          Neo4j graph
                                    ↓
              Web UI (graph + transcript + facts)
```

## BAND agents (for live judging)

Register three remote agents at [app.band.ai/agents](https://app.band.ai/agents):

| Agent | Role |
|-------|------|
| **Extractor** | Pulls decisions, commitments, blockers, questions |
| **GraphBuilder** | Stages facts for Neo4j after Critic approval |
| **Critic** | BLOCKED if no supporting quote in transcript |

```bash
cd agents
pip install -r requirements.txt
cp agent_config.yaml.example agent_config.yaml
# fill agent IDs and keys

# Terminal 1–3, or:
chmod +x run_all.sh && ./run_all.sh
```

Create a Band chat room, add all three agents, set `BAND_CHAT_ID` and `BAND_ROOM_URL` in `.env`.

In the UI: **Kick off Band agents** posts `@Extractor` with the transcript.

## Environment variables

See [`.env.example`](.env.example). Minimum for full demo:

- `CRUSOE_API_KEY` — top prize qualification
- `NEO4J_URI` + `NEO4J_PASSWORD` — graph persistence
- `BAND_*` — agent coordination
- `PLAUD_CLIENT_ID` + `PLAUD_API_KEY` — live audio
- DuploCloud — deploy this Dockerfile via AI Studio Quick Deploy

## DuploCloud deploy

1. Build: `docker build -t talktrace .`
2. Push to a registry DuploCloud can pull from
3. **AI Suite → Studio → Agents → Add** (Prebuilt image)
4. **Quick Deploy** with env vars from `.env`
5. Demo the public load-balancer URL during judging

## Prize mapping

| Sponsor | How TalkTrace uses it |
|---------|----------------------|
| Crusoe | LLM extraction + critique |
| Plaud | Audio transcription input |
| BAND | Agent handoffs + Critic veto |
| Neo4j | Decision/commitment graph |
| DuploCloud | Production deploy for live demo |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 4318 |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `agents/run_all.sh` | Start all Band agents |
