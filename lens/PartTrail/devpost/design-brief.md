---
status: approved-by-delegation
author: Shivam Gupta
started: 2026-10-20
---

# Design brief: PartCue

Planning: Devpost Learn `plan-lens`, revision `5d8bc0800346d38e468c29b15afcb7ca92280005`. Shivam explicitly delegated consequential choices and requested no interview. These are agent-selected defaults, not invented interview answers. Normal interview and sign-off were replaced by delegated decisions. Implementation now exists in Lens Studio 5.24.1 through CLAD and the official Lens Studio MCP. All six final LEAF preview scenarios pass; the build report separates preview evidence from untested hardware behavior.

## The one spatial moment

You return to a half-disassembled object. Two nearly identical screws sit in a tray. PartCue lights the exact tray slot and the exact place the next part belongs, using the teardown you recorded yourself. You put it back, confirm, and the next pair appears.

## Why it belongs on glasses
- Draws in the world: a spatial cue connects the active tray slot and original location.
- Leaves your body free: eyes stay on the device, hands remain available between brief pinches.
- A phone can hold photos, but requires looking away and interpreting them while handling parts. Spatial correspondence is the reason for glasses.
- Shared-view sensing is future work. This build uses explicit manual marking.

## Product or overlay
- Type: overlay on a repair bench, with an interactive simulation in preview.
- Real version senses world tracking for manually marked locations, with no inference about part identity.
- Preview stand-in: visible `SIMULATED BENCH / MANUAL MARKING` label and an authored battery-free mechanical enclosure, origin points, and four tray wells. Never claim camera recognition.
- Fixture (default): generic serviceable enclosure with short screw, long screw, lid, and inner module. This demonstrates memory, not a manufacturer's repair procedure.

## Where things live
- Gaze: down at the bench about 1 m away (default).
- Work root: world anchored 100 cm ahead and 25 cm below initial eye level (default). Reposition before recording. Lock placement after first removal. Restart to re-place.
- Device: 22 x 16 x 6 cm, 12 cm left of root (default).
- Tray: four wells in an 18 x 18 cm area to the right (default).
- Active origin and tray rings: 3 cm radius, cyan and amber, with numbers and labels (default). Color never carries meaning alone.
- Task card: 24 x 11 cm beyond the device, below eye level. One instruction and progress, never the full log (default).
- Controls: large UIKit targets about 6 cm tall, inside a 50 cm wide work zone (default).
- Return cue: luminous path from active tray to origin, with animated direction markers (default).

## Hands and input
- Setup: pinch `Set bench`, then `Start teardown`.
- Record: select a simulated part, select an empty tray well, pinch `Record removal`. Show a brief confirmation and updated count.
- Return: pinch `Return parts`. Highlight the last recorded part and its origin. Wrong selection gives a specific hint without advancing. Correct selection followed by `Confirm returned` advances exactly once.
- Pause/Resume: hide cues and block mutation while paused. Resume the exact next part.
- Undo: undo one removal or return, recompute cues.
- Finish: remove active cues and show parts accounted for. `New session` requires confirmation.
- Targets highlight when aimed at. No custom poses or continuous raised arms.
- Voice: out of scope. Mouse-driven SIK input carries the entire preview flow.

## When things show
- Setup instructions disappear when recording starts.
- Expand only the active tray/origin pair. Other wells retain small numbers.
- Pause hides work cues. Resume remains available.
- Errors sit beside the active cue, explain recovery, and preserve data.
- Completion removes route animation and the return button.
- Out of view: small directional hint toward the active pair. Tracking uncertainty must never imply a verified placement.

## Done criteria
Each requires an actual preview observation and LEAF scenario. Pure logic tests alone do not satisfy these.
1. Start, record four removals in distinct wells, and see accurate labels and counts.
2. Enter return mode. The fourth removal's tray and origin highlight together, joined by the return cue.
3. Select a wrong part. Expected label and well appear, progress stays unchanged. Correct selection and confirmation advance once.
4. Pause, resume to the same next return, undo a return, and see the previous pair restored.
5. Return all parts. Completion has no active cue. Confirm restart to get a clean bench.

## Out of scope
- Live vision, automatic identification, torque guidance, repair certification, or verification that a physical part was installed.
- Persistent spatial anchors, remote collaboration, and device validation.
- AI guessing assembly steps. The sequence comes only from the user's own removals.
- Lens login gate. The current session works offline. A companion may handle account-owned saved logs separately.

## Risks and open questions
- Feel unproven: physical tracking, additive readability, comfort, and real repair performance need glasses and users.
- Reverse removal order is a memory aid, not a certified assembly procedure. Some assemblies require a different order.
- Recording friction may outweigh the time saved. This is the main pilot question.
- Demand, pricing, and differentiation remain hypotheses. No customers, pilots, or measured impact are claimed.
- Actual CLAD execution, preview capture, and LEAF results must be recorded after environment setup.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

Implementation defaults: tested pure domain core is the sole sequence authority. UI receives state and emits intents. Plan articulated procedural MeshBuilder geometry through CLAD's mesh skill so enclosure parts remain separate. Generate subtle record/error/return/completion SFX through CLAD. No music. Author semantic scene roots for inspection and editing.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
