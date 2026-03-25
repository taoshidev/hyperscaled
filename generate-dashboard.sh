#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TRACKER="$SCRIPT_DIR/TRACKER.json"
DASHBOARD="$SCRIPT_DIR/docs/hyperscaled-dashboard.html"

if [ ! -f "$TRACKER" ]; then
  echo "ERROR: TRACKER.json not found at $TRACKER" >&2
  exit 1
fi

if [ ! -f "$DASHBOARD" ]; then
  echo "ERROR: docs/hyperscaled-dashboard.html not found at $DASHBOARD" >&2
  exit 1
fi

# Find the line numbers of the marker boundaries
# Top box ends at the line after "Do not hand-edit" (the closing box line)
# Bottom box starts at the line before "END TRACKER DATA"
TOP_END=$(grep -n "Do not hand-edit" "$DASHBOARD" | head -1 | cut -d: -f1)
if [ -z "$TOP_END" ]; then
  echo "ERROR: Could not find 'Do not hand-edit' marker in dashboard" >&2
  exit 1
fi
# The closing line of the top box is one line after "Do not hand-edit"
TOP_END=$((TOP_END + 1))

BOTTOM_START=$(grep -n "END TRACKER DATA" "$DASHBOARD" | head -1 | cut -d: -f1)
if [ -z "$BOTTOM_START" ]; then
  echo "ERROR: Could not find 'END TRACKER DATA' marker in dashboard" >&2
  exit 1
fi
# The opening line of the bottom box is one line before "END TRACKER DATA"
BOTTOM_START=$((BOTTOM_START - 1))

# Build the new file: top (through marker) + new data + bottom (from marker)
{
  head -n "$TOP_END" "$DASHBOARD"
  echo "const TRACKER = $(cat "$TRACKER");"
  tail -n +"$BOTTOM_START" "$DASHBOARD"
} > "${DASHBOARD}.tmp"

mv "${DASHBOARD}.tmp" "$DASHBOARD"

echo "✓ dashboard updated from TRACKER.json ($(date '+%Y-%m-%d %H:%M'))"
