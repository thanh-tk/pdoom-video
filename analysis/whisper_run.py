"""Run faster-whisper (word timestamps) on the time-corrected vocal stem.

Writes work/whisper_<tag>.json ({"text", "segments"}) — the same schema the
old mlx-whisper runs produced. Used as an independent cross-check for the
CTC forced alignment in align.py.
"""
import common  # noqa: F401  (sets cache dirs)
import json, sys

MODELS = {
    "turbo": "large-v3-turbo",
    "large": "large-v3",
}

_model = None


def get_model(name):
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel(name, device="cpu", compute_type="int8")
    return _model


def run(tag, model, prompt=None):
    # pass decoded samples: faster-whisper 1.2.1 calls av.open(metadata_errors=),
    # which av>=19 no longer accepts — skipping PyAV avoids the incompatibility
    import soundfile as sf
    y, _ = sf.read(str(common.WORK / "vocals16k.wav"), dtype="float32")
    segments, _info = get_model(model).transcribe(
        y, language="en", word_timestamps=True,
        condition_on_previous_text=False, initial_prompt=prompt,
        temperature=0.0, beam_size=5, vad_filter=False, no_speech_threshold=None,
    )
    segs = []
    for s in segments:
        segs.append(dict(start=s.start, end=s.end, text=s.text,
                         words=[dict(word=w.word, start=w.start, end=w.end, probability=w.probability)
                                for w in (s.words or [])]))
        print(f"{s.start:7.2f} {s.end:7.2f} {s.text}")
    res = {"text": "".join(s["text"] for s in segs), "segments": segs}
    out = common.WORK / f"whisper_{tag}.json"
    out.write_text(json.dumps(res, indent=1, default=float))
    return res


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "turbo"
    run(which, MODELS[which])
    run(which + "_prompt", MODELS[which], common.song.WHISPER_PROMPT)
