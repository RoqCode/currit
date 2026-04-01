#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Stopping services..."

# Send Ctrl-C to all panes in the current window
PANES=$(tmux list-panes -F '#{pane_id}')
for pane in $PANES; do
  tmux send-keys -t "$pane" C-c 2>/dev/null || true
done

# Stop database
pnpm db:stop 2>/dev/null || true

echo "Services stopped. Close this window with <prefix>&"
