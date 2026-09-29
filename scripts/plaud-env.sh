#!/usr/bin/env bash
# Source this before any `plaud` CLI command so Embedded API keys don't break OAuth/account APIs.
export PLAUD_CLI_CLIENT_ID="${PLAUD_CLI_CLIENT_ID:-client_f9e0b214-c11f-434b-8b95-c4497d1feb81}"
unset PLAUD_CLIENT_ID
unset PLAUD_API_KEY
unset PLAUD_CLIENT_SECRET
