/* Browser platform adapter: input + rendering only. C++ owns all game rules. */
"use strict";
const $ = (id) => document.getElementById(id),
  canvas = $("battlefield"),
  ctx = canvas.getContext("2d"),
  mini = $("minimap"),
  mc = mini.getContext("2d");
const names = [
  "Villager",
  "Spearman",
  "Archer",
  "Knight",
  "Town Center",
  "House",
  "Barracks",
  "Archery Range",
  "Stable",
  "Watchtower",
  "Farm",
  "Woodland",
  "Berry Bush",
  "Gold Deposit",
  "Stone Deposit",
  "Blacksmith",
  "School",
  "Wall",
];
const maxHP = [
  55, 90, 55, 180, 1600, 350, 850, 700, 850, 650, 240, 220, 220, 650, 550, 800,
  650,
];
const costs = [
  [50, 0, 0, 0],
  [45, 25, 0, 0],
  [0, 35, 25, 0],
  [65, 0, 65, 0],
  [0, 250, 0, 200],
  [0, 30, 0, 0],
  [0, 130, 0, 0],
  [0, 160, 0, 0],
  [0, 175, 0, 0],
  [0, 70, 0, 100],
  [0, 45, 0, 0],
  [],
  [],
  [],
  [],
  [0, 150, 0, 0],
  [0, 120, 0, 0],
];
const requiredAge = [1, 1, 2, 3, 1, 1, 1, 2, 3, 2, 1, 1, 1, 1, 1, 2, 1],
  durations = [9, 12, 14, 20];
const symbols = [
  "♟",
  "⚑",
  "➶",
  "♞",
  "♜",
  "⌂",
  "⚔",
  "➶",
  "♞",
  "♜",
  "≋",
  "♧",
  "♧",
  "◆",
  "◆",
  "⚒",
  "▤",
  "▥",
];
const ageNames = ["", "Dark Age", "Feudal Age", "Castle Age"],
  roman = ["", "I", "II", "III"];
let state = null,
  menuPreview = null,
  menuPreviewBase = null,
  menuAppearanceKey = "",
  oldState = null,
  selected = new Set(),
  camera = { x: 0, y: 0, zoom: 1 },
  viewport = { w: 0, h: 0, dpr: 1 };
let token = sessionStorage.getItem("crown-token") || "",
  player = Number(sessionStorage.getItem("crown-player") || 0),
  connected = false;
let wallDrag = null, gateFacing = 0;
let shots = [],
  lastMiniDraw = 0;
let observedPlayer = 0,
  consoleOpen = true;
const isObserver = () => player >= 16 || state?.role === "team-spectator";
const isOperator = () => !!state?.isHost;
const economyPlayer = () => (isObserver() ? observedPlayer : player);
let gridEnabled = localStorage.getItem("crown-grid") === "true",
  lobbyUIKey = "",
  needsFocus = true;
let difficulties = [],
  technologies = [],
  actionTab = "commands";
const isBuildingKind = (kind) => CrownArt.isBuilding(kind);
const isResourceKind = (kind) => kind >= 11 && kind <= 14;
const footprints = [],
  definitionsByKind = [];
const isUnitKind = (kind) => CrownArt.isUnit(kind);
const allowedKind = (kind) =>
  definitionsByKind[kind]?.races?.[state?.players[player]?.race || 0] !== false;
const trainable = (building) =>
  definitionsByKind.filter(
    (d) =>
      d.unit &&
      d.producer === building &&
      allowedKind(d.kind) &&
      (d.kind !== 40 || state?.players[player]?.technologies?.[4]) &&
      (d.kind !== 19 || !state?.players[player]?.technologies?.[4]),
  );
const mapNames = ["The Riverlands", "Highland March", "Twin Lakes"];
const colorOf = (p) =>
  state?.lobby?.slots?.find((s) => s.id === p)?.color ??
  state?.players[p]?.color ??
  p;
const teamName = (p) => CrownArt.teamNames[colorOf(p)] || "Kingdom";
const allied = (a, b) =>
  a >= 0 &&
  b >= 0 &&
  (a === b ||
    (state.players[a]?.team > 0 &&
      state.players[a].team === state.players[b]?.team));
const teamColor = (p) => CrownArt.palettes[colorOf(p)]?.[2] || "#ddd";
let atlasTheme = "silk-road", atlasWanted = "silk-road", atlasRequest = 0;
async function applyAtlasTheme(theme) {
  if (!atlas || theme === atlasWanted) return;
  atlasWanted=theme; const ticket = ++atlasRequest;
  if(theme===atlasTheme) return;
  const image = new Image();
  image.src = theme === "legacy" ? "./atlas-legacy.png" : "./atlas.png";
  try {await image.decode(); if (ticket !== atlasRequest) return; atlas=image;atlasTheme=theme;CrownArt.clearCaches();CrownGround.clear();lastUI="";}
  catch {toast("Could not load the selected baked atlas. Extract all game files.");}
}
let atlas,
  placing = -1,
  attackMode = false,
  drag = null,
  mouse = { x: -1, y: -1 },
  pan = null,
  keys = new Set(),
  groups = {},
  effects = [],
  markers = [];
let lastFrame = performance.now(),
  lastSnapshot = 0,
  renderTime = 0,
  lastUI = "",
  lastNotice = "",
  toastTimer,
  lastPollOK = 0,
  idleIndex = 0,
  requestInFlight = false,
  pollTimer = null,
  urgentPoll = false,
  entityById = new Map(),
  lastRendered = 0,
  vignette = null;
const renderEntities = [];
const menuOrigin = { x: 0, y: 0 },
  gameOrigin = { x: 0, y: 0 };
