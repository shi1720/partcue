import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, chmodSync } from 'node:fs';
import { realpath, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateSession, serializeSession } from '../dist/core/index.js';

const scrypt = promisify(scryptCallback);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BODY_LIMIT = 260_000;
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const HASH_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const TOKEN_RE = /^[a-f0-9]{64}$/;
const digest = value => createHash('sha256').update(value).digest('hex');
const opaque = () => randomBytes(32).toString('hex');
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
const fail = (status, code, message) => { throw new ApiError(status, code, message); };
const publicUser = row => ({ id: row.id, email: row.email, name: row.name });

/** Local-first companion. Proxy headers are deliberately ignored. See README for deployment bounds. */
export function createServer({ databasePath = path.join(ROOT, 'data', 'partcue.sqlite'), now = Date.now, secureCookies = false, publicOrigin, sessionTtlMs = SESSION_MS, authLimit = 12 } = {}) {
  if (!Number.isSafeInteger(sessionTtlMs) || sessionTtlMs < 1) throw new Error('sessionTtlMs must be positive');
  let configuredOrigin;
  if (publicOrigin) {
    const url = new URL(publicOrigin);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('PUBLIC_ORIGIN must be a bare http(s) origin');
    configuredOrigin = url.origin;
    if (url.protocol === 'https:' && !secureCookies) throw new Error('HTTPS public origins require secureCookies');
  }
  if (databasePath !== ':memory:') mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(databasePath);
  if (databasePath !== ':memory:') chmodSync(databasePath, 0o600);
  db.exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS auth_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS auth_user_idx ON auth_sessions(user_id);
    CREATE TABLE IF NOT EXISTS repair_sessions (owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, id TEXT NOT NULL, snapshot TEXT NOT NULL, revision INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (owner_id,id));`);
  db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(now());
  const rate = new Map();
  let closed = false;
  const server = http.createServer(async (req, res) => {
    setHeaders(res);
    try {
      const origin = requestOrigin(req, server, configuredOrigin);
      const pathname = new URL(req.url, origin).pathname;
      if (pathname.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-store');
        if (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])) fail(403, 'CROSS_ORIGIN', 'Use this application from its own origin.');
        if (req.headers.origin && req.headers.origin !== origin) fail(403, 'CROSS_ORIGIN', 'Cross-origin requests are not accepted.');
        const mutating = !['GET', 'HEAD'].includes(req.method);
        if (mutating && req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') fail(415, 'JSON_REQUIRED', 'Send application/json.');
        if (req.method === 'POST' && ['/api/auth/register', '/api/auth/login'].includes(pathname)) {
          // Browser POSTs must carry Origin. Non-browser clients must explicitly send it too.
          if (req.headers.origin !== origin) fail(403, 'ORIGIN_REQUIRED', 'A matching Origin header is required.');
          consumeRate(req.socket.remoteAddress ?? 'unknown');
          const body = await readJson(req);
          const { email, password, name } = credentials(body, pathname.endsWith('register'));
          const emailKey = `email:${email}`;
          consumeRate(emailKey);
          let user;
          let newAccount;
          if (pathname.endsWith('register')) {
            const salt = opaque();
            const hash = Buffer.from(await scrypt(password, salt, 64, HASH_OPTIONS)).toString('hex');
            if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) fail(409, 'ACCOUNT_EXISTS', 'This email already has an account. Sign in instead.');
            user = { id: opaque(), email, name };
            newAccount = { hash, salt };
          } else {
            user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
            const hash = Buffer.from(await scrypt(password, user?.password_salt ?? 'partcue-absent-account-dummy-salt', 64, HASH_OPTIONS)).toString('hex');
            if (!equal(hash, user?.password_hash ?? '0'.repeat(128))) fail(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
          }
          const token = opaque();
          const csrfToken = opaque();
          const timestamp = now();
          db.exec('BEGIN IMMEDIATE');
          try {
            if (newAccount) db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)').run(user.id, email, name, newAccount.hash, newAccount.salt, timestamp);
            db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(timestamp);
            // Credential creation and token rotation commit together, even if storage fails.
            const old = cookieToken(req);
            if (old) db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(digest(old));
            db.prepare('INSERT INTO auth_sessions VALUES (?, ?, ?, ?)').run(digest(token), user.id, csrfToken, timestamp + sessionTtlMs);
            db.prepare('DELETE FROM auth_sessions WHERE user_id = ? AND token_hash NOT IN (SELECT token_hash FROM auth_sessions WHERE user_id = ? ORDER BY expires_at DESC, rowid DESC LIMIT 10)').run(user.id, user.id);
            db.exec('COMMIT');
          } catch (error) {
            try { db.exec('ROLLBACK'); } catch { /* The database may already have rolled back. */ }
            if (newAccount && String(error.message).includes('UNIQUE constraint failed: users.email')) fail(409, 'ACCOUNT_EXISTS', 'This email already has an account. Sign in instead.');
            throw error;
          }
          res.setHeader('Set-Cookie', sessionCookie(token, secureCookies, Math.ceil(sessionTtlMs / 1000)));
          return json(res, pathname.endsWith('register') ? 201 : 200, { user: publicUser(user), csrfToken });
        }
        const token = cookieToken(req);
        const auth = token && db.prepare('SELECT a.*, u.email, u.name FROM auth_sessions a JOIN users u ON u.id=a.user_id WHERE token_hash=?').get(digest(token));
        if (!auth || auth.expires_at <= now()) {
          if (auth) db.prepare('DELETE FROM auth_sessions WHERE token_hash=?').run(auth.token_hash);
          fail(401, 'AUTH_REQUIRED', 'Sign in to continue.');
        }
        // Browser tabs share cookies. Bind an existing tab's requests to its displayed account.
        if (req.headers['x-partcue-account'] !== undefined && req.headers['x-partcue-account'] !== auth.user_id) fail(401, 'AUTH_REQUIRED', 'The signed-in account changed in another tab. Sign in again before continuing.');
        if (mutating && !equal(req.headers['x-csrf-token'], auth.csrf_token)) fail(403, 'CSRF_REQUIRED', 'Refresh the application and try again.');
        if (pathname === '/api/auth/me' && req.method === 'GET') return json(res, 200, { user: { id: auth.user_id, email: auth.email, name: auth.name }, csrfToken: auth.csrf_token });
        if (pathname === '/api/auth/logout' && req.method === 'POST') {
          checkedBody(await readJson(req), []);
          db.prepare('DELETE FROM auth_sessions WHERE token_hash=?').run(auth.token_hash);
          res.setHeader('Set-Cookie', sessionCookie('', secureCookies, 0));
          return json(res, 200, { ok: true });
        }
        if (pathname === '/api/sessions' && req.method === 'GET') {
          const rows = db.prepare('SELECT id,snapshot,revision,updated_at FROM repair_sessions WHERE owner_id=? ORDER BY updated_at DESC,id').all(auth.user_id);
          return json(res, 200, { sessions: rows.map(row => { const state = JSON.parse(row.snapshot); return { id: row.id, title: state.title, phase: state.phase, updatedAt: row.updated_at, revision: row.revision, partCount: state.parts.length }; }) });
        }
        if (pathname === '/api/sessions' && req.method === 'POST') {
          const body = await readJson(req);
          checkedBody(body, ['snapshot']);
          const snapshot = checkedSnapshot(body.snapshot);
          if (db.prepare('SELECT COUNT(*) AS count FROM repair_sessions WHERE owner_id=?').get(auth.user_id).count >= 200) fail(409, 'SESSION_LIMIT', 'Export and remove old sessions before adding more. The account limit is 200.');
          if (db.prepare('SELECT 1 FROM repair_sessions WHERE owner_id=? AND id=?').get(auth.user_id, snapshot.id)) fail(409, 'ALREADY_EXISTS', 'A session with this id already exists.');
          db.prepare('INSERT INTO repair_sessions VALUES (?, ?, ?, 1, ?)').run(auth.user_id, snapshot.id, serializeSession(snapshot), now());
          return json(res, 201, { snapshot, revision: 1 });
        }
        const match = /^\/api\/sessions\/([a-zA-Z0-9][a-zA-Z0-9_-]{0,63})$/.exec(pathname);
        if (match && ['GET', 'PUT', 'DELETE'].includes(req.method)) {
          const id = match[1];
          const row = db.prepare('SELECT * FROM repair_sessions WHERE owner_id=? AND id=?').get(auth.user_id, id);
          if (!row) fail(404, 'NOT_FOUND', 'Session not found.');
          if (req.method === 'GET') return json(res, 200, { snapshot: JSON.parse(row.snapshot), revision: row.revision });
          const body = await readJson(req);
          checkedBody(body, req.method === 'DELETE' ? ['revision'] : ['snapshot', 'revision']);
          if (!Number.isSafeInteger(body.revision) || body.revision < 1) fail(400, 'INVALID_REVISION', 'A positive integer revision is required.');
          if (body.revision !== row.revision) fail(409, 'REVISION_CONFLICT', 'This session changed in another tab. Reload it before saving.');
          if (req.method === 'DELETE') {
            const result = db.prepare('DELETE FROM repair_sessions WHERE owner_id=? AND id=? AND revision=?').run(auth.user_id, id, body.revision);
            if (result.changes !== 1) fail(409, 'REVISION_CONFLICT', 'Reload the session before deleting.');
            return json(res, 200, { ok: true });
          }
          const snapshot = checkedSnapshot(body.snapshot);
          if (snapshot.id !== id) fail(400, 'ID_MISMATCH', 'Snapshot id must match the URL.');
          const result = db.prepare('UPDATE repair_sessions SET snapshot=?,revision=revision+1,updated_at=? WHERE owner_id=? AND id=? AND revision=?').run(serializeSession(snapshot), now(), auth.user_id, id, body.revision);
          if (result.changes !== 1) fail(409, 'REVISION_CONFLICT', 'Reload the session before saving.');
          return json(res, 200, { snapshot, revision: row.revision + 1 });
        }
        fail(404, 'NOT_FOUND', 'Endpoint not found.');
      }
      if (!['GET', 'HEAD'].includes(req.method)) fail(405, 'METHOD_NOT_ALLOWED', 'Use GET for static content.');
      await serveStatic(req, res, pathname);
    } catch (error) {
      if (res.headersSent) { res.destroy(); return; }
      if (!(error instanceof ApiError)) console.error('Companion request failed:', error.message);
      if (error.status === 429) res.setHeader('Retry-After', '900');
      json(res, error.status ?? 500, { error: { code: error.code && error instanceof ApiError ? error.code : 'INTERNAL_ERROR', message: error instanceof ApiError ? error.message : 'The request could not be completed.' } });
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxHeadersCount = 50;
  server.once('close', () => { if (!closed) { closed = true; db.close(); } });
  return server;

  function consumeRate(key) {
    const at = now();
    if (rate.size > 10_000) for (const [k, v] of rate) if (v.resetAt <= at) rate.delete(k);
    if (rate.size > 20_000 && !rate.has(key)) fail(429, 'RATE_LIMITED', 'Too many authentication attempts. Try again later.');
    let bucket = rate.get(key);
    if (!bucket || at >= bucket.resetAt) { bucket = { count: 0, resetAt: at + 15 * 60 * 1000 }; rate.set(key, bucket); }
    if (++bucket.count > authLimit) { fail(429, 'RATE_LIMITED', 'Too many authentication attempts. Try again in 15 minutes.'); }
  }
}

function requestOrigin(req, server, configuredOrigin) {
  const host = req.headers.host;
  if (typeof host !== 'string' || !host || /[\s/@\\]/.test(host)) fail(400, 'INVALID_HOST', 'Invalid Host header.');
  if (configuredOrigin) {
    if (host !== new URL(configuredOrigin).host) fail(400, 'INVALID_HOST', 'Host does not match PUBLIC_ORIGIN.');
    return configuredOrigin;
  }
  const port = server.address()?.port;
  if (![`localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`].includes(host)) fail(400, 'INVALID_HOST', 'Use the local application address.');
  return `http://${host}`;
}
function setHeaders(res) {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}
function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); }
function sessionCookie(value, secure, maxAge) { return `partcue_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`; }
function cookieToken(req) {
  const matches = (req.headers.cookie ?? '').split(';').map(v => v.trim()).filter(v => v.startsWith('partcue_session='));
  if (matches.length !== 1) return null;
  const token = matches[0].slice('partcue_session='.length);
  return TOKEN_RE.test(token) ? token : null;
}
async function readJson(req) {
  if (req.headers['content-encoding'] && req.headers['content-encoding'] !== 'identity') fail(415, 'ENCODING_UNSUPPORTED', 'Compressed request bodies are not supported.');
  if (Number(req.headers['content-length']) > BODY_LIMIT) fail(413, 'BODY_TOO_LARGE', 'Request body exceeds 260 KB.');
  let size = 0;
  const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > BODY_LIMIT) fail(413, 'BODY_TOO_LARGE', 'Request body exceeds 260 KB.'); chunks.push(chunk); }
  let result;
  try { result = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
  if (!object(result)) fail(400, 'INVALID_BODY', 'Request body must be a JSON object.');
  return result;
}
function checkedBody(body, keys) { if (Object.keys(body).some(key => !keys.includes(key))) fail(400, 'UNSUPPORTED_FIELD', 'Request contains unsupported fields.'); return body; }
function credentials(body, registering) {
  checkedBody(body, registering ? ['email', 'password', 'name'] : ['email', 'password']);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)) fail(400, 'INVALID_EMAIL', 'Enter a valid email address.');
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128 || Buffer.byteLength(body.password) > 512) fail(400, 'INVALID_PASSWORD', 'Use a password between 12 and 128 characters.');
  const name = body.name === undefined ? email.split('@')[0] : typeof body.name === 'string' ? body.name.trim() : '';
  if (registering && (!name || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name))) fail(400, 'INVALID_NAME', 'Use a name between 1 and 80 printable characters.');
  return { email, password: body.password, name };
}
function checkedSnapshot(value) {
  const result = validateSession(value);
  if (!result.valid) fail(400, 'INVALID_SNAPSHOT', result.errors.slice(0, 5).join('; '));
  // Strip unknown keys via explicit canonical cloning so imported JSON has no hidden payload.
  const snapshot = { schemaVersion: value.schemaVersion, units: value.units, id: value.id, title: value.title, phase: value.phase, resumePhase: value.resumePhase, parts: value.parts.map(p => ({ id:p.id,label:p.label,originCm:{x:p.originCm.x,y:p.originCm.y,z:p.originCm.z},trayCm:{x:p.trayCm.x,y:p.trayCm.y,z:p.trayCm.z},count:p.count,...(p.note === undefined ? {} : {note:p.note}),removedAt:p.removedAt })), returnedCount: value.returnedCount,pendingReturnId:value.pendingReturnId,createdAt:value.createdAt,updatedAt:value.updatedAt,eventSeq:value.eventSeq,events:value.events.map(e=>({seq:e.seq,at:e.at,type:e.type,...(e.partId===undefined ? {} : {partId:e.partId})})) };
  if (Buffer.byteLength(JSON.stringify(snapshot)) > 250_000) fail(413, 'SNAPSHOT_TOO_LARGE', 'Snapshot exceeds 250 KB.');
  return snapshot;
}
async function serveStatic(req, res, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { fail(400, 'INVALID_PATH', 'Invalid path encoding.'); }
  if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').some(p => p === '..' || p.startsWith('.'))) fail(404, 'NOT_FOUND', 'File not found.');
  const dist = decoded.startsWith('/dist/');
  const base = path.join(ROOT, dist ? 'dist' : 'web');
  const relative = dist ? decoded.slice(6) : decoded === '/' ? 'index.html' : decoded.slice(1);
  const target = path.resolve(base, relative);
  if (!target.startsWith(base + path.sep)) fail(404, 'NOT_FOUND', 'File not found.');
  const allowed = new Set(['.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.ico','.woff2','.json']);
  if (!allowed.has(path.extname(target)) || (dist && path.extname(target) !== '.js')) fail(404, 'NOT_FOUND', 'File not found.');
  try {
    const resolved = await realpath(target);
    if (!resolved.startsWith(base + path.sep)) fail(404, 'NOT_FOUND', 'File not found.');
    const metadata = await stat(resolved);
    if (!metadata.isFile()) fail(404, 'NOT_FOUND', 'File not found.');
    const type = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.json':'application/json; charset=utf-8'}[path.extname(resolved)];
    const data = await readFile(resolved);
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'Content-Length': data.length });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) { if (error instanceof ApiError) throw error; if (['ENOENT','ENOTDIR','EACCES'].includes(error.code)) fail(404,'NOT_FOUND','File not found.'); throw error; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 4173);
  const host = process.env.HOST ?? '127.0.0.1';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1–65535');
  if (!['127.0.0.1','localhost','::1'].includes(host) && (!process.env.PUBLIC_ORIGIN?.startsWith('https://') || process.env.COOKIE_SECURE !== '1')) throw new Error('Network binding requires an explicit HTTPS PUBLIC_ORIGIN, COOKIE_SECURE=1 and an HTTPS reverse proxy.');
  const server = createServer({ databasePath: process.env.DATABASE_PATH, secureCookies: process.env.COOKIE_SECURE === '1', publicOrigin: process.env.PUBLIC_ORIGIN });
  server.listen(port, host, () => console.log(`PartCue companion listening on ${process.env.PUBLIC_ORIGIN ?? `http://${host}:${port}`}`));
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => { server.close(() => process.exit(0)); server.closeIdleConnections(); });
}
