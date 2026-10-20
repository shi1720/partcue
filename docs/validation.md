# Validation record

Observed on 20 October 2026. This file separates the browser companion from the SPECS Lens. Lens runtime evidence is recorded in [the Lens build report](lens-build-report.md).

## Hosted v1.1 release checkpoint

The public app is [partcue.web.app](https://partcue.web.app), backed by Firebase Auth and Firestore. Optional local mode still uses SQLite. Manual jobs support up to 100 named groups with origins, containers, quantities and notes; the diagram is explicitly illustrative. The four-part practice fixture remains separate, as does the unchanged SPECS Lens.

| Evidence | Recorded result and scope |
| --- | --- |
| Expanded standard software suite | **51/51 pass locally and in [public CI](https://github.com/shi1720/partcue/actions/runs/39428423008)** on `4fecff759913f6cb7757ff7accf4793b3c353fab`. |
| Firebase emulator suite | **12/12 pass locally and in public CI** against actual Auth/Firestore adapters and checked-in rules. Includes ownership, schema envelope/UTF-8 bounds, revision races, 50-session quota forgery, concurrent first saves/deletes, reauthentication and stale-token recreation denial after deletion. |
| Lens runtime | **7/7 pass**, unchanged saved Lens revision; six functional scenarios including the guard plus one no-fallback IK scenario. No new Lens behavior is inferred from browser work. |
| Earlier production cloud smoke | **10/10 stages pass** at release `0d3277c7b0503626d60073db206d65ad85cc2dbe`, 20 October 2026, 12:35-12:36 UTC. Two disposable accounts exercised Auth, CRUD, concurrent revisions, owner isolation, deployed-rule denial and deletion, then were cleaned up. This predates the deletion-marker/custom-job release and is not its final production result. |
| Hosted browser UI | Final deployed custom job: required fields, two named groups, notes, quantities, save/reload, load from an empty bench, actual downloaded JSON, import as a new custom job, return, completion and undo. Actual 320 px tab-scoped viewport had scrollWidth = innerWidth = 320. Earlier practice/account/invalid-import checks are retained separately. |
| Product video | [Public 156.500-second video](https://www.youtube.com/watch?v=BVofj69YVnA), full media decode passed. Published manual English captions selected in public Chrome playback at 1080p HD. Studio copyright and Community Guidelines checks reported no issues. |
| Final production smoke | **12/12 stages pass** at `4fecff759913f6cb7757ff7accf4793b3c353fab`, 13:17-13:18 UTC. Custom job references/full-length names round-trip; stale tokens cannot reset/delete markers or recreate jobs. Two disposable Auth profiles and all their repair records removed; two minimal markers retained. [Redacted report](evidence/cloud-smoke-final.json). |

The deletion fix preserves a minimal UID-scoped lock after removing repair content and the Auth account. Emulator regressions prove that an old authenticated context cannot recreate a session, remove the lock or reset it. Its exact retention is documented in [security and deployment](security-and-deployment.md).

The runtime dependency audit reported zero known advisories at the v1.1 checkpoint; the development Firebase CLI retains seven transitive advisories. See the security guide for scope and mitigations. An audit lookup is not a security certification.

## Earlier local companion checkpoint

Environment: macOS ARM, Node 22.16.0. `npm run build` compiled the shared TypeScript core and bundled the browser app without external runtime requests. The earlier local checks below include the independent review fixes. The v1.1 release checkpoint is recorded separately above.

The tests exercise the core and actual HTTP servers backed by temporary SQLite files. They cover command validation, reverse ordering, exact quantity, pause/resume, undo, rejected-action immutability, malformed imports, history/size limits, durable restart, password hashing, account ownership, CSRF, session revocation and expiry, rate/body limits, static path traversal, concurrency, and backup/restore. These are not LEAF tests.

**Earlier software checkpoint: 34/34 tests passed locally and in public CI**, including the stale-selection core and actual browser-handler regressions, exact Lens-core parity, cross-tab account-switch isolation, late authentication-response protection, and the browser fetch-receiver regression. `npm audit --omit=dev` reported zero known vulnerabilities in the runtime dependency set at the earlier 32-check review; that is an advisory lookup, not a security certification.

Public source: [shi1720/partcue](https://github.com/shi1720/partcue), tested code revision [`a6c74c7`](https://github.com/shi1720/partcue/commit/a6c74c7). [CI passes all 34 checks](https://github.com/shi1720/partcue/actions/runs/39416731639).

Independent reviews also verified the running app in Chrome at 320 px and 1512 px widths, with no horizontal overflow and all four tray wells visible. Keyboard focus now survives selection-list redraws, recording, pause/resume, and completion. Registration, saving, listing, and logout were exercised against the current server. Four dialogs have accessible names and descriptions. A real-browser fetch binding bug was found and fixed even though injected-fetch tests had passed; the added regression test retains the global receiver.

## Earlier local browser observations

Tested the running local companion at `http://127.0.0.1:4173` through browser UI controls. Test accounts used disposable, invented `.example.test` addresses and random test passwords. No real personal account or password is included in the project.

| Workflow | Observed result |
| --- | --- |
| Four removals | Recorded the short screw, long screw, top cover, and gear module into distinct wells; the scene moved each part into its chosen well. |
| Reverse return | Gear module was first; the paired route connected its tray position and origin. |
| Wrong part | Selecting the short screw left progress at 0/4 and identified the expected gear module. |
| Wrong selection after correct selection | In a fresh tab running the rebuilt bundle, selected Long screw, then attempted Short screw. Both selections were unchecked, the confirmation form disappeared and progress stayed at 0/2. Fresh correct selection is required. |
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

## Selection-guard evidence

The strict review reproduced a stale confirmation: selecting the correct part and then attempting a wrong pickup left the old selection armed. The fix keeps the rejected command immutable, then records an explicit successful `deselectReturn` command and `return-deselected` event. It changes no part list or progress count. The browser clears the count input and hides its confirmation form until a new correct selection.

The regression checks the complete sequence: correct selection → rejected wrong attempt → explicit deselection → confirmation rejection → fresh correct selection → exactly one accepted return. A second test executes the shipped browser transition handler with the real domain core. The Lens includes the same exact core source; all seven functional/IK scenarios passed on the saved guard revision, including this new regression.

Actual browser observation: [selection guard screenshot](evidence/companion-selection-guard.png) and [accessibility-state evidence](evidence/companion-selection-guard.txt). An older tab had unsaved-work navigation protection, so the verification used a fresh tab and the rebuilt bundle rather than assuming that a reload had succeeded.

## Native Lens captures and spatial proof

The native Lens Studio recorder produced actual workflow footage in `demo/raw/partcue-workflow-full.mp4` (1570 × 1590, 116.632 seconds) and a separate continuous spatial recording in `demo/raw/partcue-spatial.mp4`. These are source captures; the media checkpoint is recorded below.

The [corrected spatial evidence](../lens/PartTrail/devpost/spatial-video-evidence-corrected.json) reports success: during the camera move, measured world-position deltas for the bench root and both active halos are zero. A subsequent actual pickup and confirmation advances 1/4 → 2/4, changes the cue pair from Lid/Well 3 to Long screw/Well 2 and preserves the work root. The earlier partial observation is retained rather than presented as a successful run.

The fixture contains four authored parts with predefined origins. Scenario replay supplies explicit SIK/UIKit inputs; footage does not show camera recognition, arbitrary world-point capture, physical installation verification or a live human hand take. The earlier workflow capture and spatial proof retain their original capture stages. A fresh post-guard native workflow is saved as `demo/raw/partcue-workflow-final.mp4` (114.165 seconds). The earlier finished demo was `demo/partcue-demo.mp4` (152 seconds, 1920 × 1080), assembled from actual captured preview sources; media provenance records the exact source edits and audio mix.

## Media checkpoint

The current [product video](https://www.youtube.com/watch?v=BVofj69YVnA) is 156.500 seconds at 1920×1080 and 30 fps. It passed full video/audio decoding and frame review, including the punctuation correction. Public Chrome playback exposed the manual English caption track and 1080p HD. The generic Kokoro stock guide is disclosed and does not imitate Shivam. Its 381-word transcript check found no omissions; no human listening review is claimed. The video shows practice/account flows; custom-job evidence comes from separate live UI checks and screenshots.

The final post-guard workflow, corrected continuous spatial evidence and seven live Lens scenarios support the observed behavior. The nonasserting input choreography is distinct from the seven assertion/IK tests.

## Boundaries

The browser now also has a real public Firebase deployment, separate from optional local SQLite mode. Email action generation is tested in the Auth emulator; actual mailbox delivery, production abuse controls and cloud restore operations are not established by those tests. The Lens and companion do not automatically synchronize. Glasses comfort, real bench alignment, physical hand tracking and technician time savings require device and user studies.

## Account action handler check

The Firebase reserved handler at `partcue.web.app/__/auth/action` loaded its verification page with the public web configuration, then rejected a deliberately invalid code with “Try verifying your email again.” This is an invalid-code check, not real inbox delivery. Firebase Console rejected optional email template branding/action-URL changes with “Email template updates are currently unavailable for this project.” The configured default callback remains the existing internal project domain; no email branding change is claimed.
