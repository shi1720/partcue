# Build provenance

**PartCue — created by Shivam Gupta, developed with AI coding assistance.** Work began on 20 October 2026, within the official 15 October–9 November 2026 submission period. [Official rules](https://learn-specs.devpost.com/rules).

This record describes the tools and evidence behind the implemented entry. The public source destination is [shi1720/partcue](https://github.com/shi1720/partcue); the repository is created, with upload pending at this checkpoint.

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

**Final scenario rerun: six of six passed.** The final design adds phase-specific UI and direct tray-part selection, with updated environment and framing. The interaction review exposed a back-row target sightline problem; after that fix, the final IK run selected the actual tray part and confirmed its return with fallback disabled. Final captures and continuous viewpoint proof are being prepared in `lens/PartTrail/devpost/captures/partcue-final/`; no finished recording is implied by that destination.

## Companion and shared software

The separate browser companion has real local accounts, salted password hashing, expiring opaque sessions, CSRF and ownership protection, SQLite snapshots, optimistic revisions and verified online backups. It runs without API keys or paid infrastructure. It does not synchronize with the Lens.

The shared software checkpoint is **32/32 passing tests**, including exact Lens-core source parity, domain rules, real HTTP/SQLite integration, account-switch isolation and browser authentication regressions. [Validation](validation.md) records the build environment and actual browser workflows; these are not mislabeled as LEAF results.

## Remaining release evidence

Final capture completion, public source upload, a public YouTube demo under three minutes and completed Devpost submission remain gates. Hardware comfort, alignment stability, physical assembly correctness and practical repair benefit require separate studies. Contributor credit does not imply unrecorded manual edits, customer interviews or field results.
