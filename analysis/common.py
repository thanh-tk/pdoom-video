"""Shared paths / cache setup for the analysis scripts.

Import this module FIRST (before torch / huggingface imports) so that all
model downloads land in analysis/.cache/.

The song is selected with the SONG env var (required); its tables live
in songs/<SONG>.py. DATA_OUT overrides the data/ output dir (used to write a
re-run's outputs elsewhere for comparison instead of overwriting data/).
"""
import importlib
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent          # analysis/
PROJECT = ROOT.parent                            # pdoom/
CACHE = ROOT / ".cache"
for var, sub in [("TORCH_HOME", "torch"), ("HF_HOME", "hf"), ("HF_HUB_CACHE", "hf/hub"),
                 ("XDG_CACHE_HOME", "xdg"), ("HUGGINGFACE_HUB_CACHE", "hf/hub"),
                 ("TRANSFORMERS_CACHE", "hf/transformers"), ("MPLCONFIGDIR", "mpl"),
                 ("NUMBA_CACHE_DIR", "numba"), ("UV_CACHE_DIR", "uv")]:
    os.environ.setdefault(var, str(CACHE / sub))
    (CACHE / sub).mkdir(parents=True, exist_ok=True)

SONG = os.environ.get("SONG", "").strip()
if not SONG:
    _songs = sorted(p.stem for p in (ROOT / "songs").glob("*.py")
                    if p.stem != "__init__" and not p.stem.startswith("_"))
    raise SystemExit(
        "SONG is required (no default): run e.g. `SONG=onboarded uv run python pipeline.py`. "
        f"Available songs: {', '.join(_songs)}")
song = importlib.import_module(f"songs.{SONG}")

AUDIO = PROJECT / song.AUDIO
LYRICS_SRC = PROJECT / song.LYRICS_SRC
WORK = ROOT / "work" / SONG       # intermediate results (whisper json, alignments)
QA = ROOT / "qa" / SONG
STEMS = ROOT / "stems" / "htdemucs_ft" / SONG
KARAOKE = ROOT / "stems" / "karaoke" / SONG
# Time reference for everything: ffmpeg's gapless decode of the mp3
# (44.1 kHz stereo float32), written by the pipeline's decode step.
MIX_WAV = WORK / f"{SONG}.wav"
DATA = Path(os.environ["DATA_OUT"]).resolve() if os.environ.get("DATA_OUT") else PROJECT / "data"
for d in (WORK, QA, DATA):
    d.mkdir(parents=True, exist_ok=True)


def load_lyrics_src():
    """Parse lyrics.src.js -> list of (start, end, text)."""
    import json
    src = LYRICS_SRC.read_text(encoding="utf-8")
    body = src[src.index("["): src.rindex("]") + 1]
    return [tuple(x) for x in json.loads(body)]


def duration():
    """Length of the song in seconds (the gapless MIX_WAV decode)."""
    import soundfile as sf
    return sf.info(str(MIX_WAV)).duration


def _stem_offsets():
    """{"stems": n, "lead": m}: samples @44.1 kHz to drop from the start of the
    Demucs stems / karaoke lead (written by the pipeline's offsets step;
    negative = pad at start instead of dropping)."""
    import json
    f = WORK / "stem_offset.json"
    if not f.exists():
        raise FileNotFoundError(
            f"{f} missing: run the pipeline's 'offsets' step first "
            f"(uv run python pipeline.py --until offsets)")
    return json.loads(f.read_text())


def load_stem(name, sr=None, mono=True):
    """Load a Demucs stem, time-aligned to the gapless mp3 decode."""
    import soundfile as sf
    import numpy as np
    y, s = sf.read(STEMS / f"{name}.wav", dtype="float32", always_2d=True)
    assert s == 44100
    n = _stem_offsets()["stems"]
    y = y[max(0, n):] if n >= 0 else np.pad(y, ((-n, 0), (0, 0)))
    y = y.mean(axis=1) if mono else y.T
    if sr and sr != s:
        import soxr
        y = soxr.resample(y, s, sr) if mono else np.stack([soxr.resample(c, s, sr) for c in y])
        s = sr
    return y, s


def load_lead(sr=None, mono=True):
    """Lead vocal only (karaoke model output)."""
    import soundfile as sf
    import numpy as np
    y, s = sf.read(KARAOKE / "lead.wav", dtype="float32", always_2d=True)
    n = _stem_offsets()["lead"]
    y = y[max(0, n):] if n >= 0 else np.pad(y, ((-n, 0), (0, 0)))
    y = y.mean(axis=1) if mono else y.T
    if sr and sr != s:
        import soxr
        y = soxr.resample(y, s, sr) if mono else np.stack([soxr.resample(c, s, sr) for c in y])
        s = sr
    return y, s


def load_vocal_source(name, sr=None):
    """'vocals' = Demucs vocal stem (mono sum), 'vocL'/'vocR' = its left/right
    channel (choruses are double-tracked and panned L/R, so each channel is
    closer to a single voice), 'lead' = karaoke lead."""
    if name == "lead":
        return load_lead(sr)
    if name in ("vocL", "vocR"):
        y, s = load_stem("vocals", sr=sr, mono=False)
        return y[0 if name == "vocL" else 1], s
    return load_stem("vocals", sr=sr)


def load_mix(sr=44100, mono=True):
    """The gapless mp3 decode (MIX_WAV): the pipeline's time reference."""
    import soundfile as sf
    import numpy as np
    y, s = sf.read(MIX_WAV, dtype="float32", always_2d=True)
    y = y.mean(axis=1) if mono else y.T
    if sr and sr != s:
        import soxr
        y = soxr.resample(y, s, sr) if mono else np.stack([soxr.resample(c, s, sr) for c in y])
        s = sr
    return y, s
