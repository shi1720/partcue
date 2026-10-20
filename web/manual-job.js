import { FIXTURE } from "./fixture.js";

export const MANUAL_LIMITS = Object.freeze({ name: 80, origin: 48, tray: 32, note: 96, groups: 100 });
const invalidText = /[\u0000-\u001f\u007f\u2028\u2029]/;
function text(value, limit, label, optional = false) {
  if (typeof value !== "string" || invalidText.test(value)) throw new Error(`${label} must be one line of text.`);
  const trimmed = value.trim();
  if ((!optional && !trimmed) || trimmed.length > limit) throw new Error(`${label} must contain ${optional ? "up to" : "1 to"} ${limit} characters.`);
  return trimmed;
}
export function isManualJob(state) {
  return state.id?.startsWith("job-") || state.parts.some((part) => !FIXTURE.some((fixture) => fixture.id === part.id) || decodeManualReferences(part) !== null);
}
export function sessionIdForMode(manual, uuid) {
  if (typeof uuid !== "string" || !/^[A-Za-z0-9_-]{1,58}$/.test(uuid)) throw new Error("A valid new session identity is required.");
  return `${manual ? "job" : "bench"}-${uuid}`;
}
function splitName(name) {
  let label = "";
  for (const character of name) {
    if (label.length + character.length > 64) break;
    label += character;
  }
  label = label.trimEnd();
  return [label, name.slice(label.length)];
}
/** Length prefixes preserve punctuation verbatim without escaping or delimiter ambiguity.
 * All maximum-size fields, including a Unicode-safe name suffix, fit core.note's 240 characters.
 */
export function encodeManualReferences({ origin, tray, suffix = "", note = "" }) {
  origin = text(origin, 48, "Origin reference");
  tray = text(tray, 32, "Tray or container");
  note = text(note, 96, "Note", true);
  if (typeof suffix !== "string" || suffix.length > 18 || invalidText.test(suffix)) throw new Error("The part name could not be stored.");
  const result = `J1 Origin[${origin.length}]:${origin} | Tray[${tray.length}]:${tray} | Name+[${suffix.length}]:${suffix} |Note:${note}`;
  if (result.length > 240) throw new Error("These references are too long. Shorten the note and try again.");
  return result;
}
export function decodeManualReferences(part) {
  const source = part.note;
  if (typeof source !== "string" || !source.startsWith("J1 Origin[")) return null;
  let cursor = 0;
  const field = (prefix, maximum, required) => {
    if (!source.startsWith(prefix, cursor)) throw new Error("prefix");
    cursor += prefix.length;
    const size = /^(\d{1,2})\]:/.exec(source.slice(cursor));
    if (!size) throw new Error("length");
    const length = Number(size[1]);
    if (length > maximum || (required && length < 1)) throw new Error("limit");
    cursor += size[0].length;
    const value = source.slice(cursor, cursor + length); cursor += length;
    if (value.length !== length || invalidText.test(value)) throw new Error("content");
    return value;
  };
  try {
    const origin = field("J1 Origin[", 48, true);
    const tray = field(" | Tray[", 32, true);
    const suffix = field(" | Name+[", 18, false);
    if (!source.startsWith(" |Note:", cursor)) return null;
    const note = source.slice(cursor + 7);
    if (note.length > 96 || invalidText.test(note)) return null;
    const name = part.label + suffix;
    if (name.length > 80 || !origin.trim() || !tray.trim()) return null;
    return { name, origin, tray, note };
  } catch { return null; }
}
export function partDisplayName(part) { return decodeManualReferences(part)?.name ?? part.label; }
export function manualReferences(part) {
  return decodeManualReferences(part) ?? {
    name: part.label, origin: "Recorded origin", tray: "Recorded container", note: part.note ?? "",
  };
}
/** Positions organize an illustrative diagram, not measurements of a physical workspace. */
export function manualDiagramPositions(index) {
  if (!Number.isInteger(index) || index < 0 || index >= MANUAL_LIMITS.groups) throw new Error("A job can hold up to 100 part groups. Start another job for the next subassembly.");
  const column = index % 10, row = Math.floor(index / 10);
  return {
    originCm: { x: -70 + column * 6, y: 2.5, z: -27 + row * 6 },
    trayCm: { x: 16 + column * 6, y: 2.5, z: -27 + row * 6 },
  };
}
export function createManualPart(fields, uuid, index) {
  const name = text(fields.name, 80, "Part name").replace(/\s+/g, " ");
  const [label, suffix] = splitName(name);
  if (!Number.isInteger(fields.count) || fields.count < 1 || fields.count > 100) throw new Error("Quantity must be a whole number from 1 to 100.");
  if (typeof uuid !== "string" || !/^[A-Za-z0-9_-]{1,59}$/.test(uuid)) throw new Error("A valid part identity is required.");
  return {
    id: `part-${uuid}`, label, count: fields.count,
    ...manualDiagramPositions(index),
    note: encodeManualReferences({ origin: fields.origin, tray: fields.tray, suffix, note: fields.note ?? "" }),
  };
}
export function importedSessionIdentity(snapshot, uuid) {
  return sessionIdForMode(isManualJob(snapshot), uuid);
}
