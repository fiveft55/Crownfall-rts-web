/* Local presentation/network counters; no simulation authority and no external analytics. */
"use strict";
window.CrownPerf = (() => {
  const stats = {
    fps: 0,
    frameMs: 0,
    rttMs: 0,
    commandMs: 0,
    visibleCommandMs: 0,
    rxRate: 0,
    txRate: 0,
    rxBytes: 0,
    txBytes: 0,
    requests: 0,
    serverTickMs: 0,
    serverSnapshotMs: 0,
  };
  let enabled = localStorage.getItem("crown-debug") === "true",
    cameraBoxes = localStorage.getItem("crown-camera-boxes") === "true",
    limit = Number(localStorage.getItem("crown-fps") ?? 60);
  const validLimit = (value) =>
    Number.isInteger(value) && value >= 1 && value <= 1000;
  if (!validLimit(limit)) limit = 60;
  const overlay = document.getElementById("performance-overlay");
  let frames = 0,
    renderSum = 0,
    windowStart = performance.now(),
    lastRx = 0,
    lastTx = 0,
    pending = null,
    lastReport = 0,
    reporting = false;
  let interest = null,
    spectatorMode = false;
  function toggle(value = !enabled) {
    enabled = value;
    localStorage.setItem("crown-debug", String(enabled));
    overlay.hidden = !enabled;
    document.body.classList.toggle("debug-visible", enabled);
    document.getElementById("menu-debug").checked = enabled;
    document
      .getElementById("debug-toggle")
      .setAttribute("aria-pressed", String(enabled));
  }
  function record(path, ms, rx, tx) {
    stats.requests++;
    stats.rxBytes += rx;
    stats.txBytes += tx;
    if (path === "ping") stats.rttMs = ms;
  }
  function frame(renderMs) {
    frames++;
    renderSum += renderMs;
    const now = performance.now(),
      dt = (now - windowStart) / 1000;
    if (dt < 0.5) return;
    stats.fps = frames / dt;
    stats.frameMs = renderSum / frames;
    stats.rxRate = (stats.rxBytes - lastRx) / dt;
    stats.txRate = (stats.txBytes - lastTx) / dt;
    lastRx = stats.rxBytes;
    lastTx = stats.txBytes;
    frames = 0;
    renderSum = 0;
    windowStart = now;
    if (enabled) {
      overlay.textContent =
        `CROWN DEBUG   ${stats.fps.toFixed(0)} FPS / ${stats.frameMs.toFixed(1)} ms render\nHTTP ping ${stats.rttMs.toFixed(1)} ms   Order ACK ${stats.commandMs.toFixed(1)} ms\nOrder → snapshot ${stats.visibleCommandMs.toFixed(1)} ms\nPayload RX ${(stats.rxRate / 1024).toFixed(1)} KB/s  TX ≈${(stats.txRate / 1024).toFixed(1)} KB/s\nRX ${(stats.rxBytes / 1048576).toFixed(2)} MiB · TX ≈${(stats.txBytes / 1048576).toFixed(2)} MiB · ${stats.requests} API requests\nServer tick ${stats.serverTickMs.toFixed(2)} ms · snapshot ${stats.serverSnapshotMs.toFixed(2)} ms` +
        (interest?.enabled
          ? `\nCamera: ${interest.highSent} fast / ${interest.lowSent} outer · ${interest.deferred} buffered · ${interest.culled} outside`
          : "") +
        (window.CrownGround
          ? `\nGround cache ${CrownGround.stats.chunks} chunks · ${(CrownGround.stats.bytes / 1048576).toFixed(1)} MiB`
          : "");
    }
  }
  function ack(id, start) {
    stats.commandMs = performance.now() - start;
    pending = { id, start };
  }
  function state(next) {
    spectatorMode = next.role === "spectator" || next.role === "team-spectator";
    interest = next.interest;
    stats.serverTickMs = next.serverTickMs || 0;
    stats.serverSnapshotMs = next.serverSnapshotMs || 0;
    if (pending && next.lastCommandId >= pending.id) {
      stats.visibleCommandMs = performance.now() - pending.start;
      pending = null;
    }
  }
  async function report(token) {
    const now = performance.now();
    if (reporting || now - lastReport < 2000 || document.hidden) return;
    lastReport = now;
    reporting = true;
    try {
      const start = performance.now(),
        response = await fetch("/api/ping", { cache: "no-store" });
      await response.text();
      record(
        "ping",
        performance.now() - start,
        Number(response.headers.get("content-length") || 0),
        9,
      );
      const body = JSON.stringify(
        Object.fromEntries(
          ["fps", "frameMs", "rttMs", "commandMs", "rxRate", "txRate"].map(
            (key) => [key, Math.max(0, stats[key])],
          ),
        ),
      );
      await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session": token },
        body,
        cache: "no-store",
      });
      stats.txBytes += body.length;
    } catch {
      /* The normal game connection handles retries. */
    } finally {
      reporting = false;
    }
  }
  document.getElementById("debug-toggle").onclick = () => toggle();
  // Old saved opt-ins cannot re-enable camera coordinates in state requests.
  localStorage.removeItem("crown-camera-snapshots");
  document.getElementById("camera-boxes").checked = cameraBoxes;
  document.getElementById("camera-boxes").onchange = (e) => {
    cameraBoxes = e.target.checked;
    localStorage.setItem("crown-camera-boxes", String(cameraBoxes));
  };
  document.getElementById("menu-debug").onchange = (e) =>
    toggle(e.target.checked);
  const limitSelect = document.getElementById("render-limit"),
    customInput = document.getElementById("custom-fps"),
    customField = document.getElementById("custom-fps-field"),
    fpsError = document.getElementById("fps-error");
  function applyLimit(value) {
    if (!validLimit(value)) {
      fpsError.hidden = false;
      fpsError.textContent = "Enter a whole number from 1 to 1000 FPS.";
      customInput.setAttribute("aria-invalid", "true");
      return false;
    }
    limit = value;
    localStorage.setItem("crown-fps", String(limit));
    fpsError.hidden = true;
    customInput.removeAttribute("aria-invalid");
    document.getElementById("fps-summary").textContent =
      `Frame-rate limit: ${limit} FPS. Actual FPS depends on your display and hardware.`;
    return true;
  }
  limitSelect.value = [30, 60, 90, 120, 144, 165, 200].includes(limit)
    ? String(limit)
    : "custom";
  customInput.value = limit;
  customField.hidden = limitSelect.value !== "custom";
  applyLimit(limit);
  limitSelect.onchange = () => {
    customField.hidden = limitSelect.value !== "custom";
    if (!customField.hidden) {
      customInput.value = limit;
      customInput.focus();
      customInput.select();
    } else applyLimit(Number(limitSelect.value));
  };
  customInput.oninput = () => applyLimit(customInput.valueAsNumber);
  toggle(enabled);
  return {
    record,
    receive(bytes) {
      stats.rxBytes += bytes;
    },
    frame,
    ack,
    state,
    report,
    toggle,
    get stats() {
      return { ...stats };
    },
    get limit() {
      return limit;
    },
    // Preserve the deadline phase on displays whose refresh rate differs from the cap.
    nextFrame(now, previous) {
      const interval = 1000 / limit,
        elapsed = now - previous;
      if (elapsed < interval - 0.25) return null;
      return (
        previous +
        Math.max(1, Math.floor((elapsed + 0.25) / interval)) * interval
      );
    },
    get cameraSnapshots() {
      return false;
    },
    get cameraBoxes() {
      return cameraBoxes;
    },
  };
})();
window.CrownStream = (() => {
  let map = new Map(),
    previous = null;
  return {
    merge(next) {
      if (next.delta) {
        if (
          !previous ||
          next.width !== previous.width ||
          next.height !== previous.height
        )
          throw new Error("Snapshot needs resynchronization");
        for (const id of next.removed || []) map.delete(id);
        for (const e of next.entities) map.set(e.id, e);
      } else map = new Map(next.entities.map((e) => [e.id, e]));
      previous = {
        ...(next.delta ? previous : {}),
        ...next,
        entities: Array.from(map.values()),
      };
      if (previous.overview && next.deaths?.length) {
        const dead = new Set(next.deaths.map((e) => e.id));
        previous.overview = previous.overview.filter((e) => !dead.has(e.id));
      }
      return previous;
    },
    get map() {
      return map;
    },
    reset() {
      map = new Map();
      previous = null;
    },
  };
})();
