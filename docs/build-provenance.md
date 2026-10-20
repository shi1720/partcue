# Build provenance

**PartCue — created by Shivam Gupta, developed with AI coding assistance.** Work began on 20 October 2026, within the official 15 October–9 November 2026 submission period. [Official rules](https://learn-specs.devpost.com/rules).

This record describes the tools and evidence behind the implemented entry. Public source: [shi1720/partcue](https://github.com/shi1720/partcue), tested code revision [`a6c74c7`](https://github.com/shi1720/partcue/commit/a6c74c7). [CI passes all 34 checks](https://github.com/shi1720/partcue/actions/runs/39416731639).

## Planning and product decisions

- Installed and read Devpost Learn `plan-lens`, its AR design rules, preview limits and design-brief template. Source revision: `5d8bc0800346d38e468c29b15afcb7ca92280005`. The exact source and license are retained under `tools/devpost-learn-source/`.
- Produced [devpost/design-brief.md](../devpost/design-brief.md). Shivam explicitly delegated consequential choices and requested no interview; the brief records the selected defaults rather than presenting them as interview answers.
- Reviewed official rules/resources, Snap's CLAD setup and the *Design for the World* educational video's transcript. The design applies information beside the object, generous targets and one active instruction.
- Compared inexpensive screw-organization products, enterprise AR instructions and a direct reverse-teardown journal. [Market research](market-research.md) acknowledges the overlap. No first-invention, customer-demand or measured-impact claim follows from that research.

## Lens implementation

The actual Lens Studio project is included under [lens/](../lens/). Internal project and script prefixes intentionally remain PartTrail so scene references and test identifiers stay stable. PartCue is the public product name.

- Installed Snap's official `ls-clad@ls-extensions` package from [lens-studio-devs/ls-extensions](https://github.com/lens-studio-devs/ls-extensions), revision `8adedd5d5b93f9dbe55f31c6be4264a4f8a608b3`.
- Used Lens Studio **5.24.1.26100516**, target Spectacles/SPECS, with SPECS 27 Interactive preview. The official macOS ARM application was obtained from Snap's download flow and its Developer ID/notarization verified during setup.
- Executed the standalone CLAD SPECS experience-builder workflow against the real project using the official Lens Studio MCP. Tool actions included scene reads/applies, package installation, script compilation, runtime inspection, interaction, captures and project save. The project-local build report records the exact operations and corrections.
- During setup the CLAD router authorization probe returned false. The implementation subsequently used the standalone CLAD builder and its project self-gate; official MCP build and preview tools succeeded. This does not assert signed-in publishing authorization or a published Lens.
- Installed SpectaclesInteractionKit and SpectaclesUIKit distribution version 2.0.0, Leaf 2.0.2 and the preview inspection/interaction helpers. The SIK runtime banner's internal version is distinct from its distribution version.
- Authored separate geometry, view, coordinator, audio and test modules. MeshBuilder creates the original enclosure, four wells, articulated parts and active cue geometry. Short feedback WAVs were generated locally; icons were imported through CLAD's icon tool. No cloud mesh generation or runtime AI inference is claimed.
- Copied the dependency-free session core into the Lens Assets scripts. An executable parity test compares it with the shared source. The [architecture](architecture.md) documents the adapter boundary and state ownership.

The project includes third-party starter/toolkit assets, disclosed in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Generated editor caches and local MCP credentials do not belong in public source.

## Observed runtime evidence

The project-local `devpost/build-report.md` and `devpost/leaf-results.md` under [lens/](../lens/) contain the detailed evidence. The initial six successful scenarios were rerun after the final design changes, with all six passing. The project-local results retain the actual Lens-side evidence:

1. Four removals in distinct wells, with labels and count changes.
2. The active pickup/origin pair and changing directional-marker positions.
3. Wrong-part, missing-selection and wrong-count rejection; one advance for a valid confirmation.
4. Pause, resume and undo restoring the expected next pair.
5. Reverse completion, cleared active cues and confirmed restart.
6. An IK setup/start/part/well/record sequence, followed by actual tray-part pickup selection (`PickupPart3`) and return confirmation, using far-field routing without scripted fallback.

Scenarios 1–5 used LEAF's functional interactor through real SIK/UIKit targets. Scenario 6 used IK. These runs establish preview behavior; they do not establish direct physical reach or real-device hand tracking. Renderer fallback and nonfatal batching warnings are disclosed in the project-local results.

**Design-stage rerun: six of six passed.** The final design adds phase-specific UI and direct tray-part selection, with updated environment and framing. The interaction review exposed a back-row target sightline problem; after that fix, the final IK run selected the actual tray part and confirmed its return with fallback disabled. Final captures exist under `lens/PartTrail/devpost/captures/partcue-final/`. Native workflow and continuous spatial recordings now exist under `demo/raw/`; the corrected runtime spatial evidence records zero halo/root drift during camera movement, followed by an actual next return. Those earlier source captures retain their original stages; a fresh post-guard native workflow was subsequently recorded at `demo/raw/partcue-workflow-final.mp4` (114.165 seconds).

## Companion and shared software

The separate browser companion has real local accounts, salted password hashing, expiring opaque sessions, CSRF and ownership protection, SQLite snapshots, optimistic revisions and verified online backups. It runs without API keys or paid infrastructure. It does not synchronize with the Lens.

The current local shared software checkpoint is **34/34 passing tests**, including exact Lens-core source parity, domain rules, real HTTP/SQLite integration, account-switch isolation and browser authentication regressions. [Validation](validation.md) records the build environment and actual browser workflows; these are not mislabeled as LEAF results.

## Final selection-guard correction

An independent source review reproduced an older correct return selection remaining armed after a rejected wrong pickup. The root core now exposes an explicit `deselectReturn` command and `return-deselected` event; the rejection itself stays immutable. Both adapters clear the old selection before a confirmation can succeed. Two new software regressions and a fresh actual browser observation passed. The Lens core was copied through official MCP and all seven functional/IK scenarios passed on the saved guard revision.

Current root/Lens core SHA-256: `ea3d499db55843a5b613a12d4ee07c64f5a44979cfdaeea135768b8556fa3bc8`. Exact source parity is included in the 34 local checks. [Validation](validation.md) links the actual browser evidence and spatial observation.

## Published media and final participant step

The finished [public demo](https://www.youtube.com/watch?v=Z9rPXUwUdnw) is **2:32**, 1920 × 1080. Full decoding and an independent visual review passed. YouTube Studio reports Public with no check issues; the viewer page title and duration were checked. Narration is a disclosed generic synthetic guide, not Shivam’s voice or a voice clone; original Lens feedback sounds remain in the mix.

The final edit is `demo/partcue-demo.mp4`; source capture and edit/audio provenance remain under `demo/`. The footage is actual Lens Studio preview of four authored parts with predefined origins, driven through real SIK/UIKit input replay. It is not generated repair footage, arbitrary location capture or a live human hand recording.

Source and passing 34-check CI are public. All seven functional/IK Lens scenarios passed on the saved guard revision. The remaining submission step is Shivam's review, personal Additional info responses and truthful attestations and Devpost Submit; that action is not recorded as completed. Hardware comfort, alignment stability and practical repair benefit remain future validation work.
