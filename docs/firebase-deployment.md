# PartCue hosted workbench

Canonical app: https://partcue.web.app

The browser companion uses Firebase Hosting, Firebase Authentication and Cloud Firestore. It has real email/password accounts and private saved sessions. The separate SPECS Lens keeps its own session in Lens Studio. There is no automatic synchronization between the two experiences.

## Reproduce a deployment

Use Node 22.16 or later in the Node 22 release line, npm, Git and JDK 21. The test wrapper detects Homebrew's JDK 21 on Apple Silicon; otherwise set `JAVA_HOME`.

```sh
npm ci
npm run build
npm test
npm run test:firebase
npm run deploy:firebase
```

`deploy:firebase` runs the checks again, builds a clean `dist/hosting`, deploys rules, indexes and the `partcue` Hosting site, then checks the live release manifest. `npm run deploy:firebase -- --build-only` performs every local gate without publishing. Firebase CLI must already be authenticated with access to the project.

The existing Google Cloud project retains its immutable internal ID `benchback`; its display name is PartCue. Hosting uses a separate site ID, `partcue`, so the public URL is clean. No paid billing account is attached. Hosting, Auth and the Standard Firestore database use the Spark/free-tier configuration. Quotas can still interrupt service; the app offers JSON export when cloud storage is unavailable. This configuration avoids Cloud Functions and Cloud Storage.

## Storage and account behavior

- Guest work stays in memory and a tab-scoped recovery copy. Reload restores it. Closing the tab removes that recovery copy. Export JSON to keep a portable backup.
- Save is explicit. Accounts can store up to 50 sessions, enforced by Firestore rules and an atomic owner counter.
- Email verification and password reset use Firebase's email actions. Passwords require 12 to 128 characters in both the UI and the project's Auth password policy.
- Loading a saved session restores the saved snapshot. A delayed load cannot replace newer edits. A delayed list from another account cannot display its titles.
- Updates use optimistic revisions. A stale tab receives a conflict and must export its current work or reload the saved version. No silent overwrite.
- Account deletion reauthenticates before removing saved sessions and the Auth account. An interrupted deletion can be retried. Export first; deletion is permanent.
- No analytics or advertising SDK is included. Firebase handles authentication and private cloud storage.

Firestore rules enforce ownership, exact storage envelopes, timestamp types, payload bounds, valid summaries, revision increments and session quota transactions. Full domain validation runs in the shared TypeScript core before writes and after restores. Rules cannot execute that core or parse the opaque JSON. A malicious account owner could damage their own stored snapshot; another account cannot read or write it, and the UI rejects invalid restored content.

## Public configuration and secrets

`firebase.web-config.json` contains Firebase's public web app configuration, not an administrative credential. Security depends on Auth and deployed Firestore rules. No service account, OAuth token, private key or QA password belongs in this repo. See [Firebase's configuration guidance](https://firebase.google.com/docs/projects/learn-more#config-files-objects).

Hosting serves content over HTTPS with a restrictive CSP, no framing, no camera/microphone/location permission, and content-hashed static assets. The deployment contains only generated web assets, a 404 page and a public release manifest. It does not upload the local SQLite database, Lens cache, test accounts or raw recordings.

## Verification scope

The automated local and cloud-emulator suites exercise the production code and rules. Live browser verification and the live cloud smoke-test report are recorded separately in `docs/hosted-validation.md`. Email action generation is tested with the Auth emulator; actual mailbox delivery and physical glasses comfort are separate checks. A working web companion does not substitute for the Lens Studio preview requirement.
