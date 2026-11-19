---
name: video-team
description: Make a new code-rendered music video in this repo with a HEPHAESTUS-led team of Herdr peer agents (screenshots, treatment, plates in parallel tracks, GPT critics, success auditor), the recipe that produced "Good to Go" in one run (song to full live preview in ~2.5 h, ~88 ACU). Use when HENRY asks for a new video, a team or coworkers for a video, or "do it like Good to Go".
---

# Video team: the Good to Go recipe

The playbook for the video itself is `docs/NEW_VIDEO.md` (inputs, scaffold, timing data, treatment, plates, QA, defect catalogue) and the rules every scene follows are in `AGENTS.md`. This skill is the **team layer** on top: who runs what, in which order, with which gates, so a song becomes a full live preview in one run. It follows the global HEPHAESTUS team protocol (`~/.config/devin/hephaestus-team.md`, `full-team-implementation` skill) in its "keep it focused" variant: the lead performs the orchestrator duties itself.

Reference run: "Good to Go" (guugomeo, 3:26), 2026-11-18, branch `good-to-go`. Song received 15:23, all 12 timeline entries merged 17:56. 96.8 ACU total for 14 sessions, 87.7 of them in the team run (numbers below).

## 0. Before anything

- Read this file, `docs/NEW_VIDEO.md`, `AGENTS.md`, and `~/.config/devin/hephaestus-team.md` in full.
- Herdr is required (`HERDR_ENV=1`); every peer runs in a pane of the lead's tab (`herdr` skill).
- Team root (outside the repo): `~/HEPHAESTUS/<video-id>/` with `artifacts/` (BRIEF, PROGRESS, roles, tracks, reference), `worktrees/`, `shots/`, `qa/`, `logs/`, `audio/`.
- Ask HENRY once, up front, with `ask_user_question` (it is quick and he answers in one go):
  1. team plan approval;
  2. scaffold (`new-video.ts`; `--clean` only on a branch that still holds an old video);
  3. screenshot source (HENRY chose "latest develop": `git fetch origin develop`, then `git archive origin/develop frontend` into the team root and a `cp -a` of `node_modules`; his own checkout is never touched);
  4. bypass: HENRY allows **bypass mode for every peer** ("minimal intervention"). On a peer's first approval dialog, select `Bypass mode` (`herdr agent send-keys <peer> down`, check the selection in a zoomed read, then `enter`) and log it in PROGRESS.md.
- Deliverable is the **live preview** (`bunx vite --port 5173` in `app/`, `http://localhost:5173/?scale=0.5`, `&cut=public`); no MP4 unless HENRY asks.

## 1. Timeline of the run (critical path is the lead's)

| Clock (Good to Go) | Lead (critical path) | Peers in parallel |
|---|---|---|
| +0 | `audio/` tidy, scaffold dry run, scaffold, `WHISPER_PROMPT` with every product/place name, commit | — |
| +12 min | start `analysis/pipeline.py --until analyze` detached (`setsid nohup`, log in the team root): ~46 min CPU | — |
| +15 min | team setup (snapshot, role files, BRIEF, envelopes), launch peers | **shots** (screenshots) + **treatment** |
| +30 min | answer dialogs, review first shots, course-correct | treatment done in ~16 min → HENRY approves it |
| +36 min | ask HENRY: start plates round 1 now? | **kit** (kit + 12-entry timeline + intro + hook) |
| +46 min | — | **critic r1** (read-only) → kit remediation r1 |
| +60 min | pipeline done → lyrics as sung, PRON, grid/phase/sections, align, commit `data/*.json` | — |
| +65 min | merge round 1 + data, real-data stills, remediation r2 | **round 2**: phone, board, desk (then bridge split off) |
| +105 min | integrate round 2, real-data stills of every entry, both cuts | **critic r2** → **fix** worker |
| +125 min | final render with provenance, determinism check | **success auditor** |
| +153 min | merge into the video branch, docs, preview restart, memory, report | all peers closed |

## 2. Roster and models (wall-clock first; fast models on the critical path)

| Peer | Role file | Model | Work | Good to Go time / ACU |
|---|---|---|---|---|
| lead (HEPHAESTUS) | — | `claude-opus-5-5-xhigh-fast` | scaffold, timing data, orchestration, integration, QA, merges | 153 min / 28.7 |
| `shots-<id>` | worker | `claude-opus-5-5-high-fast` | demo-mode screenshots line by line, logos, SHOTLIST | 47 min / 9.7 |
| `treat-<id>` | worker | `fusion-claude-opus-5-5-xhigh-sidekick-swe-2-flash-max` | treatment draft + screens-needed list | 16 min / 2.0 |
| `kit-<id>` | worker | `claude-opus-5-5-high-fast` | round 1: kit additions, full timeline (slate fallback), intro + hook | 36 min / 17.0 |
| `phone-`, `desk-`, `bridge-<id>` | worker | `claude-opus-5-5-high-fast` | round 2 world tracks | 5–12 min / 2.7–6.7 each |
| `board-<id>` | worker | Fusion (as treat) | round 2 Go Board track | 30 min / 4.7 (too slow, see lessons) |
| `critic-<id>-rN` | critic | `gpt-6-1-sol-max-priority` | read-only review of each integrated round | 8–10 min / 0.9–1.4 |
| `fix-<id>` | worker | `claude-opus-5-5-high-fast` | fresh worker for the critic's findings | 8 min / 4.5 |
| `success-<id>` | success-auditor | `gpt-6-astra-xhigh` | final gate against the request verbatim | 10 min / 3.0 |

