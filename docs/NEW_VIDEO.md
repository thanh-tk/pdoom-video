# Making a new video: the playbook

How to turn a song and its lyrics into a new code-rendered lyric video with this repo, written down after "Onboarded" (Oct 2026) and updated after "Good to Go" (Nov 2026, branch `good-to-go`) so the next one starts from what was learned, not from scratch. Read it with `AGENTS.md` (the rules every scene follows) and `docs/ENGINE.md` (the scene API).

**Model:** `active` is the clean boilerplate (engine, kit, tools, analysis pipeline, templates, these notes; `main` only mirrors upstream for fork sync); each video gets its own branch started from `active` (the reference run is `good-to-go`). The engine, the analysis pipeline, the slate, the UI kit, the fonts and the tools come from `active`; the song, the data, the treatment, the plates and their assets are per video. For a team run of agents (screenshots, treatment and plates in parallel, critics, success auditor) follow `.devin/skills/video-team/SKILL.md`.

## 0. Phases and what they cost on this laptop

Intel Core Ultra 7 165H, integrated graphics, no NVIDIA, 31 GB RAM.

| phase | output | time / gate |
|---|---|---|
| 1. Inputs | audio, lyric sheet, credits, subject material | ask everything in one message |
| 2. Branch + scaffold | branch, song config, lyric source, empty timeline | minutes |
| 3. Timing data | `data/audio.json`, `data/lyrics.json` | pipeline ~1 h 10 min CPU (37 min of it the lead-vocal separation), then 30–60 min of checking |
| 4. Treatment | `docs/TREATMENT.md` | **explicit approval** before any plate is built |
| 5. Plates | `app/src/scenes/*.ts`, `timeline.ts` | in rounds: kit + timeline + 2 plates first, review, then the rest |
| 6. QA | sweep stills, sheets, perf, preview with sound | before anyone else sees it |
| 7. Deliver | live preview link; MP4 only on request | 1080p60 export est. 1–1.5 h here (not yet run for Onboarded) |

## 1. Inputs to collect

Ask for all of these at once:

1. **The song file** (mp3, wav, flac, m4a or ogg).
2. **The lyrics as text** with `[Section]` headers. A repeated section may be written as an empty header (`[Chorus]` with no lines); the scaffold expands it. Backing echoes in parentheses (`I'm signed! (Signed!)`) are recognised and kept out of the aligned text.
3. **Title, artist / writers, credits** (end card and README).
4. **Subject material**: product repo, brand assets, screenshots, what may be shown, what must stay off-screen, whether there is a public cut.
5. **Tone, references, things to avoid.**
6. **Deliverable**: live preview only, or an MP4 (the export is slow here; for Onboarded Henry chose the preview only).

The lyric sheet is never the final truth: what is sung wins (section 3.2).

## 2. Start the branch

```sh
git checkout -b <video-id> active # e.g. payroll-anthem
cd app
bun scripts/new-video.ts --id <id> --title "<Title>" --artist "<Artist>" \
  --audio "<path to song>" --lyrics "<path to lyrics.txt>" --bpm <approx BPM> --dry-run
```

Read the dry-run report, then run it again without `--dry-run` (add `--clean` only on a branch that still holds an old video). `--clean` refuses to run on `main` / `new-video` or with uncommitted changes, so everything it deletes stays in git history.

What it does:

- copies the song to `audio/<id>.<ext>`;
- turns the lyric sheet into `lyrics/<id>.src.js`: drops the preamble (title and style notes before the first header) and lines that are only a parenthesised note, expands empty repeat headers, removes backing echoes (a parenthetical whose words already occur earlier in the line), keeps other parentheticals (they may be sung by the lead: "(one type's enough, you see)" was);
- writes `analysis/songs/<id>.py` from `analysis/songs/_template.py`, with the tempo range from `--bpm`, a commented `PRON` stub for every token the default spelling rule gets wrong (acronyms, digits, camelCase, code) and an `EXTRA_DESC` stub for every removed echo;
- points `app/src/project.ts` at the song (title, audio, output name) and resets `app/src/timeline.ts` to one `slate` entry for the whole song;
- with `--clean`: deletes the previous plates (`app/src/scenes/*.ts` except `slate.ts` and `_ui.ts`), their assets (`app/public/screens`, `partners`, `brand`), the previous song's `data/*.json`, and replaces `docs/TREATMENT.md` with `docs/templates/TREATMENT.md`.

It prints the report (sections and line ranges, expansions, echoes removed, parentheticals kept, flagged tokens) and the next steps. Also update the first lines of `AGENTS.md` and `README.md` (which video this branch holds). Commit: "Start <Title> on a clean slate".