const viewOrigin = () => (connected ? gameOrigin : menuOrigin);
// Follow the actual layout, including narrow-screen menu scrolling. Projection
// and clipping are presentation only; they never change world/camera coordinates.
function updateMenuFrame() {
  if (connected) {
    canvas.style.clipPath = "";
    return;
  }
  const r = document.querySelector(".menu-stage").getBoundingClientRect();
  menuOrigin.x = r.left + r.width / 2;
  menuOrigin.y = r.top + r.height * 0.55 + 42;
  const inset = (value, maximum) => Math.min(maximum, Math.max(0, value));
  canvas.style.clipPath = `inset(${inset(r.top, viewport.h)}px ${inset(viewport.w - r.right, viewport.w)}px ${inset(viewport.h - r.bottom, viewport.h)}px ${inset(r.left, viewport.w)}px)`;
}
let menuScrollFrame = 0;
$("welcome").addEventListener("scroll", () => {
  if (connected || menuScrollFrame) return;
  menuScrollFrame = requestAnimationFrame(() => {
    menuScrollFrame = 0;
    updateMenuFrame();
  });
});
function updateMenuAppearance() {
  if (!menuPreviewBase) return;
  const choice = $("welcome-civ").value || "imperials";
  const civilization = window.crownContent?.civilizations.find(
    (c) => c.id === choice,
  );
  const race = Math.max(
    0,
    CrownArt.raceTemplates.findIndex((r) => r.id === civilization?.race),
  );
  const template = CrownArt.raceTemplates[race];
  const color = Math.min(
    CrownArt.teamNames.length - 1,
    Math.max(0, Number($("welcome-color").value) || 0),
  );
  const name =
    choice === "__random__"
      ? "Random civilization"
      : civilization?.name || "Imperials";
  const key = `${choice}/${race}/${color}/${name}`;
  if (key === menuAppearanceKey) return;
  menuAppearanceKey = key;
  // Never mutate the authoritative snapshot or a live match. One small cached
  // preview is recolored only when a selection/content definition changes.
  menuPreview = {
    ...menuPreviewBase,
    players: menuPreviewBase.players.map((p, index) =>
      index === 0
        ? { ...p, race, color, civilizationId: choice, civilization: name }
        : { ...p },
    ),
    entities: menuPreviewBase.entities.map((e) =>
      e.owner === 0
        ? {
            ...e,
            race,
            color,
            kind:
              isUnitKind(e.kind) && !template.units.includes(e.kind)
                ? template.units.find((k) => k !== 0)
                : e.kind,
          }
        : { ...e },
    ),
  };
  $("preview-name").textContent = name;
  $("preview-name").title = name;
  $("preview-crest").textContent =
    choice === "__random__"
      ? "?"
      : ["♜", "⚔", "⚑", "♟", "◆", "❧", "❦", "⚒", "♫", "☠"][race];
  $("welcome").style.setProperty("--banner-color", CrownArt.palettes[color][1]);
  for (const id of ["welcome-civ", "welcome-color"])
    $(id).title = $(id).selectedOptions[0]?.textContent || "";
  if (!connected) {
    state = menuPreview;
    CrownMotion.ingest(state);
    CrownDamage.ingest(state);
    entityById = new Map(state.entities.map((e) => [e.id, e]));
  }
}
$("welcome").addEventListener("click", (e) => {
  if (e.target.closest("[data-close-menu]"))
    e.target.closest("details").open = false;
});
document.addEventListener("pointerdown", (e) => {
  if (!connected)
    for (const detail of $("welcome").querySelectorAll("details[open]")) {
      if (!detail.contains(e.target)) detail.open = false;
    }
});
$("welcome-civ").addEventListener("change", updateMenuAppearance);
$("welcome-color").addEventListener("change", updateMenuAppearance);
addEventListener("crown-content-ready", updateMenuAppearance);
function resize() {
  vignette = null;
  viewport.w = innerWidth;
  viewport.h = innerHeight;
  gameOrigin.x = viewport.w / 2;
  viewport.hudHeight =
    parseFloat(getComputedStyle($("command-deck")).height) || 280;
  gameOrigin.y = (viewport.h - viewport.hudHeight + 77) / 2;
  viewport.dpr = Math.min(
    devicePixelRatio || 1,
    { legacy: 1, balanced: 1.5, display: 2 }[
      localStorage.getItem("crown-render-preset") || "balanced"
    ] || 1.5,
  );
  canvas.width = innerWidth * viewport.dpr;
  canvas.height = innerHeight * viewport.dpr;
  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  updateMenuFrame();
}
addEventListener("resize", resize);
resize();
function project(x, y) {
  return { x: (x - y) * 32, y: (x + y) * 16 };
}
function screen(x, y) {
  const p = project(x, y),
    origin = viewOrigin();
  return {
    x: (p.x - camera.x) * camera.zoom + origin.x,
    y: (p.y - camera.y) * camera.zoom + origin.y,
  };
}
function unproject(x, y) {
  const origin = viewOrigin(),
    a = (x - origin.x) / camera.zoom + camera.x,
    b = (y - origin.y) / camera.zoom + camera.y;
  return { x: a / 64 + b / 32, y: b / 32 - a / 64 };
}
function focus(x, y) {
  const p = project(x, y);
  camera.x = p.x;
  camera.y = p.y;
}
// Menu presentation owns its framing; it never accepts gameplay camera input.
function focusMenuSettlement() {
  // Town Center framing from commit 2fc6e69.
  camera.zoom = 1.7;
  const home = state?.entities.find((e) => e.owner === 0 && e.kind === 4);
  focus(home?.x ?? 16, home?.y ?? 35);
}
function cameraDebugView() {
  if (!state || needsFocus || state.waiting) return {};
  const z = camera.zoom,
    height = Math.max(160, viewport.h - viewport.hudHeight - 77),
    iw = Math.min(8192, Math.min(viewport.w / 2, viewport.w / (2 * z)) + 96),
    ih = Math.min(8192, Math.min(height / 2, height / (2 * z)) + 64);
  return {
    view: 1,
    cx: Math.round(camera.x),
    cy: Math.round(camera.y),
    iw: Math.ceil(iw),
    ih: Math.ceil(ih),
    ow: Math.ceil(
      Math.min(16384, Math.max(iw * 1.65, viewport.w / (2 * z) + 160)),
    ),
    oh: Math.ceil(Math.min(16384, Math.max(ih * 1.65, height / (2 * z) + 112))),
  };
}
function diamond(x, y, rx, ry, color, stroke, context = ctx) {
  context.beginPath();
  context.moveTo(x - rx, y);
  context.lineTo(x, y - ry);
  context.lineTo(x + rx, y);
  context.lineTo(x, y + ry);
  context.closePath();
  if (color) {
    context.fillStyle = color;
    context.fill();
  }
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = 1;
    context.stroke();
  }
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 3500);
}
async function api(path, params = {}, method = "GET") {
  const started = performance.now();
  const url = "/api/" + path + "?" + new URLSearchParams(params);
  const response = await fetch(url, {
    method,
    headers: {
      ...(token ? { "X-Session": token } : {}),
      ...(sessionStorage.getItem("crown-studio-key")
        ? { "X-Studio": sessionStorage.getItem("crown-studio-key") }
        : {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  CrownPerf.record(
    path,
    performance.now() - started,
    Number(response.headers.get("Content-Length") || text.length),
    url.length,
  );
  const data = JSON.parse(text);
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || "The server could not accept that order."),
      { status: response.status },
    );
  return data;
}
let commandChain = Promise.resolve(),
  queuedCommands = 0;
function order(action, extra = {}) {
  if (!connected) return;
  if (isObserver())
    return toast("Observers cannot command units. Open a player tab to join.");
  if (!selected.size && action !== "age")
    return toast("Select a unit or building first.");
  if (queuedCommands >= 64)
    return toast("Waiting for pending orders. Try again shortly.");
  const ids = [...selected].join(" "),
    session = token,
    commandStart = performance.now();
  ++queuedCommands;
  const send = async () => {
    try {
      if (!connected || token !== session) return;
      const result = await api("command", { action, ids, ...extra }, "POST");
      CrownPerf.ack(result.commandId, commandStart);
      wakePoll();
      playTone();
    } catch (e) {
      toast(e.message);
    } finally {
      --queuedCommands;
    }
  };
  commandChain = commandChain.then(send, send);
  return commandChain;
}
async function control(action, value) {
  try {
    await api("control", { action, value: value ?? "" }, "POST");
  } catch (e) {
    toast(e.message);
  }
}
function playTone() {
  CrownSound.order();
}
async function join(mode) {
  CrownSound.start();
  $("welcome-error").textContent = "";
  try {
    const result = await api(
      "join",
      {
        mode,
        ...(window.CrownWeb && window.CrownPeer?.active ? {transport:"webrtc"} : {}),
        ...mapSettings(),
        ...($("welcome-color").value !== ""
          ? { color: $("welcome-color").value }
          : {}),
        name: $("player-name").value,
        civilization: $("welcome-civ").value || "imperials",
      },
      "POST",
    );
    token = result.token;
    player = result.player;
    sessionStorage.setItem("crown-token", token);
    sessionStorage.setItem("crown-player", player);
    startSession();
  } catch (e) {
    $("welcome-error").textContent = e.message;
    refreshMainMenu();
  }
}
let spectatorController = null,
  spectatorRetryMs = 1000;
function startSession() {
  spectatorController?.abort();
  spectatorController = null;
  connected = true;
  updateMenuFrame();
  camera.zoom = 1;
  keys.clear();
  pan = drag = null;
  CrownStream.reset();
  clearTimeout(pollTimer);
  $("welcome").classList.add("hidden");
  for (const detail of $("welcome").querySelectorAll("details"))
    detail.open = false;
  needsFocus = true;
  selected.clear();
  if (player >= 16 && player < 20 && !window.CrownWeb) streamSpectator();
  else poll();
}
function wakePoll() {
  urgentPoll = true;
  clearTimeout(pollTimer);
  if (!requestInFlight) pollTimer = setTimeout(poll, 0);
}
async function streamSpectator() {
  if (!connected || spectatorController) return;
  clearTimeout(pollTimer);
  const controller = new AbortController();
  spectatorController = controller;
  try {
    const response = await fetch("/api/spectator-stream", {
      headers: { "X-Session": token },
      signal: controller.signal,
      cache: "no-store",
    });
    CrownPerf.record("spectator-stream", 0, 0, 64);
    if (!response.ok) {
      const error = await response.json();
      throw Object.assign(
        new Error(error.error || "Spectator stream unavailable"),
        { status: response.status, code: error.code },
      );
    }
    const reader = response.body.getReader(),
      decoder = new TextDecoder();
    let buffer = "";
    while (connected && !controller.signal.aborted) {
      const { value, done } = await reader.read();
      if (!connected || controller.signal.aborted) break;
      if (done) throw new Error("Spectator stream ended");
      CrownPerf.receive(value.byteLength);
      buffer += decoder.decode(value, { stream: true });
      if (buffer.length > 4194304)
        throw new Error("Spectator frame exceeded its limit");
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line) applySnapshot(JSON.parse(line));
        spectatorRetryMs = 1000;
      }
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    if (
      error.status === 403 &&
      error.code === "observer_role_changed" &&
      player < 16
    ) {
      // Restart/lobby revives this commander: resume their normal feed.
      controller.abort();
      spectatorController = null;
      CrownStream.reset();
      poll();
      return;
    }
    if (error.status === 401 || error.status === 403) {
      returnToMainMenu(error.message);
    } else if (connected) {
      toast("Spectator connection lost. Reconnecting…");
    }
  } finally {
    controller.abort();
    if (spectatorController === controller) {
      spectatorController = null;
      if (connected) {
        pollTimer = setTimeout(streamSpectator, spectatorRetryMs);
        spectatorRetryMs = Math.min(10000, spectatorRetryMs * 2);
      }
    }
  }
}
function applySnapshot(reply) {
  const next = CrownStream.merge(reply);
  entityById = CrownStream.map;
  CrownPerf.state(next);
  if (next.role === "player") CrownPerf.report(token);
  CrownDamage.ingest(next);
  CrownMotion.ingest(next);
  const nextById = new Map(next.entities.map((e) => [e.id, e]));
  if (player !== next.player) needsFocus = true;
  player = next.player;
  sessionStorage.setItem("crown-player", String(player));
  camera.zoom = Math.min(
    camera.zoom,
    player >= 16 || next.role === "team-spectator" ? 4 : 2,
  );
  if (next.role === "team-spectator") {
    const allowed = next.players
      .map((p, i) => ({ p, i }))
      .filter(
        ({ p, i }) =>
          i === player || (p.team > 0 && p.team === next.players[player].team),
      );
    if (
      !allowed.some(({ i }) => i === observedPlayer) ||
      next.players[observedPlayer]?.defeated
    )
      observedPlayer = (allowed.find(({ p }) => !p.defeated) || allowed[0]).i;
  } else if (isObserver())
    observedPlayer = Math.min(observedPlayer, next.players.length - 1);
  sessionStorage.setItem("crown-player", player);
  lastPollOK = performance.now();
  if (state && state.time <= next.time) {
    const old = new Map(state.entities.map((e) => [e.id, e]));
    const previousPlayer = state.players[player],
      nextPlayer = next.players[player];
    if (
      previousPlayer &&
      nextPlayer &&
      (nextPlayer.age > previousPlayer.age ||
        nextPlayer.technologies?.some(
          (level, id) => level > (previousPlayer.technologies?.[id] || 0),
        ))
    )
      CrownSound.completed();
    for (const e of next.entities) {
      const before = old.get(e.id);
      if (before && e.carry > before.carry && e.owner === player) {
        const resource = nextById.get(e.target);
        if (resource && camera.zoom >= 1.5 && soundNearby(e)) CrownSound.gather(resource.kind);
      }
      if (
        before &&
        before.progress < 1 &&
        e.progress >= 1 &&
        e.owner === player
      )
        CrownSound.completed();
      if (before && e.cooldown > before.cooldown + 0.1) {
        if (camera.zoom >= 1.5 && soundNearby(e)) CrownSound.hit();
        if (e.projectile) {
          const target = CrownMotion.target(e);
          if (
            target &&
            !(e.kind === 33 && Math.hypot(target.x - e.x, target.y - e.y) < 1.8)
          )
            for (let arrow = 0; arrow < (e.arrows || 1); arrow++)
              shots.push({
                x: e.x + arrow * 0.08,
                y: e.y - arrow * 0.08,
                tx: target.x,
                ty: target.y,
                life: 0.32,
                delay: arrow * 0.025,
                building: isBuildingKind(e.kind),
                kind: e.kind,
              });
        }
      }
      if (!before && next.time > 1 && e.owner === player && isUnitKind(e.kind))
        CrownSound.completed();
      if (before && e.hp < before.hp && e.owner >= 0)
        effects.push({
          x: e.x,
          y: e.y,
          life: 0.65,
          damage: Math.round(before.hp - e.hp),
        });
    }
  }
  if (state?.waiting && !next.waiting) needsFocus = true;
  CrownSound.setBattle(next.entities.some((e) => e.cooldown > 0.3) ? 1 : 0.05);
  oldState = state;
  state = next;
  if (state.role === "team-spectator" && oldState?.role !== "team-spectator") {
    selected.clear();
    toast("Your kingdom has fallen. Watching your team’s shared vision.");
  }
  if (needsFocus) {
    const home = state.entities.find((e) => e.owner === player && e.kind === 4);
    if (isObserver()) {
      focus(state.width / 2, state.height / 2);
      needsFocus = false;
    }
    if (home) {
      focus(home.x, home.y);
      selected = new Set([home.id]);
      needsFocus = false;
    }
  }
  updateLobby();
  updateObserverUI();
  lastSnapshot = performance.now();
  for (const id of selected) if (!entityById.has(id)) selected.delete(id);
  if (!selected.size && next.time < 0.3) {
    const town = next.entities.find((e) => e.owner === player && e.kind === 4);
    if (town) selected.add(town.id);
  }
  if (state.notice !== lastNotice) {
    lastNotice = state.notice;
    $("notice").textContent = state.notice;
  }
  document.body.dataset.screen = state.waiting ? "lobby" : "game";
  $("lobby").classList.toggle("hidden", !state.waiting);
  $("mode-label").textContent =
    state.mode === "lan"
      ? `${isObserver() ? (state.role === "host" ? "Dedicated operator" : "Spectator") : teamName(player) + " kingdom"} · ${state.players.filter((p) => !p.defeated).length} standing`
      : state.mode === "local"
        ? `Local skirmish · ${state.lobby.slots.filter((s) => s.ai).length} AI kingdoms`
        : `Solo skirmish · ${difficulties[state.difficulty]?.name || "Normal"} AI`;
  $("map-label").querySelector("h1").textContent =
    window.crownContent?.maps.find((m) => m.id === state.lobby?.mapId)?.name ||
    mapNames[state.mapStyle];
  $("minimap-title").textContent = $("map-label").querySelector("h1").textContent;
  $("map-size").textContent = `${state.width} × ${state.height}`;
  $("objective").querySelector("p").textContent =
    state.players[player]?.team > 0
      ? `Team ${state.players[player].team} · defeat all opposing kingdoms`
      : "Be the last kingdom standing";
  $("settings").classList.toggle(
    "hidden",
    (state.mode !== "lan" && state.mode !== "local") || !isOperator(),
  );
  $("pause").innerHTML = state.paused
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
  $("speed").textContent = state.speed + "×";
  $("pause").disabled = !isOperator();
  $("speed").disabled = !isOperator();
  $("end-screen").classList.toggle(
    "hidden",
    state.waiting || state.winner === -1,
  );
  if (state.winner !== -1) {
    $("end-title").textContent = isObserver()
      ? `${state.players[state.winner].team ? "Team " + state.players[state.winner].team : teamName(state.winner)} triumphs`
      : allied(state.winner, player)
        ? "Victory"
        : "Defeat";
    $("end-text").textContent = allied(state.winner, player)
      ? "The rival banner falls. The Riverlands belong to your people."
      : "Your Town Center has fallen. Gather your courage and raise a new kingdom.";
    $("restart").disabled = !isOperator();
    $("restart").textContent = isOperator()
      ? "BEGIN AGAIN →"
      : "WAITING FOR HOST";
  }
  updateUI();
}
async function poll() {
  if (!connected || requestInFlight || window.CrownPeer?.observerPush) return;
  requestInFlight = true;
  urgentPoll = false;
  const pollStarted = performance.now(),
    session = token;
  try {
    const reply = await api("state", {
      stream: 1,
      since: state?.revision || 0,
    });
    if (connected && token === session) applySnapshot(reply);
  } catch (e) {
    if (!connected || token !== session) {
      requestInFlight = false;
      if (connected) wakePoll();
      return;
    }
    if (e.status === 401) {
      returnToMainMenu(
        "The lobby closed or your seat ended. You can host or join again.",
      );
      requestInFlight = false;
      return;
    }
    if (e.message.includes("resynchronization")) {
      CrownStream.reset();
      if (state) state.revision = 0;
    }
    if (performance.now() - lastPollOK > 3000)
      toast("Connection lost. Retrying the server…");
  }
  requestInFlight = false;
  clearTimeout(pollTimer);
  if (
    connected &&
    ["lan", "local"].includes(state?.mode) &&
    isObserver() &&
    player < 20 &&
    !window.CrownWeb
  ) {
    streamSpectator();
    return;
  }
  const interval = document.hidden
    ? 1000
    : state?.waiting
      ? 250
      : state?.pollMs || 50;
  pollTimer = setTimeout(
    poll,
    urgentPoll ? 0 : Math.max(0, interval - (performance.now() - pollStarted)),
  );
}
function soundNearby(e) {
  const p = screen(e.x,e.y);
  return connected && p.x>=0 && p.x<=viewport.w && p.y>=77 && p.y<viewport.h-viewport.hudHeight;
}
function selectedEntities() {
  return state
    ? [...selected].map((id) => entityById.get(id)).filter(Boolean)
    : [];
}
function resourcesText(cost) {
  return cost
    .map((n, i) => (n ? `${n} ${["food", "wood", "gold", "stone"][i]}` : ""))
    .filter(Boolean)
    .join(" · ");
}
function affordable(kind) {
  const p = state?.players[economyPlayer()];
  return (
    p &&
    p.age >= requiredAge[kind] &&
    costs[kind].every((n, i) => p.resources[i] >= n)
  );
}
function actionButton(
  symbol,
  name,
  tip,
  callback,
  disabled = false,
  key = "",
  artKind = -1,
) {
  const shortcut = {
    "Town Center": "town",
    "Idle worker": "idle",
    House: "house",
    Barracks: "barracks",
    Farm: "farm",
    Range: "range",
    "Archery Range": "range",
    Tower: "tower",
    Watchtower: "tower",
    Stable: "stable",
    Blacksmith: "blacksmith",
    School: "school",
    Wall: "wall",
    Fortress: "fortress",
    Repair: "repair",
    Move: "move",
    Attack: "attack",
    "Attack move": "attackMove",
    Patrol: "patrol",
    "Defend area": "defend",
    "Hold ground": "hold",
    Stop: "stop",
    Villager: "train",
    Spearman: "train",
    Archer: "train",
    Knight: "train",
  }[name];
  if (shortcut) key = CrownControls.label(shortcut);
  const b = document.createElement("button");
  const glyphs = {
    Move: "M3 12h18m-7-7 7 7-7 7",
    Attack: "M5 3l16 16-3 3L2 6zM4 14l6 6m-7 1 4-4",
    "Attack move": "M3 12h18m-7-7 7 7-7 7M5 3v5m-2-2h5",
    Patrol: "M4 8h16l-4-4M20 16H4l4 4",
    "Defend area": "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6zM12 7v10m-4-5h8",
    "Hold ground": "M5 4h14v16H5zM9 9h6v6H9z",
    Stop: "M6 6h12v12H6z",
    Repair: "M14 3a6 6 0 0 0-7 7l-5 7 5 5 7-9a6 6 0 0 0 7-7l-5 4-4-4z",
    "Delete units": "M5 5l14 14M19 5 5 19",
    "Raze building": "M3 9l9-6 9 6v12H3zM8 12l8 7m0-7-8 7",
    "Next age": "M4 18l4-9 4 5 4-9 4 13zM4 21h16",
  };
  const glyph = glyphs[name]
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${glyphs[name]}"/></svg>`
    : symbol;
  b.innerHTML = `<span class="symbol">${glyph}</span><span class="action-name">${name}</span><span class="key">${key}</span>`;
  b.setAttribute("aria-label", name);
  if (artKind >= 0) {
    const c = document.createElement("canvas");
    c.width = 76;
    c.height = 42;
    const cc = c.getContext("2d");
    cc.imageSmoothingEnabled = false;
    CrownArt.icon(
      cc,
      atlas,
      {
        kind: artKind,
        owner: player,
        color: colorOf(player),
        id: 0,
        age: state?.players[player]?.age || 1,
        race: state?.players[player]?.race || 0,
      },
      76,
      42,
    );
    b.querySelector(".symbol").replaceChildren(c);
  }
  b.disabled = disabled;
  b.onclick = callback;
  b.onmouseenter = () => {
    const r = b.getBoundingClientRect();
    $("tooltip").innerHTML = tip;
    $("tooltip").style.left = Math.min(innerWidth - 240, r.left) + "px";
    $("tooltip").style.bottom = innerHeight - r.top + 10 + "px";
    $("tooltip").classList.remove("hidden");
  };
  b.onmouseleave = () => $("tooltip").classList.add("hidden");
  $("actions").append(b);
  return b;
}
function updateUI() {
  if (!state) return;
  applyAtlasTheme(state.lobby?.artTheme || "silk-road");
  const p = state.players[economyPlayer()];
  ["food", "wood", "gold", "stone"].forEach(
    (id, i) => ($(id).textContent = p.resources[i]),
  );
  $("population").textContent = `${p.pop} / ${p.cap}`;
  $("clock").textContent =
    `${String(Math.floor(state.time / 60)).padStart(2, "0")}:${String(Math.floor(state.time % 60)).padStart(2, "0")}`;
  $("age-label").textContent =
    `${roman[p.age]} · ${ageNames[p.age].toUpperCase()}`;
  const ageCost = p.age === 1 ? [350, 0, 100, 0] : [650, 150, 300, 0];
  $("advance").disabled =
    isObserver() ||
    p.age >= 3 ||
    p.advancing ||
    !p.ageReady ||
    !ageCost.every((n, i) => p.resources[i] >= n);
  const ageRequirement =
    p.age === 1
      ? "Complete a Barracks"
      : "Complete any two: School, Blacksmith, Archery Range";
  $("advance").title =
    p.ageReady || p.age >= 3 ? "Advance your kingdom's age" : ageRequirement;
  $("advance").innerHTML = p.advancing
    ? `↟ &nbsp; ADVANCING… ${Math.floor((p.research / 40) * 100)}%<small>A new age is on the horizon</small>`
    : p.age >= 3
      ? "♛ &nbsp; CASTLE AGE<small>Your kingdom has come of age</small>"
      : `↟ &nbsp; ADVANCE AGE<small>${resourcesText(ageCost)}${p.ageReady ? "" : " · " + ageRequirement}</small>`;
  const es = selectedEntities(),
    e = es[0];
  renderProductionIcons(e);
  const key =
    [...selected].join(",") +
    "|" +
    (e ? e.kind : -1) +
    "|" +
    p.age + ":" + p.ageReady + ":" + p.advancing +
    "|" +
    p.resources.map((n) => Math.floor(n / 5)).join(",") +
    "|" +
    es.map((e) => e.progress < 1).join(",") +
    "|" +
    (e?.spawnInside || false) +
    "|" +
    (e ? state.entities.filter((u) => u.garrison === e.id).length : 0) +
    "|" +
    actionTab +
    "|" +
    (e?.researchKind ?? -1) +
    "|" +
    JSON.stringify(p.technologies) +
    "|" +
    JSON.stringify(p.researching) +
    "|" +
    (e?.queue.length || 0);
  if (e) {
    $("selection-label").textContent =
      es.length > 1
        ? "YOUR COMPANY"
        : e.owner === player
          ? "SELECTED UNIT"
          : e.owner < 0
            ? "RESOURCE"
            : allied(e.owner, player)
              ? "ALLY UNIT"
              : "RIVAL UNIT";
    $("selected-count").textContent =
      es.length > 1
        ? es.length + " SELECTED"
        : e.owner === player
          ? (teamName(player) + " BANNER").toUpperCase()
          : e.owner < 0
            ? "THE RIVERLANDS"
            : allied(e.owner, player)
              ? "ALLIED BANNER"
              : "ENEMY BANNER";
    $("unit-info").querySelector("h2").textContent =
      es.length > 1 ? `${es.length} selected` : names[e.kind];
    $("unit-info").querySelector("p").textContent =
      es.length > 1
        ? `${es.filter((e) => e.kind === 0).length} workers · ${es.filter((e) => e.kind !== 0 && isUnitKind(e.kind)).length} soldiers`
        : e.progress < 1
          ? "Under construction"
          : isUnitKind(e.kind)
            ? e.kind === 0
              ? "Civilian · gathers, builds & repairs"
              : e.kind === 1
                ? "Spearman · counters cavalry" +
                  (e.projectile ? " · throws spears" : "")
                : [34, 39].includes(e.kind)
                  ? "Support · improves nearby allied speed and attack"
                  : [3, 28, 29, 31, 38].includes(e.kind)
                    ? "Mounted · swift battlefield movement"
                    : e.projectile
                      ? "Ranged · attacks from afar"
                      : "Infantry · close combat"
            : isResourceKind(e.kind)
              ? "Right-click with villagers to gather."
              : "Settlement building";
    $("health-fill").style.width =
      Math.max(0, (e.hp / (e.maxHP || maxHP[e.kind])) * 100) + "%";
    $("unit-detail").textContent =
      e.progress < 1
        ? `Construction ${Math.floor(e.progress * 100)}%`
        : isResourceKind(e.kind)
          ? `${Math.ceil(e.hp)} remaining`
          : `${Math.ceil(e.hp)} / ${Math.ceil(e.maxHP || maxHP[e.kind])} HP${isUnitKind(e.kind) ? " · " + ["Idle", "Moving", "Gathering", "Attacking", "Building", "Attack-moving", "Patrolling", "Defending area", "Holding ground", "Garrisoning", "Repairing"][e.order] : ""}${e.carry ? " · Carrying " + Math.floor(e.carry) : ""}`;
    $("queue").textContent =
      e.researchKind >= 0 && technologies[e.researchKind]
        ? `Researching ${technologies[e.researchKind].name} ${roman[(p.technologies?.[e.researchKind] || 0) + 1]} · ${Math.floor((e.training / technologies[e.researchKind].levels[p.technologies?.[e.researchKind] || 0].seconds) * 100)}%`
        : e.queue.length
          ? `Training ${names[e.queue[0]]} · ${Math.floor((e.training / durations[e.queue[0]]) * 100)}%${p.pop >= p.cap ? " · Need more houses" : ""}  |  ${e.queue.length} queued`
          : "";
  } else {
    $("selection-label").textContent = "YOUR SETTLEMENT";
    $("selected-count").textContent = (
      teamName(player) + " BANNER"
    ).toUpperCase();
    $("unit-info").querySelector("h2").textContent = "Command your kingdom";
    $("unit-info").querySelector("p").textContent =
      "Select units or buildings to issue orders.";
    $("unit-detail").textContent =
      ageNames[p.age] + " · " + p.kills + " enemies defeated";
    $("queue").textContent = "";
  }
  if (key === lastUI) return;
  lastUI = key;
  $("actions").replaceChildren();
  $("action-tabs").replaceChildren();
  const hasBuilder = es.some(
    (unit) => unit.owner === player && unit.kind === 0 && !unit.garrison,
  );
  if (hasBuilder && !isObserver()) {
    for (const [id, title] of [
      ["commands", "Commands"],
      ["economy", "Economy"],
      ["military", "Military"],
    ]) {
      const tab = document.createElement("button");
      tab.textContent = title;
      tab.title = id === "commands" ? "Unit commands" : title + " buildings";
      tab.dataset.actionTab = id;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(actionTab === id));
      tab.onclick = () => {
        actionTab = id;
        lastUI = "";
        updateUI();
      };
      $("action-tabs").append(tab);
    }
  } else actionTab = "commands";
  $("selection-roster").replaceChildren();
  $("portrait").replaceChildren();
  if (e) {
    const portrait = document.createElement("canvas");
    portrait.width = 100;
    portrait.height = 100;
    const pc = portrait.getContext("2d");
    pc.imageSmoothingEnabled = false;
    CrownArt.icon(pc, atlas, e, 100, 100);
    $("portrait").append(portrait);
  } else $("portrait").textContent = "♜";
  for (const unit of es.slice(0, 10)) {
    const b = document.createElement("button");
    b.textContent = symbols[unit.kind] || "♧";
    b.title = names[unit.kind];
    b.onclick = () => {
      selected = new Set([unit.id]);
      lastUI = "";
      updateUI();
    };
    $("selection-roster").append(b);
  }
  if (!e) {
    if (isObserver()) {
      $("unit-info").querySelector("h2").textContent = "The whole realm";
      $("unit-info").querySelector("p").textContent =
        "Select a kingdom above to inspect its economy.";
      return;
    }
    actionButton(
      "♜",
      "Town Center",
      "Find your Town Center",
      () => selectTown(),
      false,
      "H",
    );
    actionButton(
      "♟",
      "Idle worker",
      "Select an idle villager",
      selectIdle,
      false,
      ".",
    );
    return;
  }
  if (isObserver() || e.owner !== player) return;
  if (actionTab === "commands" && (e.kind !== 4 || isUnitKind(e.kind)))
    actionButton(
      "✕",
      isUnitKind(e.kind) ? "Delete units" : "Raze building",
      isUnitKind(e.kind)
        ? "Remove selected units immediately."
        : "Raze selected buildings after two confirmations.",
      requestDelete,
    );
  if (e.garrison) {
    actionButton(
      "⇧",
      "Select garrison",
      "Select the structure holding this unit.",
      () => {
        selected = new Set([e.garrison]);
        lastUI = "";
        updateUI();
      },
    );
    return;
  }
  if ([4, 9, 18].includes(e.kind)) {
    const count = state.entities.filter(
      (unit) => unit.garrison === e.id,
    ).length;
    actionButton(
      "⇧",
      "Deploy garrison",
      `Deploy ${count} units toward the rally flag.`,
      () => order("ungarrison"),
      count === 0,
    );
    if (e.kind === 4)
      actionButton(
        "⛨",
        e.spawnInside ? "Spawn outside" : "Spawn inside",
        "Toggle whether new villagers wait inside this Town Center.",
        () => order("spawninside"),
      );
  }
  if (isUnitKind(e.kind)) {
    if (hasBuilder && actionTab !== "commands") {
      const choices =
        actionTab === "economy" ? [4, 5, 10, 16, 15] : [6, 7, 8, 9, 17, 18, 41];
      for (const kind of choices.filter(allowedKind))
        actionButton(
          symbols[kind],
          names[kind],
          `<b>${names[kind]}</b><br><small>${resourcesText(costs[kind])}<br>${requiredAge[kind] > p.age ? "Requires " + ageNames[requiredAge[kind]] : "Click, then place on visible empty ground."}</small>`,
          () => beginBuild(kind),
          !affordable(kind),
          "",
          kind,
        );
      return;
    }
    if (hasBuilder)
      actionButton(
        "⚒",
        "Repair",
        "Click a damaged friendly building. Repairs cost half its construction resources per full health restored, rounded cumulatively.",
        () => armOrder("repair"),
      );
    for (const [symbol, name, action, tip] of [
      [
        "➜",
        "Move",
        "move",
        "Move to the clicked point without fighting on the way.",
      ],
      [
        "⚔",
        "Attack",
        "attack",
        "Click an enemy to attack, or ground to attack-move.",
      ],
      [
        "⚔",
        "Attack move",
        "attackmove",
        "Fight enemies on the way to a destination.",
      ],
      [
        "⇄",
        "Patrol",
        "patrol",
        "Click a destination. Travel between it and the starting point, fighting enemies on the route.",
      ],
      [
        "⛨",
        "Defend area",
        "defend",
        "Defend the current area and return after nearby enemies leave.",
      ],
      ["▣", "Hold ground", "hold", "Attack enemies in range without chasing."],
      ["■", "Stop", "stop", "Cancel current orders."],
    ])
      actionButton(symbol, name, tip, () =>
        ["defend", "hold", "stop"].includes(action)
          ? order(action)
          : armOrder(action),
      );
  } else if (e.progress >= 1) {
    for (const technology of technologies.filter(
      (t) => t.building === e.kind && (t.id !== 4 || allowedKind(40)) && (t.id !== 5 || allowedKind(20)),
    )) {
      const level = p.technologies?.[technology.id] || 0,
        next =
          [4, 5].includes(technology.id) && level >= 1 ? null : technology.levels[level],
        busy = p.researching?.[technology.id];
      actionButton(
        technology.id < 2 ? "⚒" : "▤",
        technology.name + (!next ? " ✓" : " " + roman[level + 1]),
        `<b>${technology.name}</b><br><small>${technology.description}<br>${next ? resourcesText(next.cost) + " · " + next.seconds + " seconds<br>Requires " + ageNames[next.age] : "Fully researched"}</small>`,
        () => order("research", { kind: technology.id }),
        !next ||
          busy ||
          e.researchKind >= 0 ||
          e.queue.length > 0 ||
          p.age < next.age ||
          (technology.id === 5 && !p.technologies?.[4]) ||
          !next.cost.every((n, i) => p.resources[i] >= n),
      );
    }
    for (const def of trainable(e.kind)) {
      const kind = def.kind;
      actionButton(
        symbols[kind] || "⚔",
        names[kind],
        `<b>Train ${names[kind]}</b><br><small>${resourcesText(costs[kind])}<br>${durations[kind]} seconds · up to 8 queued<br>Base: ${def.armor || 0} armor · ${def.damage} damage · ${kind === 1 && [1, 3].includes(p.race) ? 4.5 : def.range} range</small>`,
        () => order("train", { kind }),
        !affordable(kind) || e.researchKind >= 0 || e.queue.length >= 8,
        "",
        kind,
      );
    }
    if (e.kind === 4)
      actionButton(
        "↟",
        "Next age",
        `<b>Advance your kingdom</b><br><small>${resourcesText(ageCost)}<br>40 seconds · unlocks new troops and buildings</small>`,
        () => order("age"),
        $("advance").disabled,
      );
  }
}
function renderProductionIcons(building) {
  const area = $("production-icons");
  if (!area) return;
  const stored = building ? state.entities.filter(u=>u.garrison===building.id) : [];
  const key = building ? JSON.stringify([building.id,building.queue,stored.map(u=>[u.id,u.kind])]) : "";
  if (area.dataset.key === key) return;
  area.dataset.key = key; area.replaceChildren();
  if (!building) return;
  const icon = (kind, label, cancel) => {
    const tile=document.createElement("div");tile.className="production-tile";tile.title=label;
    const image=document.createElement("canvas");image.width=52;image.height=52;
    CrownArt.icon(image.getContext("2d"),atlas,{...building,kind},52,52);tile.append(image);
    if(cancel){const button=document.createElement("button");button.textContent="×";button.title="Cancel "+label;button.setAttribute("aria-label","Cancel "+label);button.onclick=cancel;tile.append(button);}
    else {const mark=document.createElement("small");mark.textContent="IN";tile.append(mark);}
    area.append(tile);
  };
  if (building.owner===player && !isObserver()) building.queue.forEach((kind,index)=>icon(kind,names[kind]+" #"+(index+1),()=>order("canceltrain",{target:building.id,kind:index})));
  for(const u of stored)icon(u.kind,"Garrisoned "+names[u.kind]);
}
function armOrder(action) {
  if (!selectedEntities().some((e) => e.owner === player && isUnitKind(e.kind)))
    return toast("Select your units first.");
  placing = -1;
  attackMode = action;
  canvas.style.cursor = "crosshair";
  const prompt = {
    move: "Click where to move.",
    repair:
      "Click a damaged friendly building to repair. Resources are consumed as health is restored.",
    attack: "Click an enemy or an attack destination.",
    attackmove: "Click a destination to attack-move.",
    patrol: "Click the other end of the patrol route.",
  };
  toast(prompt[action]);
}
function placementCenter(kind, value) {
  return Math.floor(value) + ((footprints[kind] || 1) % 2 ? 0.5 : 1);
}
function placementValid(kind, wx, wy) {
  if (!state || wx < 0 || wy < 0) return false;
  const n = footprints[kind] || 1,
    width = kind===41 ? (gateFacing%2 ? 1:3) : n,
    height = kind===41 ? (gateFacing%2 ? 3:1) : n,
    x = placementCenter(kind, wx), y = placementCenter(kind, wy),
    left = Math.floor(x-width/2+.001), top = Math.floor(y-height/2+.001);
  if (left < 0 || top < 0 || left + width > state.width || top + height > state.height)
    return false;
  for (let ty = top; ty < top + height; ty++)
    for (let tx = left; tx < left + width; tx++) {
      const cell = ty * state.width + tx;
      if (state.fog[cell] !== "2" || state.terrain[cell] === "1") return false;
      if (
        state.entities.some((e) => {
          if (!isBuildingKind(e.kind) && !isResourceKind(e.kind)) return false;
          if (kind===41 && e.kind===17 && e.owner===player) return false;
          const m = footprints[e.kind] || 1,
            ew=e.kind===41?(e.facing%2?1:3):m,
            eh=e.kind===41?(e.facing%2?3:1):m,
            ox = Math.floor(e.x - ew / 2 + .001),
            oy = Math.floor(e.y - eh / 2 + .001);
          return tx >= ox && tx < ox + ew && ty >= oy && ty < oy + eh;
        })
      )
        return false;
    }
  return true;
}
function beginBuild(kind) {
  if (!selectedEntities().some((e) => e.owner === player && e.kind === 0))
    return toast("Select your villagers first.");
  if (!allowedKind(kind) || !affordable(kind))
    return toast("Check resources and the required age for this building.");
  actionTab = [5, 10, 15, 16].includes(kind) ? "economy" : "military";
  lastUI = "";
  placing = kind;
  attackMode = false;
  canvas.style.cursor = "crosshair";
  toast(kind === 41 ? "Place a three-tile gate; R rotates. May replace your walls." :
    kind === 17 ? "Drag with the left button; release to build a connected wall. Shift appends jobs." :
    `Place ${names[kind]} on visible open ground. Shift queues construction. Right-click cancels.`);
}
function selectTown() {
  const e = state?.entities.find((e) => e.owner === player && e.kind === 4);
  if (e) {
    selected = new Set([e.id]);
    focus(e.x, e.y);
    updateUI();
  }
}
function selectIdle() {
  const idle =
    state?.entities.filter(
      (e) => e.owner === player && e.kind === 0 && e.order === 0,
    ) || [];
  if (!idle.length) return toast("All villagers are busy.");
  const e = idle[idleIndex++ % idle.length];
  selected = new Set([e.id]);
  focus(e.x, e.y);
  updateUI();
}
function hitEntity(x, y) {
  if (!state) return null;
  let result = null,
    best = 10000;
  const origin = viewOrigin(),
    worldX = (x - origin.x) / camera.zoom + camera.x,
    worldY = (y - origin.y) / camera.zoom + camera.y;
  for (const e of state.entities) {
    if (e.garrison) continue;
    // Reject distant world positions before allocating animated sprites/hit masks.
    // Padding includes tall 3x3 roofs and interpolation between server samples.
    if (
      Math.abs((e.x - e.y) * 32 - worldX) > 192 ||
      Math.abs((e.x + e.y) * 16 - worldY) > 512
    )
      continue;
    const visual = CrownMotion.visual(e),
      p = screen(visual.x, visual.y),
      n = CrownArt.footprint(e.kind);
    const dx = Math.abs(x - p.x),
      dy = Math.abs(y - p.y),
      d = Math.hypot(dx, dy);
    const max =
      dx / (n * 32 * camera.zoom) + dy / (n * 16 * camera.zoom) <= 1
        ? 100000
        : 0;
    if (d < max && d < best) {
      result = e;
      best = d;
    }
  }
  if (result) return result;
  // Roofs rise above their ground tiles. Test visible ink rather than a large
  // rectangular hit area, so gaps between towers still click through.
  let depth = -Infinity;
  for (const e of state.entities) {
    if (
      e.garrison ||
      !(isBuildingKind(e.kind) || isUnitKind(e.kind) || isResourceKind(e.kind))
    )
      continue;
    const p = screen(e.x, e.y);
    const rx = CrownArt.footprint(e.kind) * 32 * camera.zoom,
      rise =
        (isResourceKind(e.kind)
          ? 100
          : isUnitKind(e.kind)
            ? 48
            : 160 * CrownArt.renderScale(e)) * camera.zoom;
    if (Math.abs(x - p.x) > rx || y < p.y - rise || y > p.y + rx / 2) continue;
    if (
      e.x + e.y > depth &&
      CrownArt.hit(atlas, e, (x - p.x) / camera.zoom, (y - p.y) / camera.zoom)
    ) {
      result = e;
      depth = e.x + e.y;
    }
  }
  if (result) return result;
  const ground = unproject(x, y),
    tx = Math.floor(ground.x),
    ty = Math.floor(ground.y);
  for (const entity of state.entities) {
    if (entity.garrison) continue;
    if (
      isResourceKind(entity.kind) &&
      Math.floor(entity.x) === tx &&
      Math.floor(entity.y) === ty
    )
      return entity;
    if (isBuildingKind(entity.kind)) {
      const n = footprints[entity.kind] || 1,
        left = Math.round(entity.x - n / 2),
        top = Math.round(entity.y - n / 2);
      if (tx >= left && tx < left + n && ty >= top && ty < top + n)
        return entity;
    }
  }
  return null;
}
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("mousedown", (e) => {
  if (!connected) return;
  mouse = { x: e.clientX, y: e.clientY };
  canvas.focus();
  if (e.button === 1) {
    e.preventDefault();
    pan = { x: e.clientX, y: e.clientY, cx: camera.x, cy: camera.y };
    return;
  }
  if (e.button === 2) {
    if (placing >= 0 || attackMode) {
      placing = -1;
      wallDrag = null;
      attackMode = false;
      canvas.style.cursor = "default";
      return;
    }
    const w = unproject(e.clientX, e.clientY),
      target = hitEntity(e.clientX, e.clientY);
    const buildingSelection = selectedEntities().some(
      (unit) =>
        unit.owner === player && [4, 6, 7, 8, 9, 18].includes(unit.kind),
    );
    order(
      buildingSelection
        ? "rally"
        : e.shiftKey
          ? "queue_move"
          : target
            ? "interact"
            : "interact",
      {
        x: w.x,
        y: w.y,
        target: target?.id || 0,
      },
    );
    markers.push({
      x: w.x,
      y: w.y,
      life: 1.2,
      label: target && (isResourceKind(target.kind)||target.kind===10) && selectedEntities().some(u=>u.kind===0) ? "GATHER" : "",
      attack: target?.owner >= 0 && !allied(target.owner, player),
    });
    return;
  }
  if (e.button === 0) {
    if (placing >= 0) {
      const w = unproject(e.clientX, e.clientY);
      if (placing === 17) {
        wallDrag = {x: Math.floor(w.x), y: Math.floor(w.y), shift: e.shiftKey};
      } else {
        order(e.shiftKey ? "queue_build" : "build", { kind: placing, x: w.x, y: w.y, facing: gateFacing });
        if(!e.shiftKey){placing=-1;canvas.style.cursor="default";}
      }
      return;
    }
    if (attackMode) {
      const w = unproject(e.clientX, e.clientY);
      const target = hitEntity(e.clientX, e.clientY);
      const action =
        attackMode === "attack"
          ? target?.owner >= 0 && !allied(target.owner, player)
            ? "interact"
            : "attackmove"
          : attackMode;
      order(action, { x: w.x, y: w.y, target: target?.id || 0 });
      markers.push({
        x: w.x,
        y: w.y,
        life: 0.8,
        attack: action === "attackmove" || action === "interact",
      });
      attackMode = false;
      canvas.style.cursor = "default";
      return;
    }
    drag = {
      x: e.clientX,
      y: e.clientY,
      ex: e.clientX,
      ey: e.clientY,
      shift: e.shiftKey,
    };
  }
});
addEventListener("mousemove", (e) => {
  mouse = { x: e.clientX, y: e.clientY };
  if (drag) {
    drag.ex = e.clientX;
    drag.ey = e.clientY;
  }
  if (pan && connected) {
    camera.x = pan.cx - (e.clientX - pan.x) / camera.zoom;
    camera.y = pan.cy - (e.clientY - pan.y) / camera.zoom;
  }
});
addEventListener("mouseup", (e) => {
  if (e.button === 1) {
    pan = null;
    return;
  }
  if (wallDrag && e.button === 0) {
    const start = wallDrag, end = unproject(e.clientX, e.clientY);
    wallDrag = null;
    if(!start.shift){placing=-1;canvas.style.cursor="default";}
    const x1 = Math.floor(end.x), y1 = Math.floor(end.y);
    let x = start.x, y = start.y, dx = Math.abs(x1-x), dy = -Math.abs(y1-y),
      sx = x < x1 ? 1 : -1, sy = y < y1 ? 1 : -1, error = dx+dy;
    const limit = Math.min(17, Math.floor(state.players[player].resources[3] / (costs[17]?.[3] || 20)));
    let placed=0;
    for (let i = 0; i < limit; ++i) {
      if(placementValid(17,x+.5,y+.5)){
        order(start.shift || placed ? "queue_build" : "build", {kind:17, x:x+.5, y:y+.5});
        ++placed;
      }
      if (x === x1 && y === y1) break;
      const twice = error*2;
      if (twice >= dy) {error += dy; x += sx;}
      if (twice <= dx) {error += dx; y += sy;}
    }
    return;
  }
  if (!drag || e.button !== 0) return;
  const moved = Math.hypot(drag.ex - drag.x, drag.ey - drag.y);
  if (!drag.shift) selected.clear();
  if (moved > 6) {
    for (const entity of state.entities)
      if (
        entity.owner === player &&
        !entity.garrison &&
        isUnitKind(entity.kind)
      ) {
        const p = screen(entity.x, entity.y);
        if (
          p.x >= Math.min(drag.x, drag.ex) &&
          p.x <= Math.max(drag.x, drag.ex) &&
          p.y - 10 >= Math.min(drag.y, drag.ey) &&
          p.y - 10 <= Math.max(drag.y, drag.ey)
        )
          selected.add(entity.id);
      }
  } else {
    const entity = hitEntity(e.clientX, e.clientY);
    if (entity) {
      if (drag.shift && selected.has(entity.id)) selected.delete(entity.id);
      else selected.add(entity.id);
    }
  }
  drag = null;
  lastUI = "";
  updateUI();
});
canvas.addEventListener("dblclick", (e) => {
  const target = hitEntity(e.clientX, e.clientY);
  if (!target || target.owner !== player || !isUnitKind(target.kind)) return;
  selected.clear();
  for (const unit of state.entities) {
    const p = screen(unit.x, unit.y);
    if (
      unit.kind === target.kind &&
      unit.owner === player &&
      p.x > 0 &&
      p.x < innerWidth &&
      p.y > 77 &&
      p.y < viewport.h - viewport.hudHeight
    )
      selected.add(unit.id);
  }
  updateUI();
});
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    if (!connected) return;
    const before = unproject(e.clientX, e.clientY);
    camera.zoom = Math.max(
      1,
      Math.min(isObserver() ? 4 : 2, camera.zoom * (e.deltaY < 0 ? 1.1 : 0.91)),
    );
    const after = unproject(e.clientX, e.clientY),
      a = project(before.x, before.y),
      b = project(after.x, after.y);
    camera.x += a.x - b.x;
    camera.y += a.y - b.y;
  },
  { passive: false },
);
addEventListener("keydown", (e) => {
  if ($("escape-menu").open || $("delete-confirm").open) return;
  if (placing === 41 && e.code === "KeyR") {
    e.preventDefault(); gateFacing = (gateFacing+1)%4;
    toast("Gate direction: " + ["East","South","West","North"][gateFacing]); return;
  }
  if (
    CrownControls.isOpen ||
    $("mod-workshop").open ||
    $("guide").open ||
    ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName) ||
    e.target.isContentEditable
  )
    return;
  const action = CrownControls.action(e);
  if (!connected) {
    if (e.key === "Escape") {
      e.preventDefault();
      const openPanels = $("welcome").querySelectorAll("details[open]");
      if (openPanels.length) {
        for (const detail of openPanels) detail.open = false;
        return;
      }
      openEscapeMenu();
    } else if (action === "help") $("guide").showModal();
    return;
  }
  if (action) e.preventDefault();
  if (action?.startsWith("pan")) {
    keys.add(CrownControls.chord(e));
    return;
  }
  if (e.repeat) return;
  if (e.key === "Escape") {
    e.preventDefault();
    openEscapeMenu();
    return;
  }
  const buildKinds = {
    house: 5,
    barracks: 6,
    farm: 10,
    range: 7,
    tower: 9,
    stable: 8,
    blacksmith: 15,
    school: 16,
    wall: 17,
    fortress: 18,
  };
  if (buildKinds[action] !== undefined) beginBuild(buildKinds[action]);
  else if (action === "grid") toggleGrid();
  else if (action === "town" && !isObserver()) selectTown();
  else if (action === "idle" && !isObserver()) selectIdle();
  else if (["move", "attack", "attackMove", "patrol"].includes(action))
    armOrder(action === "attackMove" ? "attackmove" : action);
  else if (["stop", "defend", "hold"].includes(action)) order(action);
  else if (action === "delete") requestDelete();
  else if (action === "repair") armOrder("repair");
  else if (action === "train") {
    const entity = selectedEntities()[0],
      kind = trainable(entity?.kind).find(
        (d) => requiredAge[d.kind] <= state.players[player].age,
      )?.kind;
    if (kind !== undefined) order("train", { kind });
  } else if (action === "pause" && connected && isOperator()) control("pause");
  else if (action === "help") $("guide").showModal();
  if (/^[1-9]$/.test(e.key) && !e.altKey && !e.metaKey) {
    const k = e.key;
    if (e.ctrlKey) {
      e.preventDefault();
      groups[k] = [...selected];
      toast(`Control group ${k} saved.`);
    } else if (groups[k]) {
      selected = new Set(
        groups[k].filter((id) => state.entities.some((e) => e.id === id)),
      );
      updateUI();
    }
  }
});
addEventListener("keyup", (e) => {
  for (const key of keys)
    if (key === e.code || key.endsWith("+" + e.code)) keys.delete(key);
  if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) keys.clear();
});
addEventListener("crown-input-reset", () => {
  keys.clear();
  drag = null;
  pan = null;
  placing = -1;
  attackMode = false;
  canvas.style.cursor = "default";
});
addEventListener("focusin", (e) => {
  if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) keys.clear();
});
addEventListener("crown-controls-changed", () => {
  keys.clear();
  lastUI = "";
  if (state) updateUI();
});
addEventListener("blur", () => {
  keys.clear();
  drag = null;
  pan = null;
});
mini.addEventListener("mousedown", (e) => {
  if (!connected) return;
  const r = mini.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * state.width,
    y = ((e.clientY - r.top) / r.height) * state.height;
  focus(x, y);
});
$("solo").onclick = () => join("solo");
$("skirmish").onclick = () => join("skirmish");
$("spectate-seat").onclick = () => lobbyAction("spectate");
$("host").onclick = () => join("host-player");
$("join").onclick = () => join("join");
$("help").onclick = () => $("guide").showModal();
$("close-guide").onclick = () => $("guide").close();
$("pause").onclick = () => control("pause");
$("speed").onclick = () =>
  control("speed", state?.speed === 1 ? 2 : state?.speed === 2 ? 0.5 : 1);
