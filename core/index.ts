/** Pure domain model. No camera recognition, persistence, clock or UI dependencies. */
export const SCHEMA_VERSION = 1 as const;
export const LIMITS = Object.freeze({ parts: 100, count: 100, coordinateCm: 1000, events: 100, snapshotBytes: 250_000 });
export type Phase = "setup" | "recording" | "returning" | "paused" | "complete";
export interface VectorCm { x: number; y: number; z: number }
export interface PartInput { id: string; label: string; originCm: VectorCm; trayCm: VectorCm; count: number; note?: string }
export interface Part extends PartInput { removedAt: number }
export type EventType = "created" | "started" | "part-recorded" | "return-started" | "return-selected" | "part-returned" | "paused" | "resumed" | "removal-undone" | "return-undone" | "reset";
export interface SessionEvent { seq: number; at: number; type: EventType; partId?: string }
export interface Session {
  schemaVersion: typeof SCHEMA_VERSION;
  units: "cm";
  id: string;
  title: string;
  phase: Phase;
  resumePhase: "recording" | "returning" | null;
  parts: Part[];
  returnedCount: number;
  pendingReturnId: string | null;
  createdAt: number;
  updatedAt: number;
  eventSeq: number;
  events: SessionEvent[];
}
export type Command =
  | { type: "start" }
  | { type: "recordPart"; part: PartInput }
  | { type: "beginReturn" }
  | { type: "selectReturn"; partId: string }
  | { type: "confirmReturn"; partId: string; count: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "undoRemoval" }
  | { type: "undoReturn" }
  | { type: "reset" };
export interface ActionError { code: "INVALID_STATE" | "INVALID_INPUT" | "WRONG_PHASE" | "EMPTY" | "LIMIT" | "DUPLICATE_ID" | "WRONG_PART" | "CONFIRM_REQUIRED" | "WRONG_COUNT" | "INVALID_TIME"; message: string; recovery: string }
export type Result = { ok: true; state: Session } | { ok: false; state: Session; error: ActionError };
export interface Validation { valid: boolean; errors: string[] }

const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}(?![\s\S])/;
const PHASES: readonly string[] = ["setup", "recording", "returning", "paused", "complete"];
const EVENTS: readonly string[] = ["created", "started", "part-recorded", "return-started", "return-selected", "part-returned", "paused", "resumed", "removal-undone", "return-undone", "reset"];
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => Object.keys(value).every(key => keys.includes(key));
const validTime = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 8_640_000_000_000_000;
const validId = (value: unknown): value is string => typeof value === "string" && ID.test(value);
const validText = (value: unknown, max: number): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
const validCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= LIMITS.count;
const vectorValid = (value: unknown): value is VectorCm => isObject(value) && hasOnlyKeys(value, ["x", "y", "z"]) && [value.x, value.y, value.z].every(v => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= LIMITS.coordinateCm);

function partErrors(value: unknown, prefix: string, recorded: boolean): string[] {
  if (!isObject(value)) return [`${prefix} must be an object`];
  const errors: string[] = [];
  if (!hasOnlyKeys(value, ["id", "label", "originCm", "trayCm", "count", "note", ...(recorded ? ["removedAt"] : [])])) errors.push(`${prefix} contains unsupported fields`);
  if (!validId(value.id)) errors.push(`${prefix}.id must be 1–64 letters, digits, underscores or hyphens, starting with a letter or digit`);
  if (!validText(value.label, 64)) errors.push(`${prefix}.label must contain 1–64 printable characters`);
  if (!vectorValid(value.originCm)) errors.push(`${prefix}.originCm must contain finite x/y/z coordinates within ±${LIMITS.coordinateCm} cm`);
  if (!vectorValid(value.trayCm)) errors.push(`${prefix}.trayCm must contain finite x/y/z coordinates within ±${LIMITS.coordinateCm} cm`);
  if (!validCount(value.count)) errors.push(`${prefix}.count must be an integer from 1 to ${LIMITS.count}`);
  if (value.note !== undefined && !validText(value.note, 240)) errors.push(`${prefix}.note must contain 1–240 printable characters when supplied`);
  if (recorded && !validTime(value.removedAt)) errors.push(`${prefix}.removedAt must be a valid millisecond timestamp`);
  return errors;
}

