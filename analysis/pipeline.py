"""End-to-end analysis pipeline for one song (SONG env, required).

Usage:  SONG=<name> [DATA_OUT=<dir>] uv run python pipeline.py [--until STEP] [--from STEP] [--force]

Each step is skipped when its outputs already exist, unless --force.
Steps, in order:

  decode    ffmpeg gapless mp3 decode -> work/<song>/<song>.wav (44.1 kHz f32 stereo)
  demucs    htdemucs_ft -> stems/htdemucs_ft/<song>/{bass,drums,other,vocals}.wav
  karaoke   audio-separator mel-roformer karaoke -> stems/karaoke/<song>/lead.wav
  offsets   cross-correlate the stems-sum and karaoke lead against the mix
            -> work/<song>/stem_offset.json
  vocals16k work/<song>/vocals16k.wav
  emissions CTC log-probs (mms, lv60k) x sources (vocals, lead, vocL, vocR)
  whisper   faster-whisper large-v3-turbo (unprompted + prompted)
  feats     vocal_feats.npz
  analyze   audio.json + QA plots
  align     lyrics.json + per-line QA plots
"""
import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

import common

KARAOKE_MODEL = "mel_band_roformer_karaoke_aufr33_viperx_sdr_10.1956.ckpt"


def run(cmd, **kw):
    print("  $", " ".join(str(c) for c in cmd), flush=True)
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def _stem_files():
    return [common.STEMS / f"{n}.wav" for n in ("bass", "drums", "other", "vocals")]


def step_decode():
    run(["ffmpeg", "-y", "-v", "error", "-i", common.AUDIO,
         "-ar", "44100", "-ac", "2", "-c:a", "pcm_f32le", common.MIX_WAV])


def step_demucs():
    run([sys.executable, "-m", "demucs", "-n", "htdemucs_ft",
         "-o", common.ROOT / "stems", common.MIX_WAV])


def step_karaoke():
    # the model must be known to audio-separator; list and check first
    p = subprocess.run(["audio-separator", "--list_models", "--list_format", "json"],
                       capture_output=True, text=True)
    try:
        models = json.loads(p.stdout[p.stdout.index("{"):])
        names = {m["filename"] for groups in models.values() for m in groups.values()}
    except Exception:
        names = set()
    if KARAOKE_MODEL not in names:
        print(f"KARAOKE MODEL NOT FOUND: {KARAOKE_MODEL}")
        print("karaoke models available:")
        for n in sorted(x for x in names if "karaoke" in x.lower()):
            print("  ", n)
        raise SystemExit(1)
    common.KARAOKE.mkdir(parents=True, exist_ok=True)
    run(["audio-separator", "-m", KARAOKE_MODEL, "--output_format", "wav",
         "--output_dir", common.KARAOKE, "--model_file_dir", common.CACHE / "audio-separator",
         "--single_stem", "vocals", common.MIX_WAV])
    vocs = sorted(common.KARAOKE.glob("*ocal*.wav"))
    if not vocs:
        vocs = sorted(common.KARAOKE.glob("*.wav"))
    if not vocs:
        raise SystemExit("audio-separator produced no output in " + str(common.KARAOKE))
    shutil.move(str(vocs[0]), common.KARAOKE / "lead.wav")


def _lag(a, b, max_lag):
    """k maximizing sum_i a[i+k]*b[i] over |k| <= max_lag (FFT cross-correlation)."""
    import numpy as np
    from scipy.signal import correlate, correlation_lags
    c = correlate(a, b, mode="full", method="fft")
    lags = correlation_lags(len(a), len(b), mode="full")
    m = np.abs(lags) <= max_lag
    return int(lags[m][np.argmax(c[m])])


