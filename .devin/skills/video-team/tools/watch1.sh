#!/usr/bin/env bash
# watch1.sh <agent> <pane> <seconds>: wait until the peer is idle/done/gone or shows a dialog (Herdr can report
# done/idle while a dialog is open, so the pane is read too). Uses peerwatch.py and dialog.sh next to this file.
D=$(cd "$(dirname "$0")" && pwd); end=$(( $(date +%s) + $3 ))
while [ "$(date +%s)" -lt "$end" ]; do
  out=$("$D/dialog.sh" "$1" "$2")
  if echo "$out" | rg -q 'Bypass mode'; then echo "DIALOG"; echo "$out"; exit 0; fi
  st=$(python3 "$D/peerwatch.py" 0 "$1")
  case "$st" in *idle*|*done*|*GONE*) echo "$st"; exit 0;; esac
  sleep 20
done
echo "$(date +%T) still working"