$("advance").onclick = () => order("age");
$("restart").onclick = async () => {
  await control("restart");
  selected.clear();
  needsFocus = true;
};
const miniGround = document.createElement("canvas"),
  miniGroundContext = miniGround.getContext("2d");
let miniGroundState = null;
function drawMinimap() {
  if (!state) return;
  const w = mini.width,
    h = mini.height;
  mc.fillStyle = "#14211b";
  mc.fillRect(0, 0, w, h);
  if (
    !miniGroundState ||
    miniGroundState.terrain !== state.terrain ||
    miniGroundState.fog !== state.fog ||
    miniGround.width !== state.width ||
    miniGround.height !== state.height
  ) {
    miniGround.width = state.width;
    miniGround.height = state.height;
    const image = miniGroundContext.createImageData(state.width, state.height),
      pixels = image.data,
      hidden = [21, 35, 30],
      water = [84, 122, 114],
      seenWater = [42, 70, 64],
      sand = [169, 155, 114],
      seenGrass = [52, 72, 48],
      grass = [104, 124, 72];
    for (let i = 0; i < state.width * state.height; i++) {
      const fog = state.fog[i],
        kind = state.terrain[i],
        color =
          fog === "0"
            ? hidden
            : kind === "1"
              ? fog === "1"
                ? seenWater
                : water
              : kind === "2"
                ? sand
                : fog === "1"
                  ? seenGrass
                  : grass,
        offset = i * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
    miniGroundContext.putImageData(image, 0, 0);
    miniGroundState = { terrain: state.terrain, fog: state.fog };
  }
  mc.imageSmoothingEnabled = false;
  mc.drawImage(miniGround, 0, 0, w, h);
  // The slower compact overview preserves the minimap outside the detailed boxes.
  // Detailed positions override it; current fog hides stale enemy overview dots.
  const overview = new Map((state.overview || []).map((e) => [e.id, e]));
  for (const e of state.entities) overview.set(e.id, e);
  for (const e of overview.values()) {
    if (e.garrison) continue;
    const fog = state.fog[Math.floor(e.y) * state.width + Math.floor(e.x)];
    if (e.owner !== player && (e.owner < 0 ? fog === "0" : fog !== "2"))
      continue;
    if (e.kind === 11) {
      mc.fillStyle = "#345337";
      mc.fillRect((e.x * w) / state.width, (e.y * h) / state.height, 2, 2);
    } else if (e.owner >= 0) {
      mc.fillStyle = teamColor(e.owner);
      let s = CrownArt.footprint(e.kind) * 1.5;
      mc.fillRect(
        (e.x * w) / state.width - s / 2,
        (e.y * h) / state.height - s / 2,
        s,
        s,
      );
    }
  }
  const corners = [
    [0, 77],
    [viewport.w, 77],
    [viewport.w, viewport.h - viewport.hudHeight],
    [0, viewport.h - viewport.hudHeight],
  ].map(([x, y]) => unproject(x, y));
  mc.strokeStyle = "#e9d2a7b0";
  mc.lineWidth = 1;
  mc.beginPath();
  corners.forEach((p, i) =>
    i
      ? mc.lineTo((p.x * w) / state.width, (p.y * h) / state.height)
      : mc.moveTo((p.x * w) / state.width, (p.y * h) / state.height),
  );
  mc.closePath();
  mc.stroke();
  if (CrownPerf.cameraBoxes) {
    const box = cameraDebugView();
    if (box.view) {
      mc.save();
      mc.setLineDash([3, 2]);
      for (const [hw, hh, color] of [
        [box.ow, box.oh, "#f1ba62"],
        [box.iw, box.ih, "#71e0e5"],
      ]) {
        mc.strokeStyle = color;
        mc.beginPath();
        [
          [-hw, -hh],
          [hw, -hh],
          [hw, hh],
          [-hw, hh],
        ].forEach(([dx, dy], i) => {
          const px = box.cx + dx,
            py = box.cy + dy,
            x = ((px / 64 + py / 32) * w) / state.width,
            y = ((py / 32 - px / 64) * h) / state.height;
          if (i) mc.lineTo(x, y);
          else mc.moveTo(x, y);
        });
        mc.closePath();
        mc.stroke();
      }
      mc.restore();
    }
  }
}
function drawSnapshotBoxes() {
  if (!CrownPerf.cameraBoxes) return;
  const box = cameraDebugView();
  if (!box.view) return;
  const x = (box.cx - camera.x) * camera.zoom + viewport.w / 2,
    y = (box.cy - camera.y) * camera.zoom + gameOrigin.y;
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    0,
    77,
    viewport.w,
    Math.max(0, viewport.h - viewport.hudHeight - 77),
  );
  ctx.clip();
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 1.5;
  for (const [hw, hh, color] of [
    [box.ow, box.oh, "#f1ba62"],
    [box.iw, box.ih, "#71e0e5"],
  ]) {
    ctx.strokeStyle = color;
    ctx.strokeRect(
      x - hw * camera.zoom,
      y - hh * camera.zoom,
      hw * 2 * camera.zoom,
      hh * 2 * camera.zoom,
    );
  }
  ctx.restore();
}
function drawFlag(x, y, label, color, z) {
  const p = screen(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * z;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x, p.y - 27 * z);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 27 * z);
  ctx.lineTo(p.x + 15 * z, p.y - 22 * z);
  ctx.lineTo(p.x, p.y - 17 * z);
  ctx.fill();
  diamond(p.x, p.y, 7 * z, 3 * z, null, color);
  ctx.fillStyle = "#efe2b5";
  ctx.font = `${Math.max(8, Math.round(10 * z))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(label, p.x, p.y - 32 * z);
}
function drawOrderHighlights(z) {
  const units = selectedEntities().filter(
    (e) =>
      e.owner === player ||
      (isObserver() &&
        (state.role !== "team-spectator" || allied(e.owner, player))),
  );
  const targets = new Set();
  for (const unit of units) {
    if (
      unit.target &&
      [2, 3, 4, 9, 10].includes(unit.order) &&
      !targets.has(unit.target)
    ) {
      const target = entityById.get(unit.target);
      if (!target) continue;
      targets.add(target.id);
      const p = screen(target.x, target.y),
        color =
          unit.order === 3
            ? "#ef967c"
            : unit.order === 9
              ? "#9abbd5"
              : "#edd487";
      diamond(
        p.x,
        p.y,
        (isBuildingKind(target.kind) ? 38 * CrownArt.renderScale(target) : 18) *
          z,
        (isBuildingKind(target.kind) ? 19 * CrownArt.renderScale(target) : 9) *
          z,
        null,
        color,
      );
      ctx.fillStyle = color;
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        { 2: "GATHER", 3: "ATTACK", 4: "BUILD", 9: "GARRISON", 10: "REPAIR" }[
          unit.order
        ],
        p.x,
        p.y - 35 * z,
      );
    }
    if ([4, 6, 7, 8, 9, 18].includes(unit.kind) && unit.progress >= 1)
      drawFlag(unit.rallyX, unit.rallyY, "RALLY", teamColor(unit.owner), z);
  }
  const lead = units.find((e) => isUnitKind(e.kind) && !e.garrison);
  if (lead) {
    const points = (
      [1, 5, 6].includes(lead.order) ? [{ x: lead.goalX, y: lead.goalY }] : []
    ).concat(lead.waypoints || []);
    let last = screen(lead.x, lead.y);
    ctx.strokeStyle = "#dcc78488";
    ctx.lineWidth = z;
    ctx.setLineDash([4 * z, 5 * z]);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    for (const point of points) {
      const p = screen(point.x, point.y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    points.forEach((point, index) =>
      drawFlag(
        point.x,
        point.y,
        lead.order === 6 ? "PATROL" : String(index + 1),
        "#dfcc8b",
        z,
      ),
    );
  }
}
let razeSelection = [],
  razeStage = 0;
function requestDelete() {
  if (!connected || isObserver()) return;
  const owned = selectedEntities().filter((e) => e.owner === player);
  const units = owned.filter((e) => isUnitKind(e.kind)),
    buildings = owned.filter((e) => isBuildingKind(e.kind) && e.kind !== 4);
  if (units.length) order("delete", { ids: units.map((e) => e.id).join(" ") });
  if (!buildings.length) return;
  keys.clear();
  razeSelection = buildings.map((e) => e.id);
  razeStage = 1;
  $("delete-title").textContent =
    `Raze ${buildings.length === 1 ? names[buildings[0].kind] : buildings.length + " buildings"}?`;
  $("delete-warning").textContent =
    "This destroys your selected buildings. Stored units will deploy if possible. Unfinished foundations return 50% of their construction cost. Town Centers cannot be razed.";
  $("delete-stage").textContent = "Confirmation 1 of 2";
  $("confirm-delete").textContent = "CONTINUE TO FINAL CONFIRMATION";
  $("confirm-delete").disabled = false;
  $("delete-confirm").showModal();
}
$("cancel-delete").onclick = () => $("delete-confirm").close();
$("confirm-delete").onclick = () => {
  if (razeStage === 1) {
    razeStage = 2;
    $("delete-stage").textContent =
      "Confirmation 2 of 2 · this cannot be undone";
    $("confirm-delete").textContent = "CONFIRM — RAZE BUILDINGS";
    $("confirm-delete").disabled = true;
    setTimeout(() => {
      $("confirm-delete").disabled = false;
    }, 300);
    return;
  }
  if (razeStage === 2) {
    razeStage = 0;
    $("delete-confirm").close();
    order("raze", { ids: razeSelection.join(" ") });
  }
};
$("escape-menu").addEventListener("close", () => {
  if (!CrownControls.isOpen && !$("guide").open && !$("delete-confirm").open)
    canvas.focus();
});
let returnToEscape = false;
function openEscapeMenu() {
  keys.clear();
  drag = null;
  pan = null;
  placing = -1;
  attackMode = false;
  canvas.style.cursor = "default";
  $("surrender-confirm").classList.add("hidden");
  $("escape-title").textContent = connected ? "Game menu" : "Settings";
  $("menu-match-info").textContent =
    `On\u0027Gate: Legacy ${state?.version || ""} · ${state?.mode || "Main menu"}`;
  $("menu-audio").checked = CrownSound.enabled;
  for (const [id, key] of [
    ["master-volume", "master"],
    ["music-volume", "music"],
    ["effects-volume", "effects"],
  ])
    $(id).value = Math.round(CrownSound.volumes[key] * 100);
  $("menu-surrender").disabled = !connected;
  $("menu-host").disabled = !!window.CrownWeb || !connected || !isOperator();
  $("menu-surrender").textContent = "SURRENDER";
  $("menu-resume").textContent = connected
    ? "RESUME GAME"
    : "BACK TO MAIN MENU";
  $("escape-menu").showModal();
}
$("welcome-settings").onclick = openEscapeMenu;
$("player-name").value = (
  localStorage.getItem("crown-player-name") || ""
).slice(0, 24);
$("player-name").oninput = () =>
  localStorage.setItem("crown-player-name", $("player-name").value);
$("close-escape").onclick = $("menu-resume").onclick = () =>
  $("escape-menu").close();
$("menu-host").onclick = () => window.open("/host.html", "_blank");
$("menu-controls").onclick = () => {
  returnToEscape = true;
  $("escape-menu").close();
  CrownControls.open();
};
$("menu-info").onclick = () => {
  returnToEscape = true;
  $("escape-menu").close();
  $("guide").showModal();
};
for (const id of ["controls-dialog", "guide"])
  $(id).addEventListener("close", () => {
    if (returnToEscape && !CrownControls.isOpen && !$("guide").open) {
      returnToEscape = false;
      openEscapeMenu();
    }
  });
$("menu-surrender").onclick = () => {
  $("surrender-confirm").classList.remove("hidden");
  $("surrender-warning").textContent = isOperator()
    ? "Surrender and return to the main menu? As host, this closes the match for everyone."
    : isObserver()
      ? "Leave this spectator seat and return to the main menu?"
      : "Surrender your kingdom and return to the main menu?";
};
$("cancel-surrender").onclick = () =>
  $("surrender-confirm").classList.add("hidden");
$("confirm-surrender").onclick = async () => {
  $("confirm-surrender").disabled = true;
  try {
    await api("leave", {}, "POST");
    returnToMainMenu();
  } catch (error) {
    toast(error.message);
  } finally {
    $("confirm-surrender").disabled = false;
  }
};
$("menu-audio").onchange = async () => {
  if ($("menu-audio").checked !== CrownSound.enabled) await CrownSound.toggle();
  $("sound").setAttribute("aria-pressed", CrownSound.enabled);
};
for (const [id, key] of [
  ["master-volume", "master"],
  ["music-volume", "music"],
  ["effects-volume", "effects"],
])
  $(id).oninput = () => CrownSound.setVolume(key, Number($(id).value) / 100);
// Terrain chunks are anchored in world space, so camera movement only translates them.
function drawGround() {
  CrownGround.draw(
    ctx,
    state,
    atlas,
    camera,
    viewOrigin(),
    viewport.w,
    viewport.h,
    gridEnabled,
    !connected, // Decorative land fills menu borders without extending the playable map.
  );
}
function frame(now) {
  if (document.body.classList.contains("studio-content")) {
    requestAnimationFrame(frame);
    return;
  }
  const renderDeadline = CrownPerf.nextFrame(now, lastRendered);
  if (renderDeadline === null) {
    requestAnimationFrame(frame);
    return;
  }
  lastRendered = renderDeadline;
  const renderStarted = performance.now();
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  if (!connected || (!state?.paused && !state?.waiting && state?.winner < 0))
    renderTime += dt * (connected ? state.speed || 1 : 1);
  CrownMotion.advance(dt);
  CrownDamage.advance(dt, state?.paused, state?.speed || 1);
  if (
    connected &&
    !state?.waiting &&
    !$("guide").open &&
    !$("mod-workshop").open &&
    !CrownControls.isOpen &&
    !$("escape-menu").open &&
    !$("delete-confirm").open
  ) {
    let dx = 0,
      dy = 0;
    if (CrownControls.down("panLeft", keys)) dx--;
    if (CrownControls.down("panRight", keys)) dx++;
    if (CrownControls.down("panUp", keys)) dy--;
    if (CrownControls.down("panDown", keys)) dy++;
    // Edge panning stays above the command deck, so UI interaction never drifts the map.
    if (
      CrownControls.edgePan &&
      mouse.y > 80 &&
      mouse.y < viewport.h - viewport.hudHeight - 10
    ) {
      if (mouse.x >= 0 && mouse.x < 8) dx--;
      if (mouse.x > viewport.w - 8) dx++;
      if (mouse.y < 85) dy--;
    }
    camera.x += (dx * dt * CrownControls.panSpeed) / camera.zoom;
    camera.y += (dy * dt * CrownControls.panSpeed * 0.82) / camera.zoom;
    camera.x = Math.max(
      -state.height * 32,
      Math.min(state.width * 32, camera.x),
    );
    camera.y = Math.max(
      0,
      Math.min((state.width + state.height) * 16, camera.y),
    );
  }
  ctx.fillStyle = "#1a2b24";
  ctx.fillRect(0, 0, viewport.w, viewport.h);
  if (state && atlas) {
    const z = camera.zoom;
    drawGround(z);
    drawOrderHighlights(z);
    const ordered = renderEntities;
    ordered.length = 0;
    const origin = viewOrigin();
    for (const source of state.entities) {
      if (source.garrison) continue;
      const sx = ((source.x - source.y) * 32 - camera.x) * z + origin.x,
        sy = ((source.x + source.y) * 16 - camera.y) * z + origin.y;
      if (
        sx < -256 * z ||
        sx > viewport.w + 256 * z ||
        sy < -128 * z ||
        sy > viewport.h + 400 * z
      )
        continue;
      const e = CrownMotion.visual(source),
        p = screen(e.x, e.y);
      if (
        p.x >= -130 * z &&
        p.x <= viewport.w + 130 * z &&
        p.y >= 30 &&
        p.y <= viewport.h + 250 * z
      )
        ordered.push(e);
    }
    ordered.sort((a, b) => a.x + a.y - b.x - b.y);
    const hovered =
      mouse.y < viewport.h - viewport.hudHeight
        ? hitEntity(mouse.x, mouse.y)
        : null;
    for (const e of ordered) {
      const p = screen(e.x, e.y);
      if (
        p.x < -130 * z ||
        p.x > viewport.w + 130 * z ||
        p.y < 60 ||
        p.y > viewport.h + 250 * z
      )
        continue;
      if (selected.has(e.id))
        diamond(
          p.x,
          p.y,
          isBuildingKind(e.kind) ? (footprints[e.kind] || 1) * 32 * z : 13 * z,
          isBuildingKind(e.kind) ? (footprints[e.kind] || 1) * 16 * z : 6 * z,
          "#b4d7ac20",
          allied(e.owner, player) ? "#d1dba3" : "#e0a078",
        );
      ctx.save();
      CrownArt.clipTile(ctx, e, p.x, p.y, z);
      if (e.progress < 1) {
        diamond(p.x, p.y, 29 * z, 15 * z, "#a5966233", "#bcad7d");
        ctx.save();
        ctx.beginPath();
        ctx.rect(
          p.x - 65 * CrownArt.renderScale(e) * z,
          p.y - 170 * CrownArt.renderScale(e) * z * e.progress,
          130 * CrownArt.renderScale(e) * z,
          170 * CrownArt.renderScale(e) * z * e.progress + 40 * z,
        );
        ctx.clip();
        CrownArt.blit(ctx, atlas, e, p.x, p.y, z, 0.65);
        ctx.restore();
        ctx.strokeStyle = "#bba472";
        ctx.lineWidth = 2 * z;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(p.x + i * 22 * z, p.y + 10 * z);
          ctx.lineTo(p.x + i * 22 * z, p.y - 40 * z);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
      } else {
        const sway =
          e.kind === 11 ? Math.sin(renderTime * 0.8 + e.id) * 0.7 * z : 0;
        if (isUnitKind(e.kind)) CrownMotion.draw(ctx, atlas, e, p, z);
        else if (isBuildingKind(e.kind)) {
          CrownDamage.building(ctx, atlas, e, p, z, renderTime);
          CrownArt.buildingFlag(ctx, e, p.x, p.y, z, renderTime);
        } else CrownArt.blit(ctx, atlas, e, p.x, p.y, z);
        if (e.kind === 5) {
          for (let puff = 0; puff < 2; puff++) {
            const phase = (renderTime * 0.17 + puff * 0.5 + e.id * 0.1) % 1;
            ctx.fillStyle = `rgba(187,191,163,${(1 - phase) * 0.23})`;
            ctx.fillRect(
              Math.round(p.x + 18 * z + Math.sin(phase * 5 + e.id) * 3 * z),
              Math.round(p.y - 58 * z - phase * 15 * z),
              (2 + phase * 4) * z,
              (2 + phase * 3) * z,
            );
          }
        }
      }
      if (e.owner >= 0) {
        ctx.fillStyle = teamColor(e.owner);
        ctx.strokeStyle = "#18241c";
        ctx.lineWidth = 1;
        const n = CrownArt.footprint(e.kind),
          by = p.y + n * 11 * z;
        ctx.beginPath();
        ctx.moveTo(p.x - 4 * z, by);
        ctx.lineTo(p.x + 4 * z, by);
        ctx.lineTo(p.x, by + 4 * z);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      if (
        e.owner >= 0 &&
        (selected.has(e.id) ||
          e.hp < (e.maxHP || maxHP[e.kind]) ||
          hovered?.id === e.id)
      ) {
        const width = (isUnitKind(e.kind) ? 25 : 45) * z,
          height =
            (isUnitKind(e.kind)
              ? 38
              : e.kind === 4
                ? 102 * CrownArt.renderScale(e)
                : e.kind === 9
                  ? 91
                  : 71) * z;
        ctx.fillStyle = "#112119";
        ctx.fillRect(p.x - width / 2 - 1, p.y - height - 1, width + 2, 5);
        ctx.fillStyle = allied(e.owner, player) ? "#acc379" : "#cf8067";
        ctx.fillRect(
          p.x - width / 2,
          p.y - height,
          (width * e.hp) / (e.maxHP || maxHP[e.kind]),
          3,
        );
      }
    }
    if (
      gridEnabled &&
      mouse.y > 77 &&
      mouse.y < viewport.h - viewport.hudHeight
    ) {
      const cell = unproject(mouse.x, mouse.y);
      if (
        cell.x >= 0 &&
        cell.y >= 0 &&
        cell.x < state.width &&
        cell.y < state.height
      ) {
        const p = screen(Math.floor(cell.x) + 0.5, Math.floor(cell.y) + 0.5);
        diamond(p.x, p.y, 32 * z, 16 * z, "#efdc8e22", "#f0daa0");
        ctx.fillStyle = "#f2e4bb";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `${Math.floor(cell.x)}, ${Math.floor(cell.y)}`,
          p.x,
          p.y + 4,
        );
      }
    }
    if (placing >= 0) {
      const w = unproject(mouse.x, mouse.y),
        p = screen(
          placementCenter(placing, w.x),
          placementCenter(placing, w.y),
        ),
        valid = placementValid(placing, w.x, w.y);
      if(placing===41){
        const fw=gateFacing%2?1:3, fh=gateFacing%2?3:1;
        ctx.beginPath();
        [[-fw/2,-fh/2],[fw/2,-fh/2],[fw/2,fh/2],[-fw/2,fh/2]].forEach(([dx,dy],i)=>{
          const q=screen(placementCenter(placing,w.x)+dx,placementCenter(placing,w.y)+dy);
          if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);
        });ctx.closePath();ctx.fillStyle=valid?"#bddb9b44":"#dc725b55";ctx.strokeStyle=valid?"#d1e4ae":"#e99777";ctx.fill();ctx.stroke();
      }else diamond(
        p.x,
        p.y,
        (footprints[placing] || 1) * 32 * z,
        (footprints[placing] || 1) * 16 * z,
        valid ? "#bddb9b44" : "#dc725b55",
        valid ? "#d1e4ae" : "#e99777",
      );
      CrownArt.blit(
        ctx,
        atlas,
        {
          kind: placing,
          facing: gateFacing,
          owner: player,
          id: 0,
          age: state.players[player].age,
          race: state.players[player].race,
        },
        p.x,
        p.y,
        z,
        0.6,
      );
    }
    if (drag && Math.hypot(drag.ex - drag.x, drag.ey - drag.y) > 5) {
      ctx.fillStyle = "#d7d5a31c";
      ctx.strokeStyle = "#d5d8a4";
      ctx.fillRect(drag.x, drag.y, drag.ex - drag.x, drag.ey - drag.y);
      ctx.strokeRect(
        drag.x + 0.5,
        drag.y + 0.5,
        drag.ex - drag.x,
        drag.ey - drag.y,
      );
    }
    CrownDamage.drawGhosts(ctx, atlas, screen, z);
    for (const m of markers) {
      m.life -= dt;
      const p = screen(m.x, m.y);
      ctx.strokeStyle = m.attack
        ? `rgba(230,135,100,${m.life})`
        : `rgba(230,221,153,${m.life})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y,
        (20 * (1 - m.life) + 6) * z,
        (9 * (1 - m.life) + 3) * z,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    for (const m of markers) if (m.label) {
      const p=screen(m.x,m.y);ctx.save();ctx.globalAlpha=Math.min(1,m.life*2);
      ctx.font="bold 18px sans-serif";ctx.textAlign="center";ctx.lineWidth=4;
      ctx.strokeStyle="#142a20";ctx.fillStyle="#ffe6a0";
      ctx.strokeText(m.label,p.x,p.y-55*z-(1.2-m.life)*18);
      ctx.fillText(m.label,p.x,p.y-55*z-(1.2-m.life)*18);ctx.restore();
    }
    markers = markers.filter((m) => m.life > 0);
    for (const effect of effects) {
      effect.life -= state.paused ? 0 : dt * (state.speed || 1);
      const p = screen(effect.x, effect.y);
      ctx.fillStyle = `rgba(247,192,138,${Math.min(1, effect.life * 2)})`;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "-" + effect.damage,
        p.x,
        p.y - 40 * z - (0.65 - effect.life) * 25,
      );
    }
    effects = effects.filter((e) => e.life > 0);
    for (const shot of shots) {
      if (shot.delay > 0) {
        shot.delay -= state.paused ? 0 : dt * (state.speed || 1);
        continue;
      }
      shot.life -= state.paused ? 0 : dt * (state.speed || 1);
      const t = 1 - shot.life / 0.32,
        a = screen(shot.x, shot.y),
        b = screen(shot.tx, shot.ty),
        x = a.x + (b.x - a.x) * t,
        y =
          a.y +
          (b.y - a.y) * t -
          (shot.building ? 60 : 25) * z * (1 - t) -
          16 * z * t -
          Math.sin(t * Math.PI) * 22 * z;
      ctx.strokeStyle = "#e5d5a2";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - (b.x - a.x) * 0.045, y - (b.y - a.y) * 0.045);
      ctx.stroke();
      if (shot.kind === 30) {
        // Oxen Lords throw rotating axe heads; spears and bolts retain slim shafts.
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(renderTime * 18);
        ctx.fillStyle = "#bac3af";
        ctx.fillRect(-4 * z, -3 * z, 7 * z, 5 * z);
        ctx.fillStyle = "#8a6d42";
        ctx.fillRect(-1 * z, -6 * z, 2 * z, 12 * z);
        ctx.restore();
      }
    }
    shots = shots.filter((s) => s.life > 0);
    if (connected && now - lastMiniDraw >= 100) {
      drawMinimap();
      lastMiniDraw = now;
    }
  }
  if (connected) {
    // Soft vignette binds the map to the illuminated command deck.
    if (!vignette) {
      vignette = ctx.createRadialGradient(
        viewport.w * 0.52,
        viewport.h * 0.45,
        viewport.h * 0.2,
        viewport.w * 0.52,
        viewport.h * 0.45,
        viewport.w * 0.75,
      );
      vignette.addColorStop(0, "#08190f00");
      vignette.addColorStop(1, "#071a1370");
    }
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 77, viewport.w, viewport.h - 77);
  }
  drawSnapshotBoxes();
  CrownPerf.frame(performance.now() - renderStarted);
  requestAnimationFrame(frame);
}

