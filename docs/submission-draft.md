# PartCue

### Every part has a way home.

**Created by Shivam Gupta, developed with AI coding assistance.**

**Short description:** PartCue is a spatial memory for your own teardown. Record where a removed part came from and where you put it. On SPECS, paired pickup and origin cues show the next return beside the work, following your recorded sequence in reverse.

**Repository:** [github.com/shi1720/partcue](https://github.com/shi1720/partcue)

**Demo:** [Watch PartCue, 2:32](https://www.youtube.com/watch?v=Z9rPXUwUdnw)
**Validation:** seven live functional/IK Lens scenarios passed; [34 software checks pass in CI](https://github.com/shi1720/partcue/actions/runs/39416731639).

## Inspiration

The repair worked. Now two nearly identical screws are left on the bench. Which one came from here?

Photos and labeled trays preserve information, but a repairer still has to map it back onto the object. Glasses can put that remembered relationship beside the work: where the next part is, and where it came from.

## What it does

In the labeled preview simulation, place an original mechanical enclosure and four-well tray, choose among four authored parts with predefined origins, record their removals, and begin the return. An animated path connects one amber pickup cue to one cyan origin cue. Only the next recorded part advances, after selection and quantity confirmation.

A wrong part or quantity leaves progress unchanged. A wrong pickup also clears an older selection, requiring fresh selection before confirmation. Pause hides the work cues; resume restores the same next part. Undo corrects a removal or return. Completion clears the active cues, and restart requires confirmation.

The sequence follows explicit selections rather than inferred repair instructions. The demo is actual native Lens Studio preview footage with real SIK/UIKit input replay. It uses a disclosed generic synthetic guide, not Shivam’s voice. The four predefined origins demonstrate the spatial interaction; they are not camera recognition or free-form real repair capture.

## How we built it

Devpost Learn's `plan-lens` skill shaped the brief around one spatial moment and observable preview criteria. Shivam delegated product and implementation decisions; the planning record reflects that process.

We built the actual Lens through Snap's standalone CLAD SPECS workflow and the official Lens Studio MCP. Spectacles Interaction Kit and UIKit supply the interactions. Code-authored MeshBuilder geometry keeps the enclosure, parts and wells separate, while local algorithmic synthesis supplies short feedback sounds.

A pure TypeScript state machine owns the sequence, with exact Lens-source parity checked by tests. The design-stage functional and IK scenarios passed in SPECS 27 preview. IK selected the actual tray part and confirmed its return using far-field routing, with scripted fallback disabled. A later adversarial review added an explicit deselection rule and a live wrong-after-correct-selection regression. All seven functional/IK scenarios then passed on the saved guard revision.

The optional companion adds browser rehearsal, local accounts, SQLite snapshots and JSON exports. Its 34 passing software checks complement the seven live Lens tests. The two adapters do not automatically synchronize.

## Challenges and learning

The main design challenge was restraint. A complete teardown history is useful storage; it is poor guidance when displayed all at once. We kept the active experience to the next pickup, its origin and a clear confirmation.

Preview interactions exposed overlapping UIKit targets and initialization issues. We corrected them through public APIs and tested real UIKit/SIK targets. Valid state transitions were only part of the job: controls also had to be selectable and recovery obvious.

Reverse teardown journals already exist, including [a direct non-AR alternative](https://github.com/KanadeK/parttrail/blob/main/README.md). Our hypothesis concerns the spatial pair: does seeing pickup and origin beside the work reduce the effort of translating a record into a task?

## What's next

Test on glasses for alignment, hand interaction, additive readability and comfort, then test with repair technicians.

Compare spatial cues with a plain reverse checklist and technicians' usual mats on practice fixtures, counting recording overhead. Repair shops and classrooms are the first users to test. **$20 per active bench per month** is an unvalidated price experiment; customer demand and repair improvements remain unmeasured.
