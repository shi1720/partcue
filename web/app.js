import {
  createSession,
  applyCommand,
  nextPart,
  progress,
  parseSession,
  serializeSession,
  LIMITS,
} from "../core/index.ts";
import { FIXTURE, TRAYS, samePosition, trayName, formatCm } from "./fixture.js";
import { createBenchScene } from "./scene.js";
import { ApiClient } from "./api.js";

const $ = (id) => document.getElementById(id);
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
const api = new ApiClient();
const id = () => `bench-${crypto.randomUUID()}`;
let state = createSession(
  { id: id(), title: "Mechanical enclosure" },
  Date.now(),
);
let selectedPartId = null,
  selectedTrayId = null,
  user = null,
  revision = null,
  lastSavedJson = null;
let networkBusy = false,
  authBusy = false,
  authMode = "login",
  saveAfterAuth = false,
  authGeneration = 0;
let confirmationResolve = null;
const phaseNames = {
  setup: "Ready",
  recording: "Recording",
  returning: "Returning",
  paused: "Paused",
  complete: "Complete",
};
const now = () => Math.max(Date.now(), state.updatedAt);
const hasWork = () => state.parts.length > 0 || state.phase !== "setup";
const isDirty = () => serializeSession(state) !== lastSavedJson;
const isUnprotected = () => hasWork() && isDirty();

function notice(message, kind = "info") {
  $("notification-text").textContent = message;
  $("notification").className = `notification ${kind}`;
  $("notification").hidden = false;
}
function clearNotice() {
  $("notification").hidden = true;
}
function expireAuth() {
  user = null;
  api.csrfToken = null;
  revision = null;
  lastSavedJson = null;
  render();
  notice(
    "Your sign-in expired or changed in another tab. Your bench is still here. Sign in again to save, or export a JSON backup.",
    "error",
  );
}
function transition(command) {
  const result = applyCommand(state, command, now());
  if (!result.ok) {
    const expected = nextPart(state);
    if (result.error.code === "WRONG_PART" && expected)
      notice(
        `Next is ${expected.label} from tray ${trayName(expected.trayCm)}. Return it to the cyan origin, then confirm the quantity. Leave other parts in their trays.`,
        "error",
      );
    else if (result.error.code === "WRONG_COUNT" && expected)
      notice(
        `Check the quantity. Confirm all ${expected.count} ${expected.count === 1 ? "piece" : "pieces"} at the saved origin.`,
        "error",
      );
    else notice(`${result.error.message} ${result.error.recovery}`, "error");
    render();
    return false;
  }
  state = result.state;
  clearNotice();
  render();
  return true;
}
function selectedRecord() {
  return FIXTURE.find((p) => p.id === selectedPartId);
}
function occupiedTray(tray) {
  return state.parts
    .slice(0, state.parts.length - state.returnedCount)
    .some((p) => samePosition(p.trayCm, tray.position));
}
function makePartButton(part, options = {}) {
  const button = node(
    "button",
    `part-option${options.selected ? " selected" : ""}${options.recorded ? " recorded" : ""}`,
  );
  button.type = "button";
  button.dataset.partId = part.id;
  button.disabled = Boolean(options.disabled);
  button.setAttribute("aria-pressed", String(Boolean(options.selected)));
  button.setAttribute(
    "aria-label",
    `${part.label}${options.recorded ? " · recorded" : ""}${options.returned ? " · returned" : ""}`,
  );
  button.append(node("span", "part-shape", part.shape ?? "◉"));
  const text = node("span", "part-text");
  text.append(
    node("strong", null, part.label),
    node(
      "span",
      null,
      options.subtitle ??
        part.subtitle ??
        `${part.count} piece${part.count === 1 ? "" : "s"}`,
    ),
  );
  button.append(text);
  if (options.recorded || options.returned)
    button.append(node("span", "part-check", "✓"));
  button.addEventListener("click", () => selectPart(part.id));
  return button;
}
function selectPart(partId) {
  if (state.phase === "recording") {
    if (!FIXTURE.some((p) => p.id === partId)) {
      notice(
        "This imported part is already recorded. Begin the reverse return to work through it.",
      );
      return;
    }
    if (state.parts.some((p) => p.id === partId)) {
      notice(
        "That part is already recorded. Choose a different part, or undo the most recent mark.",
      );
      return;
    }
    selectedPartId = partId;
    $("record-count").value = String(selectedRecord().count);
    $("record-note").value = "";
    clearNotice();
    render();
  } else if (state.phase === "returning") {
    if (transition({ type: "selectReturn", partId })) {
      $("confirm-count").value = "";
      $("confirm-count").focus();
    }
  } else if (state.phase === "setup")
    notice("Start a teardown first, then choose a part to mark.");
  else if (state.phase === "paused")
    notice("Your bench is paused. Resume the session to select a part.");
}
function selectTray(trayId) {
  if (state.phase !== "recording") {
    if (state.phase === "setup")
      notice("Start a teardown first, then mark a part and choose its tray.");
    return;
  }
  const tray = TRAYS.find((t) => t.id === trayId);
  if (!tray) return;
  if (occupiedTray(tray)) {
    notice(
      `Tray ${trayId} already holds a recorded part. Choose a free tray.`,
      "error",
    );
    return;
  }
  selectedTrayId = trayId;
  clearNotice();
  render();
}
let benchScene;
try {
  benchScene = createBenchScene($("bench-canvas"), {
    onPart: selectPart,
    onTray: selectTray,
    onUnavailable: () => {
      $("scene-fallback").hidden = false;
    },
  });
} catch (error) {
  console.error("3D view unavailable:", error.message);
  $("scene-fallback").hidden = false;
  benchScene = { update() {}, reset() {} };
}

