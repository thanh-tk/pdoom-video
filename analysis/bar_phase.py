"""Bar-phase evidence for songs/<SONG>.py DOWNBEAT_PHASE: chord changes land on downbeats.

For each beat of the analysed grid (DATA/audio.json), a beat-synchronous chroma of the bass +
'other' stems; harmonic novelty = 1 - cosine(chroma[i], chroma[i-1]). The mean novelty per beat
index mod 4 (and mod 8, for 2-bar chords) points at the downbeat phase. Also prints the snare
share per beat index mod 4 (snare on 2 and 4 puts the downbeat one beat before a snare beat).

Run:  SONG=<name> DATA_OUT=<dir with audio.json> uv run python bar_phase.py
"""
import common
import json

import numpy as np
import librosa


def main():
    doc = json.loads((common.DATA / "audio.json").read_text())
    beats = np.array(doc["beats"])
    sr = 22050
    y = sum(common.load_stem(n, sr=sr)[0] for n in ("bass", "other"))
    hop = 256
    C = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    fr = librosa.time_to_frames(beats, sr=sr, hop_length=hop)
    fr = np.clip(fr, 0, C.shape[1] - 1)
    B = np.stack([C[:, a:b].mean(axis=1) if b > a else C[:, a] for a, b in zip(fr[:-1], fr[1:])], axis=1)
    B = B / (np.linalg.norm(B, axis=0, keepdims=True) + 1e-9)
    nov = np.r_[0.0, 1.0 - np.sum(B[:, 1:] * B[:, :-1], axis=0)]
    energy = np.array([doc["rms"][min(len(doc["rms"]) - 1, int(t * doc["fps"]))] for t in beats[:-1]])
    live = energy > 0.15  # skip silence / fades
    idx = np.arange(len(nov))
    for m in (4, 8):
        means = [float(nov[(idx % m == k) & live].mean()) for k in range(m)]
        print(f"harmonic novelty by beat index mod {m}: " + "  ".join(f"{k}:{v:.3f}" for k, v in enumerate(means)))
    sn = np.array([t for t, _ in doc["onsets"]["snare"]])
    x = np.interp(sn, beats, np.arange(len(beats)), left=np.nan, right=np.nan)
    x = x[~np.isnan(x)]
    bi = np.round(x).astype(int)
    on_beat = np.abs(x - bi) < 0.15
    counts = np.bincount(bi[on_beat] % 4, minlength=4)
    print("snares on beat index mod 4:", "  ".join(f"{k}:{c}" for k, c in enumerate(counts)))
    # strongest 2-bar chord-change phase, per section-sized window, to check the phase is stable
    win = 32
    print(f"best mod-8 phase per {win}-beat window (start time):")
    out = []
    for s in range(0, len(nov) - win, win):
        sl = slice(s, s + win)
        if live[sl].mean() < 0.5:
            continue
        means = [nov[sl][(idx[sl] % 8) == k].mean() for k in range(8)]
        out.append(f"{beats[s]:6.1f}s:{int(np.argmax(means))}")
    print("  " + "  ".join(out))


if __name__ == "__main__":
    main()
