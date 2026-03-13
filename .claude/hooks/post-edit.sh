#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only run on source files
if [[ ! "$FILE_PATH" =~ \.(jsx|js|mjs|css)$ ]]; then
  exit 0
fi

# Run ESLint on edited file
if command -v npx &> /dev/null; then
  npx eslint "$FILE_PATH" --max-warnings 0 2>&1 | tail -10 || {
    echo "ESLint errors after edit. Fix before continuing." >&2
    exit 1
  }
fi

exit 0
