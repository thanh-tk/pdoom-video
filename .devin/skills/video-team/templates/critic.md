<!-- Template from the Good to Go run (2026-11-18). Placeholders: <TEAM> = ~/HEPHAESTUS/<id> (absolute path), <REPO> = the worktree root, <id> = video id, <BASE>/<SHA> = commits. Lines naming Good to Go plates, screens, lyrics or decisions are EXAMPLES: rewrite them for the new video. -->

# Assignment: <id> / critic-<id>-r2 (critic, plates round 2 integrated)

- Role: critic (read-only). Model: gpt-6-1-sol-max-priority. Launcher: HEPHAESTUS (pane w8:p1). HENRY allows bypass mode for every peer; you stay read-only regardless.
- Read first: <TEAM>/artifacts/roles/hephaestus-team.md ('Peer conduct'), <TEAM>/artifacts/roles/critic.md, <TEAM>/artifacts/BRIEF.md.
- Base: 780eb7a (round 1 + its remediations, already reviewed by critic-<id>-r1; r1 findings closed in b9f1023/ac4fcf8/f75252f, r2 tag fix d1637ff + 780eb7a). Candidate: branch <id>/integration @ 11b0e002716d357759bb201ce3e43447af6ee15c, checked out in <TEAM>/worktrees/integration (merges of <id>/phone, <id>/board, <id>/desk). All writers stopped.
- Diff: `git -C <TEAM>/worktrees/integration diff 780eb7a...11b0e002716d357759bb201ce3e43447af6ee15c`. Also re-verify that r1 findings C-G2G-R1-01/02 stay closed and the hook1 tag sub-scene (d1637ff) is correct: `git diff e40936a..780eb7a -- app/src/scenes/hook.ts`.
- Track ownership: phone-<id> = stages.ts, payroll.ts, _phone.ts; board-<id> = checks.ts, bridge.ts, _board.ts; desk-<id> = sign.ts, agency.ts, outro.ts, _desk.ts; kit-<id> = hook.ts, intro.ts, _ui.ts, timeline.ts; assets under app/public/.
- Requirements: <TEAM>/artifacts/tracks/round2-common.md, the track envelopes phone-<id>.md, board-<id>.md, desk-<id>.md, the approved treatment <TEAM>/artifacts/TREATMENT_DRAFT.md (plates sections, per-line rows, HENRY's decisions); worker claims in the three *.handoff.md (verify, do not trust).
- Real-data evidence rendered by the lead from the candidate (you may view these PNGs; you may not start servers or browsers): <TEAM>/qa/r2int/ (internal cut) and <TEAM>/qa/r2int-public/ (public cut), each with index.tsv (frame -> entry, line, time) and sheet_*.png.

## Review focus (priority order)
1. Runtime failures on the real data: every lyric/word lookup in the new modules resolves with the right occurrence inside its entry window (lyrics/goodtogo.src.js, 53 lines; data/lyrics.json words). Show counts.
2. Rule violations (AGENTS.md "Rules scenes must follow", NEW_VIDEO.md section 7 catalogue): determinism, lineCut sub-scene bounds, lyricBlock win, landBy, end states before each cut, continuity across entry boundaries (intro -> stages -> payroll -> pre1 -> hook1 -> sign -> agency -> pre2 -> hook2 -> bridge -> hook3 -> outro: first/last frames in the evidence), layout below the lyric, globalAlpha *=, effects before labels, title-safe 96 px, fitSize, TONES washes, CUT for partner logos, <=2 Layer2D uploads, no shadowBlur, no per-frame measureText storms, drawShot contain-fit ROIs.
3. Content: features only; fictional data; no 'Samsung' anywhere on screen (check evidence frames and copied PNGs); no review/confidence badges on success moments; GAP kit fallbacks use real labels.
4. Scope: frozen files untouched by round-2 tracks; no unrelated changes.

## Limits
Read-only per critic.md; absolute paths inside <TEAM>; no `../`; no reads under ~/.config/devin or ~/work. Reply with the critic Required output and write it to <TEAM>/artifacts/tracks/critic-<id>-r2.handoff.md (the only file you may write).
