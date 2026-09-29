# Run BAND agents on Windows

## 1. Get the project on your laptop

The `agents` folder lives **inside the SideQuest repo**, not in `C:\Users\hmord`.

From Cursor: open your cloud agent project and **clone/sync** it locally, or copy the whole repo folder to your machine.

You need at least:
```
sidequest/
  agents/
    extractor.py
    graph_agent.py
    scout.py
    connector.py
    critic.py
    agent_config.yaml
    requirements.txt
    run_all.bat
  .env
```

## 2. Install Python 3.11+

https://www.python.org/downloads/ — check **"Add Python to PATH"** during install.

Verify:
```cmd
python --version
```

## 3. Configure secrets

In `agents/` copy the example and fill in your Band keys:
```cmd
cd path\to\sidequest\agents
copy agent_config.yaml.example agent_config.yaml
notepad agent_config.yaml
```

Copy `.env` from project root (Crusoe + Neo4j keys) OR set env vars in each terminal.

## 4. Install dependencies

```cmd
cd path\to\sidequest\agents
pip install -r requirements.txt
```

## 5. Start all agents

**Option A — one command (opens 5 windows):**
```cmd
run_all.bat
```

**Option B — five separate Command Prompt windows:**
```cmd
python extractor.py
python graph_agent.py
python scout.py
python connector.py
python critic.py
```

Leave all windows open. Open Band room:
https://app.band.ai/chats/94227273-5272-42c1-9cc0-dc808f47f7e7

Agents should show **active** in the room when connected.
