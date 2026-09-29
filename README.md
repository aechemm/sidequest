# SideQuest

**Plaud remembers who you talked to. SideQuest discovers why those people should talk to each other.**

Record conversations at Hack Day. SideQuest accumulates a Neo4j relationship graph across all of them, and surfaces introduction opportunities that no single conversation reveals.

Built for [The AI Conference Hack Day 2026](https://theaiconference.com).

## 90-second demo

1. Click **Run 3-convo demo**
2. Watch three separate conversations ingest (Alice, Bob, Charlie)
3. **SideQuest Discovered** card appears: *Introduce Alice to Bob*
4. Click **Why?** — graph animates the cross-conversation path
5. Click **Draft Introduction** — copy the intro email

No single conversation contains the answer. Only the graph across all three does.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://127.0.0.1:4318](http://127.0.0.1:4318) → **Run 3-convo demo**.

## Architecture

```
Plaud (ears) → multiple conversations
                    ↓
              Scout (Crusoe) — extract entities per convo
                    ↓
              GraphAgent — Neo4j relationship memory
                    ↓
              Connector — cross-conversation path discovery
                    ↓
              Critic (BAND) — BLOCK unsupported intros
                    ↓
              SideQuest UI — intro cards + graph reveal
```

## Sponsor integration

| Sponsor | Role |
|---------|------|
| **Plaud** | Sensor — hears real-world conversations |
| **Crusoe** | Intelligence — entity extraction + reasoning |
| **Neo4j** | Long-term relationship memory across convos |
| **BAND** | Scout → GraphAgent → Connector → Critic coordination |
| **DuploCloud** | Deploy agent swarm + web UI |

## BAND agents

Register at [app.band.ai/agents](https://app.band.ai/agents): Scout, GraphAgent, Connector, Critic.

```bash
cd agents && pip install -r requirements.txt
cp agent_config.yaml.example agent_config.yaml
./run_all.sh
```

## Environment

See [`.env.example`](.env.example).
