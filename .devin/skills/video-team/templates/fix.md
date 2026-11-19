<!-- Template from the Good to Go run (2026-11-18). Placeholders: <TEAM> = ~/HEPHAESTUS/<id> (absolute path), <REPO> = the worktree root, <id> = video id, <BASE>/<SHA> = commits. Lines naming Good to Go plates, screens, lyrics or decisions are EXAMPLES: rewrite them for the new video. -->

# Assignment: <id> / fix-<id> (REMEDIATE round 2 critic findings)
- Mode: implement (already-diagnosed fixes). Model: claude-opus-5-5-high-fast. Launcher/approver: HEPHAESTUS (pane w8:p1). HENRY allows bypass mode.
- Read first: <TEAM>/artifacts/roles/hephaestus-team.md ('Peer conduct'), <TEAM>/artifacts/roles/worker.md, <TEAM>/artifacts/tracks/round2-common.md (rules, verification, commit policy), the findings <TEAM>/artifacts/tracks/critic-<id>-r2.handoff.md (C-G2G-R2-01..04, full evidence), and the approved treatment <TEAM>/artifacts/TREATMENT_DRAFT.md (lines cited by each finding). Original authors' notes: tracks/phone-<id>.handoff.md, board-<id>.handoff.md, desk-<id>.handoff.md.
- Worktree: <TEAM>/worktrees/fix. Branch: <id>/fix. Base: 11b0e00 (the integrated round-2 candidate). Verification port: 5194. Stills folder: <TEAM>/qa/fix.
- Owned files (only as needed for the fixes): app/src/scenes/checks.ts, _board.ts, outro.ts, stages.ts, payroll.ts, _phone.ts, plus assets under app/public/screens/. Frozen: everything else (round2-common.md list).

## Fixes (all four)
1. C-G2G-R2-01 (MEDIUM): pre2's verify capture must not show "AI verification will run automatically" (treatment line 101). Exclude it from the ROI or pre-mask it in the capture's own fill colour, keeping the stepper and the verified sections; preserve contain-fit and overlay registration. Check every other crop in checks.ts, stages.ts, payroll.ts for the same string.
2. C-G2G-R2-02 (MEDIUM): the outro must settle to exactly three switches: carry the existing master switch into the third slot (it stays on; it may pulse on the last "go"); no second master.
3. C-G2G-R2-03 (LOW): one phone-world geometry across payroll -> pre1: pre1 uses the same phone frame (_phone.ts PHONE/phoneFrame and capture pre-scaling) and the same train-band rect as stages/payroll, so only the screen content changes at the cut (t=46.367).
4. C-G2G-R2-04 (LOW): stages draws at most two screenshots per frame (the active capture or the active before/after pair); skip covered earlier states, correct for seeks as well as forward play.

## Verification
check.ts OK; real-data stills (lead script, now with exact `cut-1/60` frames) for stages,payroll,pre1,pre2,outro in both cuts; additionally render the frames t=46.35 and 46.38 (payroll/pre1 boundary) and look at them side by side; scene errors []; determinism scan of touched files. Commit per finding (no amend, no merge). Handoff: <TEAM>/artifacts/tracks/fix-<id>.handoff.md (worker Required output, per-finding evidence).
