/* Data-driven mod tools. UI produces JSON; C++ validates and owns the saved registry. */
"use strict";
window.CrownWorkshop = (() => {
  const el = (id) => document.getElementById(id),
    clone = (v) => JSON.parse(JSON.stringify(v));
  let content = { civilizations: [], maps: [] },
    importKind = "civilization",
    draft,
    history = [],
    future = [],
    brush = "0",
    painting = false,
    panning = null,
    lastCell = null;
  let view = { zoom: 1, panX: 0, panY: 0 },
    hover = null;
  const editor = el("map-editor"),
    ec = editor.getContext("2d");
  const bonusFields = [
    ["health", "Health", "Units and buildings"],
    ["attack", "Attack", "All military damage"],
    ["speed", "Movement", "Mobile units"],
    ["gather", "Gathering", "Resource collection speed"],
    ["build", "Construction", "Villager building speed"],
    ["train", "Training", "Unit production speed"],
  ];
  function message(text, error = false) {
    el("workshop-message").textContent = text;
    el("workshop-message").classList.toggle("error", error);
  }
  const slug = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "untitled";
  async function refresh() {
    content = await api("content");
    content.civilizations = content.civilizations.filter(
      (c) => !["riverborn", "oakwardens", "ironvale"].includes(c.id),
    );
    window.crownContent = content;
    populate();
    return content;
  }
  function setOptions(select, items, placeholder) {
    const previous = select.value;
    select.replaceChildren();
    if (placeholder) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = placeholder;
      select.append(o);
    }
    for (const item of items) {
      const o = document.createElement("option");
      o.value = item.id;
      o.textContent = item.name;
      select.append(o);
    }
    if ([...select.options].some((o) => o.value === previous))
      select.value = previous;
  }
  function populate() {
    setOptions(el("civ-preset"), content.civilizations);
    const currentCivilization = el("welcome-civ").value || "imperials";
    setOptions(el("welcome-civ"), [
      { id: "__random__", name: "Random civilization" },
      ...content.civilizations,
    ]);
    el("welcome-civ").value = currentCivilization;
    if (!el("welcome-civ").value) el("welcome-civ").value = "imperials";
    function describePeople() {
      if (el("welcome-civ").value === "__random__") {
        el("welcome-race-story").textContent =
          `A surprise people for your next kingdom. The server draws from ${content.civilizations.length} available civilizations, including your custom designs, when the match starts. Restart to draw again.`;
        return;
      }
      const c = content.civilizations.find(
        (c) => c.id === el("welcome-civ").value,
      );
      if (!c) return;
      const traits = bonusFields
        .filter(([k]) => c[k] !== 1)
        .map(([k, label]) => `${label} ${Math.round(c[k] * 100)}%`)
        .join(" · ");
      el("welcome-race-story").textContent = c.description + " " + traits;
    }
    el("welcome-civ").onchange = describePeople;
    describePeople();
    window.dispatchEvent(new Event("crown-content-ready"));
    setOptions(el("saved-map"), content.maps, "New map");
    for (const id of ["map-choice", "lobby-map"]) {
      const select = el(id),
        old = select.value;
      for (const option of [...select.options])
        if (option.value.startsWith("custom:")) option.remove();
      for (const map of content.maps) {
        const o = document.createElement("option");
        o.value = "custom:" + map.id;
        o.textContent = map.name + ` · ${map.width}×${map.height}`;
        select.append(o);
      }
      select.value = [...select.options].some((o) => o.value === old)
        ? old
        : "0";
    }
  }
  function matchMapChanged(id) {
    const value = el(id).value;
    if (!value.startsWith("custom:")) return;
    const map = content.maps.find((m) => m.id === value.slice(7));
    if (!map) return;
    const capacity = el(id === "map-choice" ? "max-players" : "lobby-capacity");
    capacity.value = Math.min(Number(capacity.value), map.spawns.length);
    if (id === "lobby-map") {
      el("lobby-width").value = map.width;
      el("lobby-height").value = map.height;
    }
  }
  el("map-choice").addEventListener("change", () =>
    matchMapChanged("map-choice"),
  );
  el("lobby-map").addEventListener("change", () =>
    matchMapChanged("lobby-map"),
  );
  async function open(tab = "civ") {
    try {
      await refresh();
      loadCiv(
        content.civilizations.find((c) => c.id === "imperials") ||
          content.civilizations[0],
      );
      if (!draft) newMap();
      selectTab(tab);
      message(
        "Create, export, and share. Saving on a live server requires the operator seat.",
      );
      el("mod-workshop").showModal();
      requestAnimationFrame(drawMap);
    } catch (e) {
      toast(e.message);
    }
  }
  function selectTab(tab) {
    for (const button of document.querySelectorAll(".workshop-tabs button"))
      button.classList.toggle("active", button.dataset.tab === tab);
    for (const name of ["civ", "map", "modguide"])
      el("tab-" + name).classList.toggle("hidden", name !== tab);
    if (tab === "map") requestAnimationFrame(drawMap);
  }
  for (const b of document.querySelectorAll(".workshop-tabs button"))
    b.onclick = () => selectTab(b.dataset.tab);
  el("workshop").onclick = () => open();
  el("welcome-workshop").onclick = () => open();
  el("close-workshop").onclick = () => el("mod-workshop").close();
  function loadCiv(c) {
    if (!c) return;
    el("civ-race").value = c.race || "imperials";
    el("civ-name").value = c.name;
    el("civ-id").value = c.id;
    el("civ-description").value = c.description || "";
    ["food", "wood", "gold", "stone"].forEach(
      (id, i) => (el("civ-" + id).value = c.resources[i]),
    );
    for (const [key] of bonusFields) el("bonus-" + key).value = c[key] ?? 1;
    el("civ-preset").value = c.id;
    previewCiv();
  }
  function civData() {
    const c = {
      kind: "civilization",
      race: el("civ-race").value || "imperials",
      id: el("civ-id").value,
      name: el("civ-name").value,
      description: el("civ-description").value,
      resources: ["food", "wood", "gold", "stone"].map((id) =>
        Number(el("civ-" + id).value),
      ),
    };
    for (const [key] of bonusFields) c[key] = Number(el("bonus-" + key).value);
    return c;
  }
  for (const [key, name, description] of bonusFields) {
    const label = document.createElement("label");
    label.className = "bonus-slider";
    label.innerHTML = `<span>${name}<small>${description}</small></span><input id="bonus-${key}" type="range" min=".25" max="4" step=".05" value="1"><output id="value-${key}">1.00×</output>`;
    el("civ-sliders").append(label);
  }
  for (const input of document.querySelectorAll(
    "#tab-civ input,#tab-civ textarea",
  ))
    input.addEventListener("input", previewCiv);
  function previewCiv() {
    el("civ-preview-name").textContent = el("civ-name").value;
    el("civ-preview-description").textContent = el("civ-description").value;
    for (const [key] of bonusFields)
      el("value-" + key).textContent =
        Number(el("bonus-" + key).value).toFixed(2) + "×";
    const c = el("civ-preview"),
      pc = c.getContext("2d");
    pc.imageSmoothingEnabled = false;
    pc.fillStyle = "#233b29";
    pc.fillRect(0, 0, c.width, c.height);
    if (!window.CrownArt || !atlas) return;
    function draw(index, x, y, scale = 1) {
      pc.drawImage(
        atlas,
        (index % 16) * 128,
        Math.floor(index / 16) * 128,
        128,
        128,
        x - 64 * scale,
        y - 100 * scale,
        128 * scale,
        128 * scale,
      );
    }
    for (let sum = 0; sum < 11; sum++)
      for (let x = Math.max(0, sum - 5); x <= Math.min(5, sum); x++) {
        let y = sum - x;
        draw((x + y) % 4, 180 + (x - y) * 32, 35 + (x + y) * 16);
      }
    const age = Number(el("civ-preview-age").value),
      race = CrownArt.raceTemplates.findIndex(
        (r) => r.id === el("civ-race").value,
      );
    CrownArt.blit(
      pc,
      atlas,
      { kind: 4, owner: 0, id: 0, age, race },
      180,
      127,
      0.7,
    );
    CrownArt.blit(pc, atlas, { kind: 11, id: 0 }, 80, 125);
    CrownArt.blit(pc, atlas, { kind: 11, id: 1 }, 275, 132);
    for (let i = 0; i < 3; i++)
      CrownArt.blit(
        pc,
        atlas,
        {
          kind: i === 2 ? (race === 9 ? 24 : 19) : 0,
          owner: 0,
          id: i,
          age,
          race,
        },
        152 + i * 20,
        160 + i * 8,
        1,
      );
  }
  for (const r of CrownArt.raceTemplates) {
    const o = document.createElement("option");
    o.value = r.id;
    o.textContent = r.name;
    el("civ-race").append(o);
  }
  el("civ-race").onchange = previewCiv;
  el("apply-race").onclick = () => {
    const source = content.civilizations.find(
      (c) => c.id === el("civ-race").value,
    );
    if (!source) return;
    for (const [key] of bonusFields) el("bonus-" + key).value = source[key];
    el("civ-description").value = source.description;
    previewCiv();
    message(
      "Race story and bonuses copied. Your custom name and ID stay editable.",
    );
  };
  el("civ-preview-age").onchange = previewCiv;
  el("civ-preset").onchange = () =>
    loadCiv(content.civilizations.find((c) => c.id === el("civ-preset").value));
  el("new-civ").onclick = () =>
    loadCiv({
      id: "new-civilization",
      name: "Your civilization",
      description: "Write the story of your people.",
      resources: [350, 420, 180, 180],
    });
  el("duplicate-civ").onclick = () => {
    const c = civData();
    c.id = slug(c.id + "-copy");
    c.name += " · custom";
    loadCiv(c);
    message("A new copy. Give it a unique ID and save.");
  };
  async function save(data) {
    try {
      const r = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Session": token } : {}),
        },
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      await refresh();
      message("Saved on this server. Select it for your next match.");
      return true;
    } catch (e) {
      message(e.message, true);
      return false;
    }
  }
  el("save-civ").onclick = () => save(civData());
  function download(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = data.id + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message(
      "JSON exported. Import it on another server to share your creation.",
    );
  }
  el("export-civ").onclick = () => download(civData());
  function snapshot() {
    return clone(draft);
  }
  function remember() {
    history.push(snapshot());
    if (history.length > 40) history.shift();
    future = [];
  }
  function startPoints(n, w, h) {
    const result = [];
    for (let i = 0; i < n; i++) {
      const a = 2.35 + (Math.PI * 2 * i) / n;
      result.push({
        x: Math.floor(w * 0.5 + Math.cos(a) * w * 0.32) + 0.5,
        y: Math.floor(h * 0.5 + Math.sin(a) * h * 0.32) + 0.5,
      });
    }
    return result;
  }
  function reserve() {
    for (const p of draft.spawns)
      for (
        let y = Math.max(0, Math.floor(p.y) - 8);
        y < Math.min(draft.height, Math.floor(p.y) + 9);
        y++
      )
        for (
          let x = Math.max(0, Math.floor(p.x) - 8);
          x < Math.min(draft.width, Math.floor(p.x) + 9);
          x++
        )
          draft.terrain[y * draft.width + x] = "0";
  }
  function newMap() {
    const width = Math.max(
        48,
        Math.min(128, Math.round(Number(el("editor-width").value)) || 64),
      ),
      height = Math.max(
        48,
        Math.min(128, Math.round(Number(el("editor-height").value)) || 64),
      ),
      count = Number(el("spawn-count").value) || 2;
    draft = {
      kind: "map",
      id: "untitled-meadow",
      name: "Untitled meadow",
      width,
      height,
      terrain: Array(width * height).fill("0"),
      spawns: startPoints(count, width, height),
      objects: [],
      autoResources: true,
    };
    const template = el("map-template").value;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        if (template === "river" && Math.abs(x - width / 2) <= 1) {
          const crossing =
            Math.abs(y - height * 0.28) < 3 || Math.abs(y - height * 0.72) < 3;
          draft.terrain[y * width + x] = crossing ? "2" : "1";
        }
        if (
          template === "lakes" &&
          (Math.hypot(x - width * 0.42, y - height * 0.28) < width * 0.08 ||
            Math.hypot(x - width * 0.58, y - height * 0.72) < width * 0.08)
        )
          draft.terrain[y * width + x] = "1";
      }
    reserve();
    history = [];
    future = [];
    view = { zoom: 1, panX: 0, panY: 0 };
    syncMapFields();
    drawMap();
  }
  function syncMapFields() {
    el("custom-map-name").value = draft.name;
    el("custom-map-id").value = draft.id;
    el("editor-width").value = draft.width;
    el("editor-height").value = draft.height;
    el("spawn-count").value = draft.spawns.length;
    el("auto-resources").checked = draft.autoResources;
    el("editor-zoom").value = view.zoom;
    el("start-index").replaceChildren();
    for (let i = 0; i < draft.spawns.length; i++) {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = `${i + 1} · ${CrownArt.teamNames[i]}`;
      el("start-index").append(o);
    }
  }
  function mapData() {
    return {
      ...draft,
      id: el("custom-map-id").value,
      name: el("custom-map-name").value,
      autoResources: el("auto-resources").checked,
      terrain: draft.terrain.join(""),
    };
  }
  el("custom-map-name").oninput = () => {
    if (draft) draft.name = el("custom-map-name").value;
  };
  el("custom-map-id").oninput = () => {
    if (draft) draft.id = el("custom-map-id").value;
  };
  el("auto-resources").onchange = () => {
    if (draft) draft.autoResources = el("auto-resources").checked;
  };
  el("new-map").onclick = () => {
    newMap();
    message("A fresh map. Paint the terrain, resources, and player starts.");
  };
  el("resize-map").onclick = () => {
    const old = mapData();
    remember();
    newMap();
    draft.id = old.id;
    draft.name = old.name;
    syncMapFields();
    message(
      "Dimensions and start positions applied. The map has been regenerated.",
    );
  };
  for (let n = 2; n <= 16; n++) {
    const o = document.createElement("option");
    o.value = n;
    o.textContent = n + " kingdoms";
    el("spawn-count").append(o);
  }
  el("spawn-count").value = 2;
  const brushes = [
    ["0", "▧", "Grass", "terrain"],
    ["1", "≈", "Water", "terrain"],
    ["2", "═", "Bridge", "terrain"],
    ["3", "▰", "Earth", "terrain"],
    ["11", "♧", "Tree", "resource"],
    ["12", "●", "Berries", "resource"],
    ["13", "◆", "Gold", "resource"],
    ["14", "▰", "Stone", "resource"],
    ["erase", "×", "Erase object", "resource"],
  ];
  function pickBrush(b) {
    brush = b;
    for (const button of document.querySelectorAll("[data-brush]"))
      button.classList.toggle("active", button.dataset.brush === b);
    el("spawn-brush").classList.toggle("active", b === "spawn");
  }
  for (const [id, symbol, name, type] of brushes) {
    const b = document.createElement("button");
    b.dataset.brush = id;
    b.textContent = symbol + " " + name;
    b.setAttribute("aria-label", "Paint " + name);
    b.onclick = () => pickBrush(id);
    el(type + "-brushes").append(b);
  }
  pickBrush("0");
  el("spawn-brush").onclick = () => pickBrush("spawn");
  function metrics() {
    const r = editor.getBoundingClientRect(),
      base = Math.min(
        (r.width - 30) / draft.width,
        (r.height - 30) / draft.height,
      ),
      cell = base * view.zoom;
    return {
      r,
      cell,
      ox: (r.width - draft.width * cell) / 2 + view.panX,
      oy: (r.height - draft.height * cell) / 2 + view.panY,
    };
  }
  function toCell(e) {
    const m = metrics();
    return {
      x: Math.floor((e.clientX - m.r.left - m.ox) / m.cell),
      y: Math.floor((e.clientY - m.r.top - m.oy) / m.cell),
    };
  }
  function paintCell(x, y) {
    if (x < 0 || y < 0 || x >= draft.width || y >= draft.height) return;
    if (brush === "spawn") {
      if (x < 9 || y < 9 || x > draft.width - 11 || y > draft.height - 11)
        return;
      draft.spawns[Number(el("start-index").value)] = {
        x: x + 0.5,
        y: y + 0.5,
      };
      reserve();
      return;
    }
    const radius = Math.floor((Number(el("brush-size").value) - 1) / 2);
    for (let yy = y - radius; yy <= y + radius; yy++)
      for (let xx = x - radius; xx <= x + radius; xx++) {
        if (xx < 0 || yy < 0 || xx >= draft.width || yy >= draft.height)
          continue;
        const i = yy * draft.width + xx;
        if (brush === "erase")
          draft.objects = draft.objects.filter(
            (o) => Math.floor(o.x) !== xx || Math.floor(o.y) !== yy,
          );
        else if (Number(brush) < 4) {
          if (
            brush === "1" &&
            draft.spawns.some(
              (p) =>
                Math.abs(Math.floor(p.x) - xx) <= 8 &&
                Math.abs(Math.floor(p.y) - yy) <= 8,
            )
          )
            continue;
          draft.terrain[i] = brush;
          if (brush === "1")
            draft.objects = draft.objects.filter(
              (o) => Math.floor(o.x) !== xx || Math.floor(o.y) !== yy,
            );
        } else if (draft.terrain[i] !== "1") {
          if (
            draft.spawns.some(
              (p) =>
                Math.abs(Math.floor(p.x) - xx) <= 1 &&
                Math.abs(Math.floor(p.y) - yy) <= 1,
            )
          )
            continue;
          draft.objects = draft.objects.filter(
            (o) => Math.floor(o.x) !== xx || Math.floor(o.y) !== yy,
          );
          if (draft.objects.length < 3000)
            draft.objects.push({
              kind: Number(brush),
              x: xx + 0.5,
              y: yy + 0.5,
            });
        }
      }
  }
  editor.addEventListener("pointerdown", (e) => {
    if (!draft) return;
    if (e.button === 1) {
      e.preventDefault();
      panning = { x: e.clientX, y: e.clientY, px: view.panX, py: view.panY };
    } else if (e.button === 0) {
      remember();
      painting = true;
      lastCell = toCell(e);
      paintCell(lastCell.x, lastCell.y);
      drawMap();
    }
    editor.setPointerCapture(e.pointerId);
  });
  editor.addEventListener("pointermove", (e) => {
    if (!draft) return;
    hover = toCell(e);
    el("map-inspector").textContent =
      `Tile ${hover.x}, ${hover.y} · ${["Grass", "Water", "Bridge", "Earth"][draft.terrain[hover.y * draft.width + hover.x]] || "Outside map"} · ${draft.objects.length} resource objects`;
    if (panning) {
      view.panX = panning.px + e.clientX - panning.x;
      view.panY = panning.py + e.clientY - panning.y;
    }
    if (painting) {
      const steps = Math.max(
        Math.abs(hover.x - lastCell.x),
        Math.abs(hover.y - lastCell.y),
        1,
      );
      for (let i = 1; i <= steps; i++)
        paintCell(
          Math.round(lastCell.x + ((hover.x - lastCell.x) * i) / steps),
          Math.round(lastCell.y + ((hover.y - lastCell.y) * i) / steps),
        );
      lastCell = hover;
    }
    drawMap();
  });
  editor.addEventListener("pointerup", () => {
    painting = false;
    panning = null;
    lastCell = null;
    drawMap();
  });
  editor.addEventListener("pointercancel", () => {
    painting = false;
    panning = null;
  });
  editor.addEventListener("contextmenu", (e) => e.preventDefault());
  editor.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      view.zoom = Math.max(
        1,
        Math.min(6, view.zoom * (e.deltaY < 0 ? 1.12 : 0.89)),
      );
      el("editor-zoom").value = view.zoom;
      drawMap();
    },
    { passive: false },
  );
  function drawMap() {
    if (!draft || el("tab-map").classList.contains("hidden")) return;
    const m = metrics(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    editor.width = Math.round(m.r.width * dpr);
    editor.height = Math.round(m.r.height * dpr);
    ec.setTransform(dpr, 0, 0, dpr, 0, 0);
    ec.fillStyle = "#111f18";
    ec.fillRect(0, 0, m.r.width, m.r.height);
    const colors = ["#718650", "#446e70", "#b9a875", "#a09561"];
    for (let y = 0; y < draft.height; y++)
      for (let x = 0; x < draft.width; x++) {
        const px = m.ox + x * m.cell,
          py = m.oy + y * m.cell;
        if (
          px + m.cell < 0 ||
          py + m.cell < 0 ||
          px > m.r.width ||
          py > m.r.height
        )
          continue;
        ec.fillStyle = colors[Number(draft.terrain[y * draft.width + x])];
        ec.fillRect(px, py, m.cell + 0.5, m.cell + 0.5);
        if (el("editor-grid").checked && m.cell > 3) {
          ec.strokeStyle = "#15282033";
          ec.lineWidth = 0.5;
          ec.strokeRect(px, py, m.cell, m.cell);
        }
      }
    for (const o of draft.objects) {
      ec.fillStyle = ["#315d36", "#c17459", "#e0ba66", "#c0c2af"][o.kind - 11];
      ec.beginPath();
      ec.arc(
        m.ox + o.x * m.cell,
        m.oy + o.y * m.cell,
        Math.max(1.5, m.cell * 0.4),
        0,
        Math.PI * 2,
      );
      ec.fill();
    }
    for (let i = 0; i < draft.spawns.length; i++) {
      const p = draft.spawns[i],
        x = m.ox + p.x * m.cell,
        y = m.oy + p.y * m.cell;
      ec.strokeStyle = CrownArt.palettes[i][2] + "88";
      ec.lineWidth = 1;
      ec.strokeRect(
        x - 8.3 * m.cell,
        y - 8.3 * m.cell,
        17 * m.cell,
        17 * m.cell,
      );
      ec.fillStyle = CrownArt.palettes[i][2] + "22";
      ec.fillRect(
        m.ox + (Math.floor(p.x) - 1) * m.cell,
        m.oy + (Math.floor(p.y) - 1) * m.cell,
        3 * m.cell,
        3 * m.cell,
      );
      ec.strokeStyle = CrownArt.palettes[i][2];
      ec.strokeRect(
        m.ox + (Math.floor(p.x) - 1) * m.cell,
        m.oy + (Math.floor(p.y) - 1) * m.cell,
        3 * m.cell,
        3 * m.cell,
      );
      ec.fillStyle = CrownArt.palettes[i][2];
      ec.beginPath();
      ec.arc(x, y, Math.max(7, m.cell * 1.3), 0, Math.PI * 2);
      ec.fill();
      ec.font = "bold 10px monospace";
      ec.textAlign = "center";
      ec.fillStyle = "#1a291d";
      ec.fillText(i + 1, x, y + 3);
    }
    if (
      hover &&
      hover.x >= 0 &&
      hover.y >= 0 &&
      hover.x < draft.width &&
      hover.y < draft.height
    ) {
      ec.strokeStyle = "#f3d990";
      ec.lineWidth = 2;
      ec.strokeRect(
        m.ox + hover.x * m.cell,
        m.oy + hover.y * m.cell,
        m.cell,
        m.cell,
      );
    }
    el("undo-map").disabled = !history.length;
    el("redo-map").disabled = !future.length;
  }
  el("undo-map").onclick = () => {
    if (!history.length) return;
    future.push(snapshot());
    draft = history.pop();
    syncMapFields();
    drawMap();
  };
  el("redo-map").onclick = () => {
    if (!future.length) return;
    history.push(snapshot());
    draft = future.pop();
    syncMapFields();
    drawMap();
  };
  el("editor-grid").onchange = drawMap;
  el("brush-size").oninput = () =>
    (el("brush-output").textContent = el("brush-size").value + " tiles");
  el("editor-zoom").oninput = () => {
    view.zoom = Number(el("editor-zoom").value);
    drawMap();
  };
  function validate() {
    const errors = [];
    if (draft.spawns.length < 2)
      errors.push("At least two player starts are required.");
    for (let i = 0; i < draft.spawns.length; i++)
      for (let j = i + 1; j < draft.spawns.length; j++)
        if (
          Math.hypot(
            draft.spawns[i].x - draft.spawns[j].x,
            draft.spawns[i].y - draft.spawns[j].y,
          ) < 10
        )
          errors.push(`Starts ${i + 1} and ${j + 1} are too close.`);
    const seen = new Uint8Array(draft.width * draft.height),
      q = [],
      start = draft.spawns[0];
    if (start) {
      const cell = Math.floor(start.y) * draft.width + Math.floor(start.x);
      seen[cell] = 1;
      q.push(cell);
      for (let head = 0; head < q.length; head++) {
        const at = q[head],
          x = at % draft.width,
          y = Math.floor(at / draft.width);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx,
            ny = y + dy,
            n = ny * draft.width + nx;
          if (
            nx < 0 ||
            ny < 0 ||
            nx >= draft.width ||
            ny >= draft.height ||
            seen[n] ||
            draft.terrain[n] === "1"
          )
            continue;
          seen[n] = 1;
          q.push(n);
        }
      }
      for (let i = 0; i < draft.spawns.length; i++) {
        const p = draft.spawns[i];
        if (!seen[Math.floor(p.y) * draft.width + Math.floor(p.x)])
          errors.push(
            `Start ${i + 1} has no land route. Paint a bridge or clear land.`,
          );
      }
    }
    el("map-validation").textContent = errors.length
      ? errors.join(" ")
      : `✓ All ${draft.spawns.length} starts are connected by land.`;
    el("map-validation").classList.toggle("error", !!errors.length);
    return !errors.length;
  }
  el("validate-map").onclick = validate;
  el("save-map").onclick = async () => {
    if (validate()) await save(mapData());
    else message("Resolve the land-route warnings before saving.", true);
  };
  el("export-map").onclick = () => download(mapData());
  function loadMap(m) {
    draft = { ...clone(m), terrain: [...m.terrain] };
    history = [];
    future = [];
    view = { zoom: 1, panX: 0, panY: 0 };
    syncMapFields();
    drawMap();
  }
  el("saved-map").onchange = () => {
    const m = content.maps.find((m) => m.id === el("saved-map").value);
    if (m) loadMap(m);
  };
  for (const [button, kind] of [
    ["import-civ", "civilization"],
    ["import-map", "map"],
  ])
    el(button).onclick = () => {
      importKind = kind;
      el("mod-import").click();
    };
  el("mod-import").onchange = async () => {
    const file = el("mod-import").files[0];
    if (!file) return;
    try {
      if (file.size > 524288)
        throw new Error("File is too large (maximum 512 KiB).");
      const data = JSON.parse(await file.text());
      if (data.kind !== importKind)
        throw new Error("This file has the wrong content kind.");
      if (importKind === "civilization") {
        loadCiv(data);
        selectTab("civ");
      } else {
        if (
          !Number.isInteger(data.width) ||
          !Number.isInteger(data.height) ||
          data.width < 48 ||
          data.width > 128 ||
          data.height < 48 ||
          data.height > 128 ||
          typeof data.terrain !== "string" ||
          data.terrain.length !== data.width * data.height ||
          /[^0-3]/.test(data.terrain) ||
          !Array.isArray(data.spawns) ||
          data.spawns.length < 2 ||
          data.spawns.length > 16 ||
          !Array.isArray(data.objects)
        )
          throw new Error("Invalid map dimensions, tiles, or object arrays.");
        for (const p of data.spawns)
          if (
            !Number.isFinite(p.x) ||
            !Number.isFinite(p.y) ||
            p.x < 9 ||
            p.y < 9 ||
            p.x > data.width - 11 ||
            p.y > data.height - 11
          )
            throw new Error("A player start is outside the permitted bounds.");
        loadMap(data);
        selectTab("map");
      }
      message(
        "Imported as a draft. Review and save it to register it on this server.",
      );
    } catch (e) {
      message(e.message, true);
    }
    el("mod-import").value = "";
  };
  window.addEventListener("resize", () => {
    if (el("mod-workshop").open) drawMap();
  });
  refresh().catch(() => {});
  return {
    open,
    refresh,
    get content() {
      return content;
    },
    get mapDraft() {
      return draft;
    },
    validate,
  };
})();
