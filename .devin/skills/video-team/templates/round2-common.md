<!-- Template from the Good to Go run (2026-11-18). Placeholders: <TEAM> = ~/HEPHAESTUS/<id> (absolute path), <REPO> = the worktree root, <id> = video id, <BASE>/<SHA> = commits. Lines naming Good to Go plates, screens, lyrics or decisions are EXAMPLES: rewrite them for the new video. -->

# Plates round 2: shared rules for phone-<id>, board-<id>, desk-<id>

- Launcher/approver: HEPHAESTUS (pane w8:p1). HENRY allows bypass mode for every peer in this run.
- Read first: <TEAM>/artifacts/roles/hephaestus-team.md ('Peer conduct'), <TEAM>/artifacts/roles/worker.md, <TEAM>/artifacts/BRIEF.md, the APPROVED treatment <TEAM>/artifacts/TREATMENT_DRAFT.md (your plates' sections, their rows in "Per line", "Kit additions needed", "Production constraints", and "HENRY's decisions"), then your track envelope. Repository rules from your worktree: AGENTS.md ("Rules scenes must follow"), docs/ENGINE.md, docs/NEW_VIDEO.md sections 5 and 7 (the defect catalogue is your checklist).
- Base for every track: e40936a = <id> with the REAL timing data (data/*.json) and round 1 (kit in app/src/scenes/_ui.ts, the 12-entry app/src/timeline.ts with slate fallback, intro.ts, hook.ts). Your module file name = the timeline's module name, so it loads automatically.
- Reference code: app/src/scenes/intro.ts and hook.ts (round 1, same kit, same rules) and `git show new-video:app/src/scenes/<call|forms|agency|release>.ts` (Onboarded patterns: phone, drawShot, review, end card).

## Frozen files (do not edit; BLOCKED with the exact request if you need a change)
app/src/scenes/_ui.ts, app/src/scenes/intro.ts, app/src/scenes/hook.ts, app/src/timeline.ts, app/src/engine/**, data/**, lyrics/**, analysis/**. Plate-specific or track-shared helpers go in your own kit file (named in your envelope). Use the exported kit as is: toggle/toggleSprite, STRIP / STRIP_PHONE / STRIP_DESK, stripState, goStrip, stamp/stampSize, flap/flapSpan, phoneShot, shotPair, notif, trainWindow, boardGrid, lyricBlock, landBy, drawShot, CUT, LIGHT_POST, TONES.

## Lyrics (real data, find by content, never by time or index)
- `lyrics.find(q)` is a case-insensitive substring match that keeps punctuation; repeated lines need the occurrence inside your entry window (filter the matches by `l.start >= f.start && l.start < f.end`, or nth).
- Changes vs the sheet: a sung tag after chorus 1 "Oh, signed, checked, good to go!" (inside hook1, not yours); the outro's first line is "I'm good to go!" (the second occurrence in the song); 53 lines.
- The treatment's line numbers are the sheet's (1-based, before the tag); key everything by text.

## Screens and assets
- Develop captures: <TEAM>/shots/develop/*.png, <TEAM>/shots/develop/manifest.json (notes, fictional values, hotspots in CSS px of 390x844 phone / 1920x1080 desktop viewports; PNGs are @3x / @2x), <TEAM>/shots/SHOTLIST.md (line -> shots, partial GAPs). Use `_notitle` variants for anything showing the contract title (never "Samsung"). No "Needs Review"/"Confidence" badge crops for success moments.
- Logos: <TEAM>/shots/logos/ (SOURCES.md). Partner logos internal-cut only (CUT); public cut = name tiles.
- Copy only the files a plate uses into app/public/screens/, app/public/partners/ or app/public/brand/ (keep file names; identical copies across tracks merge cleanly).
- GAPs get kit fallbacks with the real field labels and fictional values (HENRY's decision).

## Verification (all required)
1. `~/.bun/bin/bun scripts/check.ts` from app/ prints `check: OK`.
2. Real-data stills: start your own no-HMR server from your worktree's app/ on your port (`PDOOM_NO_HMR=1 ./node_modules/.bin/vite --port <port> --strictPort`, background shell), then from workdir <TEAM>/qa run `BASE=http://localhost:<port> node <REPO>/.devin/skills/video-team/tools/stills.mjs <TEAM>/qa/<track> <entry ids>` (also once with a 3rd argument `public` into a separate folder). It prints the timeline, scene errors and browser log, and writes frames at every line's middle, last word +0.15 s, 0.25 s before the next line, and the entry end - 1/60, plus index.tsv. Open the frames you need (every end frame, every word-keyed landing). Contact sheet: `cd <TEAM>/worktrees/<track>/analysis` is not set up; instead run `python3 <REPO>/.devin/skills/video-team/tools/sheet.py <folder>` only if PIL is importable, else view frames directly.
3. Scene errors must be `[]`; the only acceptable browser error is the favicon 404. Stop your vite server when done.
4. Determinism scan of your files: no Math.random / Date.now / performance.now / shadowBlur / `globalAlpha =`.

## Commit policy
Only your owned files, on your track branch, small coherent commits, repository style (git log), worker.md trailer. No push, no merge, no rebase, no amend. Delete any .playwright-mcp folder a browser tool creates in your worktree. Handoff: <TEAM>/artifacts/tracks/<track>.handoff.md (worker Required output). The lead integrates, renders its own real-data stills and runs a GPT critic on the integrated round.
