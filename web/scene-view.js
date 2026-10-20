import { FIXTURE, TRAYS, samePosition } from "./fixture.js";

/** Fits portable cm snapshots without changing the authored fixture's default view. */
export function cameraViewForSession(state, aspect = 1.35) {
  const custom = state.parts.some((part) => {
    const fixture = FIXTURE.find((candidate) => candidate.id === part.id);
    return !fixture || !samePosition(part.originCm, fixture.originCm) ||
      !TRAYS.some((tray) => samePosition(part.trayCm, tray.position));
  });
  if (!custom) return {
    custom: false, target: { x: 1, y: 0, z: 0 }, distance: 154,
    minDistance: 95, maxDistance: 230, far: 600,
    fogNear: 170, fogFar: 310, zoom: Math.min(1, aspect / 1.35),
  };
  const points = state.parts.flatMap((part) => [
    part.originCm, part.trayCm, ...routeControlPoints(part.originCm, part.trayCm),
  ]);
  const lower = { x: Infinity, y: Infinity, z: Infinity };
  const upper = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const point of points) for (const axis of ["x", "y", "z"]) {
    lower[axis] = Math.min(lower[axis], point[axis]);
    upper[axis] = Math.max(upper[axis], point[axis]);
  }
  const target = Object.fromEntries(["x", "y", "z"].map((axis) => [axis, (lower[axis] + upper[axis]) / 2]));
  // The bounds already include arc controls; reserve room for part meshes and rings.
  const radius = Math.hypot(upper.x - lower.x, upper.y - lower.y, upper.z - lower.z) / 2 + 18;
  const safeAspect = Math.max(0.1, Math.min(10, Number.isFinite(aspect) ? aspect : 1.35));
  const verticalHalfFov = 17 * Math.PI / 180;
  const halfFov = Math.min(verticalHalfFov, Math.atan(Math.tan(verticalHalfFov) * safeAspect));
  const distance = Math.max(154, radius / Math.sin(halfFov) * 1.08);
  const maxDistance = Math.max(230, distance * 2);
  return {
    custom: true, target, distance, radius,
    minDistance: Math.max(95, distance * 0.4), maxDistance,
    far: maxDistance + radius * 3 + 100,
    fogNear: maxDistance + radius, fogFar: maxDistance + radius * 3 + 100,
    zoom: 1,
  };
}

/** Endpoint-relative arc controls also support vertical and negative cm positions. */
export function routeControlPoints(origin, tray) {
  const from = { x: tray.x, y: tray.y + 0.8, z: tray.z };
  const to = { x: origin.x, y: origin.y + 0.8, z: origin.z };
  const lift = Math.min(80, Math.max(12, Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) * 0.15));
  const control = (fraction) => ({
    x: from.x + (to.x - from.x) * fraction,
    y: from.y + (to.y - from.y) * fraction + lift,
    z: from.z + (to.z - from.z) * fraction,
  });
  return [from, control(0.32), control(0.68), to];
}
