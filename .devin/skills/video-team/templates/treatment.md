<!-- Template from the Good to Go run (2026-11-18). Placeholders: <TEAM> = ~/HEPHAESTUS/<id> (absolute path), <REPO> = the worktree root, <id> = video id, <BASE>/<SHA> = commits. Lines naming Good to Go plates, screens, lyrics or decisions are EXAMPLES: rewrite them for the new video. -->

# Assignment: <id> / treat-<id> (worker B, treatment draft)

- Mode: implement (document). Model: fusion-claude-opus-5-5-xhigh-sidekick-swe-2-flash-max. Launcher/approver: HEPHAESTUS (pane w8:p1).
- Read first: <TEAM>/artifacts/BRIEF.md (constraints and AC-6, AC-7 are yours), <TEAM>/artifacts/roles/worker.md, <TEAM>/artifacts/roles/hephaestus-team.md (peer conduct).
- Role-file mapping: no track branch, no commits. Read-only reference worktree: <TEAM>/worktrees/ref (detached at d412ce0; never edit it, no git writes; `git -C <TEAM>/worktrees/ref show new-video:<path>` is allowed). Owned outputs: <TEAM>/artifacts/TREATMENT_DRAFT.md and <TEAM>/artifacts/tracks/treat-<id>.screens-needed.md. Every exec workdir inside the team root; absolute paths only; no `../`. Sidekick briefs restate these limits.

## Objective
Draft the treatment for "Good to Go" so HENRY can approve it the moment the timing data lands (~16:45), and plates can start right after.

## Inputs (inside the team root)
- Lyric sheet (sung from line 13): <TEAM>/worktrees/ref/lyrics/goodtogo.txt; aligner source: .../worktrees/ref/lyrics/goodtogo.src.js.
- Song: 206.4 s (3:26), about 128 BPM (analysis will confirm), 10 sections (Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus 2, Chorus, Bridge, Final Chorus, Outro), 52 lines, 429 words. Timing data does not exist yet: key everything to lines and words; any section times you give are labelled "estimated".
- Template and rules: .../worktrees/ref/docs/templates/TREATMENT.md, docs/NEW_VIDEO.md (sections 4, 5, 7), docs/ENGINE.md, AGENTS.md ("Rules scenes must follow").
- Kit and engine: .../worktrees/ref/app/src/scenes/_ui.ts, slate.ts, app/src/engine/palette.ts, type.ts, util.ts.
- Previous video for what worked (reuse ideas and kit, not lines): `git -C <TEAM>/worktrees/ref show new-video:docs/TREATMENT.md`, `show new-video:app/src/timeline.ts`, `show new-video:app/src/scenes/<call|forms|cloud|hook|agency|devmode|release>.ts`.
- Day One Ready treatment draft (reference only, never copy lines): <TEAM>/artifacts/reference/dayone-TREATMENT_DRAFT.md.
- Screens: Oct-30 reference inventory <TEAM>/shots/ref-dayone/manifest.json (notes describe each screen; view PNGs with the read tool); worker A is capturing the develop set now: <TEAM>/shots/SHOTLIST.md and shots/develop/manifest.json appear and grow while you work; reference develop file names in the draft where they exist, else the planned capture.

## Deliverables
1. Within your first ~10 minutes: artifacts/tracks/treat-<id>.screens-needed.md, a short list of screens/states the treatment needs that are NOT in BRIEF AC-2 (worker A reads it before its final round). Update it if needs change.
2. artifacts/TREATMENT_DRAFT.md (AC-6): one idea in one paragraph; a recurring motif that pays off in the Final Chorus/Outro; 2-3 worlds mapped to sections; look (palette keys from palette.ts, every accent with its wash; fonts from type.ts); karaoke rules; plates table (plate id, timeline entries per section, reuse/adapt/new); per line: what is shown, trigger words, screenshot file(s); chorus treatment across 3 repeats (escalation, FastTrack/Astute/MYOB logo moment with public-cut fallback via CUT); bridge call-and-response "Skills? Switched on!" staging; kit additions needed; production constraints (2D/2.5D Canvas2D, light plates with LIGHT_POST, <=2 Layer2D uploads, ~60-65 ms/frame budget, deterministic, drawShot contain-fit, landBy/win rules); build rounds (kit + timeline + 2 plates first); open questions for HENRY.

## Rules
- Features only: no code, terminals, infra diagrams, developer bridge, PR numbers; the previous video's devmode/cloud/release ideas are out.
- Product words as the UI shows them (Registration Pack, Save Progress, Submit, Start Signing, Adopt and Sign, Complete Onboarding, Completed).
- Never edit repository files; never read HENRY's checkouts (~/work/**) or the pdoom-video worktrees outside the team root; no installs, no network, no push; never use ask_user_question (put questions in the draft's "Open questions" and reply NEEDS_DECISION only if blocked).

## Verification
- Every sung line (52) appears in the per-line table; every screenshot referenced exists in shots/develop or shots/ref-dayone or is listed in screens-needed.md; template sections all present. Handoff: <TEAM>/artifacts/tracks/treat-<id>.handoff.md (worker Required output).
