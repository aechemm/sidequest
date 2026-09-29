#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Starting SideQuest BAND agents..."
python3 extractor.py &
python3 graph_agent.py &
python3 scout.py &
python3 connector.py &
python3 critic.py &
wait
