# PartCue: independent internal judge review

**Reviewed 20 October 2026. Created by Shivam Gupta, developed with AI coding assistance.**

This is an internal LLM review requested for iteration, not an official score, external endorsement or prediction of winning. It assesses the implemented preview and workbench from source/evidence records. It does not certify hardware performance, commercial demand or audited production security.

## Provisional assessment

| Official criterion | Provisional score / 10 | Evidence and reason |
| --- | ---: | --- |
| Design | 8.5 | The Lens provides a complete record/return sequence with paired pickup/origin cues, quantity guards, pause, undo and deliberate restart. The browser adds a useful manual job with named origins, containers and notes, plus a practice fixture and portable export. Seven live Lens scenarios support its lifecycle; browser custom-job end-to-end checks now pass. Glasses comfort and real alignment are untested. |
| Technical implementation | 9.0 | Actual CLAD/official MCP construction, SIK/UIKit interaction, an exact shared-core copy and seven live functional/IK passes establish a working Lens. Firebase adds real private accounts, transactional revisions, rule-enforced quota and deletion hardening; all 12 cloud emulator tests pass. The expanded standard suite passes 51/51 locally; updated public CI and the final 12-stage production smoke now pass. |
| Innovation / idea | 7.0 | The paired world-attached pickup/origin relationship gives AR a specific job. Reverse teardown journals already exist; the documented direct alternative and inexpensive mats/bags are material competition. Spatial benefit over a plain reverse checklist remains a hypothesis, not measured superiority or an established moat. |
| Presentation | 8.0 | The native workflow and continuous spatial captures show actual behavior with explicit simulation and replay disclosure. The earlier 2:32 video passed decode, visual review and public playback checks. The caption-corrected 156.500-second replacement is now public with manual English captions and verified HD playback: [https://www.youtube.com/watch?v=BVofj69YVnA](https://www.youtube.com/watch?v=BVofj69YVnA). |

These numbers are reviewer judgments, not test measurements. No score follows automatically from the number of tests. The current review uses recorded visual/browser observations and source evidence; it does not turn release-owner playback verification into a separate reviewer playback claim. The final encoded-frame review is recorded in [final review](final-review.md).

## Actual evidence, kept separate

- **Lens:** [seven live results](../lens/PartTrail/devpost/leaf-results.md), including actual tray-part pickup and confirmation through far-field IK without scripted fallback, plus stale-selection recovery. The Firebase/manual-job changes do not change this Lens revision.
- **Shared software:** the earlier public [34-check CI](https://github.com/shi1720/partcue/actions/runs/39416731639) is historical. The expanded custom-job suite passes 51/51 locally; [updated public CI](https://github.com/shi1720/partcue/actions/runs/39428423008) passes 51 software and 12 Firebase checks.
- **Cloud:** 12 Auth/Firestore emulator tests pass against the production adapter and checked-in rules. They cover ownership, UTF-8 bounds, schema envelopes, revision races, quota forgery, account reauthentication/deletion and stale-token recreation denial. Full snapshot domain validation remains in the client core; rules do not parse opaque JSON.
- **Production:** an earlier ten-stage smoke passed at deployed revision `0d3277c7b0503626d60073db206d65ad85cc2dbe`, including disposable accounts, CRUD, concurrent revisions and cross-owner denial. Final production smoke passes all 12 stages at `4fecff7`, including custom-job roundtrips and stale-token denial; two disposable accounts and their repair data were cleaned up, retaining minimal markers. Hosted desktop/mobile captures are real evidence of their captured build.
- **Spatial behavior:** [corrected evidence](../lens/PartTrail/devpost/spatial-video-evidence-corrected.json) records zero work-root/active-halo world-position drift during preview camera movement, followed by a valid return and changed pair. This does not establish physical glasses tracking.
- **Media:** actual native post-guard workflow and spatial recordings exist. The current replacement passed full decoding and encoded-frame review, with public manual English captions and HD playback verified by the release owner.

## Earlier material issues and status

| Issue | Status |
| --- | --- |
| A correct selection remained armed after a wrong pickup | Fixed and verified in shared software, browser observation and the live Lens guard. Rejection remains immutable; an explicit successful deselection clears the old confirmation without advancing. |
| The demo could imply arbitrary origin capture or a human hand take | Fixture/manual-marking, predefined origins and SIK replay are disclosed. Synthetic narration is not Shivam's voice. Replacement captions must preserve those boundaries. |
| A preview could be described as a deployable paid AR repair product | Public cloud accounts and a general manual browser log now exist, which improves actual usability. The Lens still has four authored parts, predefined origins and session-local state. Browser persistence does not close those Lens gaps. |

A further cloud deletion race was fixed during v1.1 review: cleanup now retains an irreversible minimal UID marker so old authenticated contexts cannot recreate jobs. Its emulator regression passes. Exact retained fields and indefinite retention are documented in [security](security-and-deployment.md).

## Commercial boundary

The user/problem is credible as a pilot hypothesis: independent repair and training benches, inexpensive alternatives, no recurring runtime LLM cost and an explicit comparison that includes recording overhead. **$20 per bench per month remains unvalidated.** There are no invented customer interviews, trials, paid pilots, time savings or moat.

The browser can log a manual job of up to 100 groups, but its diagram is illustrative. The Lens cannot yet capture arbitrary real origins, durably restore a job across restarts or synchronize with the cloud workbench. A useful logging product and a convincing spatial demonstration are progress; they do not establish a paid general AR product. Next, test real alignment/recovery and compare total task time against usual methods and a plain reverse checklist on safe practice fixtures.

## Required release and participant work

The final release-owner checks confirm public CI, the 12-stage deployed cloud smoke, custom-job browser workflow and captioned public video. [Validation](validation.md) records the exact revision and boundaries. This closes those technical release gates without establishing hardware performance or customer outcomes.

The Devpost entry is not submitted. Shivam must supply country/residence and truthful eligibility answers, prior Lens Studio experience and subjective survey responses, review the final artifacts, then click Submit. Technical responses are prepared in [devpost-additional-info.json](devpost-additional-info.json). No missing personal response or completed attestation is fabricated.


## Final release closeout

Verified after the review checkpoint: [public CI](https://github.com/shi1720/partcue/actions/runs/39428423008) passes 51 software and 12 Firebase tests on `4fecff759913f6cb7757ff7accf4793b3c353fab`. The deployed app at https://partcue.web.app passes all 12 [production smoke stages](evidence/cloud-smoke-final.json). Custom jobs were exercised in the browser through recording, save/reload/cloud load, export/import, return, completion and undo; the actual 320 px layout has no horizontal page overflow. Seven Lens results remain for the unchanged Lens revision.

The [156.500-second product video](https://www.youtube.com/watch?v=BVofj69YVnA) is public, with the corrected 57-cue manual English track verified in public Chrome playback and 1080p HD available. It demonstrates the native Lens and hosted practice/account flows. New custom-job evidence is separate [desktop](evidence/hosted/custom-job-return.png) and [mobile](evidence/hosted/custom-mobile-320.png) capture, not a claim that the video covers that new form. The story, app/repository links, nine tags, new video and five captioned images are saved on Devpost. Personal answers/attestations and final Submit remain participant actions. Earlier pending statements describe their checkpoint and are superseded here.
