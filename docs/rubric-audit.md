# PartCue: submission and judging audit

**Checkpoint: 20 October 2026.** The final Lens design has passed all six LEAF/IK preview scenarios, and the shared software passes 32/32 checks. The entry is **not ready to submit yet**: final captures and continuous viewpoint proof are being prepared, the source upload is pending, and the public YouTube demo has not been published.

The six-scenario rerun follows the final UI and interaction changes, including the back-row target sightline fix. No numeric judge score or outcome is implied.

## Eligibility and required artifacts

| Requirement | Evidence | Status / remaining gate |
| --- | --- | --- |
| New project during the submission period | Source and planning started 20 October 2026, within 15 October–9 November. [Official rules](https://learn-specs.devpost.com/rules). | Met by recorded start date; preserve provenance and disclose third-party templates/packages. |
| Planned with the Devpost Learn skill pack | [Design brief](../devpost/design-brief.md), vendored skill source and recorded revision. Shivam delegated decisions instead of an interview. | Planning output present; the actual process is disclosed. |
| Built through CLAD and Lens Studio MCP | Actual project under [lens/](../lens/); project-local build report records standalone CLAD construction, official MCP operations and saved assets. | Implemented; final six-scenario rerun passed. |
| Runs in Lens Studio preview | Six successful final scenarios, including actual tray-part selection and confirmation through IK. Project-local `devpost/leaf-results.md` records the runs. | Final scenario gate passed; capture completion pending. |
| Public repository with Lens and `devpost/` | [shi1720/partcue](https://github.com/shi1720/partcue) is created; complete source exists locally. | Source upload and signed-out access check pending. |
| Public YouTube video under three minutes | [Narration and recording plan](video-script.md). | Public demo URL pending. Record the final verified Lens, then check visibility and duration. |
| Description and learning narrative | [Submission draft](submission-draft.md). | Refresh checkpoint after final tests, upload and recording. |
| Participant attestations | Creator identified as Shivam Gupta. | Any personal eligibility and submission attestations must be made truthfully by the participant. |

## Judging criteria

| Criterion | Demonstrated strength | Evidence and remaining question |
| --- | --- | --- |
| **Design** | A complete record/return flow, one active pickup/origin pair, explicit confirmation, interruption recovery, undo and confirmed restart. | Final functional scenarios cover the lifecycle; IK exercises actual pickup and confirmation. Phase-specific controls and direct tray-part selection are implemented. Finish the legible final capture; hardware comfort is untested. |
| **Technical implementation** | Actual CLAD/MCP construction; SIK/UIKit interaction; separate articulated geometry; shared immutable sequence authority; real runtime tests. | All six final LEAF/IK scenarios passed; 32 software checks include Lens-core parity. IK fallback was disabled. Remaining renderer/batching warnings must stay disclosed rather than being called a warning-free host log. |
| **Innovation / idea** | A specific spatial relationship: next pickup and saved origin shown together beside the user's work. | The reverse log is established elsewhere, including a direct non-AR alternative acknowledged in [research](market-research.md). The AR benefit is a testable hypothesis, not a first-invention or superiority claim. Demonstrate viewpoint movement and the paired locations clearly. |
| **Presentation** | A relatable two-screw opening and an end-to-end product story with visible failure recovery. | The script exists; the public video does not. Capture actual Lens preview, include the simulation label and keep text legible at video size. Finish with creator credit and a clear result. |
| **Commercial credibility** | A defined repair-bench/classroom user, inexpensive alternatives, low-inference-cost design and a comparative pilot plan. | $20/bench/month, adoption and time savings remain unvalidated. Include recording overhead and compare against both usual methods and a plain reverse checklist. |

## Preview acceptance matrix

All six scenarios passed on the final design revision after the back-row interaction fix. These are Lens Studio preview results, separate from the 32 shared software checks.

| Criterion | Scenario evidence | Final observed result |
| --- | --- | --- |
| P1: record four removals, distinct wells and accurate labels/counts | `parttrail-01-record-four` — succeeded | Succeeded |
| P2: fourth removal's pickup/origin pair and animated direction cue | `parttrail-02-active-pair-animation` — succeeded; marker positions observed across time | Succeeded |
| P3: wrong part/count preserve state; selection plus correct confirmation advances once | `parttrail-03-wrong-part-count-confirm` — succeeded, including missing selection and double-confirm protection | Succeeded |
| P4: pause hides cues; resume and undo restore the expected pair | `parttrail-04-pause-resume-undo` — succeeded | Succeeded |
| P5: completion clears cues; confirmed restart restores setup | `parttrail-05-complete-confirm-restart` — succeeded | Succeeded |
| Additional IK interaction coverage | `parttrail-06-ik-toolbar-selection` — succeeded using far-field routing without scripted fallback | Succeeded; actual `PickupPart3` plus confirmation, far-field routing and fallback disabled |

The final capture must clearly show the permanent simulation/manual-marking label, text legibility, labels in addition to color, correct route direction, bench-relative attachment during viewpoint changes, and phase-specific controls. Gray preview surroundings can help inspect contrast; they do not establish additive-display readability on glasses.

## Claims that fit the evidence

**Supported:** implemented SPECS Lens; built through CLAD and official MCP; six named final preview scenario successes; 32 shared software checks; explicit manual marking; real local companion accounts and saved snapshots.

**Require the remaining gate:** completed final captures and continuous viewpoint proof, publicly accessible complete source and a working public demo. Refresh these statements only after observing the result.

**Not established:** automatic recognition or physical verification, safe assembly, persistent cross-session spatial anchors, measured technician time savings, validated demand, an established moat, first invention or public-production readiness. Completion means the user confirmed returns for the recorded parts. The Lens and companion do not automatically synchronize.

## Closeout sequence

1. Retain the completed six-scenario results, exact final revision evidence and disclosed warnings in the project-local reports.
2. Finish captures and continuous viewpoint proof of framing, phase controls, cue attachment and recovery. Intended destination: `lens/PartTrail/devpost/captures/partcue-final/`.
3. Publish the complete source to [shi1720/partcue](https://github.com/shi1720/partcue), excluding credentials, local databases and generated caches; verify access signed out.
4. Record and publish the under-three-minute YouTube demo. Check narration against visible behavior, then paste the final links and description into Devpost.

**Created by Shivam Gupta, developed with AI coding assistance.** The submission should stand on observed behavior, a clear product story and an honest next validation step.
