#!/bin/zsh
set -euo pipefail
export TIGER_OUTREACH_SERVICE_TOKEN="$(/usr/bin/security find-generic-password -w -a tiger-outreach -s com.tiger.outreach.multica)"
export TIGER_OUTREACH_ENDPOINT="${TIGER_OUTREACH_ENDPOINT:-https://outreach-ingest.tigersourcingchina.com}"
exec /opt/homebrew/bin/node "/Users/mac/Documents/B2B精密铁件定制/TC-workflow-integration/scripts/outreach-import.mjs" "$@"
