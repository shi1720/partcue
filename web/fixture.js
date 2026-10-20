/** A non-powered enclosure, used only as an explicitly labelled simulated fixture. */
export const FIXTURE = Object.freeze([
  {
    id: "screw-short",
    label: "Short screw",
    subtitle: "M3 · short",
    shape: "⌁",
    originCm: { x: -30, y: 5.4, z: -8 },
    count: 1,
  },
  {
    id: "screw-long",
    label: "Long screw",
    subtitle: "M3 · long",
    shape: "⌁",
    originCm: { x: -14, y: 5.4, z: 8 },
    count: 1,
  },
  {
    id: "lid",
    label: "Top cover",
    subtitle: "Enclosure lid",
    shape: "▱",
    originCm: { x: -22, y: 5.3, z: 0 },
    count: 1,
  },
  {
    id: "module",
    label: "Gear module",
    subtitle: "Mechanical insert",
    shape: "◉",
    originCm: { x: -22, y: 2.3, z: 0 },
    count: 1,
  },
]);
export const TRAYS = Object.freeze([
  { id: "A", position: { x: 16, y: 1.8, z: -13 } },
  { id: "B", position: { x: 40, y: 1.8, z: -13 } },
  { id: "C", position: { x: 16, y: 1.8, z: 13 } },
  { id: "D", position: { x: 40, y: 1.8, z: 13 } },
]);
export const samePosition = (a, b) =>
  Math.abs(a.x - b.x) < 0.1 &&
  Math.abs(a.y - b.y) < 0.1 &&
  Math.abs(a.z - b.z) < 0.1;
export const trayName = (position) =>
  TRAYS.find((t) => samePosition(t.position, position))?.id ?? "custom";
export const formatCm = (point) => `${point.x}, ${point.y}, ${point.z} cm`;
