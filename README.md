# PartCue

### Every part has a way home.

**[Open PartCue at partcue.web.app](https://partcue.web.app)** · [Public source](https://github.com/shi1720/partcue) · [Demo](https://www.youtube.com/watch?v=BVofj69YVnA)

Two similar screws. Two different origins. PartCue remembers the relationship while you take something apart and shows one way back at a time.

[![PartCue Lens preview: paired pickup and origin cues](docs/evidence/partcue-cover.png)](https://www.youtube.com/watch?v=BVofj69YVnA)

**Created by Shivam Gupta, developed with AI coding assistance.** Built for Learn AR with SPECS, starting 20 October 2026.

## Use the workbench

Open [partcue.web.app](https://partcue.web.app) in a modern browser. Start as a guest, or create an email/password account for private cloud saves. Firebase Authentication and Firestore power the hosted app; no installation or paid subscription is required.

Choose **your own manual job** or the **four-part practice fixture**. A manual job records up to 100 part groups, each with a name, named origin, storage container, quantity and optional note. Return mode follows your removal order in reverse, keeping the next group's container and origin together. The diagram is illustrative: it does not measure a real workbench or locate your parts. Pause, undo, quantity checks and explicit confirmation help recover from interruptions. Export/import JSON keeps a portable copy.

Accounts can save 50 private sessions, with revision checks that refuse stale overwrites. Password reset, optional email verification, profile editing and password-confirmed account deletion are available. Deletion removes repair content and the sign-in account while retaining a minimal private UID marker to block stale-token recreation. Save needs an online connection; export important work before closing a tab. See [security and deployment](docs/security-and-deployment.md).

The browser workbench and the SPECS Lens are **separate sessions**. They do not automatically synchronize. Neither recognizes parts or verifies physical installation.

## Try the SPECS Lens

The hackathon Lens demonstrates four authored parts with predefined origins and a four-well tray. During return, an amber pickup cue and cyan origin cue are joined by an animated path beside the work. The sequence comes from your explicit teardown selections, with part and quantity confirmation before progress advances.

1. Install **Lens Studio 5.24.1** or a compatible version supporting SPECS 27.
2. Open [PartCue.esproj](lens/PartTrail/PartCue.esproj). Allow generated caches and definitions to rebuild. The project includes the scene, scripts, procedural geometry, feedback audio, icons, SIK/UIKit and LEAF dependencies.
3. Select **SPECS 27 / Interactive** preview. Set the bench, start, select a part and an empty well, then record removal. Repeat for four parts.
4. Start return mode, select the highlighted next part and confirm its recorded quantity. Try a wrong part/count, pause/resume, undo, completion and confirmed restart.

The permanent **SIMULATED BENCH / MANUAL MARKING** label identifies the fixture. It does not capture arbitrary real origins. Recorded proof replays actual runtime SIK/UIKit inputs; it is not a live human hand take. User acknowledgments do not verify mechanical correctness. Reverse order is a memory aid and may differ from a manufacturer's assembly procedure.

**Evidence:** [public CI](https://github.com/shi1720/partcue/actions/runs/39428423008) passes all **51 software tests and 12 Firebase tests**. Seven functional/IK Lens scenarios pass on the unchanged saved selection-guard revision, including actual tray-part selection with IK fallback disabled. **12/12 live cloud smoke stages** pass on deployed `4fecff7`, including custom-job roundtrips, concurrent saves, cross-owner denial and stale-token recreation refusal after deletion. Desktop and mobile custom-job browser checks passed. [Validation](docs/validation.md) keeps these results separate.

## Run locally

The optional local mode uses Node/SQLite instead of Firebase. Local accounts and cloud accounts are independent.

Requires **Node 22.16+ within Node 22**, npm and a WebGL2 browser:

```sh
npm ci
npm run build
npm test
npm start
```

Open `http://127.0.0.1:4173`. There are no seeded credentials. Local saves persist in ignored `data/partcue.sqlite`; local email identifiers are unverified and have no email recovery flow. Keep this server on localhost. For cloud emulator checks, install JDK 21 and run `npm run test:firebase`. [Firebase deployment](docs/firebase-deployment.md) documents the hosted build and deployment gates.

## How it fits together

| Area | Role |
| --- | --- |
| [lens/](lens/) | Actual SPECS project, UIKit/SIK interactions and live LEAF scenarios |
| [core/](core/) | Immutable sequence rules; exact Lens source copy checked by tests |
| [web/](web/) | Manual-job workbench, practice fixture, Three.js diagram and Firebase/local adapters |
| [server/](server/) | Optional localhost account API, SQLite snapshots and backup utility |
| [devpost/](devpost/) | Devpost Learn planning output |
| [Architecture](docs/architecture.md) and [validation](docs/validation.md) | State ownership, failure boundaries and observed checks |
| [Build provenance](docs/build-provenance.md) and [rubric audit](docs/rubric-audit.md) | Tools, evidence and submission status |
| [Submission draft](docs/submission-draft.md) and [video script](docs/video-script.md) | Pitch and demonstration narrative |

## First users and commercial test

Independent repair benches and classrooms are the first users to test. The proposed AR benefit is seeing pickup and origin together beside the task, reducing translation from a list into positions. A reverse teardown log is established elsewhere: [a direct alternative](https://github.com/KanadeK/parttrail/blob/main/README.md) already describes that workflow. Labeled mats, bags and photographs are strong inexpensive alternatives.

The commercial experiment is **$20 per active bench per month**, unvalidated. Compare total task time against usual methods and a plain reverse checklist, including recording overhead. No customer demand, time savings or established moat is claimed. The hosted manual workbench makes the logging workflow usable now; it does not establish a paid general AR repair product. Glasses comfort, real alignment and technician benefit need hardware and user pilots. See [research](docs/market-research.md) and the [commercial plan](docs/commercial-plan.md).

## Submission

[Public product demo, 2:37](https://www.youtube.com/watch?v=BVofj69YVnA) shows actual Lens footage and hosted practice/account workflows, with disclosed generic narration and published English captions. The newer custom-job workflow is shown in the [hosted screenshot](docs/evidence/hosted/custom-job-return.png) and [testing instructions](docs/testing-instructions.md). [Validation](docs/validation.md) records the evidence.

Deadline: **10 November 2026, 03:30 IST**. Shivam must review the entry, supply personal Additional info answers, make truthful eligibility attestations and click **Devpost Submit**. Submission is not claimed complete.

MIT license for original PartCue code. See [third-party notices](THIRD_PARTY_NOTICES.md).
