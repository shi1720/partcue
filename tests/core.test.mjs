import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, applyCommand, nextPart, progress, serializeSession, parseSession, validateSession, LIMITS } from '../dist/core/index.js';

const part = (id, count = 1) => ({ id, label: `Part ${id}`, originCm: { x: 1, y: 2, z: 3 }, trayCm: { x: 20, y: 0, z: 10 }, count });
function fixture() {
  let state = createSession({ id: 'bench-1', title: 'Battery-free ratchet' }, 1000);
  let time = 1000;
  return {
    get state() { return state; },
    act(command) {
      const result = applyCommand(state, command, ++time);
      assert.equal(result.ok, true, result.ok ? '' : JSON.stringify(result.error));
      state = result.state;
      assert.equal(validateSession(state).valid, true, validateSession(state).errors.join('; '));
      return state;
    },
    reject(command, code) {
      const before = serializeSession(state);
      const result = applyCommand(state, command, ++time);
      assert.equal(result.ok, false);
      assert.equal(result.error.code, code);
      assert.equal(result.state, state);
      assert.equal(serializeSession(state), before);
      return result.error;
    }
  };
}
function recording(...parts) {
  const f = fixture(); f.act({ type: 'start' });
  parts.forEach(p => f.act({ type: 'recordPart', part: p }));
  return f;
}
function returnPart(f, id, count = 1) {
  f.act({ type: 'selectReturn', partId: id });
  f.act({ type: 'confirmReturn', partId: id, count });
}

test('full three-part teardown returns strictly in reverse order with explicit quantity confirmation', () => {
  const f = recording(part('cover'), part('washers', 3), part('spindle'));
  assert.deepEqual(progress(f.state), { totalGroups: 3, returnedGroups: 0, remainingGroups: 3, totalPieces: 5, remainingPieces: 5, fraction: 0 });
  f.act({ type: 'beginReturn' });
  assert.equal(nextPart(f.state).id, 'spindle');
  const hint = f.reject({ type: 'selectReturn', partId: 'cover' }, 'WRONG_PART');
  assert.match(hint.recovery, /Part spindle/);
  f.reject({ type: 'confirmReturn', partId: 'spindle', count: 1 }, 'CONFIRM_REQUIRED');
  f.act({ type: 'selectReturn', partId: 'spindle' });
  f.reject({ type: 'confirmReturn', partId: 'cover', count: 1 }, 'WRONG_PART');
  f.reject({ type: 'confirmReturn', partId: 'spindle', count: 2 }, 'WRONG_COUNT');
  f.act({ type: 'confirmReturn', partId: 'spindle', count: 1 });
  assert.equal(nextPart(f.state).id, 'washers');
  returnPart(f, 'washers', 3);
  assert.equal(progress(f.state).remainingPieces, 1);
  returnPart(f, 'cover');
  assert.equal(f.state.phase, 'complete');
  assert.equal(nextPart(f.state), null);
  assert.equal(progress(f.state).fraction, 1);
  f.reject({ type: 'selectReturn', partId: 'cover' }, 'WRONG_PHASE');
});

test('interruption restores the exact next part and requires a fresh confirmation', () => {
  const f = recording(part('a'), part('b'));
  f.act({ type: 'pause' });
  assert.equal(f.state.resumePhase, 'recording');
  f.reject({ type: 'recordPart', part: part('c') }, 'WRONG_PHASE');
  f.act({ type: 'resume' });
  f.act({ type: 'beginReturn' });
  returnPart(f, 'b');
  f.act({ type: 'selectReturn', partId: 'a' });
  f.act({ type: 'pause' });
  assert.equal(f.state.pendingReturnId, null);
  const restored = parseSession(serializeSession(f.state));
  assert.equal(restored.resumePhase, 'returning');
  const resumed = applyCommand(restored, { type: 'resume' }, 2000);
  assert.equal(resumed.ok, true);
  assert.equal(nextPart(resumed.state).id, 'a');
  assert.equal(applyCommand(resumed.state, { type: 'confirmReturn', partId: 'a', count: 1 }, 2001).error.code, 'CONFIRM_REQUIRED');
});

test('undo removal removes only the latest record and permits re-recording its id', () => {
  const f = recording(part('a'), part('b'));
  f.act({ type: 'undoRemoval' });
  assert.deepEqual(f.state.parts.map(p => p.id), ['a']);
  f.act({ type: 'recordPart', part: part('b', 2) });
  f.act({ type: 'beginReturn' });
  f.reject({ type: 'undoRemoval' }, 'WRONG_PHASE');
  assert.equal(nextPart(f.state).count, 2);
});

