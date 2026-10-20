# PartCue demo — exact guide script and capture alignment

**Final — 20 October 2026:** [the public demo](https://www.youtube.com/watch?v=Z9rPXUwUdnw) is complete. The local master is exactly **2:32 (152 seconds), 1920×1080, 30 fps**, with source SFX, a generic synthetic guide and 31 caption cues. The workflow uses four authored parts, predefined origins and actual SIK input replay. The complete workflow was recorded after the final selection guard; all 34 software checks and seven Lens scenarios pass.

The narrator is a generic synthetic guide, not Shivam's voice. Keep **AI guide narration · synthetic** visible for that edition. Shivam may also read this exact third-person script. Preserve **Actual Lens Studio preview · Simulated bench · Manual marking** and show **Four authored parts · predefined origins · SIK replay** clearly at least once. No automatic recognition, arbitrary teardown recording, physical-glasses validation, or repair verification is claimed.

## Optional human-recorded intro — Shivam only

Use this as an alternative to the synthetic intro **only when Shivam records it himself**. Label that edition as Shivam's voiceover. Keep the synthetic guide edition and its nine canonical segments unchanged.

> I'm Shivam Gupta. Two similar screws. Two different homes. After an interruption, which loose part belongs where? I created PartCue with AI assistance to help you retrace your own teardown. Every part has a way home.

The human version needs a fresh timing pass; its length will differ from the synthetic intro. The remaining wording below can be read verbatim, preserving the preview and hardware limitations.

## Exact nine-segment spoken copy

Total unpadded speech: **107.064s**. These nine verified chunks are placed in the completed soundtrack using [narration-schedule.json](../demo/narration-schedule.json). Only engine input expands `PartCue` to `Part Cue`; the official transcript below preserves the brand.

### 1. Intro · 17.950s

Two similar screws. Two different homes. After an interruption, which loose part belongs where? PartCue is spatial memory for your own teardown, created by Shivam Gupta with AI assistance. Every part has a way home.

### 2. Setup · 9.045s

This is the actual Lens Studio preview. The bench is simulated, and every mark is manual. First, place the workspace.

### 3. Record · 10.531s

Select a part, choose an empty tray well, and record its removal. Each record connects an origin to a tray location. Repeat for the remaining parts.

### 4. Pair · 4.598s

Amber is pickup. Cyan is origin. Follow the path.

### 5. Wrong · 4.267s

A wrong part stays blocked. Confirm the expected part.

### 6. Pause · 9.045s

Pause hides the cues. Resume restores the same next part. Undo brings back the previous return when a correction is needed.

### 7. Complete · 9.718s

Confirm the remaining returns, and the active cues clear. This accounts for user confirmations. It does not inspect a physical installation.

### 8. Spatial · 10.345s

Here, the viewpoint moves without replacing the bench. Both cues stay at their saved locations. Confirming the return advances to the next pair.

### 9. Closing · 31.564s

Thirty-four software checks pass, alongside Lens preview scenarios. Physical glasses and repair benefits still need testing. The first customer hypothesis is repair and training benches. Twenty dollars per bench per month is a pricing hypothesis. A pilot must compare total task time against mats, photos and a plain reverse checklist, including recording time. PartCue helps you find your own way back.

## Final video timeline

| Edited time | Actual footage and narration |
| --- | --- |
| 0:00–0:28 | Visibly labeled replay of a calm active pair. Intro begins at 0:00.6; preview explanation at 0:19. |
| 0:28–1:39 | Full continuous final Lens workflow, source 0–71 seconds, at native speed. Includes placement, all four removals, wrong selection, correction, pause/resume, undo, completion and confirmed restart. |
| 1:39–2:00 | Separate continuous viewpoint check, spatial source 123–144 seconds. Camera moves, saved endpoints remain fixed, and confirming Lid advances to Long screw. Narration begins at 1:40.5. |
| 2:00–2:32 | Visibly labeled replay of the calm bench. Validation, customer/pricing hypothesis and comparative pilot; closing voice begins at 2:00.1. |

Narration starts within the continuous workflow: record **0:35**, paired cues **0:52.2**, wrong pick **0:57.2**, interruption/recovery **1:05.5**, and completion **1:23.95**. Completion narration begins during the last returns, so the complete 9.718-second explanation is finished before the restart flow advances.

## Final native workflow anchors

These times refer to `demo/raw/partcue-workflow-final.mp4`, the 114.165-second native recording from public product commit `a6c74c7`. Add 28 seconds for the main workflow's position in the final video.

| Native source time | Visible evidence |
| --- | --- |
| 5.667s | Bench placed. |
| 7.398s | Start teardown. |
| 11.098 / 14.833 / 18.567 / 22.298s | Four part removals recorded into distinct wells. |
| 24.033s | Inner module becomes the active pickup/origin pair, 0/4. |
| 29.167s | Wrong selection stays blocked; correct selection is required. |
| 32.298 / 34.732s | Expected module selected, then confirmation advances to Lid, 1/4. |
| 37.867 / 40.567s | Pause hides cues; resume restores Lid. |
| 42.798 / 47.532s | Undo restores module; selecting and confirming it advances once again. |
| 51.932 / 56.332s | Lid, then Long screw confirmed. |
| 60.767s | Four user-confirmed returns; active cues clear. |
| 66.098 / 68.098s | Restart prompt, then confirmed reset to setup. |

The [capture provenance](../demo/capture-provenance.json), [edit plan](../demo/partcue-edit-plan.json) and [render verification](../demo/partcue-demo.edit.json) preserve the selected source ranges and hashes. The separate spatial recording predates the final selection guard; its geometry and demonstrated spatial path are unchanged. No speed changes, generated product footage or hidden cuts occur within either evidence flow.

## Delivery and optional human voiceover

The published edition labels synthetic narration permanently. Captions are burned into the sidebar; the timed SRT is also supplied. Full video decode, dimensions, duration, source hashes, waveform bounds and key visual/action alignment were checked. Those checks do not substitute for a human listening review of narration quality.

To replace the guide with your own voice, read the optional first-person intro and the remaining nine-section copy verbatim, leaving the indicated gaps. Keep the disclosure and footage intact, then check the replacement voice against the timeline before republishing. The current public demo is already usable without that replacement.

Shivam must review eligibility and complete the final Devpost Submit action himself; the preparation and published demo do not imply that the prize entry has been submitted.
