import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from 'three';
import { cameraViewForSession, routeControlPoints } from '../web/scene-view.js';
import { FIXTURE, TRAYS } from '../web/fixture.js';

const source = await readFile(new URL('../web/scene.js', import.meta.url), 'utf8');
const actualFunction = (begin, end) => {
  const start = source.indexOf(begin), stop = source.indexOf(end, start);
  assert.ok(start >= 0 && stop > start, 'production scene boundary exists');
  return source.slice(start, stop);
};
const part = { id: 'custom-washer', originCm: { x: -20, y: 3, z: 0 }, trayCm: { x: 20, y: 2, z: 0 } };

test('actual scene update clears cues while paused and restores the same pair on resume', () => {
  const routes = [], markers = [], parts = new Map();
  const context = vm.createContext({
    parts, FIXTURE: [], TRAYS: [], sceneState: null, fitView() {},
    makePart(id) { parts.set(id, { group: { visible: true }, target: { set() {} } }); },
    clearMarkers() { markers.length = 0; },
    route(origin, tray) { markers.push('route'); routes.push([origin, tray]); },
    ring() { markers.push('ring'); }, invalidate() {},
  });
  vm.runInContext(actualFunction('  function update(state,', '  return { update, reset };'), context);
  const session = { phase: 'returning', resumePhase: null, parts: [part], returnedCount: 0 };
  context.update(session, null, null);
  assert.equal(markers.length, 1);
  context.update({ ...session, phase: 'paused', resumePhase: 'returning' }, null, null);
  assert.equal(markers.length, 0, 'pause removes active route and rings');
  context.update(session, null, null);
  assert.equal(markers.length, 1);
  assert.equal(routes.at(-1)[0], part.originCm);
  assert.equal(routes.at(-1)[1], part.trayCm);
  context.update({ ...session, phase: 'paused', resumePhase: 'recording' }, null, null);
  assert.equal(markers.length, 0, 'recording interruption hides its last mark too');
  context.update({ ...session, phase: 'complete', returnedCount: 1 }, null, null);
  assert.equal(markers.length, 0, 'completion removes work cues');
});

test('authored fixture preserves its original view instead of fitting every normal selection', () => {
  for (const aspect of [0.7, 1.35, 2.4]) {
    const state = { parts: FIXTURE.map((p, i) => ({ ...p, trayCm: TRAYS[i].position })) };
    const view = cameraViewForSession(state, aspect);
    assert.equal(view.custom, false);
    assert.deepEqual(view.target, { x: 1, y: 0, z: 0 });
    assert.equal(view.distance, 154);
    assert.equal(view.far, 600);
    assert.equal(view.zoom, Math.min(1, aspect / 1.35));
  }
});

test('imported extreme cm positions and the full route fit inside the camera after reset or resize', () => {
  const extremes = [
    [{ x: 800, y: 0, z: 0 }, { x: 900, y: 0, z: 0 }],
    [{ x: -1000, y: -1000, z: -1000 }, { x: 1000, y: 1000, z: 1000 }],
    [{ x: 1000, y: -1000, z: 1000 }, { x: -1000, y: 1000, z: -1000 }],
    [{ x: 0, y: -1000, z: 0 }, { x: 0, y: -900, z: 0 }],
  ];
  for (const [originCm, trayCm] of extremes) for (const aspect of [0.1, 0.5, 1, 1.35, 2.4]) {
    const view = cameraViewForSession({ parts: [{ ...part, originCm, trayCm }] }, aspect);
    assert.equal(view.custom, true);
    assert.ok(Number.isFinite(view.distance) && view.distance < 100000);
    assert.ok(view.fogNear > view.maxDistance);
    const target = new THREE.Vector3(...Object.values(view.target));
    const camera = new THREE.PerspectiveCamera(34, aspect, 0.1, view.far);
    camera.position.set(target.x + Math.sin(0.36) * Math.cos(0.84) * view.distance,
      target.y + Math.sin(0.84) * view.distance, target.z + Math.cos(0.36) * Math.cos(0.84) * view.distance);
    camera.lookAt(target); camera.updateMatrixWorld();
    const curve = new THREE.CatmullRomCurve3(routeControlPoints(originCm, trayCm).map(p => new THREE.Vector3(p.x, p.y, p.z)));
    for (const point of [originCm, trayCm, ...curve.getPoints(100)]) {
      const ndc = new THREE.Vector3(point.x, point.y, point.z).project(camera);
      assert.ok(Math.abs(ndc.x) < 1 && Math.abs(ndc.y) < 1 && ndc.z > -1 && ndc.z < 1,
        `saved point/path stays visible at aspect${aspect}: ${JSON.stringify(ndc)}`);
    }
  }
});

