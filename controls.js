// One browser-side control profile is used by every native server platform.
(() => {
  const definitions = [
    ["panUp", "Pan up", "ArrowUp", "Camera"],
    ["panDown", "Pan down", "ArrowDown", "Camera"],
    ["panLeft", "Pan left", "ArrowLeft", "Camera"],
    ["panRight", "Pan right", "ArrowRight", "Camera"],
    ["move", "Move to a point", "KeyM", "Unit orders"],
    ["attack", "Attack a target / attack-move", "KeyA", "Unit orders"],
    ["attackMove", "Attack-move", "KeyF", "Unit orders"],
    ["patrol", "Patrol between two points", "KeyP", "Unit orders"],
    ["defend", "Defend this area", "KeyD", "Unit orders"],
    ["hold", "Hold ground", "KeyV", "Unit orders"],
    ["stop", "Stop", "KeyS", "Unit orders"],
    ["delete", "Delete units / raze building", "Delete", "Unit orders"],
    [
      "repair",
      "Repair a damaged friendly building",
      "KeyR",
      "Villager economy",
    ],
    ["train", "Train first available unit", "KeyT", "Economy"],
    ["town", "Select Town Center", "KeyH", "Economy"],
    ["idle", "Select idle villager", "Period", "Economy"],
    ["house", "Build house", "Shift+KeyH", "Villager construction"],
    ["barracks", "Build barracks", "Shift+KeyB", "Villager construction"],
    ["farm", "Build farm", "Shift+KeyF", "Villager construction"],
    ["wall", "Build wall", "Shift+KeyW", "Villager construction"],
    ["fortress", "Build Fortress", "Shift+KeyC", "Villager construction"],
    ["range", "Build archery range", "Shift+KeyA", "Villager construction"],
    ["tower", "Build watchtower", "Shift+KeyT", "Villager construction"],
    ["stable", "Build stable", "Shift+KeyS", "Villager construction"],
    ["blacksmith", "Build Blacksmith", "Shift+KeyK", "Villager construction"],
    ["school", "Build School", "Shift+KeyU", "Villager construction"],
    ["grid", "Toggle tile grid", "KeyG", "Interface"],
    ["pause", "Pause / resume (host)", "Space", "Interface"],
    ["help", "Open field guide", "Shift+Slash", "Interface"],
  ];
  const defaults = Object.fromEntries(
    definitions.map(([id, , key]) => [id, key]),
  );
  const storageKey = "crown-controls-v1";
  let profile = { bindings: { ...defaults }, panSpeed: 550, edgePan: true };
  let capturing = null;
  const allowed =
    /^(?:(?:Ctrl\+)?(?:Alt\+)?(?:Shift\+)?)(?:Key[A-Z]|Arrow(?:Up|Down|Left|Right)|Delete|Space|Period|Comma|Slash|Semicolon|Quote|BracketLeft|BracketRight|Backslash|Minus|Equal|Backquote|F[1-9]|F1[0-2])$/;
  const reserved = new Set([
    "F5",
    "F11",
    "F12",
    "Alt+F4",
    "Ctrl+KeyW",
    "Ctrl+KeyT",
    "Ctrl+KeyN",
    "Ctrl+KeyL",
    "Ctrl+KeyR",
    "Ctrl+Shift+KeyT",
    "Ctrl+Shift+KeyN",
    "Ctrl+Shift+KeyW",
  ]);
  const validBinding = (key) =>
    typeof key === "string" && allowed.test(key) && !reserved.has(key);
  function validate(value) {
    if (!value || typeof value !== "object" || !value.bindings)
      throw new Error("Expected a Crownfall keyboard profile.");
    const bindings = {},
      missing = [];
    const added = {
      delete: "Delete",
      repair: "KeyR",
      blacksmith: "Shift+KeyK",
      school: "Shift+KeyU",
      wall: "Shift+KeyW",
      fortress: "Shift+KeyC",
    };
    for (const [id] of definitions) {
      const key = value.bindings[id];
      if (key === undefined && added[id]) {
        missing.push(id);
        continue;
      }
      if (!validBinding(key))
        throw new Error("Invalid or reserved shortcut for " + id + ".");
      if (Object.values(bindings).includes(key))
        throw new Error(
          "Two actions use " + label(key) + ". Assign distinct shortcuts.",
        );
      bindings[id] = key;
    }
    // Keep existing custom bindings when migrating older profiles. Find a free chord for new actions.
    for (const id of missing) {
      const candidates = [
        added[id],
        "Alt+" + added[id],
        ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"
          .split("")
          .map((letter) => "Alt+Key" + letter),
      ];
      const key = candidates.find(
        (key) => validBinding(key) && !Object.values(bindings).includes(key),
      );
      if (!key) throw new Error("No free shortcut for " + id);
      bindings[id] = key;
    }
    if (
      !Number.isFinite(value.panSpeed) ||
      value.panSpeed < 100 ||
      value.panSpeed > 1000 ||
      typeof value.edgePan !== "boolean"
    )
      throw new Error("Invalid camera settings.");
    return { bindings, panSpeed: value.panSpeed, edgePan: value.edgePan };
  }
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) profile = validate(JSON.parse(saved));
  } catch {
    /* A broken preference must not prevent the game from starting. */
  }
  function label(key) {
    return (key || "")
      .replace(/Key([A-Z])/g, "$1")
      .replace("ArrowUp", "↑")
      .replace("ArrowDown", "↓")
      .replace("ArrowLeft", "←")
      .replace("ArrowRight", "→")
      .replace("Period", ".")
      .replace("Slash", "/")
      .replace("Space", "Space");
  }
  function chord(event) {
    return (
      (event.ctrlKey ? "Ctrl+" : "") +
      (event.altKey ? "Alt+" : "") +
      (event.shiftKey ? "Shift+" : "") +
      event.code
    );
  }
  function refreshHints() {
    for (const node of document.querySelectorAll("[data-shortcut]"))
      node.textContent = label(profile.bindings[node.dataset.shortcut]);
  }
  function save() {
    localStorage.setItem(storageKey, JSON.stringify(profile));
    refreshHints();
    window.dispatchEvent(new Event("crown-controls-changed"));
  }
  const dialog = document.getElementById("controls-dialog");
  const status = document.getElementById("controls-status");
  function render() {
    const list = document.getElementById("binding-list");
    list.replaceChildren();
    let group = "";
    for (const [id, name, , section] of definitions) {
      if (group !== section) {
        group = section;
        const heading = document.createElement("h3");
        heading.textContent = section;
        list.append(heading);
      }
      const row = document.createElement("div");
      row.className = "binding-row";
      const title = document.createElement("span");
      title.textContent = name;
      const button = document.createElement("button");
      button.dataset.binding = id;
      button.setAttribute("aria-label", "Shortcut for " + name);
      button.textContent =
        capturing === id ? "Press a key…" : label(profile.bindings[id]);
      button.classList.toggle("capturing", capturing === id);
      button.onclick = () => {
        capturing = id;
        status.textContent = "Press a key or modifier + key. Escape cancels.";
        render();
      };
      row.append(title, button);
      list.append(row);
    }
    document.getElementById("pan-speed").value = profile.panSpeed;
    document.getElementById("pan-speed-value").textContent = profile.panSpeed;
    document.getElementById("edge-pan").checked = profile.edgePan;
  }
  function open() {
    capturing = null;
    render();
    status.textContent =
      "Click a shortcut to change it. Each action needs a unique key.";
    dialog.showModal();
    window.dispatchEvent(new Event("crown-input-reset"));
  }
  document.getElementById("keyboard-settings").onclick = open;
  document.getElementById("guide-controls").onclick = () => {
    document.getElementById("guide").close();
    open();
  };
  document.getElementById("close-controls").onclick = () => dialog.close();
  dialog.addEventListener("close", () => {
    capturing = null;
    window.dispatchEvent(new Event("crown-input-reset"));
  });
  document.getElementById("reset-controls").onclick = () => {
    profile = { bindings: { ...defaults }, panSpeed: 550, edgePan: true };
    capturing = null;
    save();
    render();
    status.textContent = "Default shortcuts restored.";
  };
  document.getElementById("pan-speed").oninput = (event) => {
    profile.panSpeed = Number(event.target.value);
    save();
    document.getElementById("pan-speed-value").textContent = profile.panSpeed;
  };
  document.getElementById("edge-pan").onchange = (event) => {
    profile.edgePan = event.target.checked;
    save();
  };
  document.getElementById("export-controls").onclick = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { format: "crownfall-controls-v1", ...profile },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "Crownfall-keyboard.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent =
      "Exported this profile. Import it in another browser or platform.";
  };
  const upload = document.getElementById("controls-import-file");
  document.getElementById("import-controls").onclick = () => upload.click();
  upload.onchange = async () => {
    try {
      const file = upload.files[0];
      if (!file) return;
      if (file.size > 32768)
        throw new Error("Keyboard profiles must be smaller than 32 KiB.");
      const next = validate(JSON.parse(await file.text()));
      profile = next;
      capturing = null;
      save();
      render();
      status.textContent = "Profile imported and saved for this browser.";
    } catch (error) {
      status.textContent = error.message;
    }
    upload.value = "";
  };
  addEventListener(
    "keydown",
    (event) => {
      if (!dialog.open || !capturing) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape") {
        capturing = null;
        status.textContent = "Assignment cancelled.";
        render();
        return;
      }
      if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return;
      const key = chord(event);
      if (event.metaKey || !validBinding(key)) {
        status.textContent =
          "That key is reserved by the browser or system. Choose another.";
        return;
      }
      const duplicate = definitions.find(
        ([id]) => id !== capturing && profile.bindings[id] === key,
      );
      if (duplicate) {
        status.textContent =
          label(key) +
          " already controls " +
          duplicate[1] +
          ". Choose another key.";
        return;
      }
      profile.bindings[capturing] = key;
      capturing = null;
      save();
      render();
      status.textContent = "Shortcut saved.";
    },
    true,
  );
  refreshHints();
  window.CrownControls = {
    label: (id) => label(profile.bindings[id]),
    action: (event) =>
      event.metaKey
        ? null
        : definitions.find(
            ([id]) => profile.bindings[id] === chord(event),
          )?.[0],
    down: (id, pressed) => pressed.has(profile.bindings[id]),
    chord,
    get panSpeed() {
      return profile.panSpeed;
    },
    get edgePan() {
      return profile.edgePan;
    },
    get isOpen() {
      return dialog.open;
    },
    open,
    get profile() {
      return JSON.parse(JSON.stringify(profile));
    },
  };
})();