Rule of thumb: everything the lead waits on runs on a fast model. Use Fusion only for work nothing waits on (the treatment draft). A Fusion worker on a plate track became the critical path. Splitting its second plate to a fast worker (bridge: 5 min) recovered the time.

## 3. Phases in detail

### 3.1 Screenshots (worker, starts with the treatment)
- Envelope: `templates/shots.md`. It owns `shots/` and the develop snapshot (it runs the snapshot's dev server; never edits source).
- Reuse earlier capture scripts if present (Day One Ready's `cap-desktop.mjs`, `cap-phone.mjs`, `lib.mjs`). They block all non-localhost traffic, set demo mode before the first script, remove the banner and demo hints.
- Chromium without Chrome: playwright-core from `app/node_modules` with `executablePath ~/.cache/ms-playwright/chromium-1246/chrome-linux64/chrome`.
- Outputs: `shots/develop/*.png` + `manifest.json` (url, viewport, theme, note, source commit, md5, fictional values, hotspots), `SHOTLIST.md` (every sung line → shot or GAP + reason), `logos/` + `SOURCES.md`, contact sheets.
- Lead checks early: md5-identical before/after pairs (a state change not captured), SHOTLIST written early so the treatment worker can use it.

### 3.2 Treatment (worker, Fusion is fine)
- Envelope: `templates/treatment.md`. First deliverable within 10 min: `screens-needed.md` for the shots worker (before/after pairs with identical framing, hotspots).
- Then `TREATMENT_DRAFT.md` per `docs/templates/TREATMENT.md`: one idea, motif with payoff, worlds, palette/fonts, karaoke rules, plates table with the timeline block, per-line table (all sung lines verbatim), kit additions, constraints, build rounds, open questions.
- Lead verifies all lines are present (script) and no tech content, then asks HENRY the open questions in one `ask_user_question` (≤4 questions; group the rest as "draft recommendations stand"). Record the answers as a "HENRY's decisions" section at the end of the draft: every later envelope points to it.

### 3.3 Timing data (lead, while peers work)
- Fresh worktree setup: `uv sync --frozen --offline` in `analysis/` (0.6 s from the shared uv cache), `cp -a` the model cache from a checkout that has it (5.1 GB), `cp -a app/node_modules`.
- After `--until analyze`: compare both Whisper passes with the sheet; decide sung tags and dropped lines from evidence. Use lead-stem vs backing energy (`stems/karaoke/<id>/lead.wav` vs `stems/htdemucs_ft/<id>/vocals.wav`) and `zoom.py` plots; add a line only when the lead sings it.
- Keep punctuation-distinct texts for repeated lines that kit code finds by content (`lyrics.find` is a case-insensitive substring match that keeps punctuation). Good to Go added "Oh, signed, checked, good to go!" with commas so the chorus query "Signed! Checked! Good to go!" kept its 6 matches.
- Suno tempo drifts: `GRID = "tracked"` (Good to Go: kick residual 6 ms tracked vs 28 ms constant). Phase from `bar_phase.py`, sections from `bar_table.py`. `FIX`/`EXTRA_DESC` from zoom plots, then `--from analyze --force` and commit `data/*.json`.

### 3.4 Plates round 1 (one worker, can start before the timing data exists)
- Envelope: `templates/plates-round1.md`. Kit additions in `_ui.ts`, the **full** timeline (every entry; unbuilt modules fall back to `slate`, so the app boots end to end), the first two plates (intro + chorus module ×3).
- Without timing data, the worker verifies with typecheck + a synthetic `data/` copy in the team root. Once the real data lands, the lead fast-forwards the worker's branch onto the data commit and sends a remediation with real-data stills.
- Gate: GPT critic on the round (`templates/critic.md`), then remediation by the same worker, then the lead's real-data stills.

### 3.5 Plates round 2 (parallel world tracks)
- Envelopes: `templates/round2-common.md` (binding rules) + one `templates/track.md` per track. Split by world so files never overlap. Good to Go used phone (stages, payroll), board (pre-choruses), desk (sign, agency, outro) and bridge.
- Frozen files for round-2 tracks: `_ui.ts`, round-1 plates, `timeline.ts`, `engine/**`, `data/**`, `lyrics/**`, `analysis/**`. Shared helpers go in a per-track kit file (`_phone.ts`, `_board.ts`, `_desk.ts`).
- Lead integrates on `<id>/integration` in its own worktree. **Restart any no-HMR vite after new scene files are merged**: `import.meta.glob` is fixed at server start, so a stale server silently shows `slate` for the new plates.
- Watch for asset deletions across tracks. Good to Go: a kit remediation deleted `m_docs_after.png` while the phone track still drew it. The lead restored it as an integration commit.
- Gate: one critic on the integrated round (findings by owner), then a **fresh** fix worker (finished workers are closed: HENRY wants finished agents cleaned up), then the lead re-checks each fix on frames.

### 3.6 Final gate and merge
- Lead render with provenance of the exact SHA (`HEAD`, porcelain, stdout with scene errors and browser log in a log file), both cuts, plus `tools/determinism.mjs`. In Good to Go this caught a render-order dependence in a cached fit size.
- Success auditor (`templates/success-auditor.md`): original request verbatim plus every scope extension HENRY approved, ACs, candidate SHA. Expect "PASS WITH LIMITATIONS" (no sound playback, no browser for the auditor). Close the cheap NOT VERIFIED items yourself.
- Merge the integration branch into the video branch (fast-forward), copy the approved treatment to `docs/TREATMENT.md`, update the first lines of README/AGENTS, restart the preview, update memory, close every peer pane, report time/ACU per agent (`sessions.db`, see 5).

## 4. Lead conduct that made it work

- One `ask_user_question` per decision point, ≤4 questions, a recommended option first. HENRY answers fast; the team never waited on him for long.
- Envelopes name **absolute paths inside the team root** only. No `../`, no reads of `~/.config/devin` or HENRY's checkouts, so the approval hook auto-approves almost everything.
- Peers keep their own outputs current (SHOTLIST, manifest, handoff files). The lead reviews while they work and sends short course corrections with `herdr agent prompt` (they queue while the peer works).
- Watch with `tools/watch1.sh <peer> <pane> 270`. Herdr can say `done`/`idle` while a peer sits at an Allow/Bypass dialog, so read the zoomed pane (`tools/dialog.sh`) before trusting the state.
- Never `pkill -f <pattern>` from an exec shell whose own command line contains the pattern (it kills the shell). Kill servers by the port's PID from `ss -ltnp`.
- Look at frames yourself at every gate: contact sheets (`tools/sheet.py`) plus full-size crops of anything a finding names.
- Log every milestone, decision and answered dialog in `artifacts/PROGRESS.md`.

## 5. Tools (this folder)

| Tool | Use |
|---|---|
| `tools/stills.mjs` | `BASE=http://localhost:<port> [EXTRA_T=...] node .devin/skills/video-team/tools/stills.mjs <out> <entry ids> [public]`: real-data frames per line (middle, last word, exact `lineCut − 1/60`) and entry end, `index.tsv`, scene errors, browser log. Needs a no-HMR vite of the tree under test (`PDOOM_NO_HMR=1 ./node_modules/.bin/vite --port <port> --strictPort` in `app/`). |
| `tools/determinism.mjs` | entry starts, start − 1/60 and mids rendered in 3 seek orders; reports frames whose hash changes. |
| `tools/sheet.py` | contact sheets from a stills folder; run with `analysis/.venv/bin/python`. |
| `tools/peerwatch.py`, `tools/watch1.sh`, `tools/dialog.sh` | Herdr peer state, wait-until-done-or-dialog, zoomed dialog read. |

Cost and time per session: `~/.local/share/devin/cli/sessions.db` (read-only). Table `sessions`: `id` = the Herdr agent_session value, `created_at`/`last_activity_at` in epoch seconds, `metadata.total_acu_cost`. Use `message_nodes.created_at` to subtract idle gaps (overnight).

## 6. Lessons (Good to Go)

- Unreachable demo states are normal: the licence Front/Back accordion, a 9/9 progress bar, saved toasts, payroll form previews, passport/selfie and share-code inputs, referee nomination, the success toast. HENRY's rule: kit fallback cards with the product's real labels and fictional values. No "Samsung" contract title (use `_notitle` crops). No review/confidence badges on success thumbnails. No "AI verification" hint text. Partner logos in the internal cut only (`CUT`).
- Critics found real issues each round, cheaply (0.9–1.4 ACU): unused real captures, a strip below title-safe, a missing sub-scene for a sung tag, forbidden hint text, four switches instead of three, a phone-frame jump at an entry boundary, too many screenshot draws per frame.
- Kit caches must be pure functions of their key (round the input before computing, not only the key).
- Identical Canvas2D draw calls can still differ by a few antialiased text pixels after other text sizes were rendered (Chromium glyph cache). That is not scene state: verify with an instrumented `fillText` before chasing it.
