#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Split bottom (33%)
PANE_BOTTOM=$(tmux split-window -v -p 33 -c "$PROJECT_ROOT" -P -F '#{pane_id}')

# Split top pane horizontally — new pane is top-right
PANE_TOP_RIGHT=$(tmux split-window -h -t '{top}' -c "$PROJECT_ROOT" -P -F '#{pane_id}')

# Top-left is the original pane (frontend)
# Top-right is PANE_TOP_RIGHT (backend)
# Bottom is PANE_BOTTOM (multi-purpose)

# Start database
tmux send-keys -t "$PANE_BOTTOM" "pnpm db:start && echo '✓ DB ready'" Enter

# Give DB a moment to come up, then start backend
tmux send-keys -t "$PANE_TOP_RIGHT" "sleep 2 && pnpm server:dev" Enter

# Start frontend in the original pane
pnpm frontend:dev