/** Validates untrusted snapshots before restoring or acting on them. */
export function validateSession(value: unknown): Validation {
  const errors: string[] = [];
  if (!isObject(value)) return { valid: false, errors: ["Session must be an object"] };
  if (!hasOnlyKeys(value, ["schemaVersion", "units", "id", "title", "phase", "resumePhase", "parts", "returnedCount", "pendingReturnId", "createdAt", "updatedAt", "eventSeq", "events"])) errors.push("Session contains unsupported fields");
  if (value.schemaVersion !== SCHEMA_VERSION) errors.push("Unsupported schemaVersion; expected 1");
  if (value.units !== "cm") errors.push("Session units must be cm");
  if (!validId(value.id)) errors.push("Invalid session id");
  if (!validText(value.title, 80)) errors.push("Title must contain 1–80 printable characters");
  if (!PHASES.includes(value.phase as string)) errors.push("Invalid phase");
  if (value.phase === "paused" ? !["recording", "returning"].includes(value.resumePhase as string) : value.resumePhase !== null) errors.push("resumePhase must identify the interrupted active phase only while paused");
  if (!validTime(value.createdAt) || !validTime(value.updatedAt) || (value.createdAt as number) > (value.updatedAt as number)) errors.push("Invalid or out-of-order session timestamps");
  if (!Array.isArray(value.parts) || value.parts.length > LIMITS.parts) errors.push(`parts must be an array of at most ${LIMITS.parts} entries`);
  const parts = Array.isArray(value.parts) ? value.parts : [];
  const ids = new Set<string>();
  let lastRemovedAt = value.createdAt as number;
  parts.forEach((part, index) => {
    errors.push(...partErrors(part, `parts[${index}]`, true));
    if (!isObject(part)) return;
    if (typeof part.id === "string") {
      if (ids.has(part.id)) errors.push(`Duplicate part id: ${part.id}`);
      ids.add(part.id);
    }
    if ((part.removedAt as number) < lastRemovedAt || (part.removedAt as number) > (value.updatedAt as number)) errors.push(`parts[${index}].removedAt is out of order`);
    lastRemovedAt = part.removedAt as number;
  });
  if (!Number.isInteger(value.returnedCount) || (value.returnedCount as number) < 0 || (value.returnedCount as number) > parts.length) errors.push("returnedCount is outside the part list");
  const activePhase = value.phase === "paused" ? value.resumePhase : value.phase;
  if (["setup", "recording"].includes(activePhase as string) && value.returnedCount !== 0) errors.push("Parts cannot be returned before the return phase");
  if (value.phase === "setup" && parts.length !== 0) errors.push("Setup cannot contain recorded parts");
  if (activePhase === "returning" && (parts.length === 0 || (value.returnedCount as number) >= parts.length)) errors.push("Returning requires at least one outstanding part");
  if (value.phase === "complete" && (parts.length === 0 || value.returnedCount !== parts.length)) errors.push("Complete requires every recorded part returned");
  const expected = parts[parts.length - 1 - (value.returnedCount as number)];
  if (value.pendingReturnId !== null && (activePhase !== "returning" || !isObject(expected) || value.pendingReturnId !== expected.id)) errors.push("pendingReturnId must match the next outstanding part");
  if (!Number.isSafeInteger(value.eventSeq) || (value.eventSeq as number) < 1) errors.push("eventSeq must be a positive safe integer");
  if (!Array.isArray(value.events) || value.events.length < 1 || value.events.length > LIMITS.events) errors.push(`events must contain 1–${LIMITS.events} entries`);
  let previousSeq = 0;
  let previousAt = value.createdAt as number;
  if (Array.isArray(value.events)) value.events.forEach((event, index) => {
    if (!isObject(event)) { errors.push(`events[${index}] must be an object`); return; }
    if (!hasOnlyKeys(event, ["seq", "at", "type", "partId"])) errors.push(`events[${index}] contains unsupported fields`);
    if (!Number.isSafeInteger(event.seq) || (event.seq as number) <= previousSeq || (event.seq as number) > (value.eventSeq as number)) errors.push(`events[${index}].seq must increase`);
    if (!validTime(event.at) || event.at < previousAt || event.at > (value.updatedAt as number)) errors.push(`events[${index}].at is invalid or out of order`);
    if (!EVENTS.includes(event.type as string)) errors.push(`events[${index}].type is invalid`);
    if (event.partId !== undefined && !validId(event.partId)) errors.push(`events[${index}].partId is invalid`);
    previousSeq = event.seq as number;
    previousAt = event.at as number;
  });
  if (Array.isArray(value.events) && value.events.length > 0 && isObject(value.events[value.events.length - 1])) {
    const last = value.events[value.events.length - 1] as Record<string, unknown>;
    if (last.seq !== value.eventSeq || last.at !== value.updatedAt) errors.push("Last event must match eventSeq and updatedAt");
  }
  return { valid: errors.length === 0, errors };
}

