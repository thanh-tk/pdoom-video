#!/usr/bin/env bash
# dialog.sh <agent> <pane>: print a peer's pending approval dialog (zoomed read; narrow panes truncate it), or "no dialog".
herdr pane zoom "$2" --on > /dev/null; sleep 1
out=$(herdr agent read "$1" --source visible --lines 30)
herdr pane zoom "$2" --off > /dev/null
if echo "$out" | rg -q 'Bypass mode'; then echo "$out" | rg -v '^\s*$' | tail -9; else echo "$1: no dialog ($(echo "$out" | rg -o 'bypass' | head -1))"; fi