function mapSettings() {
  const size = $("map-preset").value;
  return {
    width: size === "custom" ? $("map-width").value : size,
    height: size === "custom" ? $("map-height").value : size,
    style: $("map-choice").value.startsWith("custom:")
      ? 0
      : $("map-choice").value,
    mapId: $("map-choice").value.startsWith("custom:")
      ? $("map-choice").value.slice(7)
      : "",
    difficulty: $("ai-difficulty").value,
    capacity: $("max-players").value,
    seed: $("map-seed").value,
  };
}
function toggleGrid() {
  gridEnabled = !gridEnabled;
  localStorage.setItem("crown-grid", gridEnabled);
  $("grid").setAttribute("aria-pressed", gridEnabled);
  toast(
    gridEnabled
      ? "Tile grid on · coordinates are zero-based."
      : "Tile grid off.",
  );
}
async function lobbyAction(action, extra = {}) {
  try {
    await api("lobby", { action, ...extra }, "POST");
  } catch (e) {
    toast(e.message);
  }
}
function updateLobby() {
  const lobby = state.lobby;
  if (!lobby) return;
  const isHost = isOperator(),
    slot = lobby.slots.find((s) => s.id === player),
    opposingSides = lobby.slots.some((a, i) =>
      lobby.slots.some((b, j) => i !== j && (!a.team || a.team !== b.team)),
    ),
    allReady = opposingSides && lobby.slots.every((s) => s.ready);
  $("lobby-count").textContent = `${lobby.slots.length} / ${lobby.capacity}`;
  $("ready").classList.toggle("hidden", isObserver());
  $("spectate-seat").classList.toggle("hidden", isObserver());
  $("spectate-seat").textContent =
    state.mode === "local" ? "WATCH AI VS AI" : "SPECTATE · AI TAKES MY SEAT";
  $("lan-share").classList.toggle("hidden", state.mode !== "lan");
  $("lan-observer-seats").classList.toggle("hidden", state.mode !== "lan");
  $("add-ai").classList.toggle("hidden", !isHost);
  $("add-ai").disabled = lobby.slots.length >= lobby.capacity;
  $("operator-name").textContent =
    `HOST: ${lobby.host || "Solo"} · ${lobby.ownerSeat === 20 ? "dedicated operator" : lobby.ownerSeat >= 16 ? "spectator host" : "playing commander"}`;
  $("lobby-console").classList.toggle("hidden", !isHost || !!window.CrownWeb);
  $("spectator-list").textContent =
    `SPECTATORS ${lobby.spectators?.length || 0}/4: ${(lobby.spectators || []).map((s) => s.name).join(", ") || "open seats"}`;
  $("ready").textContent = slot?.ready
    ? "✓ READY · CLICK TO UNREADY"
    : "READY UP";
  $("ready").classList.toggle("is-ready", !!slot?.ready);
  $("start-match").classList.toggle("hidden", !isHost);
  $("start-match").disabled = !allReady;
  $("lobby-status").textContent = allReady
    ? "All commanders are ready. The host may begin."
    : lobby.slots.length < 2
      ? "Add an AI kingdom or invite another commander."
      : !opposingSides
        ? "Choose at least two opposing teams (or No team)."
        : "Every human commander must ready up before the host starts.";
  const configKey = [
    lobby.width,
    lobby.height,
    lobby.style,
    lobby.seed,
    lobby.capacity,
    lobby.mapId,
    lobby.artTheme,
    player,
  ].join(",");
  if (configKey !== lobbyUIKey) {
    lobbyUIKey = configKey;
    $("lobby-width").value = lobby.width;
    $("lobby-height").value = lobby.height;
    $("lobby-art-theme").value = lobby.artTheme || "silk-road";
    $("lobby-size").value =
      lobby.width === lobby.height && [64, 80, 96, 112, 128].includes(lobby.width)
        ? String(lobby.width)
        : "custom";
    $("lobby-custom-dimensions").classList.toggle("hidden", $("lobby-size").value !== "custom");
    $("lobby-map").value = lobby.mapId ? "custom:" + lobby.mapId : lobby.style;
    $("lobby-seed").value = lobby.seed;
    $("lobby-capacity").value = lobby.capacity;
  }
  for (const id of [
    "lobby-size",
    "lobby-art-theme",
    "lobby-width",
    "lobby-height",
    "lobby-map",
    "lobby-seed",
    "lobby-capacity",
    "apply-map",
  ])
    $(id).disabled = !isHost;
  const key =
    JSON.stringify(lobby.slots) +
    isHost +
    JSON.stringify(window.crownContent?.civilizations || []);
  if ($("lobby-players").dataset.key !== key) {
    $("lobby-players").dataset.key = key;
    $("lobby-players").replaceChildren();
    for (const s of lobby.slots) {
      const row = document.createElement("div");
      row.className = "commander-row";
      const flag = document.createElement("span");
      flag.className = "commander-color";
      flag.style.background = teamColor(s.id);
      const name = document.createElement("span");
      name.textContent =
        s.name + (s.ai ? " · AI" : s.id === player ? " (you)" : "");
      const status = document.createElement("small");
      status.textContent = s.ai
        ? "COMPUTER · READY"
        : s.ready
          ? "✓ READY"
          : "NOT READY";
      status.className = s.ready ? "ready-status" : "";
      row.append(flag, name, status);
      const civ = document.createElement("select");
      civ.setAttribute("aria-label", "Civilization for " + s.name);
      for (const def of [
        { id: "__random__", name: "Random civilization" },
        ...(window.crownContent?.civilizations || []),
      ]) {
        const o = document.createElement("option");
        o.value = def.id;
        o.textContent = def.name;
        civ.append(o);
      }
      civ.value = s.civilization;
      civ.disabled = s.ai ? !isHost : s.id !== player;
      civ.onchange = () =>
        s.ai
          ? lobbyAction("seat", { slot: s.id, civilization: civ.value })
          : lobbyAction("civilization", { id: civ.value });
      const controls = document.createElement("div");
      controls.className = "seat-controls";
      controls.append(civ);
      if (s.ai) {
        const difficulty = document.createElement("select");
        difficulty.setAttribute("aria-label", "Difficulty for " + s.name);
        for (const def of difficulties) {
          const option = document.createElement("option");
          option.value = def.id;
          option.textContent = def.name;
          option.title = def.description;
          difficulty.append(option);
        }
        difficulty.value = s.difficulty;
        difficulty.disabled = !isHost;
        difficulty.onchange = () =>
          lobbyAction("seat", { slot: s.id, difficulty: difficulty.value });
        controls.append(difficulty);
      }
      const team = document.createElement("select");
      team.setAttribute("aria-label", "Team for " + s.name);
      for (let i = 0; i <= 16; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i ? "Team " + i : "No team";
        team.append(option);
      }
      team.value = s.team;
      team.disabled = !isHost;
      team.onchange = () =>
        lobbyAction("seat", { slot: s.id, team: team.value });
      controls.append(team);
      const color = document.createElement("select");
      color.setAttribute("aria-label", "Banner color for " + s.name);
      for (const [id, name] of CrownArt.teamNames.entries()) {
        const option = new Option(name, id);
        option.disabled = lobby.slots.some(
          (other) => other.id !== s.id && other.color === id,
        );
        color.append(option);
      }
      color.value = s.color;
      color.disabled = s.id !== player && !(isHost && s.ai);
      color.onchange = () =>
        s.id === player
          ? lobbyAction("color", { color: color.value })
          : lobbyAction("seat", { slot: s.id, color: color.value });
      controls.append(color);
      if (isHost && s.id !== lobby.ownerSeat) {
        const kick = document.createElement("button");
        kick.textContent = "×";
        kick.title = "Remove " + s.name;
        kick.setAttribute("aria-label", "Remove " + s.name);
        kick.onclick = () => lobbyAction("kick", { slot: s.id });
        controls.append(kick);
      }
      row.append(controls);
      $("lobby-players").append(row);
    }
  }
}
for (const id of ["max-players", "lobby-capacity"]) {
  for (let n = 2; n <= 16; n++) {
    const option = document.createElement("option");
    option.value = n;
    option.textContent = n + " players";
    $(id).append(option);
  }
  $(id).value = 2;
}
$("map-preset").onchange = () =>
  $("custom-dimensions").classList.toggle(
    "hidden",
    $("map-preset").value !== "custom",
  );