test('second touch cannot replace an orbit gesture or accidentally select a part', () => {
  const listeners = new Map(), selections = [];
  const context = vm.createContext({
    THREE: { ...THREE, Raycaster: class { setFromCamera() {} intersectObjects() { return [{ object: { userData: { partId: 'custom' } } }]; } } },
    canvas: { addEventListener: (type, fn) => listeners.set(type, fn), setPointerCapture() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }) },
    angle: 0.36, elevation: 0.84, camera: {}, pickables: [], moveCamera() {}, invalidate() {},
    onPart: id => selections.push(id), onTray() {},
  });
  vm.runInContext(actualFunction('  const raycaster =', '  canvas.addEventListener(\n    "wheel",'), context);
  const event = (pointerId, x) => ({ pointerId, button: 0, clientX: x, clientY: 40 });
  listeners.get('pointerdown')(event(1, 40));
  listeners.get('pointermove')(event(1, 70));
  listeners.get('pointerdown')(event(2, 100));
  listeners.get('pointerup')(event(2, 100));
  listeners.get('pointermove')(event(1, 80));
  listeners.get('pointerup')(event(1, 80));
  assert.deepEqual(selections, [], 'a two-finger interruption cannot turn a drag into a click');
  listeners.get('pointerdown')(event(3, 100)); listeners.get('pointerup')(event(3, 100));
  assert.deepEqual(selections, ['custom'], 'a subsequent intentional tap still selects');
});

test('actual fit/reset handlers apply imported bounds, preserve orbit between selections and refit on resize', () => {
  const camera = new THREE.PerspectiveCamera(34, 1.35, 0.1, 600);
  const target = new THREE.Vector3(1, 0, 0);
  const c = vm.createContext({
    THREE, camera, target, scene: { fog: { near: 170, far: 310 } },
    fittedView: cameraViewForSession({ parts: [] }), fittedSessionId: null, viewKey: null,
    angle: 0.36, elevation: 0.84, distance: 154, cameraViewForSession,
    invalidate() {}, moveCamera() {
      camera.position.set(target.x + Math.sin(c.angle) * Math.cos(c.elevation) * c.distance,
        target.y + Math.sin(c.elevation) * c.distance, target.z + Math.cos(c.angle) * Math.cos(c.elevation) * c.distance);
      camera.lookAt(target); camera.updateMatrixWorld();
    },
  });
  vm.runInContext(actualFunction('  function fitView(', '  function update(state,'), c);
  const state = { id: 'imported-bench', parts: [{ ...part, originCm: { x: 800, y: 1000, z: -1000 }, trayCm: { x: 900, y: -1000, z: 1000 } }] };
  c.fitView(state);
  assert.ok(camera.far > 600);
  const required = cameraViewForSession(state, camera.aspect);
  assert.deepEqual(target.toArray(), Object.values(required.target));
  c.distance *= 1.5; c.angle = 0.9;
  c.fitView({ ...state, pendingReturnId: part.id });
  assert.equal(c.angle, 0.9);
  assert.equal(c.distance, required.distance * 1.5, 'selection does not reset an intentionally adjusted view');
  c.reset();
  assert.equal(c.distance, required.distance);
  assert.equal(c.angle, 0.36);
  camera.aspect = 0.5; c.fitView(state, true);
  const resized = cameraViewForSession(state, 0.5);
  assert.equal(c.distance, resized.distance);
  assert.equal(camera.zoom, 1);
  assert.equal(camera.far, resized.far);
  const normal = { id: 'normal', parts: [] };
  c.fitView(normal); c.distance = 200;
  c.fitView({ ...normal, parts: [{ ...FIXTURE[0], trayCm: TRAYS[0].position }] });
  assert.equal(c.distance, 200, 'recording the fixture preserves a chosen zoom');
});