/** Throws on invalid setup. All time values are explicit milliseconds since epoch. */
export function createSession(input: { id: string; title?: string }, now: number): Session {
  const state: Session = { schemaVersion: 1, units: "cm", id: input.id, title: input.title ?? "Mechanical teardown", phase: "setup", resumePhase: null, parts: [], returnedCount: 0, pendingReturnId: null, createdAt: now, updatedAt: now, eventSeq: 1, events: [{ seq: 1, at: now, type: "created" }] };
  const result = validateSession(state);
  if (!result.valid) throw new Error(result.errors.join("; "));
  return state;
}

/** The next part is always the last recorded part that has not been returned. */
export function nextPart(state: Session): Part | null {
  return state.parts[state.parts.length - 1 - state.returnedCount] ?? null;
}
export function progress(state: Session): { totalGroups: number; returnedGroups: number; remainingGroups: number; totalPieces: number; remainingPieces: number; fraction: number } {
  return { totalGroups: state.parts.length, returnedGroups: state.returnedCount, remainingGroups: state.parts.length - state.returnedCount, totalPieces: state.parts.reduce((n, p) => n + p.count, 0), remainingPieces: state.parts.slice(0, state.parts.length - state.returnedCount).reduce((n, p) => n + p.count, 0), fraction: state.parts.length === 0 ? 0 : state.returnedCount / state.parts.length };
}

const copyPart = (part: PartInput, now: number): Part => ({ id: part.id, label: part.label.trim(), originCm: { ...part.originCm }, trayCm: { ...part.trayCm }, count: part.count, ...(part.note === undefined ? {} : { note: part.note.trim() }), removedAt: now });
function appendEvent(state: Session, type: EventType, now: number, partId?: string): Session {
  const seq = state.eventSeq + 1;
  return { ...state, updatedAt: now, eventSeq: seq, events: [...state.events, { seq, at: now, type, ...(partId === undefined ? {} : { partId }) }].slice(-LIMITS.events) };
}

