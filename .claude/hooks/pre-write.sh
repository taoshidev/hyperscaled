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

# Skip remaining checks for markdown/docs files
if [[ "$FILE_PATH" =~ \.(md|mdx)$ ]]; then
  exit 0
fi

# Block h-screen (use min-h-[100dvh] instead)
HSCREEN="h-screen"
if echo "$NEW_CONTENT" | grep -qF "$HSCREEN"; then
  echo "STOP: Use min-h-[100dvh] instead of $HSCREEN." >&2
  exit 2
fi

# Block transition-all (specify exact properties)
if echo "$NEW_CONTENT" | grep -qE 'transition-all'; then
  echo "STOP: Do not use transition-all. Specify exact properties, e.g. transition-[border-color,box-shadow,transform]." >&2
  exit 2
fi

# Block text-[10px] and text-[11px] (minimum is text-xs / 12px)
if echo "$NEW_CONTENT" | grep -qE 'text-\[1[01]px\]'; then
  echo "STOP: Minimum text size is 12px (text-xs). Do not use text-[10px] or text-[11px]." >&2
  exit 2
fi

# Block div onClick for selection patterns (warn, not block)
if echo "$NEW_CONTENT" | grep -qE '<div[^>]*onClick'; then
  echo "WARNING: <div onClick> detected. Use button, role=radio, or a semantic element for interactive items." >&2
fi

# Protect API routes
if [[ "$FILE_PATH" =~ app/api/ ]]; then
  echo "STOP: API routes are mock stubs — do not modify without explicit instruction." >&2
  exit 2
fi

exit 0
