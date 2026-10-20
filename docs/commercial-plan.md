# PartCue: commercial plan

**Evidence status — 20 October 2026:** no customer interviews, paid pilots, or measured repair outcomes are claimed. The core and companion pass 32 software tests and manual browser QA. The actual CLAD-built SPECS Lens passes all six LEAF preview scenarios, including hand interaction without scripted fallback. Physical glasses and field performance remain untested. PartCue is the current product name. This plan defines hypotheses worth testing, not a proven business.

## A narrow customer and a specific job

Start with independent electronics repair shops with multiple benches and repair classrooms. Focus on unfamiliar or interrupted teardowns where reconstructing the exact origin of a part takes effort. The job is: **“Help me put back the parts I removed, without reconstructing my own notes.”**

The buyer is a shop owner or training lead; the daily user is a technician or learner. An occasional home repairer is a secondary free user, since a subscription plus glasses is a large commitment for a sporadic task. Hardware access is a major adoption dependency, not a solved distribution problem.

The first product should support an explicit local sequence, one active spatial origin/tray pair, corrections, and transparent confirmation. Account login does not belong in the Lens's active repair flow. The implemented companion has accounts and saved jobs; useful Lens-to-companion integration and technician handoff still require evidence.

## Alternatives and evidence

| Alternative | Primary evidence | What PartCue must earn |
|---|---|---|
| Direct reverse-teardown journal | [KanadeK/parttrail README](https://github.com/KanadeK/parttrail/blob/main/README.md) describes local capture of teardown steps, photos, parts, quantities and tray locations, followed by strict reverse reassembly and portable JSON. It is an independently maintained browser/CLI alternative; we have not tested its runtime. | Reverse order, local storage, and a personal teardown record are already baseline concepts. Demonstrate whether paired spatial pickup/origin cues improve a task over a plain reverse checklist. No competitor code or documentation was copied. |
| Labeled mats, bins, bags, photos | [iFixit Magnetic Project Mat](https://www.ifixit.com/products/magnetic-project-mat) sells a writable screw-organization surface, observed at US $19.95. [FixMat](https://www.ifixit.com/products/fixmat) adds sorting bins and was observed at US $36.95. Prices are a research snapshot, not guaranteed future prices. | An inexpensive mat has no software subscription and does not need charging. PartCue must beat the user's usual method after including capture time. |
| Enterprise AR work instructions | [PTC Vuforia](https://www.ptc.com/en/technologies/augmented-reality/work-instructions) supports contextual guides, first-person knowledge capture, and CAD-based procedures. | Evaluate our specific tray-to-origin interaction and setup friction. Broad “hands-free guidance,” knowledge capture, or lack of CAD authoring cannot establish novelty. This is not proof PTC lacks an overlapping feature. |
| Industrial smart-glasses workflows | [TeamViewer Frontline](https://www.teamviewer.com/en-us/products/frontline/) covers assembly instructions, inspection documentation, and remote assistance. | Keep the workflow simple enough for a small bench. Generic “hands-free repair guidance” is insufficient differentiation. No unsupported competitor price comparison is made. |
| Device repair guides | [iFixit guide example](https://documents.cdn.ifixit.com/pdf/ifixit/guide_29782_en.pdf) warns that using longer screws in particular holes can damage a logic board. | Origin mapping has practical stakes. PartCue supplements authoritative procedures; it must not manufacture instructions or promise damage prevention. |

The [ITU Global E-waste Monitor 2024](https://www.itu.int/en/ITU-D/Environment/Pages/Publications/The-Global-E-waste-Monitor-2024.aspx) reports 62 billion kg generated in 2022. Extending device life is useful context, but this total is not PartCue's addressable market and does not establish any environmental impact from this project.

## Positioning

**PartCue is a spatial memory of your teardown.** It preserves a relationship: recorded part, origin, tray location, and order. Its input comes from the user's explicit marking; its output is a localized cue and a record of the user's confirmation.

The reverse log itself is not the differentiation. The specific hypothesis is that **seeing the next tray location and saved origin together, beside the physical task**, reduces the mental work of mapping a checklist to a bench. The [direct competitor's README](https://github.com/KanadeK/parttrail/blob/main/README.md) makes the overlap clear. A spatial UI without a measurable usability benefit would be an expensive presentation layer over an existing workflow. Do not claim a first invention, superior reliability, or an exclusive feature without evidence.

This boundary is useful commercially as well as technically. It does not require us to maintain repair instructions for every device or claim a general visual model understands arbitrary screws. It still requires dependable tracking, fast input, and honest recovery when the bench moves. Those remain production validation work.

## Pricing experiment and unit economics

Test **$20 per active bench per month**, bring your own supported glasses. Offer a free single-session mode so users can evaluate recording friction before creating an account. Pricing and packaging have not been validated. No payment collection or paid launch is implied by this plan.

The following model is illustrative and deliberately excludes hardware subsidy:

| Monthly per paid bench | Assumption | Amount |
|---|---|---:|
| Subscription revenue | One active bench | $20.00 |
| Payment processing | Assumed 3% + $0.30 per monthly charge; not a vendor quote | $0.90 |
| Optional job storage / transfer | Assumed small text snapshots, no default image/video uploads | $0.50 |
| Support allocation | Assumed 10 minutes at an internal cost of $12/hour | $2.00 |
| Contribution before other costs | Revenue minus the three assumptions above | $16.60 |

The illustrative contribution ratio is 83%. It is not a gross-margin forecast. It excludes development, sales, taxes, refunds, device fleet management, compliance, insurance, customer acquisition, and hardware. Low early customer volume could make per-user costs much higher. No recurring LLM inference is required for the explicit marking flow; any future vision service would need separate cost and reliability analysis.

Customer-side break-even depends on local labor value and actual time saved. At an **assumed $20/hour**, a $20 subscription requires **60 net minutes saved monthly** before hardware and onboarding. At $10/hour it requires 120 minutes; at $40/hour it requires 30 minutes. “Net” includes all time spent recording and correcting the log. We have not measured any savings.

## Pilot before scale

Recruit five consenting repair technicians for a practice-device study. Use battery-free mechanical fixtures first. No outreach has been performed or authorized by this document. Each participant uses their current method, a plain reverse checklist, and PartCue's spatial cue mode on matched tasks, with order counterbalanced to reduce learning effects. The checklist comparison isolates the value of spatial presentation from the value of recording steps at all.

Capture task duration from first removal to final return, recording overhead, origin/quantity mistakes, recovery after a planned interruption, assistance requests, and subjective confidence. Preserve anonymized observations only with consent; do not upload client devices or repair footage by default.

**Predeclared pilot acceptance gates:**

1. Every recorded group is reconciled; no unreported mismatch in origin or quantity appears in the final practice-fixture check. Any discrepancy pauses expansion until its cause is understood.
2. Median total task time, including recording, is at least 10% lower than the participant's usual method on the interruption task. Spatial mode must also improve total time over the plain reverse checklist without reducing mapping accuracy; otherwise the claimed AR benefit has not been shown. A five-person pilot is directional evidence, not a general statistical claim.
3. At least four of five participants complete the second session without facilitator help and prefer using it on another unfamiliar teardown.
4. At least three of five accept a clearly described paid pilot offer at $20/bench/month after any free trial; only an actual commitment counts, not “sounds useful.”
5. No participant mistakes a user confirmation for automatic physical verification when asked to explain what completion means.

Failure is useful: if capture takes longer than later recall saves, simplify input or stop this wedge. If users prefer mats, do not hide that result behind confidence scores. Device testing must separately evaluate real alignment stability, re-placement recovery, hand interaction, and additive readability before a commercial release.

## Distribution and defensibility

After an evidence-backed pilot, test repair educators and small-shop communities as a learning channel, with a short real workflow demonstration. Partnerships with mat/tray suppliers are possibilities, not existing relationships. A printable well layout should remain optional, with ordinary trays usable through manual marking.

There is **no established moat**. A direct public reverse-log competitor strengthens this concern: adding accounts or a subscription does not make the core idea defensible. Spatial tethers, reverse logs, and AI-generated code are readily reproducible. Possible future advantages are reliable alignment recovery, compatibility with shop workflows, and earned user trust. These require execution and validation. Customer photos are not a defensible asset to collect indiscriminately.

## Release discipline

The hackathon version should be judged as a preview-tested AR experience once evidence exists. A commercial release additionally needs durable job storage with recovery, device testing, privacy and deletion controls, permission boundaries, actual support processes, and a documented way to invalidate alignment after the bench moves. Do not call the current package production-ready on glasses.
