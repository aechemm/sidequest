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

echo "Freeing port 8199 if a previous login is stuck..."
if command -v fuser >/dev/null 2>&1; then
  fuser -k 8199/tcp >/dev/null 2>&1 || true
fi
# Also kill any leftover oauth server from this repo
pkill -f "node scripts/plaud-oauth-server.mjs" >/dev/null 2>&1 || true
sleep 1

echo "Starting reliable Plaud OAuth listener..."
echo "If Authorize ends on localhost error, paste the callback URL at:"
echo "  https://pulled-amended-heating-categories.trycloudflare.com/plaud/finish-login"
echo
exec node scripts/plaud-oauth-server.mjs
