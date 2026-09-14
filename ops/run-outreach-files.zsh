#!/bin/zsh
set -euo pipefail
export TIGER_OUTREACH_FILE_ROOT="/Users/mac/Library/Application Support/TigerOutreach/files"
export TIGER_OUTREACH_FILE_PORT="8788"
export TIGER_OUTREACH_FILE_SIGNING_SECRET="$(/usr/bin/security find-generic-password -w -a tiger-outreach -s com.tiger.outreach.files)"
exec /opt/homebrew/bin/node "/Users/mac/Documents/B2B精密铁件定制/TC-workflow-integration/server/outreach-files.mjs"
