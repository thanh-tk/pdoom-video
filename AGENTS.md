# AGENTS.md — code-rendered music video engine (`active`: clean boilerplate)

Code-rendered music video. Every frame is a pure function of song time `t`, so the browser preview and the offline export are identical. Renderer: TypeScript + three.js r0.186, bun + Vite 8, TypeScript 7 (`app/`). Timing data comes from a Python/uv toolchain (`analysis/`) and is committed in `data/`. `active` is the clean boilerplate: engine, UI kit, tools, analysis pipeline, templates and playbook, with no song, timing data, plates or treatment. `main` only mirrors the upstream GitHub `main` for fork sync: never commit on it or branch work from it. One branch per video, each started from `active` (section "Starting a new video"); `good-to-go` holds "Good to Go" (guugomeo), the reference team run (its plates and kits are reusable examples). Team runs with Herdr peer agents follow `.devin/skills/video-team/SKILL.md`. Authoritative docs: `README.md`, `docs/ENGINE.md` (engine + scene API), `docs/TREATMENT.md` (concept + style bible of the current video; the template on `active`), `docs/NEW_VIDEO.md` (playbook for the next video: inputs, timing data, treatment, plates, QA, defect catalogue). No test suite and no linter: verification = `bun scripts/check.ts` + rendered stills you actually look at.

## Commands (run from `app/`)

