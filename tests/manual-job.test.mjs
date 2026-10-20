import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createSession, applyCommand, nextPart, serializeSession, parseSession, LIMITS, progress } from '../dist/core/index.js';
import { FIXTURE, TRAYS, trayName, samePosition, formatCm } from '../web/fixture.js';
import { isManualJob, createManualPart, manualDiagramPositions, encodeManualReferences, decodeManualReferences, partDisplayName, manualReferences, sessionIdForMode, importedSessionIdentity } from '../web/manual-job.js';
import { cameraViewForSession } from '../web/scene-view.js';

const fields = overrides => ({ name: 'Left hinge screws', origin: 'Upper left hinge mount', tray: 'Blue tray A', count: 3, note: 'Keep washers together', ...overrides });
const act = (state, command) => { const result = applyCommand(state, command, state.updatedAt + 1); assert.ok(result.ok, result.error?.message); return result.state; };

test('maximum custom fields, punctuation and full 80-character Unicode names survive the unchanged core', () => {
  const name = 'a'.repeat(62) + ' 😀' + 'b'.repeat(15);
  assert.equal(name.length, 80);
  const input = fields({ name, origin: 'o'.repeat(48), tray: 't'.repeat(32), note: 'n'.repeat(96), count: 100 });
  const part = createManualPart(input, 'first', 0);
  assert.ok(part.label.length <= 64); assert.equal(part.note.length, 240);
  let state = createSession({ id: 'job-maximum' }, 1000); state = act(state, { type: 'start' }); state = act(state, { type: 'recordPart', part });
  const restored = parseSession(serializeSession(state));
  assert.deepEqual(decodeManualReferences(restored.parts[0]), { name, origin: input.origin, tray: input.tray, note: input.note });
  assert.equal(partDisplayName(restored.parts[0]), name);
  const punctuation = createManualPart(fields({ origin: 'Origin[2]:x | Tray[4]:fake', tray: 'Bag | Name+[0]: []', note: 'Quote " \uD83D\uDD27 |Note: stays literal' }), 'punctuation', 1);
  assert.equal(decodeManualReferences(punctuation).origin, 'Origin[2]:x | Tray[4]:fake');
  assert.equal(decodeManualReferences(punctuation).note, 'Quote " 🔧 |Note: stays literal');
});

test('invalid custom fields fail before a record is created, including all counts and line separators', () => {
  for (const invalid of [
    { name: '' }, { name: 'x'.repeat(81) }, { origin: '' }, { origin: 'x'.repeat(49) },
    { tray: 'x'.repeat(33) }, { tray: ' ' }, { note: 'x'.repeat(97) },
    ...[0, 101, -1, 1.5, NaN, Infinity, '1'].map(count => ({ count })),
    ...['\n', '\r', '\u2028', '\u2029', '\t', '\0'].flatMap(line => ['name', 'origin', 'tray', 'note'].map(key => ({ [key]: `x${line}y` }))),
  ]) assert.throws(() => createManualPart(fields(invalid), 'bad', 0));
  assert.throws(() => createManualPart(fields(), 'bad/id', 0));
  assert.throws(() => manualDiagramPositions(100));
  assert.throws(() => manualDiagramPositions(-1));
  assert.equal(decodeManualReferences({ label: 'Old imported part', note: 'J1 Origin[99]:corrupt' }), null);
});

test('100 custom groups retain individual references and return in order through pause, undo and export', () => {
  let state = createSession({ id: 'job-hundred' }, 1000); state = act(state, { type: 'start' });
  const positions = new Set();
  for (let index = 0; index < 100; index++) {
    const part = createManualPart(fields({ name: `Group ${index + 1}`, origin: `Mount ${index + 1}`, tray: `Bag ${index + 1}`, count: index % 4 + 1 }), `group-${index}`, index);
    positions.add(JSON.stringify(part.originCm));
    state = act(state, { type: 'recordPart', part });
  }
  assert.equal(positions.size, 100);
  assert.equal(state.parts.length, LIMITS.parts);
  state = act(state, { type: 'undoRemoval' });
  state = act(state, { type: 'recordPart', part: createManualPart(fields({ name: 'Corrected group', origin: 'Last mount', tray: 'Last bag' }), 'replacement', 99) });
  state = act(state, { type: 'beginReturn' });
  state = act(state, { type: 'pause' }); state = parseSession(serializeSession(state)); state = act(state, { type: 'resume' });
  assert.equal(manualReferences(nextPart(state)).origin, 'Last mount');
  for (let index = 0; index < 100; index++) {
    const next = nextPart(state); state = act(state, { type: 'selectReturn', partId: next.id });
    state = act(state, { type: 'confirmReturn', partId: next.id, count: next.count });
  }
  assert.equal(state.phase, 'complete');
  state = act(state, { type: 'undoReturn' }); assert.equal(manualReferences(nextPart(state)).origin, 'Mount 1');
  state = act(state, { type: 'reset' }); assert.equal(isManualJob(state), true); assert.equal(state.parts.length, 0);
});

