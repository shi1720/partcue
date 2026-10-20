# Concept recommendation: a repair bench that remembers the way back

Research date: 20 October 2026. Primary sources only. Commercial claims below are hypotheses unless explicitly sourced. Updated after finding an independently maintained direct competitor. PartCue is the current product name. All 32 software tests, companion browser QA and six actual Lens LEAF preview scenarios have passed. Physical glasses, user outcomes and commercial demand remain untested.

## Decision

Build **PartCue**: spatial teardown memory for independent electronics repairers. The core promise is **“Every part has a way home.”** A technician records a removed part's original position and its tray cell. During reassembly, the planned Lens walks through those records in reverse, lighting the next tray cell and drawing a restrained path to its original position. It remembers the technician's actual sequence; it does not invent repair instructions.

The most emotionally legible scene: “The repair worked. Now there are two nearly identical screws left.” Show one short screw, one long screw, and different origins. Then replay the user's own removal record to remove uncertainty. Treat screw lengths as user-entered facts; never claim vision measured them.

The proposed spatial moment is clear, but the underlying reverse-log idea is not new. The differentiating hypothesis is **paired tray-to-origin cues beside the work**: the user sees the next recorded pickup location and original location together, instead of translating a checklist into physical positions. Capturing a teardown and replaying it backward, local-first storage, and avoiding advance procedure authoring are not defensible novelty claims. The AR advantage remains unproven until the actual Lens works and comparison testing includes recording overhead.

## Direct competitor discovered