test('undo return reopens completed sessions and preserves reverse-order consistency', () => {
  const f = recording(part('a'), part('b'));
  f.act({ type: 'beginReturn' });
  f.reject({ type: 'undoReturn' }, 'EMPTY');
  returnPart(f, 'b'); returnPart(f, 'a');
  f.act({ type: 'undoReturn' });
  assert.equal(f.state.phase, 'returning');
  assert.equal(nextPart(f.state).id, 'a');
  f.reject({ type: 'confirmReturn', partId: 'a', count: 1 }, 'CONFIRM_REQUIRED');
  f.act({ type: 'undoReturn' });
  assert.equal(nextPart(f.state).id, 'b');
  assert.equal(progress(f.state).returnedGroups, 0);
});

test('reset clears work and pending confirmation while retaining an auditable reset event', () => {
  const f = recording(part('a'));
  f.act({ type: 'beginReturn' });
  f.act({ type: 'selectReturn', partId: 'a' });
  f.act({ type: 'reset' });
  assert.equal(f.state.phase, 'setup');
  assert.deepEqual(f.state.parts, []);
  assert.equal(f.state.pendingReturnId, null);
  assert.equal(f.state.events.at(-1).type, 'reset');
  f.act({ type: 'start' });
  f.act({ type: 'recordPart', part: part('a') });
});

test('commands do not mutate snapshots or retain externally mutable input coordinates', () => {
  const f = recording();
  const before = f.state;
  const beforeJson = serializeSession(before);
  const input = part('a');
  f.act({ type: 'recordPart', part: input });
  input.originCm.x = 999; input.trayCm.z = 888;
  assert.equal(serializeSession(before), beforeJson);
  assert.equal(f.state.parts[0].originCm.x, 1);
  assert.equal(f.state.parts[0].trayCm.z, 10);
});

test('invalid part data and duplicates are rejected without losing recorded work', () => {
  const f = recording(part('a'));
  for (const bad of [
    { ...part('b'), originCm: { x: Infinity, y: 0, z: 0 } },
    { ...part('b'), trayCm: { x: NaN, y: 0, z: 0 } },
    { ...part('b'), originCm: { x: 1001, y: 0, z: 0 } },
    { ...part('b'), count: 0 }, { ...part('b'), count: 1.2 }, { ...part('b'), count: 101 },
    { ...part('b'), id: '../../b' }, { ...part('b'), label: '   ' },
    { ...part('b'), label: 'x'.repeat(65) }, { ...part('b'), note: 'bad\ntext' },
    { ...part('b'), originCm: { x: 0, y: 0, z: 0, unit: 'metres' } },
    null
  ]) f.reject({ type: 'recordPart', part: bad }, 'INVALID_INPUT');
  f.reject({ type: 'recordPart', part: part('a') }, 'DUPLICATE_ID');
  assert.equal(f.state.parts.length, 1);
});

test('phase guards prevent empty return, accidental repeated start, and actions while paused', () => {
  const f = fixture();
  f.reject({ type: 'recordPart', part: part('a') }, 'WRONG_PHASE');
  f.reject({ type: 'resume' }, 'WRONG_PHASE');
  f.act({ type: 'start' });
  f.reject({ type: 'start' }, 'WRONG_PHASE');
  f.reject({ type: 'undoRemoval' }, 'EMPTY');
  f.reject({ type: 'beginReturn' }, 'EMPTY');
  f.act({ type: 'pause' });
  f.reject({ type: 'beginReturn' }, 'WRONG_PHASE');
});

test('timestamps are deterministic, nonnegative, integral and monotonic', () => {
  const f = fixture();
  for (const now of [-1, 999, 1000.5, Infinity, NaN, 8_640_000_000_000_001]) {
    const result = applyCommand(f.state, { type: 'start' }, now);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'INVALID_TIME');
    assert.equal(result.state, f.state);
  }
  const result = applyCommand(f.state, { type: 'start' }, 1000);
  assert.equal(result.ok, true);
  assert.equal(result.state.updatedAt, 1000);
});