$("add-ai").onclick = () => lobbyAction("add_ai");
$("ready").onclick = () => lobbyAction("ready");
$("start-match").onclick = () => lobbyAction("start");
$("lobby-size").onchange = () => {
  const size = $("lobby-size").value;
  $("lobby-custom-dimensions").classList.toggle("hidden", size !== "custom");
  if (size !== "custom") $("lobby-width").value = $("lobby-height").value = size;
};
$("apply-map").onclick = () =>
  lobbyAction("configure", {
    artTheme: $("lobby-art-theme").value,
    width: $("lobby-width").value,
    height: $("lobby-height").value,
    style: $("lobby-map").value.startsWith("custom:")
      ? 0
      : $("lobby-map").value,
    mapId: $("lobby-map").value.startsWith("custom:")
      ? $("lobby-map").value.slice(7)
      : "",
    capacity: $("lobby-capacity").value,
    seed: $("lobby-seed").value,
  });
$("server-address").textContent = location.host;
$("grid").onclick = toggleGrid;
$("grid").setAttribute("aria-pressed", gridEnabled);
$("settings").onclick = () => {
  if (state.mode === "local") {
    control("lobby");
    return;
  }
  if (state.isHost && state.role !== "host") {
    window.open("/host.html", "_blank");
    return;
  }
  consoleOpen = !consoleOpen;
  updateObserverUI();
};

