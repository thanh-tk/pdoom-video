#!/usr/bin/env python3
"""Poll herdr until a named peer is blocked/idle/done or the time budget ends. Usage: peerwatch.py <seconds> name..."""
import json, subprocess, sys, time
budget, names = float(sys.argv[1]), sys.argv[2:]
end = time.time() + budget
while True:
    agents = json.loads(subprocess.run(["herdr", "agent", "list"], capture_output=True, text=True).stdout)["result"]["agents"]
    st = {a.get("name"): a["agent_status"] for a in agents if a.get("name") in names}
    hit = {n: s for n, s in st.items() if s in ("blocked", "idle", "done")}
    missing = [n for n in names if n not in st]
    if hit or missing or time.time() >= end:
        print(time.strftime("%T"), " ".join(f"{n}={st.get(n, 'GONE')}" for n in names))
        break
    time.sleep(10)
