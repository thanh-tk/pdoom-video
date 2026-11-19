"""__TITLE__ (__ARTIST__). Song-specific tables for the analysis pipeline.

Written by app/scripts/new-video.ts from songs/_template.py. Values marked TODO are
provisional: set them from the pipeline's own evidence (docs/NEW_VIDEO.md, "Timing data").
Formats: see songs/pdoom.py (fully worked example) and songs/onboarded.py (tracked grid).
"""
AUDIO = "__AUDIO__"
# Lines exactly as sung (check against work/<song>/whisper_turbo*.json, not the lyric sheet):
# repeats written out, dropped lines removed, sung tags added. Backing echoes and ad-libs stay
# out of the text (the aligner's garbage 'star' token absorbs them); list them in EXTRA_DESC.
LYRICS_SRC = "lyrics/__ID__.src.js"

# Tempo search range of the constant grid (BPM). Keep it narrow (known tempo +-8) so the fit
# cannot lock to half or double time.
BPM_RANGE = (90.0, 160.0)  # TODO
# "constant": one tempo for the whole song (analyze.fit_grid). "tracked": follow the kick drum
# (phase-locked loop + smoothing spline, analyze.track_grid) when the tempo drifts; generated
# songs (Suno/Udio) often speed up by a few BPM. Decide from analyze.py's kick residual printout.
GRID = "constant"  # TODO
# Beat index = DOWNBEAT_PHASE (mod 4) is a downbeat. Provisional: set from bar_phase.py
# (harmonic novelty peaks on bar lines; the snare sits on beats 2 and 4).
DOWNBEAT_PHASE = 0  # TODO
# Section map in bars: (name, first bar, end bar); bar k starts at downbeats[k]; None = song
# start / end. Empty = one "song" section. A section starts where the band changes (drums or
# bass in/out, new chord loop); a line's short pickup (< 2 beats) stays in the previous section.
SECTION_BARS = []  # TODO
# QA plot windows for analyze.make_plots (None = consecutive 12 s windows)
QA_WINDOWS = None

# pron.py: display token (exact, punctuation included) -> spelling as sung, for tokens the
# default letters-only rule gets wrong: acronyms, digits, camelCase, code, names. The default
# drops digits ("M1A" -> "m a") and can leave a token empty ("1.7.0"). Check every line with
# `SONG=__ID__ uv run python pron.py`.
PRON = {
    # @PRON_STUB@
}
# Alternative spellings to score by alignment likelihood: token -> [spelling, ...]
ALT = {}
# Final manual word-boundary corrections, only where the zoomed QA plots clearly show the
# automatic result is wrong: (line, token) -> dict(start=..., end=..., syl=[...], conf=...)
FIX = {}
# Manual anchors for the CTC path: (line, token, subword) -> (earliest start, latest end) s
ANCHORS = {}
# Per-line windows (s) every token of the line must lie inside: line -> (t_lo, t_hi)
LINE_WINDOWS = {}
# (t0, t1, description) of known non-lyric vocals (backing echoes, ad-libs, tags), so align.py
# labels them instead of reporting "unlisted vocal". Times come from the Whisper passes / QA plots.
EXTRA_DESC = [
    # @ECHOES@
]
# Names, acronyms and jargon from the lyrics help Whisper spell them.
WHISPER_PROMPT = "Song lyrics: __TITLE__."

LYRICS_NOTES = (
    "Timeline = ffmpeg's gapless decode of __AUDIO__ (same as data/audio.json). Method: "
    "(1) CTC emissions (20 ms frames) of the Demucs vocal stem from torchaudio MMS_FA and "
    "wav2vec2-large-lv60k-960h, each on the mono sum and the left/right channels, fused as a "
    "probability mixture; (2) one global constrained Viterbi alignment of all lines with a garbage "
    "'star' token between lines (absorbs backing vocals and ad-libs); acronyms and code words "
    "aligned with the phonetic spellings in PRON; (3) signal refinement on the vocal stem (rest "
    "onsets, spectral-flux onsets, fricative starts; ends at the next word when legato, else when "
    "the voice drops 15 dB); (4) cross-check against faster-whisper large-v3-turbo word timestamps, "
    "the individual models/channels and a mel-roformer karaoke lead stem. conf: 0.35 + agreement "
    "of the independent alignments (<=60 ms) + CTC posterior + Whisper agreement. 'syl' = "
    "start/end of each spelled letter or compound part."
)

_NOTES = (
    "Timeline = ffmpeg's gapless decode of __AUDIO__ (44.1 kHz); the Demucs and karaoke stems "
    "were separated from that decode (offsets measured by cross-correlation). Beat grid: {grid}, "
    "median {bpm:.3f} BPM (period {P:.5f} s), first beat {off:.3f} s; beats[] is authoritative. "
    "Bar phase: beat index = {phase} (mod 4) is a downbeat; first downbeat {first_db:.3f} s, bar k "
    "starts at downbeats[k]. "
    "Envelopes: 100 fps, frame i centred at i/100 s, 46 ms RMS window, one-pole smoothing (10 ms "
    "attack / 90 ms release), each divided by its own 99th percentile and clipped to 0..1 (linear "
    "amplitude). low <150 Hz, mid 150-2000 Hz, high >4 kHz of the full mix; vocal/drums/bass/other "
    "= stem RMS. Onsets [time, strength 0-1] from the drums stem: kick = attack of the <120 Hz band "
    "({kk}); snare = 1.5-5 kHz attacks with a 0.5-5 kHz noise tail ({sn}); hat = >7 kHz attacks "
    "away from snares and kicks ({hh}). vocal = note onsets from the vocal stem (log-mel flux peaks "
    "+ legato pitch jumps > 0.8 semitone), including backing vocals / ad-libs."
)


def audio_notes(ctx):
    grid = ("tracked (kick-driven phase-locked loop + smoothing spline)" if GRID == "tracked"
            else "constant tempo fitted over the whole song")
    return _NOTES.format(grid=grid, phase=DOWNBEAT_PHASE, bpm=ctx["bpm"], P=ctx["P"], off=ctx["off"],
                         first_db=ctx["first_db"], kk=ctx["kk"], sn=ctx["sn"], hh=ctx["hh"])