def step_offsets():
    import numpy as np
    import soundfile as sf
    mix, sr = common.load_mix(44100)
    stems = [sf.read(f, dtype="float32", always_2d=True)[0].mean(axis=1) for f in _stem_files()]
    voc = stems[3]
    n_seg = min(int(60 * sr), min(len(x) for x in stems), len(mix))
    a = np.sum([x[:n_seg] for x in stems], axis=0)
    n = _lag(a, mix[:n_seg], sr)
    lead, sl = sf.read(common.KARAOKE / "lead.wav", dtype="float32", always_2d=True)
    lead = lead.mean(axis=1)
    n2 = min(int(60 * sl), len(lead), len(voc))
    k = _lag(lead[:n2], voc[:n2], sl)
    # lead[i+k] ~= voc[i] and voc[i+n] ~= mix[i] -> lead[i + (n+k)] ~= mix[i]
    lead_off = n + k
    out = {"stems": n, "lead": lead_off}
    (common.WORK / "stem_offset.json").write_text(json.dumps(out))
    print("stem offsets:", out)


def step_vocals16k():
    import soundfile as sf
    y, _ = common.load_stem("vocals", 16000)
    sf.write(common.WORK / "vocals16k.wav", y, 16000)


def step_emissions():
    import ctc_emissions
    for src in ("vocals", "lead", "vocL", "vocR"):
        for n in ("mms", "lv60k"):
            ctc_emissions.compute(n, source=src)


def step_whisper():
    import whisper_run
    whisper_run.run("turbo", whisper_run.MODELS["turbo"])
    whisper_run.run("turbo_prompt", whisper_run.MODELS["turbo"], common.song.WHISPER_PROMPT)


def step_feats():
    import vocal_feats
    vocal_feats.compute()


def step_analyze():
    import analyze
    analyze.main(plots=True)


def step_align():
    import align
    align.main(plots=True)


EMISSION_FILES = [f"emission_{m}{s}.npy" for m in ("mms", "lv60k")
                  for s in ("", "_lead", "_vocL", "_vocR")]

def _fresh(p):
    """Output exists and is at least as new as MIX_WAV (the decode); stale counts as not done."""
    return p.exists() and common.MIX_WAV.exists() and p.stat().st_mtime >= common.MIX_WAV.stat().st_mtime


# data outputs that must be newer than the decode to count as done
OUT = {"analyze": "audio.json", "align": "lyrics.json"}


STEPS = [
    ("decode", step_decode, lambda: common.MIX_WAV.exists()),
    ("demucs", step_demucs, lambda: all(f.exists() for f in _stem_files())),
    ("karaoke", step_karaoke, lambda: (common.KARAOKE / "lead.wav").exists()),
    ("offsets", step_offsets, lambda: (common.WORK / "stem_offset.json").exists()),
    ("vocals16k", step_vocals16k, lambda: (common.WORK / "vocals16k.wav").exists()),
    ("emissions", step_emissions, lambda: all((common.WORK / f).exists() for f in EMISSION_FILES)),
    ("whisper", step_whisper, lambda: (common.WORK / "whisper_turbo.json").exists()
     and (common.WORK / "whisper_turbo_prompt.json").exists()),
    ("feats", step_feats, lambda: (common.WORK / "vocal_feats.npz").exists()),
    ("analyze", step_analyze, lambda: _fresh(common.DATA / OUT["analyze"])),
    ("align", step_align, lambda: _fresh(common.DATA / OUT["align"])),
]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--until", choices=[s for s, _, _ in STEPS])
    ap.add_argument("--from", dest="from_", choices=[s for s, _, _ in STEPS])
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    names = [s for s, _, _ in STEPS]
    i0 = names.index(args.from_) if args.from_ else 0
    i1 = names.index(args.until) + 1 if args.until else len(STEPS)
    print(f"SONG={common.SONG}  steps {names[i0]}..{names[i1 - 1]}  DATA -> {common.DATA}", flush=True)
    t_all = time.time()
    stale = {n for n in OUT if (common.DATA / OUT[n]).exists() and not _fresh(common.DATA / OUT[n])}
    for name, fn, done in STEPS[i0:i1]:
        if done() and not args.force:
            print(f"[{name}] skip (outputs exist)", flush=True)
            continue
        if name in stale:
            print(f"[{name}] output older than the decode: re-running", flush=True)
        t0 = time.time()
        print(f"[{name}]", flush=True)
        fn()
        print(f"[{name}] done in {time.time() - t0:.1f}s", flush=True)
    print(f"pipeline done in {time.time() - t_all:.1f}s", flush=True)


if __name__ == "__main__":
    main()
