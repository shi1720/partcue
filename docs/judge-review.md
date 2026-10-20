# PartCue — independent internal judge review

**Reviewed 20 October 2026. Created by Shivam Gupta, developed with AI coding assistance.**

This is a strict internal LLM review requested for iteration, **not an official hackathon score, organizer endorsement or prediction of winning**. The scores below assess the demonstrated preview submission. They do not certify hardware performance or commercial readiness.

## Provisional judging scores

| Official criterion | Internal score / 10 | Reason and evidence |
| --- | ---: | --- |
| **Design** | **8.0** | A coherent beginning-to-end experience: place the bench, record removals, follow one pickup/origin pair, confirm, recover through pause/undo, finish and deliberately restart. Phase-specific controls reduce clutter; direct tray selection makes return mode more spatial than a floating checklist. Seven live scenarios and actual browser observations support recovery behavior. The four-part authored fixture is narrow, and comfort/readability on glasses remain untested. |
| **Technical implementation** | **9.0** | The actual Lens was built through CLAD and official MCP, with real UIKit/SIK targets and articulated geometry. The pure sequence authority is byte-identical across adapters. All **seven functional/IK Lens scenarios** and **34 software checks in public CI** pass. The extra adversarial selection regression and no-fallback IK run are strong evidence of iteration. Persistent local companion accounts, ownership checks, optimistic revisions and backups work separately. This remains a preview-tested release with documented graphics warnings and public-SaaS limitations. |
| **Innovation / idea** | **7.0** | The two-screw problem is understandable and the paired, world-attached pickup/origin relationship is a concrete reason to use AR. However, reverse teardown journals already exist, including the direct alternative acknowledged in the research. The contribution is the spatial interaction and its execution; its benefit over a plain reverse checklist is still a hypothesis. No established moat or first-invention claim is supported. |
| **Presentation** | **8.5** | The public **2:32** video shows actual native Lens Studio workflow and continuous spatial footage, with a clear problem/action/result story. Captions, simulation and input-replay disclosures distinguish it from sensed repair footage. Final decoding and a separate visual review passed; public embedded playback advanced with no player error and captions enabled. The generic synthetic guide is disclosed and does not impersonate Shivam. A real-bench case study would strengthen a future pitch, but is not demonstrated here. |

These are provisional reviewer judgments, not measurements. This pass reviewed the source and evidence records and uses the separate completed video review and playback observations; it does not claim to have independently rewatched every final frame.

## Evidence behind the assessment

- [Public source, tested revision a6c74c7](https://github.com/shi1720/partcue/commit/a6c74c7) and [passing 34-check CI](https://github.com/shi1720/partcue/actions/runs/39416731639).
- [Seven final live Lens results](../lens/PartTrail/devpost/leaf-results.md), including actual `PickupPart3` and confirmation through far-field IK with scripted fallback disabled, plus `partcue-08-stale-selection-guard`.
- [Browser guard observation](evidence/companion-selection-guard.txt): correct Long screw → wrong Short screw clears the older selection, hides confirmation and preserves 0/2 progress. [Software and browser validation](validation.md).
- [Corrected spatial evidence](../lens/PartTrail/devpost/spatial-video-evidence-corrected.json): camera movement leaves the work root and both active halos unchanged in world position; an actual return advances 1/4 → 2/4 and changes the pair.
- [Capture provenance](../demo/capture-provenance.json): fresh post-guard native workflow, 114.165 seconds; separately captured spatial range; no frame generation or speed change. [Published demo](https://www.youtube.com/watch?v=Z9rPXUwUdnw): approximately 152 seconds, 1920 × 1080. Final full decode and independent visual review passed. Privacy-enhanced public embedded playback was observed advancing to 7.48 seconds, readyState 4, error null; reported duration 152.021 seconds and captions enabled.

The demo choreography is a reproducible sequence of actual SIK/UIKit inputs, not an eighth assertion test or a live human hand take. The spatial source predates selection hardening; the final workflow follows it, with provenance retaining that distinction.

## Earlier material issues and their final status

| Earlier issue | Final status |
| --- | --- |
| **An older correct selection remained armed after a wrong pickup.** | **Fixed and verified.** The rejected command still preserves its input. A separate successful `deselectReturn` command clears selection and records `return-deselected` without advancing. Browser and Lens regressions require fresh correct selection, then allow exactly one return. All seven Lens scenarios and 34 software checks pass after the change. |
| **The demo could imply arbitrary origin capture or a live human take.** | **Disclosure corrected.** The video/provenance identify four authored parts, predefined origins, a simulated bench and SIK input replay. Generic synthetic narration is disclosed separately from original product SFX. No camera recognition, voice cloning or physical verification is claimed. |
| **A convincing preview could be presented as a deployable paid repair product.** | **Boundary remains, and is stated accurately.** The Lens handles an authored four-part fixture and session-local state. It cannot yet capture arbitrary repair origins, restore a real Lens job after restart or synchronize with the companion. The companion's persistence does not close those Lens gaps. This is not a paid general repair product or field-validated startup. |

## Commercial judgment

The commercial framing is credible as an experiment: independent repair/training benches, inexpensive mats and photographs as alternatives, no recurring LLM inference requirement, and an explicit recording-overhead comparison. **$20 per bench per month is unvalidated.** There are no claimed customer interviews, paid pilots, measured time savings or established moat.

The next useful evidence is hardware alignment/recovery and a counterbalanced practice-fixture study against both usual methods and a plain reverse checklist. Record total task time, including capture and correction. A faster return that costs more time to record does not establish value. Reliable arbitrary marking and durable Lens-job recovery would be prerequisites for the broader paid workflow. These are product-development boundaries, not missing hackathon preview features disguised as completed work.

## Submission handoff: personal information still required

The technical artifact, public repository, public video, captions and test evidence are ready. The Devpost story, tags, three captioned images, video and repository are saved; the entry is at **Additional information, step 3 of 5**, not submitted.

Technical responses are prepared in [devpost-additional-info.json](devpost-additional-info.json). Shivam must supply the personal answers that cannot be inferred:

- Country of residence and truthful age/location/affiliation eligibility attestations.
- Prior Lens Studio experience.
- Personal AI-cost, future-use and learning survey responses.

Those missing responses prevent Save & Continue. After completing them, Shivam must review the final entry and personally click **Submit**. No eligibility attestation or completed submission is asserted by this review. The remaining action is participant information and submission, not another speculative code or presentation rebuild.