function updateObserverUI() {
  $("observer-tools").querySelector("small").textContent =
    state?.role === "team-spectator"
      ? "Team vision only · fog of war · read-only"
      : "Full map vision · read-only";
  $("observer-tools").classList.toggle(
    "hidden",
    !isObserver() || state.waiting,
  );
  $("observer-role").textContent =
    state.role === "host"
      ? "SERVER OPERATOR"
      : state.role === "team-spectator"
        ? "TEAM VISION · FOG LOCKED"
        : "SPECTATOR";
  const optionsKey =
    state.lobby?.slots.map((s) => s.name).join("|") +
    "|" +
    state.players.length +
    "|" +
    state.role;
  if ($("observe-player").dataset.key !== optionsKey) {
    $("observe-player").dataset.key = optionsKey;
    $("observe-player").replaceChildren();
    for (let i = 0; i < state.players.length; i++) {
      if (state.role === "team-spectator" && !allied(i, player)) continue;
      const option = document.createElement("option");
      option.value = i;
      option.textContent =
        state.lobby?.slots.find((s) => s.id === i)?.name ||
        teamName(i) + " kingdom";
      $("observe-player").append(option);
    }
  }
  $("observe-player").value = observedPlayer;
  $("server-console").classList.toggle(
    "hidden",
    state.role !== "host" || state.waiting || !consoleOpen,
  );
  if (state.role === "host") {
    $("console-status").textContent =
      `${state.paused ? "PAUSED" : "LIVE"} · ${mapNames[state.mapStyle]} · ${state.width} × ${state.height}`;
    $("console-stats").textContent =
      `${state.lobby.slots.length}/16 players · ${state.lobby.spectators.length}/4 spectators · 20 simulation ticks/s`;
    $("console-roster").replaceChildren();
    for (let i = 0; i < state.players.length; i++) {
      const row = document.createElement("div"),
        p = state.players[i];
      row.className = "console-player";
      const name = document.createElement("span");
      name.textContent =
        state.lobby.slots.find((s) => s.id === i)?.name || teamName(i);
      name.style.color = teamColor(i);
      const stats = document.createElement("small");
      stats.textContent = p.defeated
        ? "ELIMINATED"
        : `${p.pop}/${p.cap} population · ${roman[p.age]} age · ${p.kills} kills`;
      row.append(name, stats);
      $("console-roster").append(row);
    }
  }
}
$("observe-player").onchange = () => {
  observedPlayer = Number($("observe-player").value);
  const home =
    state.entities.find((e) => e.owner === observedPlayer && e.kind === 4) ||
    state.overview?.find(
      (e) =>
        e.owner === observedPlayer &&
        e.kind === 4 &&
        state.fog[Math.floor(e.y) * state.width + Math.floor(e.x)] === "2",
    );
  if (home) focus(home.x, home.y);
  lastUI = "";
  updateUI();
};
$("close-console").onclick = () => {
  consoleOpen = false;
  updateObserverUI();
};
$("console-pause").onclick = () => control("pause");
$("console-restart").onclick = () => control("restart");
$("console-lobby").onclick = () => control("lobby");
$("watch").onclick = () => join("watch");
$("sound").onclick = async () => {
  $("sound").setAttribute("aria-pressed", await CrownSound.toggle());
};
$("sound").setAttribute("aria-pressed", CrownSound.enabled);
const seatRequest = new URLSearchParams(location.search).get("seat");
if (["player", "spectator"].includes(seatRequest)) {
  // A popup may inherit sessionStorage from its opener. Never resume the
  // operator's token or Studio authorization in a separately requested seat.
  token = "";
  sessionStorage.removeItem("crown-token");
  sessionStorage.removeItem("crown-player");
  sessionStorage.removeItem("crown-studio-key");
  const address = new URL(location.href);
  address.searchParams.delete("seat");
  history.replaceState(
    null,
    "",
    address.pathname + address.search + address.hash,
  );
}
async function init() {
  atlas = new Image();
  atlas.src = "./atlas.png";
  try {
    await atlas.decode();
  } catch {
    $("welcome-error").textContent = "The baked atlas could not load. Extract the whole package and reload.";
    return;
  }
  focus(16, 35);
  camera.zoom = 1;
  try {
    difficulties = await api("difficulties");
    const savedDifficulty = localStorage.getItem("crown-difficulty");
    $("ai-difficulty").replaceChildren();
    for (const profile of difficulties) {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.name;
      $("ai-difficulty").append(option);
    }
    $("ai-difficulty").value = difficulties.some(
      (d) => String(d.id) === savedDifficulty,
    )
      ? savedDifficulty
      : "1";
    function describeDifficulty() {
      $("difficulty-description").textContent =
        difficulties[Number($("ai-difficulty").value)].description;
      $("ai-difficulty").title = $("difficulty-description").textContent;
    }
    describeDifficulty();
    $("ai-difficulty").onchange = () => {
      localStorage.setItem("crown-difficulty", $("ai-difficulty").value);
      describeDifficulty();
    };
    const definitions = await api("catalog");
    CrownMotion.configure(definitions);
    for (const def of definitions) {
      definitionsByKind[def.kind] = def;
      names[def.kind] = def.name;
      symbols[def.kind] ||= def.building ? "♜" : def.unit ? "⚔" : "♧";
      maxHP[def.kind] = def.hp;
      footprints[def.kind] = def.footprint;
      if (def.building || isUnitKind(def.kind)) {
        costs[def.kind] = def.cost;
        requiredAge[def.kind] = def.age;
      }
      if (isUnitKind(def.kind)) durations[def.kind] = def.seconds;
    }
    technologies = await api("technologies");
    state = await api("preview");
    menuPreviewBase = state;
    updateMenuAppearance();
    CrownMotion.ingest(state);
    entityById = new Map(state.entities.map((e) => [e.id, e]));
    if (!token) focusMenuSettlement();
    $("release-version").textContent = $("menu-version").textContent =
      state.version;
    document.title = `On\u0027Gate: Legacy ${state.version} — SilkRoad`;
  } catch (e) {
    toast(e.message);
  }
  if (!token) {
    document.body.dataset.screen = "menu";
    await refreshMainMenu();
  }
  if (seatRequest === "spectator" && !window.CrownWeb) {
    await join("watch");
  } else if (token) startSession();
  else if (state) updateUI();
  requestAnimationFrame(frame);
}
init().then(async () => {
  const tool = new URLSearchParams(location.search).get("studio-tool");
  if (["map", "civ"].includes(tool)) {
    document.body.classList.add("studio-content");
    await CrownWorkshop.open(tool);
  }
});

