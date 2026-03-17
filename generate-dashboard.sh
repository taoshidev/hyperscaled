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

# Read the JSON
JSON_DATA=$(cat "$TRACKER")

# Replace the TRACKER data block between the marker comments
perl -0777 -i -pe '
  BEGIN {
    local $/;
    open(my $fh, "<", "'"$TRACKER"'") or die "Cannot read TRACKER.json: $!";
    $json = <$fh>;
    close($fh);
    chomp $json;
  }
  s{
    (// ╔══+╗\n// ║\s+TRACKER DATA.*?╚══+╝\n)
    .*?
    (// ╔══+╗\n// ║\s+END TRACKER DATA.*?╚══+╝)
  }{${1}const TRACKER = ${json};\n${2}}s
' "$DASHBOARD"

echo "✓ dashboard updated from TRACKER.json ($(date '+%Y-%m-%d %H:%M'))"