The app cannot boot until `data/*.json` exist again (section 3).

## 3. Timing data

All commands from `analysis/`. `SONG=<id>` is required (it selects `songs/<id>.py`; without it the scripts stop and list the songs).

### 3.1 Run everything except the alignment

First complete `WHISPER_PROMPT` in `songs/<id>.py` with every product and proper name in the lyrics (the scaffold only adds the flagged acronyms): the `whisper` step reads it, and changing it afterwards means re-running that step.

```sh
SONG=<id> uv run python pipeline.py --until analyze
```

Steps: decode → demucs → karaoke → offsets → vocals16k → emissions → whisper → feats → analyze; each is skipped when its output exists and is newer than the decode. Run it from a shell you keep open (long jobs started from short-lived shells get killed), and check the process is alive before waiting on it. Models download ~4 GB into `analysis/.cache/` the first time.

### 3.2 Lyrics as sung

Compare `lyrics/<id>.src.js` with the Whisper transcripts in `analysis/work/<id>/whisper_turbo.json` and `whisper_turbo_prompt.json` (and listen). Edit the source until it is exactly what the lead sings:

- repeats written out, unsung lines removed, sung tags added. Onboarded: verse 2's first line sung once (the mp3's embedded lyrics had it twice), pre-chorus 2 without its two "Oh-oh" lines, an extra "I'm onboarded!" tag after chorus 1, an extra "Onboarded." at the end. 50 lines, 389 words;
- backing echoes and ad-libs stay out of the text; the aligner's garbage token absorbs them. List them in `EXTRA_DESC` with times from the transcripts, so `align.py` names them instead of reporting "unlisted vocal";
- the times in the source are placeholders: `align.py` reads only the text.

### 3.3 Spellings for the aligner

The CTC aligner only knows letters. The default rule lower-cases a token and drops everything that is not a letter, so "M1A" becomes "m a" and "1.7.0" becomes nothing. Fill `PRON` with the sung spelling for every such token, keyed by the exact token including punctuation ("ATS," and "ATS" are separate keys). Onboarded: `"BSB,": "bee ess bee"`, `"TrustID": "trust eye dee"`, `"M1A": "em one ay"`, `"sp_getapplock,": "es pee get app lock"`, `"SaveChanges,": "save changes"`. Check every line:

```sh
SONG=<id> uv run python pron.py
```

Put the same names into `WHISPER_PROMPT` so Whisper spells them too.

### 3.4 Beat grid, bar phase, sections

1. **Grid.** `analyze` prints the tempo and the kick residual. If the residual grows over the song, the tempo drifts: set `GRID = "tracked"` (follows the kick drum). Onboarded drifted from ~126 to ~130.7 BPM: a constant grid slid up to a quarter beat off the drums; the tracked grid matched 381 of 447 kicks within ~6 ms. P(doom) was constant. Keep `BPM_RANGE` narrow (known tempo ±8) to avoid half or double time.
2. **Bar phase.** `SONG=<id> uv run python bar_phase.py`: harmonic novelty peaks on the bar line (beat index mod 4, and mod 8 for two-bar chords) and the snare sits on beats 2 and 4. Set `DOWNBEAT_PHASE`.
3. **Sections.** `SONG=<id> uv run python bar_table.py` prints the drums / bass / other / vocal energy of every bar. A section starts where the band changes (drums or bass in or out, a drop, a stop bar); a line's short pickup stays in the previous section. Write `SECTION_BARS`, with a comment per section saying what changes there (see `songs/onboarded.py`).

Then run the analysis and the alignment:

```sh
SONG=<id> uv run python pipeline.py --from analyze --force
```

### 3.5 Check the alignment

- **Whisper vs aligner.** Whisper's word starts run ~80–100 ms earlier than the CTC alignment on sung vocals (both songs). The alignment is the reference; Whisper is a cross-check. A median offset in that range is normal; large disagreements on single words are worth a look.
- **Confidence** per word is in `data/lyrics.json` (`conf`). Low values are the words to inspect.
- **Plots** in `analysis/qa/<id>/`: `audio_*.png` (grid on the drums spectrogram), `line_*.png` (per line). `SONG=<id> uv run python zoom.py <t0> <t1>` zooms anywhere (`zoom.py lines [i ...]` = per-line zooms), into the same folder. Correct only clear errors, in `FIX` (`(line index, token index): dict(start=..., end=..., syl=[...])`, as in `songs/pdoom.py`), then re-run `--from align --force`.
- **Port check (already done):** re-running the pipeline on P(doom) reproduced its hand-verified data (word starts median 0 ms, p90 20 ms); `compare.py --ref A --new B` diffs two data sets.

