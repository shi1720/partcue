# Third-party work

All PartCue product code is new work started 20 October 2026 for Learn AR with SPECS. Creator and product owner: Shivam Gupta. Implementation uses AI coding assistance. Do not imply unperformed manual tweaks, interviews, trials, or paid adoption.

- Devpost Learn skill source is included in `tools/devpost-learn-source/`, from [challengepost/learn-specs](https://github.com/challengepost/learn-specs), revision `5d8bc0800346d38e468c29b15afcb7ca92280005`, under its included MIT license. Its role is planning guidance, not pre-existing PartCue product code.
- Snap CLAD plugin was installed from [lens-studio-devs/ls-extensions](https://github.com/lens-studio-devs/ls-extensions), revision `8adedd5d5b93f9dbe55f31c6be4264a4f8a608b3`. Source notices identify Apache-2.0. The plugin is an external build tool and is not vendored here.
- Three.js (MIT), TypeScript (Apache-2.0), and esbuild (MIT) are package dependencies for the companion and build. Exact versions are pinned in `package-lock.json`. Retain dependency license files when redistributing bundles.
- Lens Studio 5.24.1.26100516, Spectacles Interaction Kit 2.0.0, Spectacles UIKit 2.0.0, LEAF 2.0.2, AiPreviewAgentInspect 2.0.2 and AiPreviewAgentInteract 2.0.1 are Snap tools/packages governed by their included notices and Snap's applicable licenses. Package versions were read from the actual package descriptors. The standard Default template was used and then configured for Spectacles; no SpecsBase template provenance is claimed. Bitmoji 3D 10.0.1 is an installed IK test dependency. Retain all package notices when sharing the project.
- Original procedural geometry and included sound cues were created for this project with CLAD's local tooling. The optional SFX regeneration tool is external; opening and running the Lens uses the included WAV files. No cloud asset generation is claimed.
- PDF generation uses ReportLab 4.4.9 (BSD); its version is pinned in requirements-docs.txt. Document fonts use platform fonts when available, with built-in fallbacks; proprietary fonts are not redistributed.
- The six Lens UI icons (check_circle, pause, play_arrow, radio_button_checked, restart_alt and undo) are Google Material Symbols, imported with CLAD IconSelector. They are rendered PNG assets from the [Google Material Design icons project](https://github.com/google/material-design-icons), under [Apache-2.0](docs/licenses/Material-Symbols-Apache-2.0.txt). Their artwork is not claimed as original PartCue work.
- The mechanical enclosure is an original generic demonstration fixture. It is not a CAD reproduction or a manufacturer's repair guide.

No stock video, third-party music, customer data, or real repair footage is included.
