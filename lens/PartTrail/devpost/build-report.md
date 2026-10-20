# PartCue — Every part has a way home.

Real SPECS Lens built, saved, compiled and inspected after the design judge review on 2026-10-20. Final results below are actual observations. Historical captures 01–10, `captures/partcue-label-review/` and `captures/partcue-before-seam-polish/` show superseded compositions; `build-report-baseline.md` preserves the pre-review report.


## Final observed verification and captures

Final compilation succeeded after the floor inset. A fresh official runtime reset at16:23:36 local time initialized the procedural bench and PartCue Main successfully; only the documented depth-format fallback and batch-parameter warning appeared. The final manual-session log tail reported `errors: []`; no JS exception was observed.

All five done criteria and IK passed in the complete suite after final caption layout. The subsequent floor only seam fix changed no actions/layout/roots/colliders/core; affected cue-animation02 and IK06 were rerun and passed afterward. See [exact LEAF evidence](leaf-results.md) for stage precedence, durations and initial failures. No core/browser test is substituted for LEAF.

Actual final continuous sequence, with no reset or bench replacement betweenA/B/C:

- A (20261020T105432Z): camera(0,0,0), looking at(0,-33,-100), Inner module/Well4 active, 0/4 returned. [CaptureA](captures/partcue-final/01-return-module-20261020T105432Z.png).
- B (20261020T105441Z): camera moved to(14,-6,6) and looked at the same bench. [CaptureB](captures/partcue-final/02-return-module-moved-20261020T105441Z.png). Work root stayed(0,-40,-100), cyan halo(-15,-33,-101), amber halo(18.2,-34,-104.300003). Measured root/origin/pickup drift: **0 cm** each.
- Same runtime marker moved from(-2.798131,-28.794325,-102.212837) to(-12.858009,-32.057999,-101.212906): **10.62321 cm**, independently of the viewpoint change. Ring positions remained fixed.
- C (20261020T105459Z): actual PickupPart3 pinch followed by PrimaryAction confirmed once, producing Return Lid, 1/4 returned and amber halo at(9.8,-34,-104.300003). [Next-pair capture](captures/partcue-final/03-next-lid-20261020T105459Z.png). The cyan halo stays above the shared lid/module footprint; its stem represents the active part's recorded height.
- Then Session→New session→Keep session preserved Return Lid, 1/4 and the same next pair. This was observed through real controls, not prefilled into test results.
- Earlier real-control Undo removal after the first record restored0/4 removals. LEAF04 separately proves undo return.

The actual final images were opened and reviewed: the bench and paired cue dominate the central view; top surfaces and all four parts are visible; captions clear both halos/path; the old large selector grids are absent in return; one Confirm button dominates. Side-view tray seam speckling disappeared after insetting the overlapping floor faces. Permanent simulation/manual marking text remains readable. Final screenshots have no LEAF result banner.

Raw timestamped tool results, runtime IDs, camera moves and computed deltas: [attachment-evidence.json](attachment-evidence.json). Actual bounds: [runtime-bounds.json](runtime-bounds.json), enclosure 22×6×16 cm(x/y/z), tray 18×1.900002×18 cm. Public package archives and their metadata are included under Packages/; every script/icon/WAV metadata check and final core byte-parity check passed.

Final official project save/read: **2026-10-20T10:55:37.116Z**, exact requested PartTrail.esproj, lensNamePartCue, typed Spectacles=true. Fresh documented preview rectangle at10:55:37 UTC: `{x:658,y:159,width:605,height:690}`. A fresh read-only CoreGraphics check again found display 1(0,0,1512,982); the panel is fully contained (right1263,bottom849). Parent should re-query before OS recording. No video was created; the no-assertion demo's actual rehearsal was77.839 s.

Self-caused limitations remaining: **none identified in the completed preview pass**. External limitations remain the documented host rendering warnings and untested physical-device/user feel. No authorization failure occurred in the public packages or local tools used for this run.


## Scope and provenance

- Real project: `lens/PartTrail/PartTrail.esproj`, opened at `/Users/shivamgupta/Documents/Codex/2026-10-20/i-am-participating-in-a-hackathon-3/outputs/parttrail/lens/PartTrail/PartTrail.esproj`.
- Visible product: **PartCue — Every part has a way home.** Internal PartTrail filenames/UUIDs are intentionally preserved.
- Lens Studio 5.24.1.26100516 Public, target Spectacles. Official `ExecuteEditorCode` verified both exact projectFile and `targetPlatform === Editor.TargetPlatform.Spectacles`.
- Followed installed `ls-clad/agents/specs-experience-builder.md` **standalone**, with `specs-project-init` self-gate. No router or account gate was used. No account authorization is asserted.
- Followed the approved-by-delegation `devpost/design-brief.md`. No human interview is claimed.
- No publishing, legal acceptance, credential/security changes, messages to others, Git commits, or pushes.
- The browser companion is separate. No web/server modules were imported into the Lens.