- Install: `bun install --frozen-lockfile`
- Preview: `bunx vite --port 5173` → http://localhost:5173/?t=23 (`&scale=2` for 4K, `&scale=0.5` for a half-resolution preview on slow GPUs, `&cut=public` for the public cut). Keys: space, ←/→ (±1 s, shift ±5 s), `,`/`.` frame step, `[`/`]` scene, `l` loop scene, `h` hide UI.
- Server for renders while editing (no live reload): `PDOOM_NO_HMR=1 bunx vite --port 5190`, then pass `--url http://localhost:5190`. `render.ts` starts its own no-HMR server if none is reachable.
- Check: `bun scripts/check.ts` = both typechecks (`bunx tsc --noEmit -p tsconfig.json` / `-p tsconfig.scripts.json`) + a scan of the repo's text files (tracked + new, not ignored) for mojibake (`â€`, `Ã©`, U+FFFD) and doubled CRs (`--no-tsc` = scan only; a line containing `check:ok` is skipped, for docs that quote mojibake on purpose). <!-- check:ok -->
- Stills (main check — open the PNGs): `bun scripts/render.ts stills --t 12.5,13 --only call --out ../out/wip/call`
- QA sweep: `bun scripts/render.ts sweep --sheets --out ../out/wip/sweep` = a still at the middle of every lyric line, at the last frame before the next line's cut and at the last frame of every entry, plus contact sheets and `index.tsv` (`--from/--to/--only` narrow it).
- Contact sheet: `bun scripts/render.ts sheet --from 0 --to 32 --n 24 --cols 6 --out ../out/wip/sheet.png` (`--cuts` = every scene boundary)
- Clip: `bun scripts/render.ts video --from 20 --to 25 --only forms --preset veryfast --out ../out/wip/clip.mp4`
- Full render: `bun scripts/render.ts video --samples auto --shutter 0.2` (writes `out/<PROJECT.output>`; add `--scale 2 --x264 aq-mode=3:rc-lookahead=30` for 4K)
- Other modes: `perf`, `gpu` (prints Chrome's WebGL renderer), `plates`. Global flags: `--only id1,id2`, `--scale N`, `--angle <backend>`, `--cut public`. The script prints `SCENE ERRORS` / `BROWSER LOG` — read them.

## Starting a new video (full playbook: docs/NEW_VIDEO.md)

0. For a team run (screenshots, treatment, plates in parallel tracks, GPT critics, success auditor), read and follow `.devin/skills/video-team/SKILL.md`; it uses the steps below.
1. Collect in one message: song file, lyric sheet with `[Section]` headers, title/artist/credits, subject material and what must stay off-screen, tone, deliverable (preview only or MP4).
2. `git checkout -b <video-id> active`, then from `app/`: `bun scripts/new-video.ts --id <id> --title "<Title>" --artist "<Artist>" --audio <song> --lyrics <lyrics.txt> --bpm <approx> --dry-run`; read the report; re-run without `--dry-run` (`--clean` only when the branch still holds an old video; it refuses on `main`/`new-video` or a dirty tree). It writes `audio/<id>.*`, `lyrics/<id>.src.js`, `analysis/songs/<id>.py` (from `_template.py`), points `project.ts` at the song, resets `timeline.ts` to the slate, and with `--clean` deletes the old plates, their `public/` assets, `data/*.json` and resets `docs/TREATMENT.md` from `docs/templates/`.
3. Timing data (section below): `--until analyze`, lyrics as sung + `PRON`, grid/phase/sections, `--from analyze --force`, slate preview with sound.
4. Treatment → explicit approval → plates in rounds → QA (`check.ts`, `sweep`, `sheet --cuts`, `perf`, preview with sound) → update README/AGENTS first lines → commit on the branch.

## Analysis (regenerate `data/*.json` for a song)

- Per-song tables live in `analysis/songs/<song>.py` (audio path, lyric source, BPM range, `GRID` constant|tracked, `DOWNBEAT_PHASE`, `SECTION_BARS`, `PRON`, `ALT`, `FIX`, `ANCHORS`, `LINE_WINDOWS`, `EXTRA_DESC`, Whisper prompt, notes); `songs/_template.py` documents every field. Scripts are song-agnostic; `SONG` is required (no default: a forgotten `SONG` must not overwrite `data/` with another song).
- Run: `cd analysis && SONG=<song> [DATA_OUT=work/<song>/out] uv run python pipeline.py [--from STEP] [--until STEP] [--force]`. Steps: decode → demucs → karaoke → offsets → vocals16k → emissions → whisper → feats → analyze → align (each skipped when its output exists; `analyze`/`align` also re-run when their output is older than the decode). CPU-only here: ~1 h 10 min per 3-min song, ~37 min of it the karaoke (lead vocal) separation. Only `align` reads the lyric source (text only; its times are placeholders).
- `bar_phase.py` prints downbeat-phase evidence (harmonic novelty, snare positions); `bar_table.py` prints drums/bass/other/vocal energy per bar (for `SECTION_BARS`); `pron.py` prints the aligner's spelling of every token (fill `PRON` for acronyms, digits, camelCase, code: the default drops digits); `compare.py --ref A --new B` diffs two data sets (word/beat/onset/envelope stats). A re-run on P(doom) reproduces its hand-verified data (word starts median 0 ms, p90 20 ms).
- Lyrics source = what is actually sung (check the Whisper transcript); backing echoes stay out (the aligner's star token absorbs them) and go into `EXTRA_DESC`. Whisper word starts run ~80–100 ms early on sung vocals — the CTC alignment is the reference, Whisper only a cross-check.
- Suno songs can drift in tempo: use `GRID = "tracked"` (kick-driven phase-locked loop + smoothing spline) and check per-window kick residuals.

## Layout

- `app/src/project.ts` — title, audio file, default output name of the current video.
- `app/src/main.ts` — preview player, or `?export=1` API (`window.__pdoom.still/png/stream`) driven by `scripts/render.ts`.
- `app/src/timeline.ts` — the edit: entries `{id, load, start, end, params?, maxSamples?}`; cut points found by lyric text (`cut('...', nth)` = `lineCut`: last beat at/before the line's first word, unless the previous line's last word is still being sung). One module can serve several entries via `params` (`cloud` ×2, `hook` ×3).
- `app/src/engine/` — `engine.ts` (scene loading, compositing, adaptive per-tile motion blur, readback), `scene.ts` (Scene/Frame contract), `gl.ts` (FSPass, Compositor, Layer2D, makeRT, SCALE), `post.ts` (bloom/halation/CA/grain/vignette, DEFAULT_POST), `hud.ts`, `lines.ts` (GPU LineBatch), `type.ts` / `stroke.ts` (fonts: Archivo, Inter, Inter Display, JetBrains Mono `F.code`, Plex Mono, Cormorant, single-stroke fonts), `glsl/common.ts`, `palette.ts` (P(doom) keys + product keys paper, mist, line, slate, text, teal, tealWash, green, greenWash, crimson, mauve, blush, sea, deepSea, amber, night), `audio.ts`, `lyrics.ts`, `util.ts`, `scale.ts`.
- `app/src/scenes/` — per-video plates (none on `active`; Good to Go's on branch `good-to-go`: `intro`, `stages`, `payroll`, `checks`, `hook`, `sign`, `agency`, `bridge`, `outro` plus track kits); `_ui.ts` = product UI kit (card, badge, button, field, tick, tickDisc, stepRow, progressBar, phone, figure, tap, pill, `lyricBlock` karaoke, `LIGHT_POST`, `CUT`); `slate.ts` = timing-QA scene (lyrics, beats, sections).
- `app/public/` — fonts; per video `brand/`, `partners/` (logos, internal cut only), `screens/` (demo-mode screenshots: mock data, banner hidden).
- `app/scripts/` — `render.ts` (offline renderer + QA modes), `new-video.ts` (new-video scaffold), `check.ts` (typecheck + encoding scan).
- `.devin/skills/video-team/` — team recipe `SKILL.md`, envelope `templates/`, `tools/` (`stills.mjs` real-data frames without render.ts, `determinism.mjs`, `sheet.py`, Herdr `peerwatch.py`/`watch1.sh`/`dialog.sh`).
- `docs/templates/TREATMENT.md` — treatment skeleton the scaffold copies; `analysis/songs/_template.py` — song-config skeleton.
- `audio/`, `lyrics/<song>.src.js`, `data/lyrics.json`, `data/audio.json`, `out/` (renders, gitignored).

## Rules scenes must follow (details in docs/ENGINE.md)

- Deterministic: output is a pure function of `f.t`. No `Math.random`, `Date.now`, `performance.now` in visuals; seeded `mulberry32`/`hash`. Per-frame flicker uses `frameIdx(t)`. No `stateful` scenes (they block `--samples auto`).
- `render(f, out)` fully overwrites `out` (HalfFloat linear HDR). Light plates return `LIGHT_POST` (no bloom: white must not glow).
- Layout in logical 1920×1080 (`W`,`H`); title-safe 96 px; scale handled by `SCALE`.
- Karaoke: a word highlights exactly at its `start`, never ahead of the voice; find lyrics by content (and by occurrence inside the entry window), never hard-code times.
- Sub-scene cuts (next line's beat) truncate anything timed past them: word-keyed actions must complete by `landBy(word, subEnd)` (`_ui.ts`, holds ≥0.3 s before the cut), and every `lyricBlock` gets `win: [subStart, subEnd]` so the wipe finishes before the cut. `subEnd` is the next line's cut and never past the entry's end `f.end` (a plate's last line: the next line's first word comes after the cut, so a window ending there leaves the wipe unfinished on the plate's last frame). Check the last frame of each sub-scene (`cut − 1/60`), not just mid-line frames.
- Line cuts come from `lineCut(audio, next, prev)` (`engine/lyrics.ts`; `timeline.ts cut()` and every plate's sub-scene bounds use it): the last beat at/before `next`'s first word, moved off the beat when `prev`'s last word starts after it (overlapping pickups, half-spoken lines). Plates that follow the lyric line by line show `lyrics.lineAt(t) ?? lyrics.lastLine(t)` (`lineAt` alone is null in gaps: the lyric blinks off).
- Layout below a lyric from `lyricBlock(...).bottom + 0.3*size + 40`, never a fixed y. Keep text inside its container and title-safe; fit long strings with `fitSize`.
- Dashboard screenshot: `drawShot(c, im, view, SHOT_ROI)` contain-fits the measured ROI (no partial crops); `statusPill`/`completedCount` overlays are registered through the returned `ShotMap` and clipped to `m.rect`. Animate the framed shot as a whole (scale about its centre), never by zooming inside the frame.
- Badge/pill tones use `TONES` [tone, wash] — every tone needs a light wash (`tealWash`, `greenWash`, `crimsonWash`, `amberWash`); text on its own tone is invisible. New colours go in both `palette.ts` and `glsl/common.ts` (`C_*`).
- Drawing helpers multiply alpha (`c.globalAlpha *= a`), never assign it (that cancels the caller's fade). Effects (bursts, rings, glows) are drawn before the labels they decorate.
- Continuity across a sub-scene cut: what the previous line added is on screen from the first frame of the next (pass a `landed` flag instead of re-animating it).
- Text files are UTF-8; keep each file's line endings when rewriting it from a script (a cp1252 round-trip produced `â€”` on screen; a double CRLF write doubled every line break). Run `bun scripts/check.ts` after scripted edits. <!-- check:ok -->
- Typography: kerned via `layout()`/`glyphX()`, typographic punctuation (`smart()`; straight quotes only in code), no outlined/haloed type.
- Perf on this machine (Intel Core Ultra 7 165H iGPU): Canvas2D plates cost ~60–65 ms/frame avg (p95 ~76) in `perf --only hook1,cloud2,agency` (includes export readback). Avoid `shadowBlur`, per-frame `measureText` storms and >2 Layer2D uploads per scene; pre-render static parts in `init()`.
- Internal-only content (real code, PR numbers, release tags, partner logos) goes through `CUT` (`?cut=public` / `--cut public`).

## WSL notes (Ubuntu-24.04, since 2026-11-18)

- Repo: `~/work/REC_Video/pdoom-video` (branch `active`, the boilerplate; local `main` tracks `origin/main` for fork sync only) plus the Herdr worktree `~/.herdr/worktrees/pdoom-video/good-to-go` (`good-to-go`, local only). Remote `origin` = https://github.com/thanh-tk/pdoom-video.git (`main`, `active`); WSL has no HTTPS credentials, so push over SSH (`git push git@github.com:thanh-tk/pdoom-video.git <branch>`, account Henry-Thai). Cleaned 2026-11-19: the earlier video branches (P(doom), Onboarded, Day One Ready) were deleted at HENRY's request. Moved from `C:\Users\Henry.Thai\Work\New folder\REC_Video` as a fresh Linux clone: LF working tree, no `core.autocrlf`, so keep text files LF.
- Tools: bun 1.4.3 (`~/.bun/bin`, on PATH via `~/.zshrc`; in non-interactive bash call `~/.bun/bin/bun`), uv 0.9.0 (`~/.local/bin`), ffmpeg 6.1.1 (apt), Node 26 via nvm (not needed by the app). Pin new tools/deps to releases ≥7 days old.
- `analysis/.venv` is the Linux env (Python 3.12.3, torch 2.14.0+cu130 running on CPU: no NVIDIA GPU here). On 2026-11-18 `align` reproduced `data/lyrics.json` byte for byte from the copied `analysis/work` intermediates.
- `analysis/.cache/hf/hub` uses relative symlinks (snapshots → blobs): copy it with `rsync -l` / `cp -a`, never `rsync -r` alone.
- Preview: `.wslconfig` uses `networkingMode=mirrored`, so a vite server started in WSL opens in the Windows browser at http://localhost:5173.
- Renders: Google Chrome is not installed in WSL, and `render.ts` launches `channel: 'chrome'`, so `stills`, `sweep`, `sheet`, `perf`, `video`, `plates` and `gpu` fail until it is installed (needs sudo). Without Chrome use `.devin/skills/video-team/tools/stills.mjs` (Playwright's Chromium by path, the app's `?export=1` API) against a no-HMR vite; restart that vite after adding scene files (`import.meta.glob` is fixed at start). On Linux `render.ts` passes no `--use-angle` by default (only macOS and Windows have one); run `render.ts gpu` first to see which WebGL backend Chrome gets under WSL before trusting stills or perf numbers.
- The Windows notes below describe the old Windows checkout.

## Windows notes (this machine)

- Tools: bun 1.4.3 (`%USERPROFILE%\.bun\bin`; not on Git Bash's PATH in agent shells: call `/c/Users/Henry.Thai/.bun/bin/bun`), ffmpeg 9.0.2 (winget Gyan.FFmpeg), uv 0.13.4 (winget), Node 26, Chrome. Pin new tools/deps to releases ≥7 days old.
- The browser log's 404 is the missing `favicon.ico`: harmless.
- `render.ts` picks the ANGLE backend per platform (Metal on macOS, D3D11 on Windows; `--angle` overrides). With `--use-angle=metal` Chrome on Windows falls back to SwiftShader and renders blank frames.
- Long background jobs started from short-lived shells get reaped: run the pipeline / dev server from a shell you keep, and check the process is alive before waiting on it.
- Python on Windows defaults to cp1252: write text files with `encoding="utf-8"`.
- Repo path contains a space (`New folder`): quote paths.
- `vite.config.ts` serves `audio/` and `data/` from the repo root via middleware (Windows has no directory symlinks).
- Onboarded screenshots: run the Onboarded-v2 frontend (`npx vite --port 5180` in its `frontend/`), set `localStorage.app_demo_mode = 'true'`, remove the "Demo Mode" banner (`div.bg-amber-500/10`) before capture. Mock data only; the Onboarded-v2 repo is read-only for this project.
