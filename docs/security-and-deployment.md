# Security and deployment

The public workbench at [partcue.web.app](https://partcue.web.app) uses Firebase Hosting, Authentication and Firestore on the Spark/free configuration. The Node/SQLite server is an optional local mode. Accounts and saved work are separate between these modes. The SPECS Lens maintains its own session and does not synchronize with either service.

## Hosted controls and limits

Firebase manages email/password authentication, password reset and verification email actions. The project password policy and client require 12 to 128 characters for new passwords. Verification is available but is not required to save; do not describe accounts as verified by default. Firebase SDK browser authentication persistence differs from the local service's HttpOnly cookie design. Protect the browser and device account accordingly.

Firestore rules isolate each authenticated UID, deny anonymous access and collection-group enumeration, enforce exact metadata and snapshot envelopes, bound snapshot JSON to 250,000 UTF-8 bytes, and require valid typed summaries, server timestamps and monotonic revisions. An atomic counter limits each account to 50 saved sessions. Create/delete rules verify the matching session operation, so a client cannot forge a lower counter or add multiple sessions against one quota slot. The adapter pins reads and writes to the displayed identity and handles cross-tab account changes.

The shared TypeScript core validates full snapshots before writes and on restore. Firestore rules cannot parse the JSON or execute the core. A malicious owner can corrupt their own saved domain content through a modified client; the UI rejects invalid restores. This is not server-side domain validation, part recognition or mechanical safety verification. No team sharing or public repair records are implemented.

Save requires an online server transaction. Network and quota failures leave current work available for export and report a failure. A timeout can be ambiguous, so check the saved list before repeating a creation. Guest and unsaved work use tab-scoped recovery storage when available, not a durable cross-device backup. Export important JSON before closing a tab, signing out or deleting data. Exported files remain wherever the user copies them and are not remotely erased.

### Account deletion and retention

Deletion requires the current password. It locks the UID, removes all saved session documents, clears the last job ID, and deletes the Firebase Auth account. If interrupted before Auth deletion, sign in and retry deletion; the lock prevents further job saves. Auth and Firestore are separate services, so this flow does not claim an atomic cross-service transaction or guaranteed recovery from an operator deleting an Auth account outside the app.

A private deletion marker is retained indefinitely under the former UID: only `schemaVersion:1`, `sessionCount:0`, `deleting:true`, `mutationId:null`, `createdAt` and `updatedAt`. It contains no job JSON, titles, labels, notes, email, display name or password. Client rules prohibit deletion or resetting the marker. This prevents a previously authenticated tab or still-valid token from recreating repair data after cleanup. A new signup has a new UID. Removing old markers would require a privileged operational policy; no automatic retention expiry is currently implemented.

There is no analytics or advertising SDK. Hosting uses HTTPS, a restrictive Content Security Policy, denied framing and disabled camera/microphone/location permissions. The bundled WebGL renderer does not require JavaScript `unsafe-eval`. Public Firebase web configuration is intentionally visible; authorization depends on Auth and deployed rules, not hiding its API key.

## Free local workflow

1. Use Node 22.16+ within the Node 22 line. Run `npm ci`, `npm run build`, `npm test`, then `npm start`.
2. Open `http://127.0.0.1:4173` and register a local account with a unique 12 to 128 character password. There are no seeded credentials. Local email is an unverified identifier; local email recovery and account deletion are not implemented.
3. Keep `data/partcue.sqlite` and all backups private. Local SQLite uses WAL, owner-scoped queries and server-side snapshot validation. Passwords use salted scrypt; authentication uses hashed opaque tokens in seven-day HttpOnly, SameSite Strict cookies. CSRF, Origin/Host checks, identity pinning and bounded process-local auth rate limits protect the local HTTP boundary.
4. For a consistent backup while the server runs, choose a new destination filename:

   ```sh
   node server/backup.mjs data/partcue.sqlite backups/partcue-2026-10-20.sqlite
   ```

The backup utility includes committed WAL data, checks source/destination integrity and refuses to overwrite an existing file. Backups include account hashes, session hashes and saved repairs. Copy verified backups to protected separate storage. To restore, stop the server, move the existing data directory aside, restore the database at `data/partcue.sqlite`, then restart. Do not mix old WAL/SHM files with a restored database. A retained cookie can work against a restored backup until its original expiry. The operating-system user can inspect or replace this unencrypted local database.

Do not expose the local Node server as the public hosted product. Its configuration and remaining hardening requirements are in [the server guide](../server/README.md). Hosting uses the separate Firebase adapter.

## Dependency and operational review

At the v1.1 checkpoint, `npm audit --omit=dev` reported zero known runtime advisories. This is a dependency snapshot, not a security certification. The pinned Firebase CLI 15.34.0 development tool has seven transitive advisories: four moderate and three high, involving pattern-matching/watch dependencies, UUID/gaxios and OpenTelemetry/Pubsub dependencies. These CLI dependencies are not included in the deployed browser bundle. The reviewed downgrade alternative introduced additional issues rather than a suitable supported fix.

Use the checked-in deployment/emulator scripts with literal trusted project and file paths. Do not feed untrusted glob/watch patterns or project resources to the authenticated CLI. Restrict developer-machine and Firebase console access, monitor upstream fixes and rerun audits before later releases. These measures reduce exposure; they do not resolve the advisories.

Before offering paid or sensitive production use, establish abuse monitoring and account-creation controls, alerting and quota budgets, a documented cloud backup/restore policy, deletion/support procedures, breached-password and MFA decisions, accessibility and browser coverage, load testing, incident response and independent security review. Spark quotas can interrupt service, and a 50-session per-account cap does not bound registration abuse or total project usage. No automatic cloud backup, privileged account cleanup service or user support operation is deployed. Hardware fit, tracking reliability and user value require real-device and user pilots.

See [Firebase deployment](firebase-deployment.md) for the reproducible hosted release and [architecture](architecture.md) for state and validation boundaries.