## Official tool actions

1. `ListAllPanels`; `VirtualScene(read)` confirmed live MCP and a loaded Default scene; checked the nonempty `.virtual-scene.json`.
2. `PreviewPanelTool(listSources)` discovered the shipped Sunlit Room directory. `setConfig` selected **stereo / SPECS 27 / Interactive**; `getConfig` verified it.
3. `ListInstalledPackagesTool`, `SearchLensStudioAssetLibrary`, and `InstallLensStudioPackage` installed public **SpectaclesInteractionKit 2.0.0** and **SpectaclesUIKit 2.0.0**. The runtime SIK configuration banner says 0.18.0; this is the package's internal banner, distinct from its distribution version.
4. `VirtualScene(apply)` reset Camera Object to `(0,0,0)` and added DeviceTracking World. The camera was already Perspective. A clean preview capture showed only Sunlit Room; no existing content was disabled.
5. The documented SIK asset path did not resolve because the package is registered under `Packages/`. Snapshot/asset discovery found prefab UUID `f99407ce-416a-43f3-baf8-668a42712de9`; a corrected `VirtualScene(apply)` instantiated it successfully at scene root.
6. `InstallLensStudioPackage` imported the skill-bundled local `SimpleVertexBaseColor.lspkg`; material UUID `70d03593-c7b4-410a-ae5c-75cb82ee32dc` was wired through VirtualScene. No hand-written material YAML.
7. `IconSelector(name)` imported six Material Symbols with default appearance; all are real 512×512 PNGs with metadata.
8. Optional `FontSelector(family: Inter)` failed with `No Text or Text3D components are currently selected. Select a text object first or provide a sceneObjectId.` A documented target retry failed with `SceneObject '00000000-0000-0065-0000-000000000064' has no Text or Text3D components.` UIKit built-in typography is retained. No font asset is claimed.
9. Authored local MeshBuilder scripts using `build-mesh backend=meshbuilder` → `mesh-builder-scripting`, UIKit using `specs-build-ui`, and local feedback through `build-sfx`. The build selected these local backends under delegated implementation decisions; no cloud generation was attempted.
10. Lens Studio's file watcher imported the authored Assets files, generated `.meta` files, and `asset-graphql` confirmed registration. Generated SFX are valid 44.1 kHz PCM WAVs. The generator uses CommonJS `.cjs` because the parent repo declares ES modules.
11. Bootstrap Phase A: `VirtualScene(apply)` created PartTrail, its semantic roots and bare ScriptComponents. `RecompileTypeScriptTool`; Phase B `VirtualScene(apply)` wired component/object/material references using `@component` references. Both applies returned no errors. Later authored preview-tools and direction-hint roots were added through the same VirtualScene surface.
12. Installed public **Leaf 2.0.2**, plus its automatic Bitmoji 3D dependency. Installed public **AiPreviewAgentInspect 2.0.2** and **AiPreviewAgentInteract 2.0.1**, and attached both agent scripts to PartTrailPreviewTools for runtime inspection/interactions.
13. Used `RecompileTypeScriptTool`, `RunAndCollectLogsTool`, `QueryRuntimeSceneTool`, `PreviewInteractTool`, `MovePreviewCamera`, `CapturePanelScreenshotTool`, and `CaptureRuntimeViewTool` for actual runtime validation. No raw HTTP calls to Lens Studio, authentication tools, or auth polling.

## Architecture and asset manifest

Tier: **interactive**.

| Script | Ownership |
|---|---|
| `Assets/Scripts/PartTrailCore.ts` | Exact byte-for-byte copy of `../../core/index.ts`; pure sequence authority and portable JSON serialization |
| `PartTrailMain.ts` | Converts UI intents into core commands with explicit monotonic epoch timestamps; updates views/geometry/audio |
| `PartTrailBenchUI.ts` | All UI surfaces, real UIKit BackPlate/Button/ElementContent/FlexLayout/FlexItem; passive view plus Event intents |
| `PartTrailBenchController.ts` | Original enclosure/tray/independent part geometry, motion, one active pair and animated route |
| `PartTrailGeometry.ts` | MeshBuilder closed boxes, smooth lathe solids, torus rings; CCW geometry with per-face/per-profile normals |
| `PartTrailAudioController.ts` | Four low-latency feedback channels, initialized from OnStart; no music or mic |
| `PartTrailSceneContracts.ts` | Stable dimensions, part/well definitions, view contract and manifest |
| `PartTrailLeaf*.ts` | Additive live LEAF scenarios, driver and scenario index |