test('mode survives empty-job reset, imported identity and a cloud-style snapshot round trip', () => {
  const job = createSession({ id: sessionIdForMode(true, 'new-job') }, 1000);
  assert.equal(isManualJob(job), true);
  assert.equal(isManualJob(parseSession(serializeSession(job))), true);
  assert.equal(importedSessionIdentity(job, 'copy'), 'job-copy');
  const old = { id: 'bench-old', parts: [{ id: 'unknown' }] };
  assert.equal(isManualJob(old), true); assert.equal(importedSessionIdentity(old, 'copy'), 'job-copy');
  const fixture = { id: 'bench-practice', parts: FIXTURE };
  assert.equal(isManualJob(fixture), false); assert.equal(importedSessionIdentity(fixture, 'copy'), 'bench-copy');
  const view = cameraViewForSession(job);
  assert.equal(view.custom, true); assert.ok(Number.isFinite(view.distance));
});

const source = await readFile(new URL('../web/app.js', import.meta.url), 'utf8');
function shipped(begin, end) {
  const start = source.indexOf(begin), stop = source.indexOf(end, start);
  assert.ok(start >= 0 && stop > start, 'shipped handler boundary exists'); return source.slice(start, stop);
}
function browserHarness() {
  const elements = new Map(), notices = []; let uuid = 0;
  function element() { return { value: '', hidden: false, files: [], children: [], dataset: {}, classList: { toggle() {} }, append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = [...items]; }, setAttribute() {}, listeners: new Map(), addEventListener(type, handler) { this.listeners.set(type, handler); }, focus() {}, select() {}, setCustomValidity() {}, reportValidity() { return true; }, showModal() {}, close() {}, querySelectorAll() { return []; } }; }
  const $ = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
  const context = vm.createContext({
    state: createSession({ id: 'bench-initial' }, 1000), revision: null, lastSavedJson: null, selectedPartId: null, selectedTrayId: null,
    createSession, applyCommand, nextPart, serializeSession, parseSession, LIMITS, progress, FIXTURE, TRAYS, trayName, samePosition, formatCm,
    isManualJob, createManualPart, manualReferences, partDisplayName, sessionIdForMode, importedSessionIdentity,
    crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++uuid).padStart(12, '0')}` },
    id: () => `bench-example-${++uuid}`, networkBusy: false, booting: false, $, now: () => Math.max(Date.now(), context.state.updatedAt),
    notice: (message, kind) => notices.push({ message, kind }), clearNotice() {}, render() {}, isUnprotected: () => false, confirmAction: async () => true,
  });
  $('manual-part-form').reset = () => { for (const key of ['name', 'origin', 'tray', 'note']) $(`manual-${key}`).value = ''; $('manual-count').value = '1'; };
  vm.runInContext(shipped('function transition(', '\nfunction selectedRecord('), context);
  vm.runInContext(shipped('function useSnapshot(', '// A tab-scoped recovery'), context);
  vm.runInContext(shipped('function openNew()', '$(' + '"export-session").addEventListener'), context);
  vm.runInContext(shipped('function recordManualPart(', '$(' + '"begin-return").addEventListener'), context);
  vm.runInContext(shipped('$(' + '"begin-return").addEventListener', '$(' + '"reset-view").addEventListener'), context);
  vm.runInContext(shipped('$(' + '"import-file").addEventListener', '$(' + '"auth-open").addEventListener'), context);
  vm.runInContext(shipped('$(' + '"load-example").addEventListener', '$(' + '"auth-switch").addEventListener'), context);
  return { context, $, notices, event: { preventDefault() {} }, async trigger(id, type = 'click') { return $(id).listeners.get(type)?.({ preventDefault() {} }); } };
}

test('shipped custom new/record/confirm/import handlers keep named references and never bypass return guards', async () => {
  const h = browserHarness(), c = h.context;
  c.openNew(); assert.equal(h.$('new-kind').value, 'custom'); assert.equal(h.$('new-title').value, 'My repair job');
  await h.trigger('new-form', 'submit'); assert.ok(c.state.id.startsWith('job-'));
  c.transition({ type: 'start' });
  const fill = values => { for (const [key, value] of Object.entries(values)) h.$(`manual-${key}`).value = String(value); };
  fill(fields({})); await h.trigger('manual-part-form', 'submit');
  fill(fields({ name: 'Panel', origin: 'Rear panel', tray: 'White bag', count: 1, note: '' })); await h.trigger('manual-part-form', 'submit');
  assert.equal(c.state.parts.length, 2); assert.notEqual(c.state.parts[0].id, c.state.parts[1].id);
  fill(fields({ count: 101 })); await h.trigger('manual-part-form', 'submit');
  assert.equal(c.state.parts.length, 2); assert.equal(h.$('manual-error').hidden, false);
  await h.trigger('begin-return');
  const first = c.state.parts[0], last = c.state.parts[1];
  assert.equal(c.transition({ type: 'selectReturn', partId: first.id }), false);
  assert.match(h.notices.at(-1).message, /Panel from White bag/);
  c.transition({ type: 'selectReturn', partId: last.id });
  h.$('confirm-count').value = '2'; await h.trigger('confirm-form', 'submit'); assert.equal(c.state.returnedCount, 0);
  h.$('confirm-count').value = '1'; await h.trigger('confirm-form', 'submit'); assert.equal(c.state.returnedCount, 1);
  await h.trigger('pause-session'); await h.trigger('resume-session'); assert.equal(nextPart(c.state).id, first.id);
  await h.trigger('undo-action'); assert.equal(nextPart(c.state).id, last.id);
  const exported = serializeSession(c.state), oldId = c.state.id;
  h.$('import-file').files = [{ size: exported.length, text: async () => exported }]; await h.trigger('import-file', 'change');
  assert.ok(c.state.id.startsWith('job-')); assert.notEqual(c.state.id, oldId);
  assert.equal(manualReferences(c.state.parts[0]).origin, 'Upper left hinge mount');
  assert.equal(manualReferences(c.state.parts[0]).note, 'Keep washers together');
  const restored = parseSession(serializeSession(c.state)); c.useSnapshot(restored, 8);
  assert.equal(isManualJob(c.state), true); assert.equal(c.revision, 8);
  await h.trigger('reset-session'); assert.equal(c.state.phase, 'setup'); assert.equal(isManualJob(c.state), true);
});

test('shipped practice example loads all four records and New session can still choose practice', async () => {
  const h = browserHarness(); await h.trigger('load-example');
  assert.equal(h.context.state.phase, 'returning'); assert.equal(h.context.state.parts.length, 4);
  assert.equal(isManualJob(h.context.state), false);
  h.context.openNew(); h.$('new-kind').value = 'practice'; await h.trigger('new-kind', 'change');
  await h.trigger('new-form', 'submit');
  assert.ok(h.context.state.id.startsWith('bench-')); assert.equal(h.context.state.title, 'Mechanical enclosure');
});

test('actual render shows named manual references, limits the form, and puts the next custom return first', () => {
  const h = browserHarness(), c = h.context;
  const makeNode = (tag, className, text) => ({ tag, className, textContent: text, children: [], dataset: {}, classList: { toggle() {} },
    append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = [...children]; }, setAttribute() {}, addEventListener() {} });
  c.node = makeNode;
  c.document = { activeElement: null, querySelector: () => ({ classList: { toggle() {} } }) };
  Object.assign(c, { booting: false, user: null, cloud: false, initialDraft: null, storageName: 'test storage', isDirty: () => true, rememberDraft() {}, benchScene: { update() {} } });
  vm.runInContext(shipped('function occupiedTray(', 'function makePartButton('), c);
  vm.runInContext(shipped('function makePartButton(', 'function selectPart('), c);
  vm.runInContext(shipped('function render()', 'function openAuth('), c);
  c.state = createSession({ id: 'job-render' }, 1000); c.state = act(c.state, { type: 'start' });
  for (let index = 0; index < 100; index++) c.state = act(c.state, { type: 'recordPart', part: createManualPart(fields({ name: `Group ${index}`, origin: `Mount ${index}`, tray: `Bag ${index}` }), `render-${index}`, index) });
  c.render();
  assert.equal(h.$('scene-mode').textContent, 'Job diagram');
  assert.equal(h.$('scene-input').textContent, 'positions illustrative');
  assert.equal(h.$('practice-record-fields').hidden, true);
  assert.equal(h.$('manual-part-form').hidden, false);
  assert.equal(h.$('record-manual-part').disabled, true);
  assert.equal(h.$('manual-limit').hidden, false);
  c.state = act(c.state, { type: 'beginReturn' }); c.render();
  assert.equal(h.$('next-label').textContent, 'Group 99');
  assert.equal(h.$('next-origin').textContent, 'Mount 99');
  assert.match(h.$('next-tray').textContent, /Bag 99/);
  assert.equal(h.$('next-note').textContent, 'Keep washers together');
  assert.ok(!h.$('next-note').textContent.includes('J1 Origin['));
  assert.equal(h.$('return-parts').children.length, 100);
  assert.equal(h.$('return-parts').children[0].dataset.partId, 'part-render-99');
  assert.match(h.$('return-parts').children[0].className, /next-return/);
  assert.match(h.$('next-coordinates').textContent, /illustrative, not measurements/);
});