function render() {
  const previousFocus = document.activeElement;
  const focusGroup = previousFocus?.parentElement?.id;
  const focusPart = previousFocus?.dataset?.partId;
  const focusTray = previousFocus?.dataset?.trayId;
  const p = progress(state),
    expected = nextPart(state),
    phase = state.phase;
  $("session-title").textContent = state.title;
  $("account-label").textContent = user
    ? user.name || user.email
    : "Guest rehearsal";
  $("account-label").title = user
    ? user.email
    : "No account required to try the bench";
  $("auth-open").hidden = Boolean(user);
  $("logout").hidden = !user;
  $("logout").disabled = networkBusy;
  $("save-session").disabled =
    networkBusy || Boolean(user && revision !== null && !isDirty());
  $("save-session").textContent = networkBusy ? "Please wait…" : "Save session";
  $("save-status").textContent = !user
    ? "In memory only"
    : revision !== null && !isDirty()
      ? "Saved to server"
      : "Unsaved changes";
  $("save-status").className =
    `save-status ${!user ? "" : revision !== null && !isDirty() ? "saved" : "unsaved"}`;
  $("sessions-open").disabled = networkBusy;
  $("new-session").disabled = networkBusy;
  $("import-session").disabled = networkBusy;
  $("persistence-note").textContent = user
    ? "Save explicitly to keep changes on this companion server. Export a JSON copy for a portable backup."
    : "Guest work lives in this tab. Export it before closing, or sign in to save.";
  const copy = {
    setup: [
      "READY WHEN YOU ARE",
      "Make room for\nyour next idea.",
      "Try a battery-free mechanical enclosure. Every mark is made by you. Every return follows your teardown in reverse.",
    ],
    recording: [
      "RECORDING YOUR WAY OUT",
      "One part.\nOne remembered place.",
      "Select a removed part, choose its tray, and record the origin. Take your time. This is your sequence.",
    ],
    returning: [
      "FOLLOWING THE WAY BACK",
      "The last out\ngoes back first.",
      "Find the highlighted part in its tray. Return it to the cyan origin, then confirm how many pieces you placed.",
    ],
    paused: [
      "YOUR PLACE IS KEPT",
      "A pause is\npart of the process.",
      "Your marks and return sequence stay right here. Save or export before closing the tab.",
    ],
    complete: [
      "SEQUENCE COMPLETE",
      "The work is done.\nThe memory stays.",
      "You confirmed every recorded part in reverse order. Keep the session for next time, or start a fresh bench.",
    ],
  }[phase];
  $("phase-badge").textContent = copy[0];
  $("guide-title").textContent = copy[1];
  $("guide-title").classList.toggle("has-newlines", true);
  $("guide-copy").textContent = copy[2];
  const inReturn =
    phase === "returning" ||
    phase === "complete" ||
    (phase === "paused" && state.resumePhase === "returning");
  $("step-index").textContent =
    `${String(inReturn ? p.returnedGroups : state.parts.length).padStart(2, "0")} / ${String(inReturn ? state.parts.length : Math.max(FIXTURE.length, state.parts.length)).padStart(2, "0")}`;
  document
    .querySelector(".control-panel")
    .classList.toggle(
      "compact",
      phase === "recording" || phase === "returning",
    );
  for (const [panel, match] of [
    ["setup-panel", "setup"],
    ["record-panel", "recording"],
    ["return-panel", "returning"],
    ["paused-panel", "paused"],
    ["complete-panel", "complete"],
  ])
    $(panel).hidden = phase !== match;
  const recordList = $("record-parts");
  recordList.replaceChildren(
    ...FIXTURE.map((part) =>
      makePartButton(part, {
        selected: selectedPartId === part.id,
        recorded: state.parts.some((p) => p.id === part.id),
        disabled: state.parts.some((p) => p.id === part.id),
      }),
    ),
  );
  const trayList = $("tray-options");
  trayList.replaceChildren(
    ...TRAYS.map((tray) => {
      const used = occupiedTray(tray);
      const b = node(
        "button",
        `tray-option${selectedTrayId === tray.id ? " selected" : ""}${used ? " occupied" : ""}`,
        tray.id,
      );
      b.type = "button";
      b.dataset.trayId = tray.id;
      b.disabled = used;
      b.setAttribute(
        "aria-label",
        `Tray ${tray.id}${used ? " · occupied" : " · free"}`,
      );
      b.setAttribute("aria-pressed", String(selectedTrayId === tray.id));
      b.addEventListener("click", () => selectTray(tray.id));
      return b;
    }),
  );
  $("tray-selection").textContent = selectedTrayId
    ? `TRAY ${selectedTrayId}`
    : "NOT SELECTED";
  $("record-part").disabled = !(selectedPartId && selectedTrayId);
  $("begin-return").disabled = state.parts.length === 0;
  $("record-count").disabled = !selectedPartId;
  $("record-note").disabled = !selectedPartId;
  if (phase === "returning" && expected) {
    $("next-label").textContent = expected.label;
    $("next-note").textContent = expected.note ?? "";
    $("next-tray").textContent =
      `Tray ${trayName(expected.trayCm)} · ${expected.count} ${expected.count === 1 ? "piece" : "pieces"}`;
    $("next-coordinates").textContent =
      `TRAY ${formatCm(expected.trayCm)}\nORIGIN ${formatCm(expected.originCm)}`;
    $("confirm-form").hidden = state.pendingReturnId !== expected.id;
    $("confirm-count-label").textContent =
      `Confirm all ${expected.count} ${expected.count === 1 ? "piece" : "pieces"} at the saved origin`;
    $("return-parts").replaceChildren(
      ...state.parts.map((part, index) =>
        makePartButton(
          { ...part, shape: FIXTURE.find((f) => f.id === part.id)?.shape },
          {
            selected: state.pendingReturnId === part.id,
            returned: index >= state.parts.length - state.returnedCount,
            subtitle:
              index >= state.parts.length - state.returnedCount
                ? "Returned"
                : `Tray ${trayName(part.trayCm)} · ${part.count} ${part.count === 1 ? "piece" : "pieces"}`,
          },
        ),
      ),
    );
  }
  $("pause-description").textContent =
    state.resumePhase === "returning" && expected
      ? `Next when you return: ${expected.label} from tray ${trayName(expected.trayCm)}. Select it again after resuming to confirm its placement.`
      : "Your recorded origins and trays are preserved. Resume to continue recording from the same point.";
  $("complete-description").textContent =
    `You confirmed ${p.totalPieces} ${p.totalPieces === 1 ? "piece" : "pieces"} across ${p.totalGroups} part ${p.totalGroups === 1 ? "group" : "groups"} at their saved origins. No missing step in your recorded sequence.`;
  $("pause-session").disabled = !["recording", "returning"].includes(phase);
  $("undo-action").textContent =
    phase === "recording" ? "↶ Undo last mark" : "↶ Undo last return";
  $("undo-action").disabled =
    phase === "recording"
      ? state.parts.length === 0
      : !["returning", "complete"].includes(phase) || state.returnedCount === 0;
  $("reset-session").disabled = phase === "setup";
  $("sequence-count").textContent =
    `${state.parts.length} ${state.parts.length === 1 ? "part" : "parts"} recorded`;
  $("sequence-title").textContent =
    phase === "complete"
      ? "A place for every part. A complete way back."
      : phase === "returning" ||
          (phase === "paused" && state.resumePhase === "returning")
        ? "Return order · last out, first back."
        : "Your teardown becomes your return path.";
  $("empty-sequence").hidden = state.parts.length > 0;
  const items = state.parts
    .map((part, index) => ({ part, index }))
    .reverse()
    .map(({ part, index }) => {
      const returned = index >= state.parts.length - state.returnedCount,
        isNext = Boolean(expected?.id === part.id && inReturn);
      const li = node(
        "li",
        `sequence-item${returned ? " returned" : ""}${isNext ? " next" : ""}`,
      );
      const meta = node("div", "sequence-meta");
      meta.append(
        node("span", null, String(state.parts.length - index).padStart(2, "0")),
        node(
          "span",
          null,
          returned ? "RETURNED" : isNext ? "NEXT" : "RECORDED",
        ),
      );
      li.append(
        meta,
        node("strong", "sequence-name", part.label),
        node(
          "span",
          "sequence-detail",
          `${part.count} ${part.count === 1 ? "piece" : "pieces"} · Tray ${trayName(part.trayCm)}`,
        ),
      );
      li.title = `${part.label}. ${part.count} ${part.count === 1 ? "piece" : "pieces"}. Origin ${formatCm(part.originCm)}. Tray ${formatCm(part.trayCm)}.${part.note ? ` Note: ${part.note}` : ""}`;
      return li;
    });
  $("sequence-list").replaceChildren(...items);
  $("session-progress").value = p.fraction;
  $("progress-label").textContent =
    phase === "complete"
      ? "All parts returned"
      : state.parts.length
        ? `${p.returnedGroups} / ${p.totalGroups} returned`
        : "Ready to start";
  $("scene-hint").textContent =
    phase === "recording"
      ? selectedPartId
        ? selectedTrayId
          ? "Origin + tray selected · Record this part to remember both"
          : "Choose a free tray · then record the part"
        : "Select a part · Drag to orbit · Scroll to zoom"
      : phase === "returning"
        ? "Amber: where to find it · Cyan: where it goes back"
        : phase === "complete"
          ? "Every recorded part confirmed · A complete way back"
          : phase === "paused"
            ? "Session paused · Save or export before closing"
            : "Drag to orbit · Scroll to zoom · Select a part to begin";
  benchScene.update(state, selectedPartId, selectedTrayId);
  // Replacing a button list must not send keyboard users back to the page start.
  if (focusGroup && (focusPart || focusTray)) {
    const group = $(focusGroup);
    const replacement =
      group &&
      [...group.querySelectorAll("button")].find(
        (button) =>
          !button.disabled &&
          (focusPart
            ? button.dataset.partId === focusPart
            : button.dataset.trayId === focusTray),
      );
    replacement?.focus({ preventScroll: true });
  }
}

