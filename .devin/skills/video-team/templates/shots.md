<!-- Template from the Good to Go run (2026-11-18). Placeholders: <TEAM> = ~/HEPHAESTUS/<id> (absolute path), <REPO> = the worktree root, <id> = video id, <BASE>/<SHA> = commits. Lines naming Good to Go plates, screens, lyrics or decisions are EXAMPLES: rewrite them for the new video. -->

# Assignment: <id> / shots-<id> (worker A, screenshots)

- Mode: implement. Model: claude-opus-5-5-high-fast. Launcher/approver: HEPHAESTUS (pane w8:p1).
- Read first: <TEAM>/artifacts/BRIEF.md (constraints and AC-1..AC-5 are yours), <TEAM>/artifacts/roles/worker.md, <TEAM>/artifacts/roles/hephaestus-team.md (peer conduct).
- Role-file mapping: no repository, no track branch, no commits. Your owned working area replaces the worktree: <TEAM>/shots (all outputs) and <TEAM>/v2-develop (run its dev server only; do not edit its source). Every exec workdir is inside those two directories; absolute paths only; no `../`.

## Objective
Capture, from the latest Onboarded-v2 develop build in demo mode, every product screen the "Good to Go" video needs, mapped line by line to the lyric sheet, fast. Interim result first, polish second.

## Inputs (all inside the team root)
- Lyric sheet: <TEAM>/worktrees/ref/lyrics/goodtogo.txt (lines 1-11 are notes incl. the code-check summary; sung lines start at line 13 "[Intro]"). Read-only.
- Feature -> line -> code evidence table: <TEAM>/HANDOFF.md, section "Feature -> line -> code evidence". Frontend paths there (`frontend/src/...`) exist under <TEAM>/v2-develop/frontend/src/... (develop may have moved some; search the snapshot).
- Develop snapshot: <TEAM>/v2-develop/frontend (git archive of origin/develop ff4aca3e8, with its own node_modules copy; SOURCE_COMMIT file one level up). Start with `./node_modules/.bin/vite --port 5180 --strictPort` from that directory in a shell you keep (exec with timeout 0, or setsid nohup with a log in <TEAM>/shots/logs/). Ports 5173 and 5190 are reserved for others.
- Reference captures (Oct 30, older code, Windows paths): <TEAM>/shots/ref-dayone/ (183 PNGs, manifest.json with per-shot notes on how each state was reached, lib.mjs, cap-desktop.mjs, cap-phone.mjs, merge-manifest.mjs). Copy and adapt the scripts into <TEAM>/shots/ (BASE http://localhost:5180, OUT, createRequire on <TEAM>/shots/package.json); keep their network blocking, demo-mode init script, banner removal and wait logic.
- Browser: playwright-core 1.63.0 at <TEAM>/shots/node_modules/playwright-core. Chrome is not installed; launch `chromium.launch({ executablePath: '~/.cache/ms-playwright/chromium-1246/chrome-linux64/chrome', headless: true })` with no --use-angle (verified by the lead: Chromium 154 launches and screenshots). Run with `node` (v26 on PATH).

## Outputs
- <TEAM>/shots/develop/*.png + manifest.json (file, url, viewport, theme, note, source commit ff4aca3e8, fictional values typed).
- <TEAM>/shots/SHOTLIST.md: table of all 52 sung lines (section, line text) -> shot file(s) (best first) or GAP + reason. Write it early and keep it current.
- <TEAM>/shots/logos/: Onboarded brand logo, FastTrack, Astute, MYOB (plus other ATS/payroll logos present, e.g. Bullhorn, JobAdder, Xero) copied from the snapshot's own assets; logos/SOURCES.md with source paths.
- <TEAM>/shots/contact/*.png contact sheets (e.g. ffmpeg tile or a playwright HTML grid) with file names under each tile.
- Handoff: <TEAM>/artifacts/tracks/shots-<id>.handoff.md (worker Required output).

## Capture list (AC-2), phone 390x844 @3x for candidate screens, desktop 1920x1080 @2x for recruiter screens, light theme
1. Invite + SMS/email code (OTP), welcome.
2. Registration Pack stage list / stepper, overall progress bar.
3. NEW Skills: switch toggles on, category accordion, "X Skills Selected".
4. NEW Licences & Certificates: front and back document slots (filled with a dummy image), licence number, expiry date.
5. NEW Payroll Pack (AU): TFN, Super Choice, Bank Details sections; NEW NZ: Kiwi Saver Details (and IRD / Tax Code Declaration if reachable). Find in demo forms or form-builder previews.
6. Save Progress (desktop) / Save (phone) and saved state.
7. NEW full progress bar + Submit, then thank-you.
8. NEW Right to Work: passport + liveness selfie instructions; UK share code; AU VEVO; recruiter RTW view.
9. DBS candidate form(s) and recruiter DBS view.
10. NEW referee nomination (name, position, email, phone) + referee form (role, dates) + recruiter references view.
11. Signing: preview "Start Signing", consent "I Agree - Proceed to Sign", pad Draw/Type/Upload, drawn + "Adopt and Sign", all signed + submit, success.
12. Audit trail (Sent / Viewed / Signed / Completed).
13. Recruiter review: per-section Verify / Request More Info.
14. NEW Complete Onboarding dialog -> confirmed -> status "Completed" + "Notify relevant parties"; dashboard row "Completed".
15. Settings > Integrations tiles incl. FastTrack, Astute, MYOB; a FastTrack payroll settings view if one exists in demo mode.
Also check <TEAM>/artifacts/tracks/treat-<id>.screens-needed.md (written by worker B) before your final round and capture what it asks for when reachable.

## Rules
- Fictional data only: the FAKE identity in ref-dayone/lib.mjs (Alex Morgan, example.com, ACMA fiction-reserved number); for TFN, IRD, BSB, account and similar fields use dummy values that pass the form's validator and look obviously fictional; record them in the manifest. No real people, companies' private data, or secrets.
- Final shots: Demo Mode banner removed (and top padding zeroed), no demo-only hints (e.g. "Use code 123456"); keep a `_raw` variant only when useful.
- Every browser context aborts all non-localhost requests except the two static CDN patterns in ref-dayone/lib.mjs; log blocked requests per run.
- CPU is shared with the lead's audio pipeline: one browser at a time, at most two contexts.
- Do not edit the snapshot's source to fake states; reach states through the UI, demo services, localStorage/sessionStorage seeds the app itself reads, as the reference notes do. If a state is unreachable in demo mode, mark it GAP with the reason.
- Never read or write HENRY's checkouts (~/work/**) or the pdoom-video worktrees; never install packages; never push; never use ask_user_question (reply BLOCKED / NEEDS_DECISION with the exact question).
- Leave the dev server running at the end and report how to stop it (shell id or PID).

## Pacing
- Interim reply to the lead is not possible mid-turn; instead keep SHOTLIST.md and manifest.json current so the lead can review while you work.
- Priority order: NEW items 3, 4, 5, 7, 8, 10, 14 first, then recapture the rest on develop, then logos and contact sheets.

## Verification
- `file` on each PNG (dimensions 1170x2532 phone / 3840x2160 desktop, or full-page variants marked `_full`), manifest entries == PNG count, SHOTLIST covers all 52 lines, open a sample of shots yourself (read tool) to confirm the right screen, banner gone, no hints.
