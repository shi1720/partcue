import * as THREE from "three";
import { FIXTURE, TRAYS } from "./fixture.js";

/** Procedural, simulated workbench. All stored positions use centimetres. */
export function createBenchScene(canvas, { onPart, onTray, onUnavailable }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
  } catch {
    onUnavailable();
    return { update() {}, reset() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x101e2a);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x101e2a, 170, 310);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 600);
  const target = new THREE.Vector3(1, 0, 0);
  let angle = 0.36,
    elevation = 0.84,
    distance = 154;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const ambient = new THREE.HemisphereLight(0xb4dce4, 0x102631, 2.6);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xf5f6e8, 4);
  key.position.set(-30, 95, 50);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -80;
  key.shadow.camera.right = 80;
  key.shadow.camera.top = 70;
  key.shadow.camera.bottom = -70;
  key.shadow.normalBias = 0.05;
  key.shadow.bias = -0.0002;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x68e0d9, 3.3);
  rim.position.set(30, 22, -60);
  scene.add(rim);
  const fill = new THREE.PointLight(0xffb66b, 45, 170, 1);
  fill.position.set(48, 35, 20);
  scene.add(fill);
  const material = (color, options = {}) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.56,
      metalness: 0.18,
      ...options,
    });
  const floorMat = material(0x172b36, { roughness: 0.95, metalness: 0.12 });
  const edgeMat = material(0x263d47, { roughness: 0.6 });
  const baseMat = material(0x435764, { metalness: 0.52, roughness: 0.44 });
  const metalMat = material(0xa9b9b9, { metalness: 0.86, roughness: 0.3 });
  const darkMat = material(0x132b33, { metalness: 0.45 });
  const goldMat = material(0xe4aa5d, { metalness: 0.62, roughness: 0.32 });
  const mintMat = material(0x67b9b1, { roughness: 0.44, metalness: 0.5 });
  function box(parent, w, h, d, mat, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(
    parent,
    radius,
    h,
    mat,
    x = 0,
    y = 0,
    z = 0,
    segments = 32,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, h, segments),
      mat,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  // Bevelled corners are represented with layered plates: all assets are procedural.
  box(scene, 124, 1.8, 88, floorMat, 1, -2.6, 0);
  box(scene, 125, 0.5, 89, edgeMat, 1, -3.6, 0);
  const grid = new THREE.GridHelper(120, 24, 0x34525a, 0x27424b);
  grid.position.set(1, -1.64, 0);
  grid.material.transparent = true;
  grid.material.opacity = 0.37;
  scene.add(grid);
  const boardOutline = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(124, 1.8, 88),
  );
  const edges = new THREE.LineSegments(
    boardOutline,
    new THREE.LineBasicMaterial({
      color: 0x49616a,
      transparent: true,
      opacity: 0.35,
    }),
  );
  edges.position.set(1, -2.6, 0);
  scene.add(edges);
  // Left: a non-powered mechanical enclosure with a dark recessed cavity.
  const device = new THREE.Group();
  device.position.set(-22, 0, 0);
  scene.add(device);
  box(device, 24, 1.9, 26, baseMat, 0, -0.15, 0);
  box(device, 22.7, 0.35, 24.7, darkMat, 0, 0.98, 0);
  box(device, 24, 4.1, 1.3, baseMat, 0, 2, -12.35);
  box(device, 24, 4.1, 1.3, baseMat, 0, 2, 12.35);
  box(device, 1.3, 4.1, 24, baseMat, -11.35, 2, 0);
  box(device, 1.3, 4.1, 24, baseMat, 11.35, 2, 0);
  [-9.6, 9.6].forEach((x) =>
    [-10.8, 10.8].forEach((z) => {
      cylinder(device, 0.9, 3.5, metalMat, x, 1.8, z);
      cylinder(device, 0.4, 0.2, darkMat, x, 3.65, z);
    }),
  );
  for (let n = 0; n < 7; n++)
    box(device, 0.16, 0.07, 1.2, mintMat, -6 + n * 2, 4.11, 12.4);
  box(device, 10, 0.2, 1.4, mintMat, 0, -0.7, 13.1);
  const pickables = [];
  const trayGroups = new Map();
  const trayMat = material(0x29404a, { roughness: 0.76, metalness: 0.2 });
  const trayWellMat = material(0x192e38, { roughness: 0.9 });
  TRAYS.forEach((tray, index) => {
    const group = new THREE.Group();
    group.position.set(tray.position.x, 0, tray.position.z);
    group.userData = { trayId: tray.id };
    scene.add(group);
    trayGroups.set(tray.id, group);
    box(group, 21, 0.8, 23, trayMat, 0, -0.3, 0);
    box(group, 19, 0.25, 21, trayWellMat, 0, 0.22, 0);
    box(group, 21, 1.8, 0.7, trayMat, 0, 0.5, -11.15);
    box(group, 21, 1.8, 0.7, trayMat, 0, 0.5, 11.15);
    box(group, 0.7, 1.8, 21.6, trayMat, -10.15, 0.5, 0);
    box(group, 0.7, 1.8, 21.6, trayMat, 10.15, 0.5, 0);
    // A–D appear as a small number of amber identity ticks on the tray lip.
    for (let i = 0; i <= index; i++)
      box(group, 0.6, 0.15, 1.6, goldMat, -2 + i * 1.4, 1.47, 10.8);
    const hit = box(
      group,
      21,
      0.1,
      23,
      new THREE.MeshBasicMaterial({ visible: false }),
      0,
      1.8,
      0,
    );
    hit.userData = { trayId: tray.id };
    pickables.push(hit);
  });
  const parts = new Map();
  function makePart(id, index = 0) {
    const group = new THREE.Group();
    group.userData = { partId: id };
    scene.add(group);
    if (id.startsWith("screw-")) {
      const long = id === "screw-long";
      cylinder(group, 0.62, long ? 4.7 : 2.8, metalMat, 0, long ? 0.1 : 0.7, 0);
      cylinder(group, 1.55, 0.85, metalMat, 0, 2.2, 0);
      box(group, 2.1, 0.09, 0.31, darkMat, 0, 2.65, 0);
      box(group, 0.31, 0.09, 2.1, darkMat, 0, 2.65, 0);
      for (let i = 0; i < 5; i++)
        cylinder(group, 0.73, 0.12, baseMat, 0, -0.9 + i * 0.48, 0);
    } else if (id === "lid") {
      const lidMat = material(0x70858c, {
        metalness: 0.6,
        roughness: 0.36,
        transparent: true,
        opacity: 0.77,
      });
      box(group, 18.7, 0.9, 20.9, lidMat);
      box(
        group,
        16.8,
        0.24,
        18.9,
        material(0x5b7a80, {
          metalness: 0.48,
          roughness: 0.4,
          transparent: true,
          opacity: 0.58,
        }),
        0,
        0.58,
        0,
      );
      for (let i = 0; i < 6; i++)
        box(group, 7.8, 0.08, 0.25, darkMat, 0, 0.76, -3.1 + i * 1.25);
      [
        [-8, -8],
        [8, 8],
      ].forEach(([x, z]) => {
        cylinder(group, 1.15, 0.09, darkMat, x, 0.52, z);
        cylinder(group, 0.65, 0.1, baseMat, x, 0.59, z);
      });
    } else if (id === "module") {
      box(group, 12.5, 1.1, 12.8, mintMat);
      box(group, 11, 0.6, 11.3, darkMat, 0, 0.85, 0);
      cylinder(group, 3.5, 1.1, goldMat, -2.5, 1.8, -1.8);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const tooth = box(
          group,
          1.1,
          1,
          1,
          goldMat,
          -2.5 + Math.cos(a) * 3.65,
          1.8,
          -1.8 + Math.sin(a) * 3.65,
        );
        tooth.rotation.y = -a;
      }
      cylinder(group, 2.3, 1.2, metalMat, 3.1, 1.8, 3.2);
      cylinder(group, 0.75, 1.5, darkMat, -2.5, 2, -1.8);
      cylinder(group, 0.55, 1.5, darkMat, 3.1, 2, 3.2);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const tooth = box(
          group,
          0.8,
          1.1,
          0.8,
          metalMat,
          3.1 + Math.cos(a) * 2.4,
          1.8,
          3.2 + Math.sin(a) * 2.4,
        );
        tooth.rotation.y = -a;
      }
      cylinder(group, 0.8, 0.4, metalMat, -4.9, 1, 4.9);
      cylinder(group, 0.8, 0.4, metalMat, 4.9, 1, -4.9);
    } else {
      cylinder(group, 2.8, 2.1, index % 2 ? goldMat : mintMat);
      cylinder(group, 1.1, 2.3, darkMat);
    }
    group.traverse((child) => {
      if (child.isMesh) {
        child.userData.partId = id;
        pickables.push(child);
      }
    });
    parts.set(id, { group, target: new THREE.Vector3() });
    return parts.get(id);
  }
  FIXTURE.forEach((p, i) => {
    const mesh = makePart(p.id, i);
    mesh.group.position.set(p.originCm.x, p.originCm.y, p.originCm.z);
    mesh.target.copy(mesh.group.position);
  });
  const markerGroup = new THREE.Group();
  scene.add(markerGroup);
  // Overlay colors bypass scene tone mapping so the spatial wayfinding survives
  // screen recording, downscaling and the warm lighting on the physical bench.
  const originColor = new THREE.Color(0x20f4ef),
    trayColor = new THREE.Color(0xffad25);
  const originMat = new THREE.MeshBasicMaterial({
    color: originColor,
    transparent: true,
    opacity: 1,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const trayMarkerMat = new THREE.MeshBasicMaterial({
    color: trayColor,
    transparent: true,
    opacity: 1,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const originGlowMat = new THREE.MeshBasicMaterial({
    color: originColor,
    transparent: true,
    opacity: 0.18,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  });
  const trayGlowMat = new THREE.MeshBasicMaterial({
    color: trayColor,
    transparent: true,
    opacity: 0.18,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  });
  function ring(point, radius, mat) {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.2, 8, 80),
      mat,
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(point.x, point.y + 0.16, point.z);
    mesh.renderOrder = 7;
    markerGroup.add(mesh);
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.65, 8, 80),
      mat === originMat ? originGlowMat : trayGlowMat,
    );
    glow.rotation.copy(mesh.rotation);
    glow.position.copy(mesh.position);
    glow.renderOrder = 6;
    markerGroup.add(glow);
    const tickSize = 1.1;
    [
      [radius + 1.4, 0],
      [-radius - 1.4, 0],
      [0, radius + 1.4],
      [0, -radius - 1.4],
    ].forEach(([x, z]) => {
      const tick = box(
        markerGroup,
        x === 0 ? 0.15 : tickSize,
        0.07,
        x === 0 ? tickSize : 0.15,
        mat,
        point.x + x,
        point.y + 0.16,
        point.z + z,
      );
      tick.renderOrder = 7;
    });
  }
  function clearMarkers() {
    markerGroup.children.slice().forEach((child) => {
      markerGroup.remove(child);
      child.geometry?.dispose();
      if (child.userData.ownMaterial) child.material.dispose();
    });
  }
  function route(origin, tray) {
    ring(origin, 4.2, originMat);
    ring(tray, 5.8, trayMarkerMat);
    const from = new THREE.Vector3(tray.x, tray.y + 0.8, tray.z);
    const to = new THREE.Vector3(origin.x, origin.y + 0.8, origin.z);
    const curve = new THREE.CatmullRomCurve3([
      from,
      new THREE.Vector3(tray.x - 6, 15, tray.z),
      new THREE.Vector3(origin.x + 8, 17, origin.z),
      to,
    ]);
    const pathGeometry = new THREE.TubeGeometry(curve, 64, 0.17, 8, false);
    const colors = new Float32Array(pathGeometry.attributes.position.count * 3);
    for (let i = 0; i < pathGeometry.attributes.position.count; i++) {
      const color = trayColor.clone().lerp(originColor, Math.floor(i / 9) / 64);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    pathGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const lineMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const tube = new THREE.Mesh(pathGeometry, lineMat);
    tube.renderOrder = 5;
    tube.userData.ownMaterial = true;
    markerGroup.add(tube);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x67e8d8,
      transparent: true,
      opacity: 0.15,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.58, 8, false),
      glowMat,
    );
    glow.renderOrder = 4;
    glow.userData.ownMaterial = true;
    markerGroup.add(glow);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 16), originMat);
    tip.position.copy(to);
    tip.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      to.clone().sub(curve.getPoint(0.98)).normalize(),
    );
    tip.renderOrder = 8;
    markerGroup.add(tip);
  }
  let frame = null;
  function moveCamera() {
    camera.position.set(
      target.x + Math.sin(angle) * Math.cos(elevation) * distance,
      target.y + Math.sin(elevation) * distance,
      target.z + Math.cos(angle) * Math.cos(elevation) * distance,
    );
    camera.lookAt(target);
  }
  moveCamera();
  function draw() {
    frame = null;
    let moving = false;
    parts.forEach(({ group, target: p }) => {
      if (group.position.distanceTo(p) > 0.02) {
        if (reduceMotion) group.position.copy(p);
        else {
          group.position.lerp(p, 0.13);
          moving = true;
        }
      }
    });
    renderer.render(scene, camera);
    if (moving) frame = requestAnimationFrame(draw);
  }
  function invalidate() {
    if (frame === null) frame = requestAnimationFrame(draw);
  }
  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.zoom = Math.min(1, camera.aspect / 1.35);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    invalidate();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();
  const raycaster = new THREE.Raycaster();
  let pointerStart = null,
    lastPointer = null,
    dragged = false;
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY };
    lastPointer = pointerStart;
    dragged = false;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!lastPointer) return;
    const dx = event.clientX - lastPointer.x,
      dy = event.clientY - lastPointer.y;
    if (
      Math.hypot(
        event.clientX - pointerStart.x,
        event.clientY - pointerStart.y,
      ) > 5
    )
      dragged = true;
    if (dragged) {
      angle -= dx * 0.006;
      elevation = THREE.MathUtils.clamp(elevation + dy * 0.005, 0.28, 1.35);
      moveCamera();
      invalidate();
    }
    lastPointer = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!lastPointer) return;
    if (!dragged) {
      const rect = canvas.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hits = raycaster.intersectObjects(pickables, false);
      if (hits.length) {
        const data = hits[0].object.userData;
        if (data.partId) onPart(data.partId);
        else if (data.trayId) onTray(data.trayId);
      }
    }
    lastPointer = null;
    pointerStart = null;
  });
  canvas.addEventListener("pointercancel", () => {
    lastPointer = null;
    pointerStart = null;
  });
  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      distance = THREE.MathUtils.clamp(distance + event.deltaY * 0.08, 95, 230);
      moveCamera();
      invalidate();
    },
    { passive: false },
  );
  canvas.addEventListener("keydown", (event) => {
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "+",
        "-",
        "Home",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    if (event.key === "Home") {
      reset();
      return;
    }
    if (event.key === "ArrowLeft") angle -= 0.12;
    if (event.key === "ArrowRight") angle += 0.12;
    if (event.key === "ArrowUp") elevation = Math.min(elevation + 0.1, 1.35);
    if (event.key === "ArrowDown") elevation = Math.max(elevation - 0.1, 0.28);
    if (event.key === "+") distance = Math.max(distance - 10, 95);
    if (event.key === "-") distance = Math.min(distance + 10, 230);
    moveCamera();
    invalidate();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    onUnavailable();
  });
  function reset() {
    angle = 0.36;
    elevation = 0.84;
    distance = 154;
    moveCamera();
    invalidate();
  }
  function update(state, selectedPartId, selectedTrayId) {
    const records = new Map(
      state.parts.map((p, index) => [
        p.id,
        {
          part: p,
          returned: index >= state.parts.length - state.returnedCount,
        },
      ]),
    );
    // Switching imported sessions releases stale geometry and hit targets.
    for (const [id, entry] of parts) {
      if (!records.has(id) && !FIXTURE.some((p) => p.id === id)) {
        entry.group.traverse((child) => {
          if (child.isMesh) {
            child.geometry.dispose();
            const index = pickables.indexOf(child);
            if (index !== -1) pickables.splice(index, 1);
          }
        });
        scene.remove(entry.group);
        parts.delete(id);
      }
    }
    state.parts.forEach((p, index) => {
      if (!parts.has(p.id)) makePart(p.id, index);
    });
    parts.forEach((entry, id) => {
      const record = records.get(id),
        fixture = FIXTURE.find((p) => p.id === id);
      if (!record && !fixture) {
        entry.group.visible = false;
        return;
      }
      entry.group.visible = true;
      const point =
        record && !record.returned
          ? record.part.trayCm
          : (record?.part.originCm ?? fixture.originCm);
      entry.target.set(point.x, point.y, point.z);
      // Stored parts sit above the well so screws remain visible rather than below it.
      if (record && !record.returned && id.startsWith("screw-"))
        entry.target.y += 1;
    });
    clearMarkers();
    const activePhase =
      state.phase === "paused" ? state.resumePhase : state.phase;
    if (activePhase === "returning") {
      const part = state.parts[state.parts.length - 1 - state.returnedCount];
      if (part) route(part.originCm, part.trayCm);
    } else if (activePhase === "recording") {
      const selected = FIXTURE.find((p) => p.id === selectedPartId),
        tray = TRAYS.find((t) => t.id === selectedTrayId);
      if (selected && tray) route(selected.originCm, tray.position);
      else if (selected) ring(selected.originCm, 4.2, originMat);
      else {
        const last = state.parts.at(-1);
        if (last) route(last.originCm, last.trayCm);
      }
    }
    invalidate();
  }
  return { update, reset };
}
