# Validation record

Observed on 20 October 2026. This file separates the browser companion from the SPECS Lens. Lens runtime evidence is recorded in [the Lens build report](lens-build-report.md).

## Companion build and automated checks

Environment: macOS ARM, Node 22.16.0. `npm run build` compiled the shared TypeScript core and bundled the browser app without external runtime requests. The final checks below include the independent review fixes.

The tests exercise the core and actual HTTP servers backed by temporary SQLite files. They cover command validation, reverse ordering, exact quantity, pause/resume, undo, rejected-action immutability, malformed imports, history/size limits, durable restart, password hashing, account ownership, CSRF, session revocation and expiry, rate/body limits, static path traversal, concurrency, and backup/restore. These are not LEAF tests.

**Final companion review checkpoint: 32/32 tests passed**, including a new exact Lens-core parity check, cross-tab account-switch isolation, late authentication-response protection, and the browser fetch-receiver regression. `npm audit --omit=dev` reported zero known vulnerabilities in the runtime dependency set at this checkpoint; that is an advisory lookup, not a security certification.

Independent reviews also verified the running app in Chrome at 320 px and 1512 px widths, with no horizontal overflow and all four tray wells visible. Keyboard focus now survives selection-list redraws, recording, pause/resume, and completion. Registration, saving, listing, and logout were exercised against the current server. Four dialogs have accessible names and descriptions. A real-browser fetch binding bug was found and fixed even though injected-fetch tests had passed; the added regression test retains the global receiver.

## Browser observations

Tested the running local companion at `http://127.0.0.1:4173` through browser UI controls. Test accounts used disposable, invented `.example.test` addresses and random test passwords. No real personal account or password is included in the project.

| Workflow | Observed result |
| --- | --- |
| Four removals | Recorded the short screw, long screw, top cover, and gear module into distinct wells; the scene moved each part into its chosen well. |
| Reverse return | Gear module was first; the paired route connected its tray position and origin. |
| Wrong part | Selecting the short screw left progress at 0/4 and identified the expected gear module. |
| Wrong quantity | Confirming two pieces where one was recorded left progress at 0/4. |
| Correct confirmation | Selecting the expected part and confirming one advanced exactly once. |
| Pause/resume | Paused after one return; work cues disappeared. Resume restored the next top-cover step. |
| Undo and completion | Undo restored the prior gear-module return. Confirmed all four returns and observed completion. |
| Real registration and save | Registered a disposable local account from the save dialog; the completed session saved successfully. |
| Reload and load | Reload retained the authenticated cookie; saved session loaded with four confirmed returns and revision 1. |
| Revisions | Undo and save advanced the revision. A second tab holding an old revision was blocked from overwriting a newer save, and retained its unsaved work. |
| Export/import | Exported a real session JSON and imported it as a fresh session. The validated example is committed at `examples/returning-session.json`. |
| Invalid import | A malformed snapshot was rejected while the active two-of-four return session remained intact. |
| Rename and final layout | Opened the rebuilt app and verified the PartCue name, P mark, PC workspace label, and footer. Imported the example again and verified coordinates are available under an optional Recorded locations disclosure. Captured the actual browser rehearsal below. |

![Actual PartCue browser rehearsal, with simulation disclosure](evidence/companion-return.png)

This screenshot is browser evidence only. Virtual part movement is driven by the user's explicit commands. It does not show camera recognition or verify physical assembly.

## Boundaries

The companion runs locally with real accounts and persistent saved logs. Public hosting, email delivery/recovery, multi-instance abuse controls, and operations have not been validated. The companion and Lens do not automatically synchronize. Glasses comfort, real bench alignment, physical hand tracking, and technician time savings require separate device and user studies.
