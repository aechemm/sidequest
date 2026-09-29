#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Starting SideQuest Band agents..."
python3 scout.py &
python3 graph_agent.py &
python3 connector.py &
python3 critic.py &
wait
