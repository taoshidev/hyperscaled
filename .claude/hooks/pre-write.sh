#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_content // .tool_input.content // empty')

# Block hardcoded secrets
if echo "$NEW_CONTENT" | grep -qE 'sk-[a-zA-Z0-9]{32,}|NEXT_PUBLIC_.*=.*[a-f0-9]{32,}'; then
  echo "Possible hardcoded secret detected. Use .env variables." >&2
  exit 2
fi

# Block TypeScript files
if [[ "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  echo "STOP: This project uses JSX, not TypeScript. Use .jsx or .js extension." >&2
  exit 2
fi

# Block h-screen
if echo "$NEW_CONTENT" | grep -qE 'h-screen'; then
  echo "STOP: Use min-h-[100dvh] instead of h-screen." >&2
  exit 2
fi

# Protect API routes
if [[ "$FILE_PATH" =~ app/api/ ]]; then
  echo "STOP: API routes are mock stubs — do not modify without explicit instruction." >&2
  exit 2
fi

exit 0