function openAuth(forSave = false) {
  if (networkBusy) return;
  saveAfterAuth = forSave;
  setAuthMode("login");
  $("auth-dialog").showModal();
  $("auth-email").focus();
}
function setAuthMode(mode) {
  authMode = mode;
  $("name-field").hidden = mode !== "register";
  $("auth-name").required = mode === "register";
  $("auth-title").textContent =
    mode === "register" ? "Make it your bench." : "Back to your bench.";
  $("auth-description").textContent =
    mode === "register"
      ? "Create an account to save sessions on this companion server."
      : "Sign in to save sessions on this companion server.";
  $("auth-submit").textContent =
    mode === "register" ? "Create account ↗" : "Sign in ↗";
  $("auth-switch").textContent =
    mode === "register"
      ? "Already have an account? Sign in"
      : "New here? Create an account";
  $("auth-password").autocomplete =
    mode === "register" ? "new-password" : "current-password";
  $("auth-error").hidden = true;
}
function setAuthBusy(busy) {
  authBusy = busy;
  $("auth-submit").disabled = busy;
  $("auth-switch").disabled = busy;
  for (const id of ["auth-email", "auth-password", "auth-name"])
    $(id).disabled = busy;
  $("auth-submit").textContent = busy
    ? "Please wait…"
    : authMode === "register"
      ? "Create account ↗"
      : "Sign in ↗";
}
function confirmAction(title, description, label = "Continue") {
  if (confirmationResolve) confirmationResolve(false);
  $("confirm-title").textContent = title;
  $("confirm-description").textContent = description;
  $("confirm-accept").textContent = label;
  $("confirm-dialog").showModal();
  return new Promise((resolve) => {
    confirmationResolve = resolve;
  });
}
function resolveConfirmation(value) {
  const resolve = confirmationResolve;
  confirmationResolve = null;
  $("confirm-dialog").close();
  if (resolve) resolve(value);
}
function useSnapshot(snapshot, savedRevision = null) {
  state = snapshot;
  revision = savedRevision;
  lastSavedJson = savedRevision === null ? null : serializeSession(snapshot);
  selectedPartId = null;
  selectedTrayId = null;
  $("record-count").value = "1";
  $("record-note").value = "";
  $("confirm-count").value = "";
  clearNotice();
  render();
}

