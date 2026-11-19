<!-- Template from the Good to Go run (2026-11-18). Placeholders: <TEAM> = ~/HEPHAESTUS/<id> (absolute path), <REPO> = the worktree root, <id> = video id, <BASE>/<SHA> = commits. Lines naming Good to Go plates, screens, lyrics or decisions are EXAMPLES: rewrite them for the new video. -->

# Request Brief: <id> / screenshots + treatment draft (parallel to timing analysis)

- Ticket: <id> (pdoom-video music video "Good to Go", guugomeo, 3:26, features-only Onboarded product song)
- HENRY, verbatim (2026-11-18): "i've the audio here at folder \audio. Before begin analysis, I think you need some coworkers to gather screentshot and do some other stuff, i need the result quick."
- HENRY's decisions (2026-11-18): plan approved (lead runs analysis; worker A screenshots; worker B treatment draft; lead verifies); scaffold with --clean done (d412ce0); screenshot source = latest Onboarded-v2 develop (ff4aca3e8, snapshot in the team root).
- Platform: Devin CLI in WSL Ubuntu-24.04, Herdr workspace w8, lead pane w8:p1. Mode: "keep it focused" variant, HEPHAESTUS performs the orchestrator duties (disclosed to HENRY).
- Integrity mode: deliverables are files in the team root (screenshots, manifest, shot list, logos, treatment draft); no repository commits by peers.

## Problem / outcome
Plates for "Good to Go" need product screens from the latest develop build and an approved treatment. Outcome: every sung line has a demo-mode screenshot (or a reasoned GAP), and a treatment draft HENRY can approve, both ready when the timing data lands (~16:45).

## Constraints (binding for all roles)
- Onboarded-v2 and v1 repositories are read-only; HENRY's checkouts (~/work/ado-repos/Onboarded-v2, ~/work/REC_Video/*) are never read by peers and never written by anyone. Use only the team-root copies.
- Demo mode and mock data only; fictional identities; no secrets; no real candidate data. Every browser context aborts requests that are not to localhost (except the two static CDN patterns in shots/ref-dayone/lib.mjs).
- Lyrics/visual tone: features only; no code, terminals, cloud/infra diagrams, PR numbers or developer content on screen.
- No pushes, no PRs, no installs, no network beyond localhost (except the static CDN GETs above).
- Absolute paths inside <TEAM> only; no `../`; no reads under ~/.config/devin.

## Acceptance criteria
- AC-1 (A): SHOTLIST.md maps all 52 sung lines of lyrics/goodtogo.txt to >=1 develop screenshot or a GAP with the reason.
- AC-2 (A): new captures cover Skills switches; Licences & Certificates front/back + expiry; AU Payroll Pack (TFN, Super Choice, Bank Details); NZ Kiwi Saver Details; full progress bar + Submit; Right to Work passport + liveness selfie; UK share code; VEVO; DBS; referee nomination + referee form; signing flow; audit trail; recruiter Verify; Complete Onboarding -> "Completed" + notify; Settings > Integrations with FastTrack/Astute/MYOB.
- AC-3 (A): desktop 1920x1080 @2x and phone 390x844 @3x, light theme, Demo Mode banner removed, no demo-only hints in final shots; manifest.json (file, url, viewport, theme, note, source commit).
- AC-4 (A): logos (Onboarded brand, FastTrack, Astute, MYOB, plus any other ATS/payroll logo the chorus could use) copied from the develop snapshot's own assets, with source paths.
- AC-5 (A): contact sheets for review; HENRY's checkouts untouched.
- AC-6 (B): TREATMENT_DRAFT.md following docs/templates/TREATMENT.md and docs/NEW_VIDEO.md section 4: one idea, motif with payoff, worlds per section, look (palette keys with washes, fonts), karaoke rules, plates table (one plate per section or pair; per line: visual, trigger words, screenshot file), public vs internal cut, kit reuse, production/perf constraints, open questions for HENRY.
- AC-7 (B): every screenshot the draft relies on is in shots/SHOTLIST.md or listed as a request in artifacts/tracks/treat-<id>.screens-needed.md.

## Out of scope
Plates/scene code, timeline edits, timing data (lead), copying shots into the repo (lead, after treatment approval), pushes.
