# PartCue simulated preview demo

This is a Lens Studio **simulated interaction demo**, not footage from glasses.
The scene permanently displays **SIMULATED BENCH / MANUAL MARKING**. No video has
been recorded by this build pass. The parent operator owns OS recording.

Use the already installed official LEAF panel, execution target Preview, scenario
`partcue-07-demo`, with `__leaf__log_level: ERROR` and `__leaf__timeout_secs: 180`.
It has no assertions and operates actual UIKit/SIK targets; it does not call core
commands or private Main methods. The scenario itself and its run status are not
a substitute for the six assertion scenarios in `leaf-results.md`.

For framing, use official `MovePreviewCamera` to look at `(0,-33,-100)` **after**
LEAF has reset the preview and the bench appears. A camera pose set before the
scenario can be reset by LEAF. The move changes only the viewpoint. Keep the **Preview 2** panel visible and unobstructed. Obtain a
fresh panel rectangle by passing the installed CLAD
`specs-publish/scripts/get-preview-rect.ts` directly as `ExecuteEditorCode.path`.
Panel geometry can change; use the fresh result for the parent's recording.
Start OS recording **before** calling the scenario: LEAF resets the preview at
scenario start. No Lens Studio recording API is claimed.

The choreography sets the bench, records short screw, long screw, lid and inner
module into Wells 1–4, enters return mode, selects the wrong short screw, selects
and confirms the module, pauses/resumes, undoes that return, returns all four in
reverse order, shows completion, and confirms a new session. The actual rehearsal passed in 77.839 seconds, under three minutes. Caption-only layout and floor-seam polish followed the rehearsal; the action
script is unchanged. Included pauses expose the moving paired cue and feedback.

The contribution being demonstrated is the paired world-attached pickup/origin
cue. Reverse-order teardown journals are not claimed as novel. The parts are
original generic demonstration geometry, not a manufacturer's repair procedure.

At log level ERROR, LEAF can still display its final green PASSED status overlay.
The parent may end footage before terminal status or retain that honest internal
test overlay; changing log level does not claim to hide it.

For a fully manual alternative that avoids LEAF reset/status overlays: refresh the
preview first, reset the camera and look at `(0,-33,-100)`, then use real
PreviewInteract pinches: PrimaryAction twice; for each i=0..3, SelectParti →
SelectWelli → PrimaryAction; ReturnParts; PickupPart0 (wrong); PickupPart3 →
PrimaryAction; PauseResume twice; UndoAction; then PickupPart3/2/1/0 each followed
by PrimaryAction; RestartSession twice. Insert400–600ms settling waits when a
contextual control appears. These are scene target names, not private methods.
The complete LEAF version has the measured77.839 s rehearsal; no duration is
claimed for an unrecorded manual take.