[KanadeK/parttrail's primary README](https://github.com/KanadeK/parttrail/blob/main/README.md) describes a local-first teardown journal with photos, quantities, tray locations, reverse-order reassembly, JSON transfer, and browser/CLI tools. This directly overlaps the sequence and companion concept. Its README presents a non-AR workflow; we have not tested its runtime. No source code or documentation was copied into this entry.

**Material implication:** PartCue cannot pitch “your own teardown, replayed backward” as its invention. The useful demonstration must make the spatial pickup-to-origin relationship evident while the user's view moves around the bench. A flat return list with decorative 3D assets would offer little distinction. Even a successful AR implementation would establish execution, not broad first-invention or patentability claims.

## Evidence and competition

| Source | What is established | Implication / limit |
|---|---|---|
| [KanadeK/parttrail README](https://github.com/KanadeK/parttrail/blob/main/README.md) | A directly overlapping local teardown and reverse-reassembly tool is publicly described. | Treat the reverse log as baseline functionality. Test whether spatial cues improve work over a plain reverse checklist. |
| [iFixit Magnetic Project Mat](https://www.ifixit.com/products/magnetic-project-mat) | iFixit sells a gridded magnetic mat for holding loose screws and writing location notes. US listed price observed: $19.95. | Screw organization is a real product category. Buyers already have a cheap, durable alternative. This is not evidence they would buy glasses software. |
| [iFixit FixMat](https://www.ifixit.com/products/fixmat) | FixMat combines a writable magnetic surface and sorting bins; US listed price observed: $36.95. | Integrate with ordinary trays/mats rather than require proprietary hardware. |
| [iFixit iPhone guide, step 12](https://documents.cdn.ifixit.com/pdf/ifixit/guide_29782_en.pdf) | The guide explicitly warns that inserting longer screws into certain holes may irreparably damage the logic board. | Concrete reason origin matters. Do not extrapolate an error rate or claim this Lens prevents damage. |
| [PTC Vuforia work instructions](https://www.ptc.com/en/technologies/augmented-reality/work-instructions) | PTC offers contextual AR instructions, first-person knowledge capture, CAD-based guides, and remote assistance. | “AR repair instructions” is an established crowded category. Test our specific paired tray/origin interaction rather than broad instruction or capture novelty. |
| [Vuforia Expert Capture help](https://support.ptc.com/help/vuforia/editor/en/vuforia_editor/welcome.html) | Expert Capture documents expert knowledge and distributes hands-free task guidance across AR/mobile devices. | Do not portray capturing expert knowledge as our invention. |
| [TeamViewer Frontline](https://www.teamviewer.com/en-us/products/frontline/) | Frontline Make supplies visual assembly instructions; Inspect supports maintenance steps and on-job documentation; Assist supports remote experts. | Enterprise competitors validate investment in work guidance, but do not establish small-shop demand or justify copying their ROI figures. |
| [ITU Global E-waste Monitor 2024](https://www.itu.int/en/ITU-D/Environment/Pages/Publications/The-Global-E-waste-Monitor-2024.aspx) | 62 billion kg of e-waste was generated in 2022; 22.3% was documented as formally collected and recycled. | Optional context for extending useful device life. Never claim our software measurably reduces global e-waste. Lead with repair confidence, not a huge unrelated market number. |

## Narrow product flow

1. **Place the bench.** A single workspace origin aligns a small parts tray and an open device. The real product would require manual recalibration whenever either moves.
2. **Record removal.** Select origin, then tray cell, then confirm. Store immutable step ID, order, origin, tray cell, user label, quantity, optional note, and confirmation status. One operation can hold a screw group when all share an origin; otherwise separate them.
3. **Return mode.** Reverse only confirmed removals. One active tray cell glows amber; a cyan target marks the origin; a thin spatial tether connects them. A short label sits beside the work. No wall of instructions.
4. **Confirm return.** The technician confirms the action; the software records the confirmation. It must say “confirmed,” not “verified by AI.” Wrong-part selection produces a gentle “Use tray B2 for this step” cue and cannot advance.
5. **Undo / pause / finish.** Undo the last confirmation, dim the overlays, resume within the same session, then show a reconciled count. A completion message should mean every recorded removal was confirmed returned, not that the electronics are safe or functioning.

For a polished demo, use a stylized low-voltage wireless mouse or controller housing: shell, two screw groups, bracket, and scroll wheel. Prefer self-created geometry over copying branded device CAD. The preview device is a stand-in for a physical bench, not a claim that the Lens recognized a real device.

## AR and preview fit

[Snap's preview panel documentation](https://www.developers.snap.com/spectacles/get-started/start-building/preview-panel) supports simulated Spectacles rendering and an interactive preview. The installed Devpost `plan-lens` reference is stricter: live camera recognition cannot be demonstrated, voice/AI needs a button or fixed fallback, and cross-session memory cannot be shown. Build within those declared limits.

- Keep world-relative origin and tray cues at roughly 0.5-1 m, slightly below eye level. Keep their spread narrow enough to see both comfortably; use a small directional cue if the destination leaves view.
- Standard pinch targets, mouse-clickable in preview, provide every action. Voice is optional future convenience.
- Preview should visibly identify **“Simulated bench · manual confirmations.”** Capture uses clicks; do not label scripted geometry “camera recognition.”
- Demonstrate movement around the bench: the route stays with the spatial workspace, showing why this is more than a floating webpage.
- Storage can be implemented and unit-tested separately, but honest preview evidence only proves within-session behavior. A web companion may support job accounts/history later, but should not displace the Lens in the demo or be claimed integrated until it is.

## Commercial thesis to test

**First customer:** a repair shop with several benches handling unfamiliar devices or interrupted jobs; secondarily repair classrooms. Occasional home repair is a weak initial paid segment because existing mats are inexpensive and glasses acquisition cost is material. Do not invent current hardware prices.

**Proposed paid value:** less reconstruction after interruption, handoff between technicians, and a traceable record of what was removed. The hackathon's same-session reverse flow is the beachhead; production adoption additionally needs durable job history, reliable alignment recovery, privacy controls, and device testing.

**Price experiment, not established WTP:** test $15-25 per active bench per month, bring your own glasses, with a free single-job mode. At $20/month and an assumed $20/hour labor value, saving 60 minutes monthly would cover the software price; this excludes hardware, onboarding, support, and tax, and is illustrative arithmetic only. Do not use this as an ROI finding.

**Pilot design:** observe five technicians reassembling low-risk practice devices with their current method, a plain reverse checklist, and PartCue's spatial cue mode, with counterbalanced order. The checklist comparison isolates any benefit of AR from the benefit of having a record. Track time, correct origin/quantity, interruptions recovered, confirmation overhead, and user-rated confidence. Ask for a paid pilot commitment after showing their own results. The product fails its hypothesis if recording overhead exceeds later savings or users prefer labeled bags/mats.

**Moat:** none established. A defensible business would need trusted workflow integrations, compatibility with common trays, job-history interoperability, and evidence of reliability. A pile of photos or a generic LLM prompt is not a moat. Avoid treating customer repair images as training data without consent.

## Other concepts considered

- **Allergen preparation zones:** immediate value but safety-critical, difficult to substantiate with preview-only sensing, and overclaiming risk. Reject.
- **Appliance repair instructions:** understandable, but mostly competes with authored AR instructions and needs device-specific knowledge. Reject as broad concept.
- **Packing/warehouse pick guidance:** credible commercial category but TeamViewer already demonstrates it at scale, harder to stand out. Reject.
- **Physical task interruption bookmark:** broader and unusual but vague. Use interruption recovery as a PartCue feature, not its whole pitch.

## Claims language

Use: “A spatial memory of your teardown,” “designed to connect the next recorded tray location to its marked origin,” “manual confirmation,” “designed for independent repair benches.” Use “preview-tested” only after actual Lens evidence exists.

Avoid: “AI knows where every screw goes,” “prevents repair damage,” “production-ready on glasses” before device testing, “reduces repair time by X%” without our own study, “first in the world,” “we invented reverse teardown memory,” “repair instructions generated automatically,” or any invented customer interviews.