### 3.6 Watch the slate with sound

```sh
cd app && bunx vite --port 5173      # keep this shell open
```

Open http://localhost:5173/?scale=0.5 and play: the slate shows the line, the word wipe, beats, bars and sections. Every word must light on the voice, never ahead of it. Fix and re-run until it does. Commit the song, the lyric source, the song config and `data/*.json` (never `analysis/work`, `analysis/stems` or `analysis/.cache`).

## 4. Treatment

Draft `docs/TREATMENT.md` (template: `docs/templates/TREATMENT.md`) from the lyrics, the sections and the subject material:

- one idea in one paragraph, a recurring motif that pays off at the end, two or three "worlds" mapped to sections;
- look: palette (every accent with a light wash), fonts, motifs, karaoke rules, assets, internal vs public cut;
- the plates table: one plate per section (or per pair of short sections); inside a plate, one sub-scene per lyric line;
- what each line shows, keyed to the words that trigger changes;
- production constraints: on this laptop, 2D / 2.5D only (Canvas2D layers, textured screenshots, `LineBatch`); no ray-marching.

**Get an explicit yes.** For Onboarded, "whatever it run is done" was taken as approval and the treatment was built as drafted; it worked out, but an explicit "approved" (or the list of changes) is the gate.

### Capturing screenshots of a web product

What worked for Onboarded (run its frontend in demo mode with mock data only; never touch its repo):

