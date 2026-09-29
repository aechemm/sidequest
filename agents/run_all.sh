#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Starting TalkTrace Band agents..."
python3 extractor.py &
python3 graph_builder.py &
python3 critic.py &
wait