Core SHA-256 (both copies): `1b03613333a739d086c9188c99a8aef77b06ed8b7484a5c95c2724eed1062f57`. No boundary changes were needed: JSON helpers contain no browser constructs. The domain command results remain unchanged, including rejection returning the original state.

| Manifest category | Actual output and wiring |
|---|---|
| Meshes | Runtime `EnclosureShellMesh`, `FourWellTrayMesh`, `ShortScrewMesh`, `LongScrewMesh`, `ServiceLidMesh`, `InnerModuleMesh`, `ActiveOriginRing`, `ActivePickupRing`, `ActiveReturnPath`, direction arrowheads and location stems |
| Mesh backend | All deliberately **code-authored MeshBuilder**, first-class articulated backend selected by the build under delegated decisions. No GLBs or AI-generated meshes are claimed |
| SFX | `Assets/GeneratedSFX/PartTrailRecord.wav` (0.080 s mono), `PartTrailError.wav` (0.450 s mono), `PartTrailReturn.wav` (0.120 s mono), `PartTrailComplete.wav` (1.778 s stereo); all 44,100 Hz, played on corresponding successful record/error/return/completion |
| Icons | `Assets/Icons/check_circle.png`, `radio_button_checked.png`, `pause.png`, `play_arrow.png`, `undo.png`, `restart_alt.png`; used by real UIKit controls |
| UI module | `Assets/Scripts/PartTrailBenchUI.ts`; task card, part selectors, well selectors, toolbar, two cue labels, conditional direction hint |
| Local generator | `Assets/BuildTools/gen_sfx_parttrail.cjs`, uses installed skill's algorithmic presets; no samples/music |
| Material | Local skill-packaged vertexBaseColorMaterial; actual shader asset imported with it |
| Scene | Actual saved `Assets/Scene.scene`, with generated scene metadata; no fabricated scaffold |

Semantic authored hierarchy: PartTrail → PartTrailWorkRoot → PartTrailBench (MechanicalEnclosure, FourWellTray, ShortScrew, LongScrew, ServiceLid, InnerModule, ActiveCuePair); PartTrailView and independent TaskCard / PartSelectors / TraySelectors / BenchToolbar / ActiveOriginLabel / ActivePickupLabel. PartTrailDirectionHint is a conditional camera-relative hint; PartTrailPreviewTools and PartTrailLeafIndex are additive test infrastructure. SIK is a separate scene root.

## Design/rebrand pass

The parent review identified an independently maintained non-AR teardown journal named PartTrail at https://github.com/KanadeK/parttrail. No code was copied. Reverse-order journals are not claimed as novel: the demonstrated contribution is simultaneously paired world-attached tray/origin guidance. Product/design/implementation decisions were delegated; no human interview is claimed.

Official editor save/read at **2026-10-20T10:29:58.634Z** verified the exact requested PartTrail.esproj path, `metaInfo.lensName === "PartCue"` and typed Spectacles target comparison. All visible Lens branding/task titles use PartCue; source prefixes and asset UUIDs remain stable. Metadata changes use public `project.metaInfo` copy/assign and `project.save()`.

The work root is manually set **100 cm forward and 40 cm below** initial eye level. The original 25 cm default was lowered under delegated judge-review choices to expose top surfaces. The enclosure remains **22×16×6 cm** at x−12; the four-well tray remains **18×18 cm** at x14, with an approximately 48 cm main work zone. Independent original short/long screws, lid and module move into saved wells and back. First recording locks placement. Coordinates are centimeters in the manually placed bench frame; no persistent anchors are claimed.

The original battery-free mechanical enclosure is demonstration geometry, not a manufacturer's procedure. The 7.2 cm lid fits a tray well; screws rotate to lie in the tray. Geometry remains deliberately selected local MeshBuilder throughout. Parts, cyan/amber rings, stems, route and three moving cone arrowheads are articulated/runtime-generated, not fabricated external assets.

