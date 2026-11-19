<!-- Template from the Good to Go run (2026-11-18). Placeholders: <TEAM> = ~/HEPHAESTUS/<id> (absolute path), <REPO> = the worktree root, <id> = video id, <BASE>/<SHA> = commits. Lines naming Good to Go plates, screens, lyrics or decisions are EXAMPLES: rewrite them for the new video. -->

# Assignment: <id> / kit-<id> (worker, plates round 1)

- Mode: implement. Model: claude-opus-5-5-high-fast (critical path). Launcher/approver: HEPHAESTUS (pane w8:p1). HENRY allows bypass mode for every peer in this run.
- Read first: <TEAM>/artifacts/roles/hephaestus-team.md (section 'Peer conduct'), <TEAM>/artifacts/roles/worker.md, <TEAM>/artifacts/BRIEF.md (constraints), then the APPROVED treatment <TEAM>/artifacts/TREATMENT_DRAFT.md including its final section "HENRY's decisions".
- Repository root: pdoom-video. Worktree: <TEAM>/worktrees/kit. Base: d412ce0 ("Start Good to Go on a clean slate"). Track branch: <id>/kit. Every exec workdir inside the worktree or the team root; absolute paths; no `../`.

## Objective
Plates round 1 (docs/NEW_VIDEO.md 5.5 step 1): kit additions + the full timeline + the first two plates, `intro` and `hook` (hook serves hook1/hook2/hook3 via params n=1..3), so the lead can preview them the moment timing data lands (~16:45).

## Acceptance criteria
- K-1 Kit (`app/src/scenes/_ui.ts`, additions only; existing exports unchanged): the product switch toggle (off/on, knob slide, word-keyed with landBy), the Go strip (seven labelled switches: Skills, Licences, Payroll Pack, Right to Work, DBS, References, Contract; state per entry so it carries across cuts), split-flap departures row (deterministic flip by time), stamp ("Signed!" / "Checked!" gang-shout hits), and whatever else the treatment's "Kit additions needed" list assigns to round 1. Each follows AGENTS.md rules (globalAlpha *=, effects before labels, fitSize, title-safe, no shadowBlur, cached layouts, deterministic).
- K-2 Timeline (`app/src/timeline.ts`): the 12 entries exactly as the treatment's timeline block (cut()/cutL by lyric content; never hard-coded times). Entries whose module is not built yet load `slate` as a placeholder so the app boots end to end.
- K-3 Plates `app/src/scenes/intro.ts` and `app/src/scenes/hook.ts` per the treatment's per-line table: sub-scene per line with lineCut bounds, lyricBlock with `win`, `lineAt(t) ?? lastLine(t)`, landBy for word-keyed actions, end states held before every cut, layout below the lyric from lyricBlock().bottom, light plates with LIGHT_POST, <=2 Layer2D uploads, static parts pre-rendered in init(), the chorus escalation across n=1..3 and the GO payoff on "I'm good to go!" (hook n=3).
- K-4 Partner logos only through `CUT` (public cut shows plain name tiles). Assets you add go under app/public/ (brand logo can be restored with `git -C <TEAM>/worktrees/kit show new-video:app/public/brand/onboarded-logo.png`; partner logos from <TEAM>/shots/logos/ once present, else name tiles); screenshots from <TEAM>/shots/develop/ (copy only the ones a plate uses into app/public/screens/; worker shots-<id> is still capturing, check SHOTLIST.md and develop/manifest.json; hotspots there give click targets).
- K-5 `~/.bun/bin/bun scripts/check.ts` (from app/) prints `check: OK` (both typechecks + encoding scan).
- K-6 Determinism: no Math.random / Date.now / performance.now in visuals; seeded hash/mulberry32; no stateful scenes.

## Owned files
app/src/scenes/_ui.ts, app/src/scenes/intro.ts, app/src/scenes/hook.ts, app/src/timeline.ts, new files under app/public/brand/, app/public/partners/, app/public/screens/. Allowed adjacent only if a colour is truly missing: app/src/engine/palette.ts + app/src/engine/glsl/common.ts (both together, with a wash). Anything else: BLOCKED with the exact scope request.

## Known limits (do not fight them)
- data/lyrics.json and data/audio.json do not exist yet (the lead's pipeline produces them ~16:45, then commits them on <id>). The app cannot boot until then; verify by typecheck and careful reading of the lyric-lookup strings against <TEAM>/worktrees/kit/lyrics/goodtogo.src.js (lyrics.get is a case-insensitive substring match; occurrences matter for the repeated chorus lines).
- render.ts cannot run in WSL (no Chrome) and HENRY chose live preview only: do not change render.ts. The lead previews in a browser once data lands.
- Reference implementations: `git -C <TEAM>/worktrees/kit show new-video:app/src/scenes/<hook|agency|forms|call|release>.ts` (patterns, not content). Engine API: docs/ENGINE.md.

## Commit policy
Commit only owned files to <id>/kit, small coherent commits once check.ts passes, repository commit style (see git log), trailer lines from worker.md. No push, no merge, no rebase.

## Output
Worker Required output, also written to <TEAM>/artifacts/tracks/kit-<id>.handoff.md. A GPT critic peer reviews the branch before the lead merges it.