if (window.CrownWeb) {
  document.querySelectorAll(".native-only").forEach((e) => (e.hidden = true));
  document.querySelector(".menu-section-title").textContent = "PLAY · WEB DEMO";
  for (const id of [
    "welcome-console",
    "join-address-field",
  ])
    $(id).hidden = true;
  document.querySelector(".lan-buttons").hidden = false;
  document.querySelector(".menu-connection").hidden = true;
  document.querySelector(".welcome-foot span").textContent =
    "WEB · LOCAL AI OR DIRECT BROWSER ROOMS";
  $("server-address").textContent = "Local browser simulation";
}

async function refreshMainMenu() {
  try {
    const info = await api("info");
    const ready = !!state && !!atlas;
    $("host").disabled = !ready || info.mode !== "none";
    $("join").disabled = !ready || (info.mode === "lan" && info.lobby.started);
    $("solo").disabled = $("skirmish").disabled =
      !ready || info.mode !== "none";
    $("watch").disabled = !ready;
    document
      .querySelector(".menu-stage")
      .setAttribute("aria-busy", String(!ready));
  } catch (error) {
    $("welcome-error").textContent = error.message;
  }
}
function returnToMainMenu(message = "") {
  connected = false;
  window.CrownPeer?.close();
  token = "";
  player = 0;
  keys.clear();
  pan = drag = null;
  if (menuPreview) {
    state = menuPreview;
    CrownDamage.ingest(state);
    CrownMotion.ingest(state);
    entityById = new Map(state.entities.map((e) => [e.id, e]));
    shots = [];
    effects = [];
  }
  focusMenuSettlement();
  spectatorController?.abort();
  spectatorController = null;
  clearTimeout(pollTimer);
  selected.clear();
  CrownStream.reset();
  sessionStorage.removeItem("crown-token");
  sessionStorage.removeItem("crown-player");
  for (const id of ["lobby", "end-screen", "server-console", "observer-tools"])
    $(id).classList.add("hidden");
  for (const dialog of document.querySelectorAll("dialog[open]"))
    dialog.close();
  document.body.dataset.screen = "menu";
  $("welcome").classList.remove("hidden");
  updateMenuFrame();
  $("welcome-error").textContent = message;
  placing = -1;
  attackMode = "";
  consoleOpen = false;
  lobbyUIKey = "";
  lastUI = "";
  refreshMainMenu();
}
async function leaveSession() {
  if (
    isOperator() &&
    !confirm("Close this lobby and return everyone to the main menu?")
  )
    return;
  try {
    await api("leave", {}, "POST");
    returnToMainMenu();
  } catch (error) {
    toast(error.message);
  }
}
$("leave-lobby").onclick = leaveSession;
$("lobby-console").onclick = $("welcome-console").onclick = () =>
  window.open("/host.html", "_blank");
for (const [id, name] of CrownArt.teamNames.entries())
  $("welcome-color").append(new Option(name, id));
$("open-join-address").onclick = () => {
  try {
    const raw = $("join-address").value.trim();
    const url = new URL(raw.includes("://") ? raw : "http://" + raw);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error("Use an HTTP(S) game address without credentials.");
    url.pathname = "/";
    url.search = "?seat=player";
    url.hash = "";
    location.assign(url.href);
  } catch (error) {
    $("welcome-error").textContent = error.message;
  }
};

$("render-preset").value =
  localStorage.getItem("crown-render-preset") || "balanced";
$("render-preset").onchange = () => {
  const preset = $("render-preset").value;
  localStorage.setItem("crown-render-preset", preset);
  $("render-limit").value = { legacy: 30, balanced: 60, display: 200 }[preset];
  $("render-limit").dispatchEvent(new Event("change"));
  resize();
};