**Recording** progressively reveals part → empty well → Record removal, with Change marking recovery and occupied well choices removed. **Return** hides both selector grids and shows one dominant Confirm returned, Pause, Undo when available, and a small Session control. Quantity inspection and restart live in the menu; Keep session exists only during confirmation. **Paused** hides cues and selections, leaving Resume. **Complete** clears the route and offers a confirmable new session. Every surface uses the existing real UIKit module and event intents; no hand-rolled replacement was introduced.

Tray selection now uses actual well-associated SIK targets; hover highlights the corresponding physical part. Nonoverlapping footprints are **6×6 cm**. Front-row selection boxes are6×2.4×6 cm centered at local y3.2; back-row boxes are6×6×6 cm centered at y6.4 to keep the lower hand ray above front-row targets. The target assignment follows the recorded well z, including swapped mappings. Saved core points and mesh positions are unchanged. Selection emits the same Main/core intent and never counts as return. Correct selection plus explicit count confirmation is required; wrong part/count preserves state.

Exactly one cyan origin ring and one amber pickup ring appear during return, each with text; pickup includes the well number. Final endpoint captions sit below the device/tray front edges so their glyphs do not intersect the halos or animated route. Rings are3 cm radius with0.22 cm tube thickness, lifted above geometry with stems to exact saved positions. One arched path and three moving arrowheads indicate pickup→origin. The permanent cyan **SIMULATED BENCH / MANUAL MARKING** label and white text do not rely on black backing.

Official PreviewPanelTool selected **stereo / SPECS27 / Interactive**, now using the discovered shipped **Plane** environment rather than Sunlit Room. A downward view toward `(0,-33,-100)` reveals bench top surfaces. Public IDockManager.write/read plus LensStudio:Serialization.Yaml widened the existing dock splitter `[177,427,202,201]`→`[140,160,100,607]`, preserving panel UUIDs/tabs. Native panel title is **Preview2** (spelled `Preview 2` in tools). Runtime capture size is1571×1590 before optional downscale.

## Optional SFX regeneration portability

`Assets/BuildTools/gen_sfx_parttrail.cjs` now requires the absolute directory supplied by **CLAD_SFX_TOOLS**, documented in `Assets/BuildTools/README.md`. It no longer contains a hardcoded `/Users/` plugin require path. The four included WAVs are sufficient to open, compile, test and run the Lens; regeneration is not a build step.

Observed checks: `node --check` exited0; invocation without CLAD_SFX_TOOLS exited1 with the documented optional-regeneration message before touching output files; all four WAV SHA-256 values remained unchanged. No sounds were regenerated during this pass.

## Failures found and fixed

- Initial UIKit near-field interaction-plane overlap was fixed with public nearFieldDepth3 and physicalZoneDepth1; no package edits. FlexLayout uses explicit item registration and autoDiscoverItemsOnStart=false.
- The first design-pass scenario03 timed out at120 s after opening Session. The toolbar's40 ms destroy/rebuild removed the SIK target before release/hover-exit finished. Product UI now defers replacement for four UpdateEvent ticks; the unchanged diagnostic scenario03 passed afterward.
- Initial final IK06 failed at16:01:45.254 with `[IK right] ray failed to converge on "PickupPart3"`. DefaultLeaf and a fresh official PreviewInteract pinch worked, but the failure was consistent with the IK hand's lower ray being occluded by aligned tray rows. Raised back-row selection volumes fixed the product sightline; unchanged fail-fast/no-fallback IK06 diagnostic then succeeded. Final six-scenario rerun follows the geometry fix.
- Actual post-test captures exposed a pickup caption intersecting the amber halo. The UIKit caption roots were moved into a clear row below the device/tray front edges; all six tests were repeated successfully after that polish; final screenshots show clear captions.
- Final side captures exposed coplanar floor/wall outer-face overlap. Enclosure/tray floors were inset within their existing walls/rims, preserving all outer dimensions and interaction geometry. Official compile/runtime and affected cue-animation/IK reruns passed; final images show the seam flicker removed.
- A CUA coordinate drag returned `Computer Use server error -10005: noWindowsAvailable`; public dock API was used instead, with no OS automation workaround.
- Optional FontSelector retries failed because no Text/Text3D target was selected and the supplied target had no Text component. UIKit's included font is retained; no imported font asset is claimed.
- Author-time GetBoundingBox could not compute bounds for runtime MeshBuilder content, including an authored-root retry. Supported QueryRuntimeSceneTool runtime bounds were used instead.

