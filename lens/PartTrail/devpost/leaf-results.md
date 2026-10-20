# PartCue — final LEAF preview results

Observed 2026-10-20 in Lens Studio 5.24.1, SPECS 27 stereo Interactive Preview (Plane), current native title Preview 2. Actual official run_leaf_scenario calls returned succeeded for all six final tests after the caption-only polish. The unchanged demo action script previously succeeded in its 77.839 s rehearsal before that caption-only polish. No device execution or physical direct-reach claim. Internal PartTrail prefixes and scenario IDs retain their stable references.

Final geometry precedence: the subsequent floor only inset was verified by clean official compilation/runtime initialization and reruns of scenarios 02 and 06 only; both passed. The table uses those newest post-inset results for 02/06. Results 01/03/04/05 remain the complete suite after final caption layout, before the floor inset; the inset changed no actions, layout, roots, colliders or core. No claim is made that all six were rerun after the floor inset.

| Scenario | Official result | Lens duration | Observed coverage |
| --- | --- | --- | --- |
| parttrail-01-record-four | succeeded | 13.803 s | Start, four distinct wells, labels/count deltas, permanent simulation label; progressive selector visibility and Change marking recovery |
| parttrail-02-active-pair-animation | succeeded | 14.896 s | Fourth removal pair active together, return path geometry, marker position changes across 400 ms |
| parttrail-03-wrong-part-count-confirm | succeeded | 20.504 s | Actual wrong tray pickup and missing selection preserve session; count 2 rejected; explicit correct selection/count advances once; double confirmation guarded |
| parttrail-04-pause-resume-undo | succeeded | 17.914 s | Pause hides cues, selectors and pickup targets, exposes only Resume; resume same pair; undo restores previous pair |
| parttrail-05-complete-confirm-restart | succeeded | 20.491 s | Reverse all four through actual tray targets; completion clears cues; first restart preserves state and exposes Keep session; second resets |
| parttrail-06-ik-toolbar-selection | succeeded | 23.047 s | Full IK actual tray PickupPart3 selection then PrimaryAction confirmation; no fallback; far-field routing |
| partcue-07-demo | succeeded | 77.839 s | No-assertion simulated real-SIK choreography: setup, four records, wrong pickup, correct return, pause/resume, undo, completion, confirmed restart |

All test actions trigger real UIKit Button SIK Interactables or the real PickupPart0..3 tray selection volumes. Session state is read through public getSnapshot(); tests never invoke core commands or private Main intents. Numeric assertions compare deltas. The demo contains no assertions and is a reproducible interaction choreography, not a recorded video. Its elapsed time above comes from the actual Lens scenario manager.

## Exact final Lens-side evidence

```text
I 16:15:32.898 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Packages/Leaf.lspkg/Utils/common/Logger.ts:89] I [DefaultLeafScenarioManager] [ 13.803 s]PASSED: parttrail-01-record-four
I 16:22:19.283 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Packages/Leaf.lspkg/Utils/common/Logger.ts:89] I [DefaultLeafScenarioManager] [ 14.896 s]PASSED: parttrail-02-active-pair-animation
I 16:16:18.506 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Packages/Leaf.lspkg/Utils/common/Logger.ts:89] I [DefaultLeafScenarioManager] [ 20.504 s]PASSED: parttrail-03-wrong-part-count-confirm
I 16:16:48.941 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Packages/Leaf.lspkg/Utils/common/Logger.ts:89] I [DefaultLeafScenarioManager] [ 17.914 s]PASSED: parttrail-04-pause-resume-undo
I 16:17:13.041 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Packages/Leaf.lspkg/Utils/common/Logger.ts:89] I [DefaultLeafScenarioManager] [ 20.491 s]PASSED: parttrail-05-complete-confirm-restart
I 16:22:47.372 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Packages/Leaf.lspkg/Utils/common/Logger.ts:89] I [DefaultLeafScenarioManager] [ 23.047 s]PASSED: parttrail-06-ik-toolbar-selection
I 16:10:42.486 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Packages/Leaf.lspkg/Utils/common/Logger.ts:89] I [DefaultLeafScenarioManager] [ 77.839 s]PASSED: partcue-07-demo
I 16:22:39.511 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Assets/Scripts/PartTrailLeafIKScenario.ts:14] [PartCue IK routing] PickupPart3 = far-field ray
I 16:22:44.767 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Assets/Scripts/PartTrailLeafIKScenario.ts:14] [PartCue IK routing] PrimaryAction = far-field ray
```

The final IK run used diagnostic policy fail-fast and createIKInteractor body fallback explicitly undefined. PickupPart3 and PrimaryAction both routed through far-field rays; the real IK ray converged, selected the module and confirmed one return. This verifies indirect pickup/confirm operation in preview. Direct arm reach, real tracking, comfort, and additive-display readability on glasses remain unproven.

