import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createSession, applyCommand, parseSession, serializeSession } from '../dist/core/index.js';

const source = await readFile(new URL('../web/app.js', import.meta.url), 'utf8');
function productionFunction(begin, end) {
  const start = source.indexOf(begin), stop = source.indexOf(end, start);
  assert.ok(start >= 0 && stop > start, 'production session handler exists');
  return source.slice(start, stop);
}
function element() {
  return { open: false, children: [], textContent: '', showModal() { this.open = true; }, close() { this.open = false; },
    append(...nodes) { this.children.push(...nodes); }, replaceChildren(...nodes) { this.children = [...nodes]; }, setAttribute() {}, addEventListener() {} };
}
function harness() {
  const elements = new Map(), requests = [], notices = [], loaded = [];
  const $ = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
  const c = vm.createContext({
    user: { id: 'alice' }, authGeneration: 0, listRequest: 0, networkBusy: false, cloud: false,
    state: createSession({ id: 'current-bench' }, 1000), $, serializeSession, parseSession,
    node: (tag, cls, text) => ({ ...element(), tag, textContent: text }), phaseNames: { recording: 'Recording' },
    api: { request: (...args) => new Promise((resolve, reject) => requests.push({ args, resolve, reject })) },
    openAuth() {}, expireAuth() { c.user = null; }, render() {}, isUnprotected: () => false,
    notice: (text, kind) => notices.push({ text, kind }),
    useSnapshot: (snapshot, revision) => { loaded.push({ snapshot, revision }); c.state = snapshot; },
  });
  vm.runInContext(productionFunction('async function listSessions()', 'async function loadSession('), c);
  vm.runInContext(productionFunction('async function loadSession(', 'async function deleteSession('), c);
  return { c, $, requests, notices, loaded,
    titles: () => $('saved-sessions').children.filter(row => row.children.length).map(row => row.children[0].children[0].textContent) };
}
const saved = (title, id) => ({ id, title, phase: 'recording', partCount: 1, updatedAt: 1000, revision: 1 });

test('late successful list from the previous account cannot expose its project titles', async () => {
  const h = harness(), alice = h.c.listSessions(), aliceRequest = h.requests.shift();
  h.$('sessions-dialog').close(); h.c.user = { id: 'bob' }; h.c.authGeneration++;
  const bob = h.c.listSessions(), bobRequest = h.requests.shift();
  bobRequest.resolve({ sessions: [saved('Bob bench', 'b')] }); await bob;
  aliceRequest.resolve({ sessions: [saved('Alice private project', 'a')] }); await alice;
  assert.deepEqual(h.titles(), ['Bob bench']);
});

test('reopening the list drops an older same-account response and stale authentication rejection', async () => {
  const h = harness(), first = h.c.listSessions(), firstRequest = h.requests.shift();
  h.$('sessions-dialog').close();
  const second = h.c.listSessions(), secondRequest = h.requests.shift();
  secondRequest.resolve({ sessions: [saved('Current revision', 'a')] }); await second;
  firstRequest.resolve({ sessions: [saved('Older revision', 'a')] }); await first;
  assert.deepEqual(h.titles(), ['Current revision']);
  const stale = h.c.listSessions(), staleRequest = h.requests.shift();
  h.$('sessions-dialog').close(); h.c.user = { id: 'bob' }; h.c.authGeneration++;
  staleRequest.reject(Object.assign(new Error('Old account expired'), { code: 'AUTH_REQUIRED' })); await stale;
  assert.equal(h.c.user.id, 'bob', 'an old error cannot sign the new account out');
});

test('edits made after a load starts survive its delayed successful response', async () => {
  const h = harness(), loading = h.c.loadSession('stored-bench'), request = h.requests.shift();
  h.$('sessions-dialog').close();
  h.c.state = applyCommand(h.c.state, { type: 'start' }, 1001).state;
  const newer = h.c.state;
  request.resolve({ snapshot: createSession({ id: 'stored-bench' }, 900), revision: 3 }); await loading;
  assert.equal(h.c.state, newer);
  assert.equal(h.loaded.length, 0);
  assert.match(h.notices.at(-1).text, /newer work is kept/);
  assert.equal(h.c.networkBusy, false);
});

test('load ignores a previous-account response but still restores an unchanged current bench', async () => {
  const h = harness(), previous = h.c.loadSession('alice-bench'), previousRequest = h.requests.shift();
  h.c.user = { id: 'bob' }; h.c.authGeneration++;
  previousRequest.resolve({ snapshot: createSession({ id: 'alice-bench' }, 900), revision: 2 }); await previous;
  assert.equal(h.loaded.length, 0);
  assert.equal(h.c.state.id, 'current-bench');
  const current = h.c.loadSession('bob-bench'), currentRequest = h.requests.shift();
  currentRequest.resolve({ snapshot: createSession({ id: 'bob-bench' }, 1100), revision: 4 }); await current;
  assert.equal(h.loaded.length, 1);
  assert.equal(h.c.state.id, 'bob-bench');
  assert.equal(h.loaded[0].revision, 4);
});
