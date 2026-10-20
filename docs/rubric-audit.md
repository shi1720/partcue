# PartCue: submission and judging audit

**Checkpoint: 20 October 2026.** The shared software passes 34/34 current local checks. All seven functional/IK Lens scenarios passed on the saved selection-guard revision. Native workflow and continuous spatial footage are captured. [Source revision a6c74c7](https://github.com/shi1720/partcue/commit/a6c74c7), [34-check CI](https://github.com/shi1720/partcue/actions/runs/39416731639) and the [2:32 public demo](https://www.youtube.com/watch?v=Z9rPXUwUdnw) are complete. The remaining participant step is review, personal Additional info responses, truthful eligibility attestations and Devpost Submit.

The new guard clears an older correct selection after a rejected wrong pickup and requires fresh selection before confirmation. It follows the final UI, interaction and back-row sightline improvements. No numeric judge score or outcome is implied.

## Eligibility and required artifacts

| Requirement | Evidence | Status / remaining gate |
| --- | --- | --- |
| New project during the submission period | Source and planning started 20 October 2026, within 15 October–9 November. [Official rules](https://learn-specs.devpost.com/rules). | Met by recorded start date; preserve provenance and disclose third-party templates/packages. |
| Planned with the Devpost Learn skill pack | [Design brief](../devpost/design-brief.md), vendored skill source and recorded revision. Shivam delegated decisions instead of an interview. | Planning output present; the actual process is disclosed. |
| Built through CLAD and Lens Studio MCP | Actual project under [lens/](../lens/); project-local build report records standalone CLAD construction, official MCP operations and saved assets. | Implemented; all seven final functional/IK scenarios passed. |
| Runs in Lens Studio preview | Seven successful final functional/IK scenarios, including actual tray-part selection, confirmation and stale-selection recovery. Project-local `devpost/leaf-results.md` records the runs. | All seven final functional/IK scenarios passed. Native workflow and spatial captures exist. |
| Public repository with Lens and `devpost/` | [shi1720/partcue](https://github.com/shi1720/partcue), code revision `a6c74c7`, is public. | [All 34 CI checks pass](https://github.com/shi1720/partcue/actions/runs/39416731639). |
| Public YouTube video under three minutes | [Actual public demo](https://www.youtube.com/watch?v=Z9rPXUwUdnw), 152 seconds, 1920 × 1080. | Public status, Studio checks and viewer title/duration checked; full decode and visual review passed. |
| Description and learning narrative | [Submission draft](submission-draft.md). | Ready to paste with the published source and demo links. |
| Participant attestations | Creator identified as Shivam Gupta. | Any personal eligibility and submission attestations must be made truthfully by the participant. |

## Judging criteria

| Criterion | Demonstrated strength | Evidence and remaining question |
| --- | --- | --- |
| **Design** | A complete record/return flow, one active pickup/origin pair, explicit confirmation, interruption recovery, undo and confirmed restart. | Final functional scenarios cover the lifecycle; IK exercises actual pickup and confirmation. Phase-specific controls and direct tray-part selection are implemented. Actual workflow and spatial recordings are available; hardware comfort is untested. |
| **Technical implementation** | Actual CLAD/MCP construction; SIK/UIKit interaction; separate articulated geometry; shared immutable sequence authority; real runtime tests. | All seven final functional/IK scenarios passed. The 34-check local software suite includes Lens-core parity. IK fallback was disabled. Remaining renderer/batching warnings must stay disclosed rather than being called a warning-free host log. |
| **Innovation / idea** | A specific spatial relationship: next pickup and saved origin shown together beside the user's work. | The reverse log is established elsewhere, including a direct non-AR alternative acknowledged in [research](market-research.md). The AR benefit is a testable hypothesis, not a first-invention or superiority claim. Demonstrate viewpoint movement and the paired locations clearly. |
| **Presentation** | A relatable two-screw opening and an end-to-end product story with visible failure recovery. | The completed public 2:32 demo combines actual native workflow and continuous spatial footage. Disclose the four authored parts, predefined origins and SIK input replay. Finish with creator credit and a clear result. |
| **Commercial credibility** | A defined repair-bench/classroom user, inexpensive alternatives, low-inference-cost design and a comparative pilot plan. | $20/bench/month, adoption and time savings remain unvalidated. Include recording overhead and compare against both usual methods and a plain reverse checklist. |

## Preview acceptance matrix

All seven functional/IK scenarios passed on the saved selection-guard revision after official compilation and runtime initialization. These are actual Lens Studio tests, separate from 34 current local software checks.

| Criterion | Scenario evidence | Final observed result |
| --- | --- | --- |
| P1: record four removals, distinct wells and accurate labels/counts | `parttrail-01-record-four` — succeeded | Succeeded |
| P2: fourth removal's pickup/origin pair and animated direction cue | `parttrail-02-active-pair-animation` — succeeded; marker positions observed across time | Succeeded |
| P3: wrong part/count preserve state; selection plus correct confirmation advances once | `parttrail-03-wrong-part-count-confirm` — succeeded, including missing selection and double-confirm protection | Succeeded |
| P4: pause hides cues; resume and undo restore the expected pair | `parttrail-04-pause-resume-undo` — succeeded | Succeeded |
| P5: completion clears cues; confirmed restart restores setup | `parttrail-05-complete-confirm-restart` — succeeded | Succeeded |
| Additional IK interaction coverage | `parttrail-06-ik-toolbar-selection` — succeeded using far-field routing without scripted fallback | Succeeded; actual `PickupPart3` plus confirmation, far-field routing and fallback disabled |
| Wrong pickup after a previous correct selection | `partcue-08-stale-selection-guard` | Succeeded; selection clears, confirmation rejects, fresh selection advances once |

The final edited demo must clearly show the permanent simulation/manual-marking label, text legibility, labels in addition to color, correct route direction, bench-relative attachment during viewpoint changes, and phase-specific controls. Gray preview surroundings can help inspect contrast; they do not establish additive-display readability on glasses.

## Claims that fit the evidence

**Supported:** implemented SPECS Lens; built through CLAD and official MCP; seven final functional/IK preview successes; 34 current local software checks; explicit manual marking; real local companion accounts and saved snapshots.

**Remaining participant gate:** Shivam reviews the published artifacts, completes personal Additional info responses and eligibility attestations truthfully and clicks Devpost Submit. Public source, passing 34-check CI and the 2:32 public demo are complete; no completed submission is asserted.

**Not established:** automatic recognition or physical verification, safe assembly, persistent cross-session spatial anchors, measured technician time savings, validated demand, an established moat, first invention or public-production readiness. Completion means the user confirmed returns for the recorded parts. The Lens and companion do not automatically synchronize.

## Final closeout

- Public source: [tested code a6c74c7](https://github.com/shi1720/partcue/commit/a6c74c7); [34-check CI](https://github.com/shi1720/partcue/actions/runs/39416731639).
- Public video: [PartCue demo, 2:32](https://www.youtube.com/watch?v=Z9rPXUwUdnw), using actual post-guard workflow and spatial captures. The generic synthetic guide is disclosed and does not impersonate Shivam; source SFX remain in the mix.
- Validation: seven live functional/IK Lens scenarios, 34 software checks, fresh browser guard observation, corrected spatial queries, full video decode and independent visual review.
- Remaining: participant review, personal Additional info responses, truthful eligibility attestations and Devpost Submit.

**Created by Shivam Gupta, developed with AI coding assistance.** The submission stands on observed behavior and a clear next hardware/user study, rather than claims of field validation.
