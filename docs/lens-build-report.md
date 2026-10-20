# PartCue ,  Lens implementation and evidence

Open [PartCue.esproj](../lens/PartTrail/PartCue.esproj) in Lens Studio 5.24.1. Official Save As preserved the 635 asset UUIDs and scene UUID. The public product and Lens metadata are **PartCue**; internal PartTrail script names remain stable.

## Implementation

The Lens was built through Snap's standalone CLAD SPECS workflow and the official Lens Studio MCP. The router authorization probe returned false during setup; the standalone builder's project self-gate and actual MCP operations succeeded. This establishes the build path, without asserting signed-in publishing authorization.

The experience uses real UIKit/SIK controls, articulated MeshBuilder geometry and a shared pure core as the sequence authority. Progressive part → well → record controls capture explicit choices among **four authored parts and predefined origins**. Return mode exposes actual tray pickup targets, one dominant confirmation action and contextual pause/undo controls. One cyan origin and amber pickup pair are joined by an animated route. The manually placed bench sits 100 cm ahead and 40 cm below initial eye level; placement locks after recording.

The permanent **SIMULATED BENCH / MANUAL MARKING** label distinguishes the fixture from real repair capture. Scenario replay drives actual runtime SIK/UIKit targets. It is not a live human hand recording, automatic recognition or arbitrary world-point marking.

## Tests and the final selection guard

The five functional scenarios and no-fallback IK scenario passed after the visual design changes. An independent review then exposed a stale confirmation: a rejected wrong pickup could leave a previously correct selection armed. The fix preserves rejection immutability and follows it with an explicit successful `deselectReturn` command, recording `return-deselected` without advancing progress. Both adapters now require fresh correct selection.

All seven functional/IK scenarios passed serially on the saved guard revision, including the dedicated stale-selection test through actual tray targets. Detailed stages and exact official results are in [LEAF results](../lens/PartTrail/devpost/leaf-results.md); a nonasserting demo choreography is recorded separately from assertion scenarios.

The current root build and **34/34 software checks pass**, including exact Lens-core parity, the core guard regression and execution of the actual browser handler. A fresh browser observation confirmed that correct Long screw → wrong Short screw unchecks the prior selection, hides confirmation and leaves 0/2 unchanged. [Browser evidence](evidence/companion-selection-guard.txt).

Current root/Lens core SHA-256: `ea3d499db55843a5b613a12d4ee07c64f5a44979cfdaeea135768b8556fa3bc8`. Known depth-format fallback and batching warnings remain disclosed; this is not a warning-free host-log claim.

## Native capture and spatial evidence

Actual Lens Studio native recordings now exist:

| Capture | Measured format | Role |
| --- | --- | --- |
| `demo/raw/partcue-workflow-full.mp4` | 1570 × 1590, 116.632 seconds | Earlier full workflow |
| `demo/raw/partcue-workflow-final.mp4` | Native preview, 114.165 seconds | Fresh post-guard full workflow |
| `demo/partcue-demo.mp4` | 1920 × 1080, 152 seconds | Finished public demo |
| `demo/raw/partcue-spatial.mp4` | 1570 × 1590, 165.298 seconds | Continuous spatial proof |

The [corrected spatial observation](../lens/PartTrail/devpost/spatial-video-evidence-corrected.json) succeeded. Camera movement leaves the bench root and both halos unchanged in world position; a subsequent actual pickup/confirmation advances 1/4 → 2/4 and moves the cue pair from Lid/Well 3 to Long screw/Well 2 while retaining the root. An earlier partial observation is preserved, not relabeled as a successful run. [Final screenshots](../lens/PartTrail/devpost/captures/partcue-final/) and the [earlier attachment measurements](../lens/PartTrail/devpost/attachment-evidence.json) provide additional context.

The earlier full-workflow and spatial captures retain their original stages. A fresh post-guard full workflow was then recorded, and the finished edit passed full decoding and independent visual review. The finished [public demo](https://www.youtube.com/watch?v=Z9rPXUwUdnw) is **2:32**, 1920 × 1080. Full decoding and an independent visual review passed. YouTube Studio reports Public with no check issues; the viewer page title and duration were checked. Narration is a disclosed generic synthetic guide, not Shivam’s voice or a voice clone; original Lens feedback sounds remain in the mix.

## Source and practical limits

Public source: [shi1720/partcue](https://github.com/shi1720/partcue), tested code revision [`a6c74c7`](https://github.com/shi1720/partcue/commit/a6c74c7). [CI passes all 34 checks](https://github.com/shi1720/partcue/actions/runs/39416731639).

Hardware comfort, real alignment, hand tracking and practical repair benefit remain untested. There is no persistent spatial anchor, automatic installation verification or manufacturer procedure. Lens state is session-local; the separately persisted companion does not synchronize with it. The [full build report](../lens/PartTrail/devpost/build-report.md), [architecture](architecture.md) and [validation record](validation.md) describe the boundaries.
