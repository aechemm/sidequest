#!/usr/bin/env bash
# Reliable Plaud OAuth for cloud Desktop:
# - correct CLI client id (not Embedded PLAUD_CLIENT_ID)
# - keeps localhost:8199 listening
# - if browser shows connection refused, paste callback URL at /plaud/finish-login
set -euo pipefail
cd "$(dirname "$0")/.."

export PLAUD_CLI_CLIENT_ID="${PLAUD_CLI_CLIENT_ID:-client_f9e0b214-c11f-434b-8b95-c4497d1feb81}"
unset PLAUD_CLIENT_ID
unset PLAUD_API_KEY
unset PLAUD_CLIENT_SECRET

echo "Starting reliable Plaud OAuth listener..."
exec node scripts/plaud-oauth-server.mjs