async function saveSession() {
  if (networkBusy) return;
  if (!user) {
    openAuth(true);
    return;
  }
  const snapshot = parseSession(serializeSession(state)),
    sentJson = serializeSession(snapshot),
    currentUser = user.id,
    requestRevision = revision;
  networkBusy = true;
  render();
  try {
    const data = await api.request(
      requestRevision === null
        ? "/api/sessions"
        : `/api/sessions/${encodeURIComponent(snapshot.id)}`,
      requestRevision === null ? "POST" : "PUT",
      {
        snapshot,
        ...(requestRevision === null ? {} : { revision: requestRevision }),
      },
    );
    if (user?.id === currentUser && state.id === snapshot.id) {
      revision = data.revision;
      lastSavedJson = sentJson;
      notice(
        isDirty()
          ? "Saved the captured session. Your newer changes are still unsaved."
          : "Session saved on this companion server. Export a copy for a portable backup.",
        "success",
      );
    }
  } catch (error) {
    if (error.code === "REVISION_CONFLICT" || error.code === "ALREADY_EXISTS")
      notice(
        "This session changed in another tab. Your bench has not been overwritten. Export your current JSON, then load the saved session, or import the JSON as a separate new session.",
        "error",
      );
    else if (error.code === "AUTH_REQUIRED") expireAuth();
    else notice(error.message, "error");
  } finally {
    networkBusy = false;
    render();
  }
}
async function listSessions() {
  if (!user) {
    openAuth();
    return;
  }
  if (networkBusy) return;
  $("sessions-dialog").showModal();
  $("sessions-status").textContent = "Loading your saved sessions…";
  $("saved-sessions").replaceChildren();
  try {
    const data = await api.request("/api/sessions");
    $("sessions-status").textContent =
      `${data.sessions.length} saved ${data.sessions.length === 1 ? "session" : "sessions"} · Stored on this server`;
    if (data.sessions.length === 0) {
      $("saved-sessions").append(
        node(
          "div",
          "empty-saved",
          "Your bench is ready for its first memory. Record a part, then choose Save session.",
        ),
      );
      return;
    }
    for (const item of data.sessions) {
      const row = node("div", "saved-session"),
        info = node("div");
      info.append(
        node("h3", null, item.title),
        node(
          "p",
          null,
          `${phaseNames[item.phase] ?? item.phase} · ${item.partCount} ${item.partCount === 1 ? "part" : "parts"} · ${new Date(item.updatedAt).toLocaleDateString()} · rev ${item.revision}`,
        ),
      );
      const actions = node("div", "saved-session-actions"),
        load = node("button", "button button-outline", "Load"),
        remove = node("button", "button delete-saved", "Delete");
      load.type = "button";
      remove.type = "button";
      load.setAttribute("aria-label", `Load ${item.title}`);
      remove.setAttribute("aria-label", `Delete ${item.title}`);
      load.addEventListener("click", () => loadSession(item.id));
      remove.addEventListener("click", () => deleteSession(item));
      actions.append(load, remove);
      row.append(info, actions);
      $("saved-sessions").append(row);
    }
  } catch (error) {
    if (error.code === "AUTH_REQUIRED") {
      $("sessions-dialog").close();
      expireAuth();
    } else $("sessions-status").textContent = error.message;
  }
}
async function loadSession(sessionId) {
  if (networkBusy) return;
  if (
    isUnprotected() &&
    !(await confirmAction(
      "Switch workbenches?",
      "Your current bench has unsaved changes. Cancel and export or save it first, or continue to replace it with the saved session.",
      "Load saved session",
    ))
  )
    return;
  networkBusy = true;
  render();
  try {
    const data = await api.request(
      `/api/sessions/${encodeURIComponent(sessionId)}`,
    );
    const snapshot = parseSession(JSON.stringify(data.snapshot));
    useSnapshot(snapshot, data.revision);
    $("sessions-dialog").close();
    notice(
      "Saved session loaded. Continue from exactly where you left it.",
      "success",
    );
  } catch (error) {
    if (error.code === "AUTH_REQUIRED") {
      $("sessions-dialog").close();
      expireAuth();
    } else {
      $("sessions-status").textContent = error.message;
      notice(error.message, "error");
    }
  } finally {
    networkBusy = false;
    render();
  }
}
async function deleteSession(item) {
  if (networkBusy) return;
  if (
    !(await confirmAction(
      "Remove this saved memory?",
      `“${item.title}” will be deleted from your account on this server. Export a copy first if you need to keep it. Your current bench is not changed.`,
      "Delete saved session",
    ))
  )
    return;
  networkBusy = true;
  render();
  try {
    await api.request(
      `/api/sessions/${encodeURIComponent(item.id)}`,
      "DELETE",
      { revision: item.revision },
    );
    if (state.id === item.id) {
      revision = null;
      lastSavedJson = null;
    }
    networkBusy = false;
    render();
    $("sessions-dialog").close();
    await listSessions();
  } catch (error) {
    if (error.code === "AUTH_REQUIRED") {
      $("sessions-dialog").close();
      expireAuth();
    } else
      $("sessions-status").textContent =
        error.code === "REVISION_CONFLICT"
          ? "This saved session changed. Close and reopen this list to refresh it before deleting."
          : error.message;
  } finally {
    networkBusy = false;
    render();
  }
}
function exportSession() {
  const text = JSON.stringify(parseSession(serializeSession(state)), null, 2),
    blob = new Blob([text], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    link = node("a");
  link.href = url;
  link.download = `partcue-${state.id}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice(
    "JSON export downloaded. It contains your manual marks and sequence, with no account credentials.",
    "success",
  );
}

$("start-session").addEventListener("click", () => {
  if (transition({ type: "start" })) $("guide-title").focus();
});
$("record-part").addEventListener("click", () => {
  const part = selectedRecord(),
    tray = TRAYS.find((t) => t.id === selectedTrayId);
  if (!part || !tray) return;
  if (occupiedTray(tray)) {
    notice("That tray is already occupied. Choose a free tray.", "error");
    return;
  }
  const count = Number($("record-count").value),
    note = $("record-note").value.trim();
  if (
    transition({
      type: "recordPart",
      part: {
        id: part.id,
        label: part.label,
        originCm: { ...part.originCm },
        trayCm: { ...tray.position },
        count,
        ...(note ? { note } : {}),
      },
    })
  ) {
    selectedPartId = null;
    selectedTrayId = null;
    $("record-count").value = "1";
    $("record-note").value = "";
    render();
    const nextChoice = [...$("record-parts").querySelectorAll("button")].find(
      (button) => !button.disabled,
    );
    (nextChoice ?? $("begin-return")).focus();
  }
});
$("begin-return").addEventListener("click", async () => {
  const remaining = FIXTURE.filter(
    (p) => !state.parts.some((r) => r.id === p.id),
  ).length;
  if (
    remaining &&
    !(await confirmAction(
      "Ready for the way back?",
      `${state.parts.length} part ${state.parts.length === 1 ? "group is" : "groups are"} recorded. You may return this partial teardown now; the remaining ${remaining} fixture parts will stay at their origins.`,
      "Begin reverse return",
    ))
  )
    return;
  selectedPartId = null;
  selectedTrayId = null;
  if (transition({ type: "beginReturn" })) $("guide-title").focus();
});
$("confirm-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const expected = nextPart(state);
  if (!expected) return;
  const count = Number($("confirm-count").value);
  if (transition({ type: "confirmReturn", partId: expected.id, count })) {
    $("confirm-count").value = "";
    if (state.phase === "complete") {
      notice(
        "Every recorded return is confirmed. This records your acknowledgment; physical placement is not automatically verified.",
        "success",
      );
      $("completion-title").focus();
    } else {
      const expectedId = nextPart(state)?.id;
      [...$("return-parts").querySelectorAll("button")]
        .find((button) => button.dataset.partId === expectedId)
        ?.focus();
    }
  }
});
$("pause-session").addEventListener("click", () => {
  if (transition({ type: "pause" })) $("resume-session").focus();
});
$("resume-session").addEventListener("click", () => {
  if (transition({ type: "resume" })) $("guide-title").focus();
});
$("undo-action").addEventListener("click", () => {
  if (
    transition({
      type: state.phase === "recording" ? "undoRemoval" : "undoReturn",
    })
  ) {
    selectedPartId = null;
    selectedTrayId = null;
    $("confirm-count").value = "";
    render();
  }
});
$("reset-session").addEventListener("click", async () => {
  if (
    await confirmAction(
      "Clear this workbench?",
      "All recorded marks and return confirmations in this session will be cleared. Cancel and export or save it first if you need them.",
      "Reset bench",
    )
  ) {
    selectedPartId = null;
    selectedTrayId = null;
    if (transition({ type: "reset" })) $("start-session").focus();
  }
});
$("reset-view").addEventListener("click", () => benchScene.reset());
$("save-session").addEventListener("click", saveSession);
$("complete-save").addEventListener("click", saveSession);
$("sessions-open").addEventListener("click", listSessions);
function openNew() {
  if (networkBusy) return;
  $("new-title").value = "Mechanical enclosure";
  $("new-warning").textContent = isUnprotected()
    ? "Your current bench has unsaved changes. Save or export it first, or create a new session to replace it in this tab."
    : "Your saved sessions stay available in your account. A fresh session starts with a new id.";
  $("new-dialog").showModal();
  $("new-title").focus();
  $("new-title").select();
}
$("new-session").addEventListener("click", openNew);
$("complete-new").addEventListener("click", openNew);
$("new-title").addEventListener("input", () =>
  $("new-title").setCustomValidity(""),
);
$("new-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!$("new-title").value.trim()) {
    $("new-title").setCustomValidity(
      "Give this session a title with at least one non-space character.",
    );
    $("new-title").reportValidity();
    return;
  }
  try {
    const snapshot = createSession(
      { id: id(), title: $("new-title").value.trim() },
      Date.now(),
    );
    useSnapshot(snapshot);
    $("new-dialog").close();
    notice(
      "A fresh session is ready. Start the teardown when you are ready.",
      "success",
    );
  } catch (error) {
    notice(error.message, "error");
  }
});
$("export-session").addEventListener("click", exportSession);
$("import-session").addEventListener("click", () => {
  if (!networkBusy) $("import-file").click();
});
$("import-file").addEventListener("change", async () => {
  const file = $("import-file").files?.[0];
  $("import-file").value = "";
  if (!file) return;
  if (file.size > LIMITS.snapshotBytes) {
    notice(
      "This file exceeds the 250 KB snapshot limit. Choose a PartCue JSON export.",
      "error",
    );
    return;
  }
  try {
    const snapshot = parseSession(await file.text());
    snapshot.id = id();
    snapshot.title = `${snapshot.title.slice(0, 69)} (imported)`;
    if (
      isUnprotected() &&
      !(await confirmAction(
        "Open this imported memory?",
        "Your current bench has unsaved changes. Cancel and export it first, or continue to replace it. The imported snapshot receives a new id, so existing saved work will not be overwritten.",
        "Import as new session",
      ))
    )
      return;
    useSnapshot(snapshot);
    notice(
      "Snapshot validated and imported with a new session id. Save it to keep a separate server copy.",
      "success",
    );
  } catch {
    notice(
      "This is not a valid PartCue export. Your current bench is unchanged. Choose a JSON file exported from PartCue.",
      "error",
    );
  }
});
$("auth-open").addEventListener("click", () => openAuth());
$("auth-switch").addEventListener("click", () => {
  if (!authBusy) setAuthMode(authMode === "login" ? "register" : "login");
});
$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (authBusy) return;
  setAuthBusy(true);
  $("auth-error").hidden = true;
  const generation = ++authGeneration;
  try {
    const payload = {
      email: $("auth-email").value.trim(),
      password: $("auth-password").value,
      ...(authMode === "register" ? { name: $("auth-name").value.trim() } : {}),
    };
    const data = await api.request(`/api/auth/${authMode}`, "POST", payload);
    if (generation !== authGeneration) return;
    user = data.user;
    api.csrfToken = data.csrfToken;
    revision = null;
    lastSavedJson = null;
    const shouldSave = saveAfterAuth;
    saveAfterAuth = false;
    $("auth-dialog").close();
    $("auth-form").reset();
    render();
    notice(
      `Signed in as ${user.name || user.email}. Save explicitly to keep this bench on the server.`,
      "success",
    );
    if (shouldSave) await saveSession();
  } catch (error) {
    $("auth-error").textContent = error.message;
    $("auth-error").hidden = false;
  } finally {
    setAuthBusy(false);
  }
});
$("logout").addEventListener("click", async () => {
  if (networkBusy) return;
  if (
    !(await confirmAction(
      "Sign out of your bench?",
      `${isUnprotected() ? "You have unsaved changes. Cancel and save or export them first. " : ""}Signing out clears this tab’s bench. Saved sessions remain on this server.`,
      "Sign out",
    ))
  )
    return;
  networkBusy = true;
  render();
  try {
    await api.request("/api/auth/logout", "POST", {});
    authGeneration++;
    user = null;
    api.csrfToken = null;
    useSnapshot(
      createSession({ id: id(), title: "Mechanical enclosure" }, Date.now()),
    );
    notice(
      "Signed out. A fresh guest bench is ready; your saved sessions stay with your account.",
      "success",
    );
  } catch (error) {
    if (error.code === "AUTH_REQUIRED") {
      authGeneration++;
      user = null;
      api.csrfToken = null;
      useSnapshot(
        createSession({ id: id(), title: "Mechanical enclosure" }, Date.now()),
      );
      notice(
        "Your sign-in had already expired. This tab is now cleared and ready for a guest rehearsal.",
      );
    } else notice(error.message, "error");
  } finally {
    networkBusy = false;
    render();
  }
});
$("confirm-accept").addEventListener("click", () => resolveConfirmation(true));
$("confirm-cancel").addEventListener("click", () => resolveConfirmation(false));
$("confirm-dialog").addEventListener("close", () => {
  if (confirmationResolve) {
    const resolve = confirmationResolve;
    confirmationResolve = null;
    resolve(false);
  }
});
document
  .querySelectorAll(".close-modal")
  .forEach((button) =>
    button.addEventListener("click", () => button.closest("dialog").close()),
  );
$("auth-dialog").addEventListener("close", () => {
  if (!authBusy) $("auth-form").reset();
});
$("dismiss-notification").addEventListener("click", clearNotice);
window.addEventListener("beforeunload", (event) => {
  if (isUnprotected()) {
    event.preventDefault();
    event.returnValue = "";
  }
});
render();
const bootGeneration = authGeneration;
api
  .request("/api/auth/me")
  .then((data) => {
    if (bootGeneration !== authGeneration) return;
    user = data.user;
    api.csrfToken = data.csrfToken;
    render();
  })
  .catch((error) => {
    if (error.code !== "AUTH_REQUIRED" && bootGeneration === authGeneration)
      notice(
        "The companion server is unavailable. You can still rehearse here; export your JSON before closing.",
      );
  });