test('ids reject trailing line terminators in setup, part input and restored snapshots', () => {
  for (const suffix of ['\n', '\r', '\u2028', '\u2029']) {
    assert.throws(() => createSession({ id: `bench${suffix}` }, 1000));
    const f = recording();
    f.reject({ type: 'recordPart', part: part(`a${suffix}`) }, 'INVALID_INPUT');
    const corrupted = JSON.parse(serializeSession(f.state));
    corrupted.id += suffix;
    assert.throws(() => parseSession(JSON.stringify(corrupted)), /Invalid snapshot/);
  }
});

test('snapshot round trip preserves the complete state and separates object identity', () => {
  const f = recording(part('a', 4), { ...part('b'), note: 'Keep the flat face outward' });
  f.act({ type: 'beginReturn' });
  f.act({ type: 'selectReturn', partId: 'b' });
  const restored = parseSession(serializeSession(f.state));
  assert.deepEqual(restored, f.state);
  restored.parts[0].originCm.x = 999;
  assert.equal(f.state.parts[0].originCm.x, 1);
});

test('malformed, unsupported, oversized or inconsistent snapshots fail closed', () => {
  const f = recording(part('a'), part('b'));
  const corruptions = [
    s => { s.schemaVersion = 2; }, s => { s.units = 'm'; }, s => { s.unexpected = true; },
    s => { s.parts[1].id = 'a'; }, s => { s.parts[0].count = -1; },
    s => { s.parts[0].originCm.x = null; }, s => { s.parts[0].trayCm.z = 1001; },
    s => { s.returnedCount = 1; }, s => { s.returnedCount = 99; },
    s => { s.phase = 'complete'; }, s => { s.phase = 'paused'; s.resumePhase = null; },
    s => { s.pendingReturnId = 'b'; }, s => { s.resumePhase = 'returning'; },
    s => { s.parts[1].removedAt = 0; }, s => { s.createdAt = s.updatedAt + 1; },
    s => { s.events[0].seq = 999; }, s => { s.events[0].at = -1; },
    s => { s.events.at(-1).at = 1000; }, s => { s.events = []; }
  ];
  for (const corrupt of corruptions) {
    const value = JSON.parse(serializeSession(f.state)); corrupt(value);
    assert.equal(validateSession(value).valid, false, JSON.stringify(value));
    assert.throws(() => parseSession(JSON.stringify(value)), /Invalid snapshot/);
    assert.equal(applyCommand(value, { type: 'reset' }, 3000).error.code, 'INVALID_STATE');
  }
  for (const json of ['null', '[]', '{}', '{broken', ' '.repeat(LIMITS.snapshotBytes + 1)]) assert.throws(() => parseSession(json));
});

test('bounded event log retains the latest actions and restores after truncation', () => {
  const f = recording(part('a'));
  for (let index = 0; index < 110; index++) {
    f.act({ type: 'pause' }); f.act({ type: 'resume' });
  }
  assert.equal(f.state.events.length, LIMITS.events);
  assert.ok(f.state.events[0].seq > 1);
  assert.equal(f.state.events.at(-1).seq, f.state.eventSeq);
  assert.deepEqual(parseSession(serializeSession(f.state)), f.state);
});

test('session part cap is enforced and coordinate boundary values remain centimetres', () => {
  const f = recording();
  for (let i = 0; i < LIMITS.parts; i++) f.act({ type: 'recordPart', part: { ...part(`p${i}`), originCm: { x: -1000, y: 1000, z: 0 } } });
  f.reject({ type: 'recordPart', part: part('overflow') }, 'LIMIT');
  assert.equal(f.state.units, 'cm');
  assert.equal(f.state.parts[0].originCm.x, -1000);
});

test('a long deterministic workflow maintains invariants through undo, interruption and restore', () => {
  const f = recording();
  for (let i = 0; i < 20; i++) {
    f.act({ type: 'recordPart', part: part(`p${i}`, (i % 3) + 1) });
    if (i % 4 === 0) { f.act({ type: 'undoRemoval' }); f.act({ type: 'recordPart', part: part(`p${i}`, (i % 3) + 1) }); }
  }
  f.act({ type: 'beginReturn' });
  for (let i = 19; i >= 0; i--) {
    if (i % 5 === 0) { f.act({ type: 'pause' }); assert.equal(validateSession(parseSession(serializeSession(f.state))).valid, true); f.act({ type: 'resume' }); }
    returnPart(f, `p${i}`, (i % 3) + 1);
    if (i % 3 === 0) { f.act({ type: 'undoReturn' }); returnPart(f, `p${i}`, (i % 3) + 1); }
  }
  assert.equal(f.state.phase, 'complete');
  assert.equal(progress(f.state).remainingPieces, 0);
});
