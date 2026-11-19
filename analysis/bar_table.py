"""Per-bar stem energy table, to set songs/<SONG>.py SECTION_BARS.

Mean drums / bass / other / vocal envelope (0..1) of every bar of DATA/audio.json; bar k
starts at downbeats[k]. Sections start where the band changes: drums or bass in/out, a drop,
a stop bar (all values near 0), a new chord loop (bar_phase.py novelty).

Run:  SONG=<name> [DATA_OUT=<dir with audio.json>] uv run python bar_table.py
"""
import common
import json

import numpy as np

STEMS = ("drums", "bass", "other", "vocal")


def main():
    d = json.loads((common.DATA / "audio.json").read_text())
    db, fps, n = d["downbeats"], d["fps"], len(d["rms"])
    print("bar   start  " + "  ".join(f"{s:>5}" for s in STEMS))
    for k, t0 in enumerate(db):
        t1 = db[k + 1] if k + 1 < len(db) else d["duration"]
        a = min(n - 1, int(t0 * fps))
        b = max(a + 1, min(n, int(t1 * fps)))
        print(f"{k:3d} {t0:7.2f}  " + "  ".join(f"{float(np.mean(d[s][a:b])):5.2f}" for s in STEMS))


if __name__ == "__main__":
    main()
