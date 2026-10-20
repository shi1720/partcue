# Build provenance

**PartCue: created by Shivam Gupta, developed with AI coding assistance.** Work began on 20 October 2026, within the official 15 October-9 November 2026 submission period. [Official rules](https://learn-specs.devpost.com/rules).

This record describes the implemented entry and its staged release evidence. [Public source](https://github.com/shi1720/partcue) includes the Lens and workbench. The earlier 34-check CI at `a6c74c7` is a historical checkpoint, not proof of the latest Firebase/custom-job revision. See [validation](validation.md) for current release gates.

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

Scenarios 1-5 used LEAF's functional interactor through real SIK/UIKit targets. Scenario 6 used IK. These runs establish preview behavior; they do not establish direct physical reach or real-device hand tracking. Renderer fallback and nonfatal batching warnings are disclosed in the project-local results.

**Design-stage rerun: six of six passed.** The final design adds phase-specific UI and direct tray-part selection, with updated environment and framing. The interaction review exposed a back-row target sightline problem; after that fix, the final IK run selected the actual tray part and confirmed its return with fallback disabled. Final captures exist under `lens/PartTrail/devpost/captures/partcue-final/`. Native workflow and continuous spatial recordings now exist under `demo/raw/`; the corrected runtime spatial evidence records zero halo/root drift during camera movement, followed by an actual next return. Those earlier source captures retain their original stages; a fresh post-guard native workflow was subsequently recorded at `demo/raw/partcue-workflow-final.mp4` (114.165 seconds).

## Hosted workbench and optional local mode

Version 1.1 adds the public [partcue.web.app](https://partcue.web.app) workbench using the official Firebase browser SDK, Firebase Hosting, Authentication and Firestore. The immutable project ID remains `benchback`; the public Hosting site is `partcue`. Spark/free configuration is used without Cloud Functions, Cloud Storage or an attached paid billing account. Public app configuration is committed; administrative credentials and QA passwords are not.

The manual-job workflow records up to 100 named part groups, named origins, storage containers, quantities and optional notes. It preserves the unchanged shared schema and labels its diagram as illustrative. The four-part practice fixture remains available. These browser capabilities do not add arbitrary marking, persistence or cloud synchronization to the Lens.

Firebase Auth provides real accounts, profile editing, reset/verification actions and password-confirmed deletion. Firestore transactions implement private snapshots, optimistic revisions and a rule-enforced 50-session quota. Rules enforce the exact storage envelope and owner isolation; full JSON domain validation is client-side through the shared core, not a server-executed state machine. Deletion retains only a minimal private UID lock to prevent old tokens recreating jobs after repair cleanup. [Architecture](architecture.md) and [security](security-and-deployment.md) state the exact boundary and retained fields.

The separate local HTTP adapter still provides salted scrypt passwords, opaque expiring cookies, CSRF/Origin protection, SQLite snapshots and online backup/restore. Its accounts are local only and independent of Firebase. The hosted build selects the cloud adapter; the ordinary local build selects HTTP. No runtime LLM inference or paid API is required.

**Cloud emulator checkpoint: 12/12 tests pass.** The expanded standard suite passes 51/51 locally after custom-job integration; [updated public CI](https://github.com/shi1720/partcue/actions/runs/39428423008) passes 51 software and 12 Firebase checks. All seven saved Lens scenarios remain passing and unchanged. A prior ten-stage live cloud smoke passed against deployed revision `0d3277c7b0503626d60073db206d65ad85cc2dbe`; the final deployment at `4fecff7` passes all 12 smoke stages, including custom jobs and deletion markers. Actual hosted desktop/mobile UI evidence exists for the captured earlier build. These stages are not interchangeable.

## Final selection-guard correction

An independent source review reproduced an older correct return selection remaining armed after a rejected wrong pickup. The root core now exposes an explicit `deselectReturn` command and `return-deselected` event; the rejection itself stays immutable. Both adapters clear the old selection before a confirmation can succeed. Two new software regressions and a fresh actual browser observation passed. The Lens core was copied through official MCP and all seven functional/IK scenarios passed on the saved guard revision.

Current root/Lens core SHA-256: `ea3d499db55843a5b613a12d4ee07c64f5a44979cfdaeea135768b8556fa3bc8`. Exact source parity is part of the standard software suite. [Validation](validation.md) links the actual browser evidence and spatial observation.

## Media revision and participant handoff

The earlier 2:32 edit passed full decoding, an independent visual review and public embedded playback checks. The current [156.500-second product video](https://www.youtube.com/watch?v=BVofj69YVnA) has corrected captions, a successful full decode and verified public HD playback with its manual English track. Current media provenance is in `demo/partcue-product-demo.edit.json`.

The native post-guard source workflow remains `demo/raw/partcue-workflow-final.mp4` (114.165 seconds). Continuous spatial footage and corrected runtime queries preserve their distinct capture stage. These are actual Lens Studio previews of four authored parts and predefined origins, driven through real SIK/UIKit replay. They are not generated repair footage, arbitrary origin capture or live human hand takes. The generic synthetic guide is disclosed, does not impersonate Shivam and is mixed with original product SFX. Source/edit/audio provenance remains under `demo/`.

Public source exists. The latest standard-test, deployed custom-job smoke and replacement-media gates are tracked in [validation](validation.md). The participant must supply personal Additional info responses, make truthful attestations, review the entry and click Devpost Submit. Submission is not recorded as complete. Hardware comfort, alignment stability and practical repair benefit remain user/device validation work.


## Final release closeout

Verified after the review checkpoint: [public CI](https://github.com/shi1720/partcue/actions/runs/39428423008) passes 51 software and 12 Firebase tests on `4fecff759913f6cb7757ff7accf4793b3c353fab`. The deployed app at https://partcue.web.app passes all 12 [production smoke stages](evidence/cloud-smoke-final.json). Custom jobs were exercised in the browser through recording, save/reload/cloud load, export/import, return, completion and undo; the actual 320 px layout has no horizontal page overflow. Seven Lens results remain for the unchanged Lens revision.

The [156.500-second product video](https://www.youtube.com/watch?v=BVofj69YVnA) is public, with the corrected 57-cue manual English track verified in public Chrome playback and 1080p HD available. It demonstrates the native Lens and hosted practice/account flows. New custom-job evidence is separate [desktop](evidence/hosted/custom-job-return.png) and [mobile](evidence/hosted/custom-mobile-320.png) capture, not a claim that the video covers that new form. The story, app/repository links, nine tags, new video and five captioned images are saved on Devpost. Personal answers/attestations and final Submit remain participant actions. Earlier pending statements describe their checkpoint and are superseded here.