- Playwright from the app's own dependency: `createRequire('<repo>/app/package.json')('playwright-core')`, `chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11'] })`.
- Desktop context 1920×1080 at `deviceScaleFactor: 2`; phone context 390×844 at 3 with `isMobile` and `hasTouch`.
- `context.addInitScript(() => localStorage.setItem('app_demo_mode', 'true'))` before the first navigation.
- After each navigation wait for `networkidle`, then until no "Loading" text remains (≤15 s), then 1.5 s more.
- Remove the "Demo Mode" banner (the ≤90 px element whose text matches /demo mode/i, `div.bg-amber-500/10` in Onboarded) and zero the page's top padding before the screenshot.
- Save a `manifest.json` (file, url, viewport, note) next to the PNGs in `out/wip/screens/`; copy only the shots a plate uses into `app/public/screens/`.
- Measure what overlays need (the screenshot's region of interest, badge centres, number boxes) as fractions of the image size, from the PNG itself.

## 5. Build the plates

### 5.1 Timeline

Entries in `app/src/timeline.ts`, each cut on the beat before a lyric line, found by its text:

```ts
E('forms', 'forms', cut('Sort code or BSB'), cut('And somewhere in the cloud', 0)),
E('cloud2', 'cloud', cut('And somewhere in the cloud', 1), cut("I'm signed! I'm checked!", 1), { params: { n: 2 } }),
```

`cut(text, nth)` = `lineCut` of the nth line containing `text`: the last beat at or before its first word, moved off the beat just far enough for the previous line's last word to be sung and wiped first (`app/src/engine/lyrics.ts`). One module can serve several entries through `params`. Never hard-code times.

### 5.2 Anatomy of a plate (sub-scene per line)

The pattern every Onboarded plate uses (from `agency.ts`):

```ts
if (!this.cache) {
  const L = [lyrics.get('Over at the agency'), lyrics.get('dashboard full') /* … one per line */];
  const cutAt = (i: number) => lineCut(audio, L[i]!, lyrics.lines[L[i]!.i - 1]);   // engine/lyrics.ts
  this.cache = { L, b: L.map((_, i) => i === 0 ? f.start : cutAt(i)).concat([f.end]) };
}
const { L, b } = this.cache;
const sub = b.findIndex((bb, i) => t >= bb && t < b[i + 1]);
const win: [number, number] = [b[sub]!, b[sub + 1]!];             // this line's sub-scene
const lb = lyricBlock(c, L[sub], t, 120, 160, { family: F.interDisplay(700), size: 60, maxWidth: 1728, win });
const contentTop = lb.bottom + 0.3 * 60 + 40;                     // layout below the lyric
// actions keyed to words finish by landBy(word, win[1]) and hold their end state
```

Rules (also in `AGENTS.md`):

- **Everything finishes before the cut.** The next line's beat cuts the sub-scene; an animation timed past it is truncated and never reaches its end state. Word-keyed actions run over `[landBy(w, subEnd) - d, landBy(w, subEnd)]` (`landBy` = `min(w.start + 0.2, subEnd - 0.3)`), and every `lyricBlock` gets `win` so the wipe completes before the cut although the singer holds the last word up to it. The window ends at the next line's cut, clamped to the entry's end `f.end`: never at the next line's first word, which for a plate's last line comes after the plate has ended.
- **Cut with `lineCut`.** A line's last word can start after the next line's beat (a pickup that overlaps it, or a half-spoken line that runs over the beat); `lineCut(audio, next, prev)` then moves the cut off the beat just far enough (prev's last word start + 0.12 s, but ≥0.02 s before next's first word). Onboarded had three: "be", "got it!", and "go" (the Service Bus moment).
- **Hold the line through gaps.** Plates that follow the lyric line by line take `lyrics.lineAt(t) ?? lyrics.lastLine(t)`: `lineAt` alone returns null between lines, so the lyric blinks off for 0.1–0.5 s and anything laid out below it jumps.
- **Lay out below the lyric** from `lyricBlock(...).bottom`, never at a fixed y; long lyrics wrap to more rows.
- **Fit text to its container** with `fitSize`; keep everything title-safe (96 px).
- **Continuity across a cut**: what the previous sub-scene added must be there from the first frame of the next (pass a `landed` flag rather than re-animating it).
- **Effects behind labels**: bursts, rings and glows are drawn before the text they decorate.

### 5.3 The kit

`app/src/scenes/_ui.ts`:

- generic, keep for any video: `lyricBlock` (karaoke wrap + wipe, `win`), `landBy`, `loadImage`, `drawShot` / `ShotMap` (screenshot contain-fit with registered overlays), `LIGHT_POST`, `CUT`, `tap`, `tick`, `padlock`, `pill`, `badge`;
- Onboarded-styled, restyle or drop: `card`, `button`, `field`, `stepRow`, `progressBar`, `phone`, `figure`, `tickDisc`, `statusPill`, `completedCount`, `TONES`.

Helpers in `app/src/engine/`: `type.ts` (`F` fonts, `font`, `measure`, `glyphX`, `fitSize`, `smart` for typographic punctuation), `util.ts` (`clamp`, `ease`, `prog`, `springStep`, `frameIdx`, seeded `mulberry32` / `hash`), `palette.ts` (`rgba(key, alpha)`, `LIN`), `gl.ts` (`Layer2D`, `FSPass`, `clearRT`).

- **Colours** live in two places: `palette.ts` and the `C_*` constants in `glsl/common.ts`. Every accent needs a light wash (`crimsonWash`, `amberWash`, …): text in a tone on a pill of the same tone is invisible.
- **Fonts**: TTFs in `app/public/fonts/` (OFL) and an entry in `F`.
- **Helpers multiply alpha** (`c.globalAlpha *= …`), never assign it, or they cancel the caller's fade.
- **Screenshots**: draw with `drawShot(c, im, view, roi)`; place overlays through the returned map in image fractions and clip them to `m.rect`; animate the whole framed shot (scale about its centre), never zoom inside the frame.
- **Internal-only content** (real code, PR numbers, release tags, partner logos) goes through `CUT`.

### 5.4 Performance

Light Canvas2D plates cost ~60–65 ms/frame here (`bun scripts/render.ts perf --only <ids>`); the live preview needs `?scale=0.5` (~56 fps; full resolution plays at 14–18 fps). Avoid `shadowBlur` and per-frame `measureText` storms (cache layouts, as `lyricBlock` does), keep to ≤2 `Layer2D` uploads per scene, pre-render static parts in `init()`. Output must stay a pure function of `f.t`: no `Math.random`, no clocks, no state carried between frames.

### 5.5 Work in rounds

1. Kit additions + the full timeline + the first two plates; review their stills.
2. The remaining plates, two or three per round, each reviewed before the next.
3. A full QA pass (section 6), then fix batches grouped by cause, not by symptom.

## 6. QA before showing anyone

From `app/`:

1. `bun scripts/check.ts`: both typechecks plus a scan of the repo's text files for mojibake (`â€`, `Ã©`, …) and doubled carriage returns. <!-- check:ok -->
2. `bun scripts/render.ts sweep --sheets --out ../out/wip/sweep`: one still at the middle of every lyric line, one at the last frame before the next line's cut, one at the last frame of every timeline entry, plus contact sheets; `index.tsv` maps each file to its line. Open the stills at full size and check each one:
   - every word on screen is correct and readable (no mojibake, no clipped glyphs, nothing outside its card / phone / title-safe area);
   - on the end frames the lyric is fully wiped and every animation has reached its final state;
   - nothing overlaps the lyric or another element; overlays sit exactly on the screenshot;
   - coloured text has contrast against its pill.
3. `bun scripts/render.ts sheet --cuts --out ../out/wip/cuts.png`: two frames either side of every entry boundary.
4. `bun scripts/render.ts perf --only <heaviest ids>`.
5. The public cut, if there is one: `stills ... --cut public`.
6. The live preview with sound at `?scale=0.5`, each plate on loop (`l`).

Say plainly what was not checked (for Onboarded: never watched in real time with sound by the agent).

## 7. Defect catalogue (Onboarded fix round)

Henry's report on the first full cut: "some text is broken like the audit log, some frames are too fast, not going full animation, some elements in incorrect positions". All three were systematic:

| symptom | cause | rule / fix |
|---|---|---|
| `â€”` instead of "—" in the audit log; doubled blank lines | a script re-wrote `hook.ts` through cp1252 and wrote CRLF twice | read/write UTF-8, keep line endings; `check.ts` scans for both <!-- check:ok --> |
| animations "too fast", never reach their end state (audit rows, pipeline, dashboard flip, code typing) | actions timed past the next line's cut were truncated | `landBy(word, subEnd)`; check frames at `cut − 1/60` (the sweep's end frames) |
| lyric wipe unfinished at the cut | the singer holds the last word up to the cut | `lyricBlock(..., { win })` |
| last word of a plate's last line half wiped on the plate's last frame (found later by `sweep`) | `win` ended at the next line's first word, which comes after the entry's cut | clamp the window end to `f.end` |
| a line's last word never lights ("be", "got it!"; the "go" moment cut 0.02 s after "go") (found later by `sweep`) | the word starts after the next line's beat cut | `lineCut` |
| the lyric blinks off between lines; the card below it jumps (found later by `sweep`) | `lyrics.lineAt(t)` is null in gaps | `lineAt(t) ?? lastLine(t)` |
| a plate's closing wipe covers its last word ("a mess") before it lights (found later by `sweep`) | the wipe started on the last beat, as the word was sung | start the wipe 0.3 s before the cut and end the last line's `win` there |
| badge / button ignores a parent fade | helpers set `globalAlpha =` | `globalAlpha *=` |
| "Completed" badge and counter beside the real ones on the dashboard | screenshot pixel coordinates pushed through a different fit and zoom | `drawShot` + `ShotMap` in image fractions, clipped to the shot; contain-fit a measured region of interest |
| dashboard cropped mid-word | cover-fit plus zoom inside the frame | contain-fit the region of interest; animate the framed shot as a whole |
| "Restricted" badge reads as a blank red bar | crimson text on a crimson pill (the tone had no wash) | every tone has a light wash in `palette.ts` and `glsl/common.ts` |
| cards and padlocks overlapping the lyric or each other | fixed coordinates | lay out from `lyricBlock().bottom` and from each other; drawn helpers (`padlock`) placed relative to the layout |
| phone welcome text running past the screen edge | fixed font size | `fitSize` to the container |
| chorus echo stamps off-frame or colliding | placed against the frame edge | place inside the layout (the next row's empty slot), at most two |
| burst rings drawn over the label | z-order | effects first, labels last |
| field added in one shot missing at the start of the next | state not carried across the cut | `landed` flag for continuity |
| ONBOARDED fill half done at the cut | fill timed to the sung word end | fill completes by `subEnd − 0.3` |

Environment problems met on the way:

- Blank frames in headless renders on Windows: `--use-angle=metal` fell back to SwiftShader. `render.ts` now picks D3D11 on Windows (`--angle` overrides).
- Browser log 404: the missing `favicon.ico`; harmless.
- The pipeline skipped `analyze` / `align` when the previous song's `data/*.json` existed: outputs older than the decode are now re-run.
- `bun` not on the bash PATH: `%USERPROFILE%\.bun\bin\bun.exe`.
- Long jobs and the dev server died with the shell that started them: run them from a shell that stays open; check before waiting on them.

## 8. Deliver

- **Preview:** `cd app && bunx vite --port 5173`, then http://localhost:5173/?scale=0.5 (space play/pause, ←/→ ±1 s, shift ±5 s, `[`/`]` scene, `l` loop, `h` hide UI; `&cut=public` for the public cut).
- **Export:** `bun scripts/render.ts video --samples auto --shutter 0.2` writes `out/<id>.mp4` (1080p60, x264 CRF 16, AAC). `--scale 2 --x264 aq-mode=3:rc-lookahead=30` for 4K. Start it from a shell that stays open; it takes hours on this laptop.
- **README:** title, what the video is, credits, licence notes for the song and assets.
- **AGENTS.md:** the first paragraph names the branch's video; add any new rule you had to learn.
- Commit on the video's branch; never push without being asked.
