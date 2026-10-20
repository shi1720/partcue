# PartCue companion server

A real account and snapshot service for the bench rehearsal companion. It does not connect the Lens to cloud storage, infer part identity, or make the Lens submission requirement disappear. The browser rehearsal and the Lens are separate adapters of the shared domain model.

## Run locally

Use Node **22.16 or later within the Node 22 line** and run the repository build before `npm start`. `node:sqlite` is built into this runtime; Node 22 prints an experimental API warning. No API keys, external databases, analytics, paid accounts or seeded credentials are required.

The default address is `http://127.0.0.1:4173`. Register an account in the application with a 12–128 character password. Registration is local to this server; email addresses are identifiers and are **not verified**. There is no password recovery or administrative bypass. Keep a password manager entry and export important repair snapshots.

SQLite persists accounts and snapshots in `data/partcue.sqlite`, with WAL journaling, foreign keys and a 5 second busy timeout. The data directory belongs in `.gitignore`; never publish it. The server creates a new data directory with mode 0700 and database file with mode 0600. Shut down the process before copying the data directory for a consistent local backup. Copy the entire directory, including any WAL files, and restore it before restarting. User data survives server restarts.

## API contract

All API responses use JSON and `Cache-Control: no-store`. Errors have shape `{ "error": { "code": "…", "message": "…" } }`. Mutations require `Content-Type: application/json`. Browser requests should use same-origin fetch and cookies; the browser sets `Origin` itself. Scripts must set `Origin` explicitly for registration and login.

| Endpoint | Request | Success |
| --- | --- | --- |
| `POST /api/auth/register` | `{email,password,name?}` | 201 `{user:{id,email,name},csrfToken}` + session cookie |
| `POST /api/auth/login` | `{email,password}` | 200 same shape; rotates current browser session |
| `GET /api/auth/me` | Session cookie | 200 `{user,csrfToken}`; 401 when signed out |
| `POST /api/auth/logout` | `{}` + CSRF header | 200 `{ok:true}` + expired cookie |
| `GET /api/sessions` | Session cookie | 200 `{sessions:[{id,title,phase,updatedAt,revision,partCount}]}` |
| `POST /api/sessions` | `{snapshot}` + CSRF header | 201 `{snapshot,revision:1}` |
| `GET /api/sessions/:id` | Session cookie | 200 `{snapshot,revision}` |
| `PUT /api/sessions/:id` | `{snapshot,revision}` + CSRF header | 200 `{snapshot,revision:revision+1}` |
| `DELETE /api/sessions/:id` | `{revision}` + CSRF header | 200 `{ok:true}` |

For authenticated mutations, send `X-CSRF-Token` using the value from login, registration or `/api/auth/me`. The browser client also sends `X-PartCue-Account` with the account id it currently displays on protected reads and writes. If another browser tab changes the shared sign-in cookie, a mismatching account id returns 401 `AUTH_REQUIRED` before any session data is returned. This header checks UI consistency; authentication and ownership still come exclusively from the session cookie. A stale revision returns **409 `REVISION_CONFLICT`**. Fetch the latest snapshot and offer the user a deliberate reload or export; do not silently overwrite it. Snapshot IDs are scoped per account. The API returns 404 for other users' sessions and does not reveal their existence. Each account may retain 200 snapshots, each capped at 100 part groups by the domain validator.

A snapshot is a complete schema-version-1 session in centimetres, as validated by `core/index.ts`. All fields and phase invariants are checked. Unknown snapshot fields are rejected by the core. `updatedAt` in list summaries is the server save time, while the snapshot preserves its explicit domain action timestamps. The server caps the JSON request at 260 KB and snapshot at 250 KB. There is no cloud Lens sync endpoint.

## Security boundaries

- Passwords use asynchronous scrypt with unique cryptographic 256-bit salts and 64-byte derived hashes (`N=16384,r=8,p=1`). Passwords are never written to the database or logs. Missing-account logins do comparable scrypt work before the same generic invalid-credential response.
- Session tokens are opaque 256-bit random values; SQLite stores their SHA-256 digests. Cookies are HttpOnly, SameSite Strict and expire after seven days. Server-side expiry is enforced independently of cookie expiry. Login rotates the current browser token and accounts retain at most ten live sign-ins. Logout revokes the current token.
- Mutations use per-session random CSRF tokens, constant-time token comparisons, Origin checks and Fetch Metadata checks. Registration/login require matching Origin even for scripts. There is no wildcard CORS.
- Authentication is limited to 12 attempts per 15 minute window per socket IP and normalized email address. The counters are bounded, held in memory, and reset on restart. Requests use socket addresses; forwarded headers never influence authentication limits.
- Parameterized SQLite statements and owner constraints cover all reads and writes. Revision checks also appear in SQL updates/deletes to handle requests that overlap while reading bodies.
- Local Host validation blocks ordinary DNS rebinding to arbitrary domains. A restrictive Content Security Policy permits same-origin scripts/styles and forbids framing and remote connections. Static requests cannot read server files, source maps, dotfiles, database files or files reached through escaping symlinks. Only `web/` assets and JavaScript from `dist/` are served.

This is a tested **local-first companion**, not a claim of an audited public SaaS service. An attacker with access to this operating-system account or data directory can read saved repairs and replace the database. Data is not encrypted at rest. Someone who knows a user's password can sign in locally. Email verification, password recovery, MFA, shared-team permissions, abuse monitoring, durable distributed rate limiting and independent penetration testing are not implemented. The app makes no guarantee about mechanical safety or factual part recognition.

## Explicit deployment configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Listening interface |
| `PORT` | `4173` | TCP port |
| `DATABASE_PATH` | `<repo>/data/partcue.sqlite` | Durable SQLite location |
| `PUBLIC_ORIGIN` | computed loopback address | Exact externally visible bare origin, e.g. `https://bench.example.org` |
| `COOKIE_SECURE` | off for local HTTP | Set to `1` to require HTTPS cookies |

Binding to a non-loopback interface is rejected unless `PUBLIC_ORIGIN` is HTTPS and `COOKIE_SECURE=1`. If intentionally deploying behind an HTTPS reverse proxy, the proxy must preserve the public `Host` header and restrict direct network access to the Node port. Proxy forwarding headers are ignored rather than implicitly trusted. Configure IP-based abuse controls at the proxy because Node sees the proxy's socket IP. An HTTPS public origin requires secure cookies even with loopback binding. There is no automatic certificate provisioning, account email delivery or claim that setting these variables completes public-production hardening.

## Verification

`npm test` builds the core and runs real HTTP tests that create fresh databases, register accounts, inspect hash storage, authenticate, rotate/revoke sessions, restart the server, validate snapshots, isolate parallel accounts, conflict concurrent writes, reject expired sessions, enforce CSRF/rate/body limits, and block traversal/Host attacks. Each test removes its temporary database.

`createServer({databasePath, now?, sessionTtlMs?, authLimit?, secureCookies?, publicOrigin?})` returns an unstarted Node HTTP server for integration tests. `now`, short TTLs and rate overrides are test injection points passed as JavaScript options, never request parameters or exposed HTTP administration features. Closing the HTTP server closes its database. Direct execution starts the server with the environment variables above.
