"""Compare two sets of timing data (lyrics.json + audio.json), e.g. a pipeline re-run against the
committed data/ files.  Pure Python (no third-party imports), so it runs in or out of the uv env.

Run:  python compare.py --ref ../data --new work/pdoom/out [--tol 0.05]
"""
import argparse
import json
import math
from pathlib import Path


def pct(xs, p):
    if not xs:
        return float("nan")
    s = sorted(xs)
    k = (len(s) - 1) * p / 100
    lo, hi = math.floor(k), math.ceil(k)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def summary(name, ds, tol):
    a = [abs(d) for d in ds]
    over = sum(x > tol for x in a)
    print(f"  {name:<10} n={len(a):4d}  median {pct(a, 50) * 1000:6.1f} ms  p90 {pct(a, 90) * 1000:6.1f} ms  "
          f"max {max(a) * 1000 if a else float('nan'):6.1f} ms  >{tol * 1000:.0f} ms: {over} ({100 * over / max(1, len(a)):.1f}%)  "
          f"mean signed {sum(ds) / max(1, len(ds)) * 1000:+.1f} ms")


def compare_lyrics(ref, new, tol):
    print("lyrics.json")
    rl, nl = ref["lines"], new["lines"]
    if len(rl) != len(nl):
        print(f"  LINE COUNT DIFFERS: ref {len(rl)} new {len(nl)}")
    rows = []
    for li, (a, b) in enumerate(zip(rl, nl)):
        if a["text"] != b["text"]:
            print(f"  L{li} TEXT DIFFERS: {a['text']!r} vs {b['text']!r}")
            continue
        if len(a["words"]) != len(b["words"]):
            print(f"  L{li} WORD COUNT DIFFERS")
            continue
        for wi, (wa, wb) in enumerate(zip(a["words"], b["words"])):
            rows.append(dict(li=li, wi=wi, w=wa["w"], ds=wb["start"] - wa["start"], de=wb["end"] - wa["end"],
                             ref=(wa["start"], wa["end"]), new=(wb["start"], wb["end"]),
                             cref=wa.get("conf"), cnew=wb.get("conf")))
    summary("word start", [r["ds"] for r in rows], tol)
    summary("word end", [r["de"] for r in rows], tol)
    summary("line start", [b["start"] - a["start"] for a, b in zip(rl, nl) if a["text"] == b["text"]], tol)
    syl = []
    for a, b in zip(rl, nl):
        for wa, wb in zip(a["words"], b["words"]):
            if wa.get("syl") and wb.get("syl") and len(wa["syl"]) == len(wb["syl"]):
                syl += [y[0] - x[0] for x, y in zip(wa["syl"], wb["syl"])]
    if syl:
        summary("syl start", syl, tol)
    cr = [r["cref"] for r in rows if r["cref"] is not None]
    cn = [r["cnew"] for r in rows if r["cnew"] is not None]
    if cr and cn:
        print(f"  conf mean  ref {sum(cr) / len(cr):.3f}  new {sum(cn) / len(cn):.3f}")
    worst = sorted(rows, key=lambda r: -abs(r["ds"]))[:15]
    print("  worst word starts:")
    for r in worst:
        print(f"    L{r['li']:02d}.{r['wi']:<2d} {r['w']:<18} ref {r['ref'][0]:8.3f}-{r['ref'][1]:8.3f}  "
              f"new {r['new'][0]:8.3f}-{r['new'][1]:8.3f}  d_start {r['ds'] * 1000:+7.1f} ms  d_end {r['de'] * 1000:+7.1f} ms")


def match_rate(ref_t, new_t, tol):
    """Share of ref events with a new event within tol (each new event used once)."""
    used, hit, ds = set(), 0, []
    j0 = 0
    for t in ref_t:
        while j0 < len(new_t) and new_t[j0] < t - tol:
            j0 += 1
        best, bj = None, None
        j = j0
        while j < len(new_t) and new_t[j] <= t + tol:
            if j not in used and (best is None or abs(new_t[j] - t) < abs(best)):
                best, bj = new_t[j] - t, j
            j += 1
        if bj is not None:
            used.add(bj)
            hit += 1
            ds.append(best)
    return hit / max(1, len(ref_t)), ds


def corr(a, b):
    n = min(len(a), len(b))
    a, b = a[:n], b[:n]
    ma, mb = sum(a) / n, sum(b) / n
    va = sum((x - ma) ** 2 for x in a)
    vb = sum((y - mb) ** 2 for y in b)
    cov = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    return cov / math.sqrt(va * vb) if va > 0 and vb > 0 else float("nan"), sum(abs(x - y) for x, y in zip(a, b)) / n


def compare_audio(ref, new, tol):
    print("audio.json")
    for k in ("duration", "bpm", "beat_period", "time_signature"):
        if k in ref or k in new:
            print(f"  {k:<14} ref {ref.get(k)}  new {new.get(k)}")
    for k in ("beats", "downbeats"):
        a, b = ref.get(k, []), new.get(k, [])
        n = min(len(a), len(b))
        d = [b[i] - a[i] for i in range(n)]
        print(f"  {k:<14} count ref {len(a)} new {len(b)}; first ref {a[0] if a else None} new {b[0] if b else None}; "
              f"max |d| over common {max((abs(x) for x in d), default=float('nan')) * 1000:.1f} ms")
    rs, ns = ref.get("sections", []), new.get("sections", [])
    names_eq = [s["name"] for s in rs] == [s["name"] for s in ns]
    dmax = max((abs(a["start"] - b["start"]) for a, b in zip(rs, ns)), default=float("nan"))
    print(f"  sections       names equal: {names_eq}; max |d start| {dmax * 1000:.1f} ms")
    ro, no = ref.get("onsets", {}), new.get("onsets", {})
    for kind in sorted(set(ro) | set(no)):
        a = [x[0] for x in ro.get(kind, [])]
        b = [x[0] for x in no.get(kind, [])]
        r1, ds = match_rate(a, b, 0.015)
        r2, _ = match_rate(b, a, 0.015)
        med = pct([abs(x) for x in ds], 50) * 1000 if ds else float("nan")
        print(f"  onsets {kind:<6} count ref {len(a):4d} new {len(b):4d}; ref matched {100 * r1:5.1f}%  new matched {100 * r2:5.1f}% "
              f"(within 15 ms, median |d| {med:.1f} ms)")
    env = lambda j, k: j.get(k) if isinstance(j.get(k), list) else (j.get("features") or {}).get(k)
    for k in ("rms", "low", "mid", "high", "vocal", "drums", "bass", "other"):
        a, b = env(ref, k), env(new, k)
        if a and b:
            c, mad = corr(a, b)
            print(f"  env {k:<6} len ref {len(a)} new {len(b)}; corr {c:.4f}  mean |d| {mad:.4f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True, help="directory with the reference lyrics.json / audio.json")
    ap.add_argument("--new", required=True, help="directory with the new lyrics.json / audio.json")
    ap.add_argument("--tol", type=float, default=0.05, help="seconds; counts differences above this")
    o = ap.parse_args()
    ref, new = Path(o.ref), Path(o.new)
    for f, fn in (("lyrics.json", compare_lyrics), ("audio.json", compare_audio)):
        if (ref / f).exists() and (new / f).exists():
            fn(json.loads((ref / f).read_text(encoding="utf-8")), json.loads((new / f).read_text(encoding="utf-8")), o.tol)
        else:
            print(f"{f}: missing in {'ref' if not (ref / f).exists() else 'new'}")


if __name__ == "__main__":
    main()