## Failures and fixes, chronologically

1. Original PartTrail layout: all six earlier scenarios passed at 15:36–15:37. Those earlier results remain historical; the table above supersedes them for final PartCue.
2. During the PartCue redesign, scenario03 timed out after 120 s with setup/session menu open. The toolbar destroyed its clicked ContextActions tree after 40 ms, before LEAF completed target hover release. Product fix: retain the old tree until four UpdateEvent ticks have elapsed after the latest view signature change, then rebuild. Tests and LEAF package were not altered to bypass this. Diagnostic03 passed, then all five functional scenarios passed.
3. Actual tray IK initially failed to converge on PickupPart3. The lower hand ray could be blocked by a front-row selection volume although camera/mouse targeting worked. Product fix: preserve nonoverlapping 6 x 6 cm well footprints, use front-row height 2.4 cm at y3.2 and back-row height 6 cm at y6.4, based on the actual saved well row. Part mesh positions and all core coordinates/semantics stayed unchanged. Diagnostic IK passed with no fallback; all six final tests were then rerun and passed.
4. Final scenario05 experienced a bridge dispatch delay: the plugin reported Running while no Lens-side RUNS line had yet appeared. The same official call subsequently returned succeeded with the actual 22.039 s Lens run. No retry or product edit was needed.

Exact earlier failure lines:

```text
I 15:57:05.572 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Packages/Leaf.lspkg/Utils/common/Logger.ts:89] E [DefaultLeafScenarioManager] [120.013 s]FAILED: parttrail-03-wrong-part-count-confirm - Error: Scenario "parttrail-03-wrong-part-count-confirm" timed out after 120 s
I 16:01:45.254 StudioPlugins/GUI/Preview/Impl/Src/Worker/PreviewWorker.cpp:835 (@Es::Preview::PreviewWorker #16) Es::Preview::PreviewWorker::onSceneCreated(const std::shared_ptr &)::(anonymous class)::operator()] [Preview 2] [Packages/Leaf.lspkg/Utils/common/Logger.ts:89] E [DefaultLeafScenarioManager] [ 22.086 s]FAILED: parttrail-06-ik-toolbar-selection - Error: [IK right] ray failed to converge on "PickupPart3"
```

5. Final caption-only polish: origin caption root moved to local (-12,-1,12), pickup caption root to (14,-1,12), clearing the halos/path. Text, actions, core and colliders were unchanged. Official compile and runtime initialization passed; all six assertion scenarios were then rerun and passed. The demo was not rerun because its action script was unchanged. Final environment readback: SPECS 27 Interactive, source /Applications/Lens Studio.app/Contents/Resources/InteractiveResources.bundle/Scenes/Plane.

6. Final floor only inset: enclosure floor half extents changed from (11,0.45,8) to (10,0.45,7); tray floor from (9,0.4,9) to (8.6,0.4,8.6). This fits the floors within their existing walls/rims to remove the identified coplanar outer-face overlap. Outer bounds stay 22 x 16 x 6 cm / 18 x 18 cm. Official compilation and runtime initialization succeeded; post-inset scenarios02 and06 passed. The earlier full caption-layout suite and demo remain identified by their actual test stage. Nonfatal depth-format fallback and SceneMaterialBatcher parameter warnings remain external rendering observations.

## Tool actions and preserved limits

- Added/updated nine Assets/Scripts/PartTrailLeaf*.ts files through ExecuteEditorCode and public LensStudio:FileSystem. The same official path applied the four-frame UIKit rebuild and row-aware selection volume fixes. RecompileTypeScriptTool returned succeeded after each product mutation.
- Authored PartTrailLeafIndex root remains attached through VirtualScene; LEAF panel discovered seven registered scenarios. Execute on device remained false. All runs were serial. Functional tests used 120 s timeout; demo used 180 s.
- Official compile + runtime refresh after fixes produced initialization logs. Nonfatal graphics warnings observed during this session: depth format fallback to Depth32FloatStencil8, and some SceneMaterialBatcher visuals staying unbatched after retries. No JS runtime exception was present in the final suite evidence.
- Scenario05 checks Keep session visibility but does not tap it; a separate actual-control manual observation after the final floor inset used SessionMenu → RestartSession → CancelRestart and preserved Return Lid, 1 / 4 returned and the same next pair. See attachment-evidence.json. The parent separately observed Undo removal manually after the first removal at 10:41 UTC, restoring 0 / 4 recorded; LEAF04 covers undo return.
- Saved actual project with verified model.project.save(). No auth calls, credentials changes, restricted-resource workaround, publish, push or external messages.

Log source: /Users/shivamgupta/Library/Preferences/Snap/Lens Studio/logs/LensStudioLog-2026-10-20-14-54-51-152-c64b4.txt