/** Commands never mutate the input. Rejections return the exact original state. */
export function applyCommand(state: Session, command: Command, now: number): Result {
  const fail = (code: ActionError["code"], message: string, recovery: string): Result => ({ ok: false, state, error: { code, message, recovery } });
  const validation = validateSession(state);
  if (!validation.valid) return fail("INVALID_STATE", validation.errors.join("; "), "Restore a valid saved session or start a new session.");
  if (!validTime(now) || now < state.updatedAt || state.eventSeq >= Number.MAX_SAFE_INTEGER) return fail("INVALID_TIME", "The timestamp must be valid and must not move backward.", "Use a timestamp at or after the last saved action.");
  if (!isObject(command) || typeof command.type !== "string") return fail("INVALID_INPUT", "A command type is required.", "Choose an available action.");
  const phaseFail = () => fail("WRONG_PHASE", `This action is unavailable while ${state.phase}.`, state.phase === "paused" ? "Resume the session first." : "Use the action available in the current phase.");
  let changed: Session;
  let event: EventType;
  let partId: string | undefined;
  switch (command.type) {
    case "start":
      if (state.phase !== "setup") return phaseFail();
      changed = { ...state, phase: "recording" }; event = "started"; break;
    case "recordPart": {
      if (state.phase !== "recording") return phaseFail();
      const errors = partErrors(command.part, "part", false);
      if (errors.length) return fail("INVALID_INPUT", errors.join("; "), "Check the label, quantity and both positions in centimetres.");
      if (state.parts.length >= LIMITS.parts) return fail("LIMIT", "This session has reached 100 part groups.", "Finish this session and create another for the next subassembly.");
      if (state.parts.some(p => p.id === command.part.id)) return fail("DUPLICATE_ID", "A part group with that id is already recorded.", "Choose a unique id or undo the previous recording.");
      changed = { ...state, parts: [...state.parts, copyPart(command.part, now)] }; event = "part-recorded"; partId = command.part.id; break;
    }
    case "beginReturn":
      if (state.phase !== "recording") return phaseFail();
      if (state.parts.length === 0) return fail("EMPTY", "Record at least one part before returning.", "Record a removed part and its origin and tray positions.");
      changed = { ...state, phase: "returning" }; event = "return-started"; break;
    case "selectReturn": {
      if (state.phase !== "returning") return phaseFail();
      const expected = nextPart(state)!;
      if (command.partId !== expected.id) return fail("WRONG_PART", "Return order is locked to the reverse teardown sequence.", `Leave this part in its tray. Next: ${expected.label} (${expected.count}) from tray position ${expected.trayCm.x}, ${expected.trayCm.y}, ${expected.trayCm.z} cm.`);
      changed = { ...state, pendingReturnId: expected.id }; event = "return-selected"; partId = expected.id; break;
    }
    case "confirmReturn": {
      if (state.phase !== "returning") return phaseFail();
      const expected = nextPart(state)!;
      if (command.partId !== expected.id) return fail("WRONG_PART", "That part is not next in the reverse sequence.", `Return ${expected.label} next.`);
      if (state.pendingReturnId !== expected.id) return fail("CONFIRM_REQUIRED", "Select the next part before confirming its return.", `Select ${expected.label}, place all ${expected.count} piece(s) at its saved origin, then confirm.`);
      if (command.count !== expected.count) return fail("WRONG_COUNT", "The confirmed quantity does not match the recorded quantity.", `Check and return all ${expected.count} piece(s) before confirming.`);
      const returnedCount = state.returnedCount + 1;
      changed = { ...state, returnedCount, pendingReturnId: null, phase: returnedCount === state.parts.length ? "complete" : "returning" }; event = "part-returned"; partId = expected.id; break;
    }
    case "pause":
      if (state.phase !== "recording" && state.phase !== "returning") return phaseFail();
      changed = { ...state, phase: "paused", resumePhase: state.phase, pendingReturnId: null }; event = "paused"; break;
    case "resume":
      if (state.phase !== "paused" || state.resumePhase === null) return phaseFail();
      changed = { ...state, phase: state.resumePhase, resumePhase: null, pendingReturnId: null }; event = "resumed"; break;
    case "undoRemoval":
      if (state.phase !== "recording") return phaseFail();
      if (state.parts.length === 0) return fail("EMPTY", "There is no removal to undo.", "Record a part first.");
      partId = state.parts[state.parts.length - 1]!.id;
      changed = { ...state, parts: state.parts.slice(0, -1) }; event = "removal-undone"; break;
    case "undoReturn":
      if (state.phase !== "returning" && state.phase !== "complete") return phaseFail();
      if (state.returnedCount === 0) return fail("EMPTY", "There is no confirmed return to undo.", "Select and confirm the next part first.");
      partId = state.parts[state.parts.length - state.returnedCount]!.id;
      changed = { ...state, returnedCount: state.returnedCount - 1, pendingReturnId: null, phase: "returning" }; event = "return-undone"; break;
    case "reset":
      changed = { ...state, phase: "setup", resumePhase: null, parts: [], returnedCount: 0, pendingReturnId: null }; event = "reset"; break;
    default: return fail("INVALID_INPUT", "Unknown command.", "Choose an available action.");
  }
  return { ok: true, state: appendEvent(changed, event, now, partId) };
}

/** JSON is deliberately used as the portable snapshot format for Lens and web adapters. */
export function serializeSession(state: Session): string {
  const result = validateSession(state);
  if (!result.valid) throw new Error(`Invalid snapshot: ${result.errors.join("; ")}`);
  return JSON.stringify(state);
}
export function parseSession(json: string): Session {
  if (typeof json !== "string" || json.length > LIMITS.snapshotBytes) throw new Error("Snapshot is missing or exceeds the size limit");
  let value: unknown;
  try { value = JSON.parse(json); } catch { throw new Error("Snapshot is not valid JSON"); }
  const result = validateSession(value);
  if (!result.valid) throw new Error(`Invalid snapshot: ${result.errors.join("; ")}`);
  return value as Session;
}
