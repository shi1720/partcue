# Security and deployment

PartCue's companion runs free on one computer with Node 22.16+, SQLite and a modern browser. It uses no paid service, cloud credentials or API keys. The Lens remains a separate Lens Studio project; account login is for saved browser rehearsal sessions.

## Free local workflow

1. Install Node 22.16+ within the Node 22 line. From the repository run `npm ci`, `npm run build`, `npm test`, then `npm start`.
2. Open `http://127.0.0.1:4173` and register a real local account with a unique 12–128 character password. No demo credentials are built in. Email is an unverified account identifier, and password recovery is not implemented.
3. Export important repair snapshots from the app. Account data is stored in `data/partcue.sqlite`; never publish this directory or commit backups.
4. Create a consistent backup while the server is running:

   ```sh
   node server/backup.mjs data/partcue.sqlite backups/partcue-2026-10-20.sqlite
   ```

   Choose a new filename each time. The utility uses SQLite's online backup API, checks source and destination integrity, creates a private file, and refuses to overwrite an existing backup. A backup contains accounts, password hashes, active session hashes and saved repairs; keep it private. Copy the verified backup to separate protected storage. To restore, stop the server, move the old data directory aside, place the backup at `data/partcue.sqlite`, then restart. Do not mix old WAL/SHM files with a restored database. Test restoration periodically. Anyone retaining a still-valid browser cookie can use it against a restored backup until its original expiry.

## What is enforced

Passwords use salted scrypt. Opaque authentication cookies are HttpOnly, SameSite Strict and server-expired after seven days. The database stores hashes of tokens. CSRF tokens, same-origin checks and Host validation protect browser mutations and local DNS rebinding. Account IDs come from authenticated cookies rather than snapshot inputs. The browser also pins requests to its displayed account, so a shared-cookie account switch in another tab forces a fresh sign-in before returning saved data. Snapshot schemas, bounds and revisions are checked server-side; overlapping writes return 409 instead of overwriting each other. Client handling should preserve the unsaved copy, explain the conflict and deliberately reload or export it before continuing.

Authentication attempts are limited per socket IP and normalized email (lowercased and trimmed). Expired tokens are removed at startup and on authentication; at most ten live sign-ins remain per account. Account creation and initial token storage are a SQLite transaction, so a persistence failure cannot leave a half-created account. Unknown API envelope and snapshot fields are rejected. Request bodies are capped, including chunked requests without Content-Length.

A same-origin Content Security Policy allows the bundled Three.js/WebGL canvas. WebGL shader compilation does not require JavaScript `unsafe-eval`. Keep scripts and CSS in bundled files; do not add inline scripts or remote CDN dependencies to work around policy failures. The server serves only `web/` assets and compiled JavaScript under `dist/`, with traversal and escaping symlinks rejected.

## Before any public deployment

This is a tested local-first application, **not an audited public SaaS service**. Local account storage is not encrypted at rest, the operating-system user can inspect it, and repair information may be sensitive. Public operation requires additional work:

- Terminate HTTPS with a correctly configured reverse proxy, preserve the public Host header, restrict direct Node-port access, set exact `PUBLIC_ORIGIN=https://…` and `COOKIE_SECURE=1`, and use a non-loopback `HOST` only intentionally. Forwarded headers are ignored. Add proxy abuse controls because Node sees the proxy's socket IP.
- Add email verification, secure password reset, account deletion and recovery, breached-password controls, and an appropriate MFA option. Design these flows before advertising cloud accounts.
- Replace process-local rate counters with durable shared abuse controls, monitoring and alerting. Review account enumeration and registration abuse before enabling public registration.
- Use a restricted service account, private durable volumes, encrypted backups, restore drills, retention/deletion policies, resource limits and operational rollback procedures. Protect backup files as strongly as the live database.
- Commission an independent security review and test browser compatibility, accessibility, load, storage failures and device-loss recovery. Keep dependencies patched and pin runtime versions.
- Design explicit consent and team permissions before adding shared repairs or camera data. Do not infer cloud sync, machine-verified part identity or physical repair safety from this browser rehearsal.

The detailed API and configuration contract is in [the server guide](../server/README.md). Automated tests cover real HTTP authentication, ownership isolation, malformed and oversized requests, revision conflicts, bounded sessions, failed auth persistence, online backup/restore and unavailable storage. They establish the tested boundaries above; they do not establish public-production readiness.