## Verification limits

Core remains byte-identical to ../../core/index.ts, with SHA-256 above. All 16 TypeScript scripts, six PNGs and four WAVs have metadata; the actual saved scene and scene metadata exist. RequireAsset paths resolve. No orphan icon or missing declared mesh/SFX/UI module remains. No browser/server imports or hand-rolled panels/buttons exist. All scene writes were through VirtualScene; metadata/save and file authoring used official editor tooling.

The host renderer reports Depth24UnormStencil8→Depth32FloatStencil8 fallback. Some SIK glow/cursor/direction-hint visuals exhaust batching retries and remain unbatched. A warning-free host is not claimed. Final compilation/runtime and LEAF evidence are recorded separately below.

**Logic proven** means only actual Lens preview behavior and LEAF assertions. **Feel unproven**: physical hand tracking, sustained comfort/additive readability, real bench registration, actual installation and practical repair benefit require hardware/users. No device run, camera recognition, automatic placement verification, persistent anchors, manufacturer repair procedure, live sensors/API keys or account resources are claimed. Stills do not prove hardware audio audibility.

## Recording preparation

Only capture mechanics from specs-publish/references/preview-video-capture.md were used; no publishing was invoked. The parent owns OS recording. `partcue-07-demo` is a real-interaction, no-assertion LEAF choreography; see `demo-choreography.md`. It does not substitute for the six assertion tests. No video is claimed.

The documented installed get-preview-rect.ts was executed by ExecuteEditorCode.path; final fresh result at **2026-10-20 10:55:37 UTC**: `{x:658,y:159,width:605,height:690}`. Read-only CoreGraphics enumeration found display 1 bounds `{x:0,y:0,width:1512,height:982}`. Panel extents x658..1263/y159..849 are fully contained. Re-query immediately before parent recording because layout changes invalidate this measurement.

## Machine-readable build summary

```yaml
tier: interactive
asset_manifest:
  meshes: ["EnclosureShellMesh", "FourWellTrayMesh", "ShortScrewMesh", "LongScrewMesh", "ServiceLidMesh", "InnerModuleMesh", "ActiveOriginRing", "ActivePickupRing", "ActiveReturnPath", "CueLocationStems", "DirectionArrowHead"]
  sfx: ["PartTrailComplete.wav", "PartTrailError.wav", "PartTrailRecord.wav", "PartTrailReturn.wav"]
  music: []
  icons: ["check_circle.png", "pause.png", "play_arrow.png", "radio_button_checked.png", "restart_alt.png", "undo.png"]
  ui_modules: ["PartTrailBenchUI.ts"]
  scripts: ["PartTrailAudioController.ts", "PartTrailBenchController.ts", "PartTrailBenchUI.ts", "PartTrailCore.ts", "PartTrailGeometry.ts", "PartTrailLeafCompleteScenario.ts", "PartTrailLeafCueScenario.ts", "PartTrailLeafDemoScenario.ts", "PartTrailLeafGuardScenario.ts", "PartTrailLeafIKScenario.ts", "PartTrailLeafIndex.ts", "PartTrailLeafInteractor.ts", "PartTrailLeafPauseUndoScenario.ts", "PartTrailLeafRecordScenario.ts", "PartTrailMain.ts", "PartTrailSceneContracts.ts"]
mesh_backend: meshbuilder
backend_deviations:
  - mesh: EnclosureShellMesh
    backend: meshbuilder
    reason: Build-selected local parametric geometry under delegated decisions; declared before authoring.
  - mesh: FourWellTrayMesh
    backend: meshbuilder
    reason: Build-selected local parametric geometry under delegated decisions; declared before authoring.
spatial_layout: |
  Manual world-attached work root 100 cm ahead and 40 cm below initial eye level.
  Enclosure 22x16x6 cm at x=-12; four-well tray 18x18 cm at x=14.
  One cyan origin/amber pickup pair with stems and animated directional route.
  Real UIKit phase-specific UI with 6 cm-high buttons, plus SIK tray selection volumes.
  Endpoint captions below front edges; permanent simulation/manual-marking label above bench.
```

## Final project manifest name

Official model.project.saveTo saved `PartCue.esproj` at 2026-10-20T11:01:53.440Z. The Spectacles target and PartCue lensName were read back, all 635 asset UUIDs and the scene UUID were preserved, and compilation passed. Earlier chronological observations refer to its prior filename. Stable script prefixes and file UUIDs are unchanged. The superseded manifest is archived outside the release repository.
