<!-- Template from the Good to Go run (2026-11-18). Placeholders: <TEAM> = ~/HEPHAESTUS/<id> (absolute path), <REPO> = the worktree root, <id> = video id, <BASE>/<SHA> = commits. Lines naming Good to Go plates, screens, lyrics or decisions are EXAMPLES: rewrite them for the new video. -->

# Assignment: <id> / success-auditor (final gate)

- Role: success-auditor (read-only). Model: gpt-6-astra-xhigh. Launcher: HEPHAESTUS (pane w8:p1). HENRY allows bypass mode for every peer; you stay read-only regardless.
- Read first: <TEAM>/artifacts/roles/hephaestus-team.md ('Peer conduct'), <TEAM>/artifacts/roles/success-auditor.md.

## Original request (verbatim, HENRY, 2026-11-18)
1. "i've the audio here at folder \audio. Before begin analysis, I think you need some coworkers to gather screentshot and do some other stuff, i need the result quick."
2. Approved scope extensions (HENRY's answers, verbatim choices): "Approve plan (Recommended)" (lead runs the analysis; worker A screenshots; worker B treatment draft; lead verifies); scaffold "Yes, --clean (Recommended)"; audio "Commit the deletions"; screenshot source "latest develop branch"; treatment "Approve as drafted"; demo gaps "Kit fallbacks (Recommended)"; cut and data "Both (Recommended)" (partner logos internal cut only; neutral contract title, no 'Samsung'); renders "Live preview only, no mp4 export"; "Start now + critic (Recommended)" (plates round 1); "Start 3 workers (Recommended)" (plates round 2: all remaining plates); Licence crop "Cleaner crop (Recommended)" (no 'Needs Review'/'Confidence' badges on the final-chorus Licences thumbnail).

## Acceptance criteria
- Brief AC-1..AC-7: <TEAM>/artifacts/BRIEF.md (screenshots: shots/SHOTLIST.md, shots/develop/*.png + manifest.json, shots/logos/, shots/contact/; treatment: artifacts/TREATMENT_DRAFT.md).
- P-1 Timing data for HENRY's song is committed and consistent: audio/goodtogo.mp3, lyrics/goodtogo.src.js (as sung), analysis/songs/goodtogo.py, data/audio.json, data/lyrics.json (53 lines).
- P-2 All 12 timeline entries (intro, stages, payroll, pre1, hook1, sign, agency, pre2, hook2, bridge, hook3, outro) load real plate modules (no slate placeholder) and render with real data with scene errors [] in both cuts.
- P-3 `~/.bun/bin/bun scripts/check.ts` from app/ prints check: OK.
- P-4 HENRY's decisions honoured on screen and in assets: partner logos only in the internal cut; no 'Samsung' anywhere in shipped PNGs or frames; no review/confidence badges on success thumbnails; GAPs use kit fallbacks with real labels; features only (no tech/developer visuals, no "AI verification" hint text); fictional data only.
- P-5 Rules from AGENTS.md "Rules scenes must follow" hold for the new scenes (determinism, lineCut bounds, win/landBy end states, title-safe, CUT, no shadowBlur); critic findings C-G2G-R1-01/02 and C-G2G-R2-01..04 are closed (tracks/critic-<id>-r1.handoff.md, critic-<id>-r2.handoff.md; fixes b9f1023, ac4fcf8, f75252f, d1637ff, 780eb7a, f968e45, 232a670, d2d6912, d70a19a).

## Candidate
- Repository: pdoom-video. Base: 08173a8 (lyric draft 3, start of this run). Final candidate: branch <id>/integration @ d70a19a1a2c4aa51a08aca4568277c4438ea38fa in <TEAM>/worktrees/integration.
- Merged track branches: <id>/kit, <id>/desk, <id>/phone, <id>/bridge, <id>/board, <id>/fix; lead commits 2fae330, d412ce0, 828faa4, e40936a (merge), e5eb1e0 (integration fix) and round-2 merges.
- Lead evidence (claims, verify yourself): <TEAM>/artifacts/PROGRESS.md; real-data frames from this exact SHA: <TEAM>/qa/final (internal, 165 frames incl. extras) and <TEAM>/qa/final-public (159 frames), each with index.tsv and sheet_*.png; you may view them (view_image). Frames were made by <REPO>/.devin/skills/video-team/tools/stills.mjs against a no-HMR vite of this worktree.
- Authorized verification commands: check.ts (above); read-only git/grep/cat; Python with PIL is available as `<REPO>/analysis/.venv/bin/python` for image inspection (read-only). No servers or browsers (live playback with sound is NOT VERIFIED by design; list it as such).
- Absolute paths only inside <TEAM> (and the venv python path above); no `../`; no reads under ~/.config/devin or ~/work.
- Reply with the Required output (PASS / FAIL / NOT VERIFIED per requirement with evidence) and write it to <TEAM>/artifacts/tracks/success-auditor.handoff.md (the only file you may write).
