# Code-rendered music video engine (boilerplate)

Engine, UI kit, tools and analysis pipeline for word-synced karaoke lyric videos where every frame is a deterministic function of song time, so the live preview in the browser and the offline 1080p60 (or 4K60) export are identical. `main` is the clean boilerplate: no song, no timing data, no plates, no treatment. Each video lives on its own branch started from `main`; `good-to-go` holds "Good to Go" (guugomeo), the reference run of the agent team.

- **Making a video** (new song, new lyrics, new branch): [`docs/NEW_VIDEO.md`](docs/NEW_VIDEO.md); with a team of agents: [`.devin/skills/video-team/SKILL.md`](.devin/skills/video-team/SKILL.md).
- Engine and scene API: [`docs/ENGINE.md`](docs/ENGINE.md). Treatment template: [`docs/TREATMENT.md`](docs/TREATMENT.md).
- Rules and commands for agents working in the repo: [`AGENTS.md`](AGENTS.md).

## Layout

- `audio/`, `lyrics/`, `data/` — per video (empty on `main`): the song, the lyric lines as sung (the aligner's input), and the timing data (`data/lyrics.json` word timings, `data/audio.json` beat grid, downbeats, sections, onsets, envelopes).
- `analysis/` — Python (uv) pipeline that produces the timing data: Demucs stem separation, a mel-roformer lead-vocal stem, CTC forced alignment cross-checked with Whisper, beat / downbeat / onset analysis. One command (`pipeline.py`); per-song tables in `analysis/songs/<song>.py` (`_template.py` documents every field).
- `app/` — the renderer: TypeScript + three.js, bun + Vite.
  - `src/engine/` — renderer core: timeline playback, adaptive motion blur, post-processing, typography (Inter, Inter Display, JetBrains Mono, Archivo, IBM Plex Mono, Cormorant Garamond, single-stroke fonts), palette, GPU line batches, HUD.
  - `src/scenes/` — `_ui.ts` UI kit (karaoke lyric blocks, cards, badges, screenshot overlays) and `slate.ts` timing-check scene; each video adds its plates here.
  - `src/timeline.ts` — the edit (only the slate on `main`). `src/project.ts` — title, audio file, output name (written by the scaffold).
  - `public/fonts/` — fonts; per video also `brand/`, `screens/`, `partners/` (internal cut only).
  - `scripts/render.ts` — offline renderer (headless Chrome → raw frames over WebSocket → ffmpeg), stills, contact sheets, QA sweeps, perf.
  - `scripts/new-video.ts` — scaffolds a video on its branch. `scripts/check.ts` — typecheck + text-encoding scan.
- `.devin/skills/video-team/` — the team recipe (roles, models, phases, gates), envelope templates and QA tools (real-data stills, determinism check, contact sheets, Herdr peer watch).
- `out/` — renders and work-in-progress stills (not in the repo).

## Requirements

[bun](https://bun.sh), Google Chrome (the offline renderer drives it headless through playwright-core) and ffmpeg with libx264. The analysis needs [uv](https://docs.astral.sh/uv/); the renderer doesn't. Everything runs on macOS and Windows.

## Preview

```sh
cd app
bun install
bunx vite --port 5173
```

Open http://localhost:5173 and use the keys below. `?t=23` starts at a given time, `?scale=0.5` renders at half resolution for slow GPUs (an integrated Intel GPU plays it at ~56 fps that way, ~15 fps at full size), `?cut=public` shows the public cut (no real code, PR numbers, release tag or partner logos).

| Key | Action |
|---|---|
| space | play / pause |
| ← / → | seek ±1 s (±5 s with shift) |
| `,` / `.` | step one frame |
| `[` / `]` | previous / next scene |
| `l` | loop the current scene |
| `h` | hide the UI |

## Render the video

```sh
cd app
bun scripts/render.ts video --samples auto --shutter 0.2      # writes out/onboarded.mp4
```

- **Output:** 1920×1080 at 60 fps, x264 CRF 16, AAC audio. `--cut public` renders the public cut.
- **Motion blur:** every frame is the average of many sub-frames spread over a short shutter (`--shutter 0.2`, a fifth of the frame time). `--samples auto` picks the count for each 32×32 tile: 12 where the image is still, up to 324 for whips and slams; a tile stops once more sub-frames would no longer change it by more than `--tol` levels of 255 (default 3). `--samples N` takes a fixed N (`--samples 4` makes a quick draft). Details: "Motion blur and sampling" in [`docs/ENGINE.md`](docs/ENGINE.md).
- **Pipeline:** two headless Chromes (`--workers 2`) render chunks of 8 frames in turn and stream them in order to one ffmpeg; frames waiting for the encoder are buffered in memory (`--mem-gb`, default 1) and then on disk (`--spool-gb`, default 20).
- **Cost:** the plates are 2D, about 60–65 ms per frame at one sample on an Intel Core Ultra 7 165H with integrated graphics; the whole song at 1080p is estimated at 1–1.5 h there.
- **4K:** `--scale 2 --x264 aq-mode=3:rc-lookahead=30` renders a true 3840×2160 (every layer at the physical resolution; scenes are laid out in 1920×1080 logical pixels). Works with every mode; in the preview add `&scale=2`.
- **Other modes:** `stills --t 12.5,13`, `sheet` (contact sheets, `--cuts` for every scene boundary), `sweep` (stills at every lyric line and every cut, for QA), `perf`, `gpu` (prints Chrome's WebGL renderer).

## Regenerate the timing data

The committed `data/*.json` files are all the renderer needs. Regenerating them needs the stems and intermediates, which are not in the repo; `analysis/pipeline.py` rebuilds everything from the mp3 (CPU is enough, CUDA is used when torch sees it; ~1 h 10 min per 3-minute song on a laptop CPU):

```sh
cd analysis
SONG=onboarded uv run python pipeline.py                 # every step whose output is missing or stale
SONG=onboarded uv run python pipeline.py --until analyze # decode … audio.json
SONG=onboarded uv run python pipeline.py --from align --force
```

`SONG` is required and selects `analysis/songs/<song>.py`. `DATA_OUT=<dir>` writes the `data/` outputs elsewhere (e.g. `DATA_OUT=work/<song>/out` to re-run a song and diff it against committed data with `compare.py`). Steps: decode → demucs → karaoke → offsets → vocals16k → emissions → whisper → feats → analyze → align. Requires `ffmpeg` on PATH. The models download about 4 GB into `analysis/.cache/`; delete that folder afterwards if space matters.

## Make a new video

```sh
git checkout -b <video-id> main
cd app
bun scripts/new-video.ts --id <id> --title "<Title>" --artist "<Artist>" --audio <song> --lyrics <lyrics.txt> --bpm <approx> --dry-run
# read the report, then the same command without --dry-run
```

Then follow [`docs/NEW_VIDEO.md`](docs/NEW_VIDEO.md): timing data, lyrics as sung, treatment, plates, QA, delivery; for a team run, [`.devin/skills/video-team/SKILL.md`](.devin/skills/video-team/SKILL.md).

## Credits

- **Engine origin:** the video for "I'm Upping My P(doom)" (lyrics by [osmarks](https://docs.osmarks.net/hypha/p%28doom%29_song_objectively_correct_interpretation), on an opening verse and chorus by [MusicPerson](https://www.udio.com/creators/MusicPerson); the "Claude-Pop" version posted by [deckard (@slimer48484)](https://x.com/slimer48484/status/2097752569212756134)), made with Claude (Opus 5.5) in Claude Code; later videos ("Onboarded", "Good to Go" by guugomeo) with Devin.
- **Fonts:** Inter, Inter Display, JetBrains Mono, Archivo, IBM Plex Mono and Cormorant Garamond (SIL Open Font License). Single-stroke EMS and Hershey fonts via the `hersheytext` package (OFL / public domain).

## License

The code is released under the [MIT License](LICENSE). The fonts in `app/public/fonts/` keep their own licenses (see Credits). The songs and lyrics (`audio/`, `lyrics/`, `data/lyrics.json`) and the product screens and logos (`app/public/brand/`, `app/public/screens/`, `app/public/partners/`) are not covered by it: they belong to their owners.
