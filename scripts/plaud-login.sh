#!/usr/bin/env bash
# Plaud CLI OAuth must NOT use the Embedded/Transcription PLAUD_CLIENT_ID.
# That partner client_id causes "Request failed with status code 404" after Google login.
set -euo pipefail
cd "$(dirname "$0")/.."

export PLAUD_CLI_CLIENT_ID="${PLAUD_CLI_CLIENT_ID:-client_f9e0b214-c11f-434b-8b95-c4497d1feb81}"
unset PLAUD_CLIENT_ID
unset PLAUD_API_KEY
unset PLAUD_CLIENT_SECRET

echo "Using Plaud CLI OAuth client: $PLAUD_CLI_CLIENT_ID"
echo "(Embedded Transcription API keys intentionally unset for login)"
echo
exec npx plaud login
