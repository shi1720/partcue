# PartCue hosted workbench

Canonical app: [partcue.web.app](https://partcue.web.app)

Version 1.1 uses Firebase Hosting, Firebase Authentication and Cloud Firestore for email/password accounts and private saved browser sessions. The optional local Node/SQLite mode remains available. The SPECS Lens is a separate session-only artifact; there is no automatic Lens/cloud synchronization.

## Reproduce a deployment

Use Node 22.16+ within the Node 22 line, npm, Git and JDK 21. The emulator wrapper detects Homebrew JDK 21 on Apple Silicon; otherwise set `JAVA_HOME`.

```sh
npm ci
npm run build
npm test
npm run test:firebase
npm run deploy:firebase
```

`deploy:firebase` runs both test suites again, builds clean `dist/hosting` assets, deploys Firestore rules/indexes and the `partcue` Hosting site, then requests the live release manifest and checks its product identifier. `npm run deploy:firebase -- --build-only` runs the same local gates without publishing. The Firebase CLI must already be authenticated with permission to deploy this project. The manifest check is a deployment smoke check, not an end-to-end account test.

The Google Cloud project retains its immutable internal ID `benchback`; its display name is PartCue. Hosting uses site ID `partcue` for the clean public URL. The project uses the Spark/free configuration without an attached paid billing account, Cloud Functions or Cloud Storage. Quotas may still interrupt service. The per-account session limit does not prevent total-project abuse.

For another operator's project, register a Firebase web app, enable email/password Auth and Firestore, configure the Auth password policy (12 minimum, 128 maximum) and authorized domains, then deliberately update `.firebaserc`, `firebase.json`, `firebase.web-config.json` and the guarded deployment target in `tools/deploy-firebase.mjs`. A hosting deployment alone does not configure Auth policies. Do not deploy open Firestore rules to make a test pass.

## Storage and account behavior

- Guest work remains in the tab, with a tab-scoped recovery copy when browser storage is available. Export JSON for portable retention.
- Save is explicit. Rules and an atomic owner counter enforce at most 50 private sessions per account.
- Firebase email actions support password reset and optional verification. New accounts are unverified and may save; actual mailbox delivery is separate from emulator action generation. The Console currently reports that email template updates are unavailable for this project, so default sender/action URLs retain the internal `benchback.firebaseapp.com` domain. The app itself is hosted and branded at `partcue.web.app`. No successful template change is claimed.
- Saved-session updates compare and increment revisions. A conflict preserves current work for export or deliberate reload. Delayed loads cannot replace newer edits, and delayed data from an earlier account is discarded.
- Server reads/transactions fail explicitly when offline or quota-limited. There is no queued offline cloud-save acknowledgement.
- Deletion reauthenticates, locks the UID, deletes all session content and clears the last mutation ID before deleting the Auth account. If interrupted while Auth still exists, retry deletion.
- A minimal private deletion marker remains indefinitely at the old UID: `schemaVersion:1`, `sessionCount:0`, `deleting:true`, `mutationId:null`, `createdAt`, `updatedAt`. No repair JSON, job titles/IDs, email or name remains in it. Clients cannot delete/reset this marker; it prevents stale tabs or valid old tokens from recreating jobs.
- No analytics or advertising SDK is included. User-exported JSON copies are outside the app's deletion control.

Rules enforce the owner path, exact storage envelope, typed summary, UTF-8 payload bound, timestamps, revision increments and counter/session transaction. Full domain validation runs in the shared TypeScript core before writes and after restore. Rules cannot execute that core or parse opaque JSON. An owner can damage their own saved JSON with a modified SDK client; another UID cannot access it, and the app rejects invalid restored content. See [architecture](architecture.md).

## Public configuration and release contents

`firebase.web-config.json` is public Firebase app configuration, not an administrative credential. Security depends on Authentication and deployed rules. Never commit service accounts, OAuth tokens, private keys, QA passwords or local account databases. See [Firebase configuration guidance](https://firebase.google.com/docs/projects/learn-more#config-files-objects).

`npm run build` selects the local HTTP adapter. `npm run build:hosting` injects public Firebase configuration into the hosted build. Hosting serves HTTPS, content-hashed assets, a restrictive CSP, denied framing and disabled camera/microphone/location permissions. The release contains generated web assets, a 404 page and a public release manifest. It does not upload SQLite data, Lens caches, private editor logs, test credentials or raw recordings. Cloud Firestore is separate from these static assets.

## Verification and operating limits

`npm run test:firebase` exercises the actual adapter against Firebase Auth and Firestore emulators with the checked-in rules. All 12 tests pass at this revision, including owner isolation, stale revisions, quota forgery, concurrent first saves/deletes, reauthentication, deletion retention and stale-token recreation denial. The ordinary core/local suite and live Lens checks remain separate. Live browser/cloud smoke evidence is recorded in the hosted validation report; deployment must be followed by a real cloud-account smoke check.

The runtime dependency audit reported zero known advisories at the v1.1 checkpoint. The development Firebase CLI retains seven known transitive advisories and must be used only with trusted checked-in inputs; see [security and deployment](security-and-deployment.md). This release has no automatic cloud backup/restore operation, MFA flow, independent penetration test or paid production support claim. The next validation steps are user and physical-glasses pilots, plus operational hardening before sensitive or paid use.
