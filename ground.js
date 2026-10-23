/* Camera-local ground cache. C++ still owns terrain and fog; no network calls.
   Small projected-world chunks survive panning/zooming. At most 128 RGBA
   258x258 canvases (~33 MiB); unchanged fog reuses the complete painted chunk. */
"use strict";
window.CrownGround = (() => {
  const SIZE = 256,
    PAD = 1,
    LIMIT = 128,
    chunks = new Map(),
    terrainSprites = document.createElement("canvas");
  let terrain = null,
    atlasImage = null,
    mapWidth = 0,
    mapHeight = 0,
    grid = false,
    extendLand = false;
  const stats = { builds: 0, hits: 0, tiles: 0, chunks: 0, bytes: 0 };
  function clear() {
    for (const chunk of chunks.values()) {
      chunk.canvas.width = 0;
      chunk.canvas.height = 0;
    }
    chunks.clear();
    terrain = null;
    stats.chunks = stats.bytes = 0;
  }
  function create(cx, cy, state) {
    const left = cx * SIZE,
      top = cy * SIZE;
    const corners = [
      [left - 36, top - 20],
      [left + SIZE + 36, top - 20],
      [left - 36, top + SIZE + 20],
      [left + SIZE + 36, top + SIZE + 20],
    ];
    const xs = corners.map(([x, y]) => x / 64 + y / 32),
      ys = corners.map(([x, y]) => y / 32 - x / 64);
    const x0 = Math.max(
        extendLand ? -Infinity : 0,
        Math.floor(Math.min(...xs)) - 1,
      ),
      x1 = Math.min(
        extendLand ? Infinity : state.width - 1,
        Math.ceil(Math.max(...xs)) + 1,
      ),
      y0 = Math.max(
        extendLand ? -Infinity : 0,
        Math.floor(Math.min(...ys)) - 1,
      ),
      y1 = Math.min(
        extendLand ? Infinity : state.height - 1,
        Math.ceil(Math.max(...ys)) + 1,
      );
    const tiles = [];
    for (let sum = x0 + y0; sum <= x1 + y1; sum++)
      for (let x = Math.max(x0, sum - y1); x <= Math.min(x1, sum - y0); x++) {
        const y = sum - x,
          px = (x - y) * 32,
          py = (x + y + 1) * 16;
        if (
          px + 35 < left - PAD ||
          px - 35 > left + SIZE + PAD ||
          py + 19 < top - PAD ||
          py - 19 > top + SIZE + PAD
        )
          continue;
        tiles.push({
          x,
          y,
          px: px - left + PAD,
          py: py - top + PAD,
          index:
            x >= 0 && y >= 0 && x < state.width && y < state.height
              ? y * state.width + x
              : -1,
        });
      }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE + PAD * 2;
    return {
      canvas,
      context: canvas.getContext("2d"),
      tiles,
      fog: null,
      fogKey: null,
    };
  }
  function diamond(c, x, y, rx, ry) {
    c.moveTo(x - rx, y);
    c.lineTo(x, y - ry);
    c.lineTo(x + rx, y);
    c.lineTo(x, y + ry);
    c.closePath();
  }
  function paint(chunk, state, atlas) {
    if (chunk.fog === state.fog) {
      stats.hits++;
      return;
    }
    // Presentation-only tiles beyond the finite map are always unexplored.
    let key = "";
    for (const tile of chunk.tiles)
      key += tile.index < 0 ? "0" : state.fog[tile.index];
    chunk.fog = state.fog;
    if (chunk.fogKey === key) {
      stats.hits++;
      return;
    }
    chunk.fogKey = key;
    const c = chunk.context;
    c.clearRect(0, 0, SIZE + 2 * PAD, SIZE + 2 * PAD);
    c.imageSmoothingEnabled = false;
    for (const t of chunk.tiles) {
      const kind = t.index < 0 ? "0" : state.terrain[t.index],
        fog = t.index < 0 ? "0" : state.fog[t.index];
      const index =
        kind === "1"
          ? 4
          : kind === "2"
            ? 5
            : kind === "3"
              ? 6
              : (Math.imul(t.x + 11, t.y + 31) >>> 0) % 4;
      c.drawImage(
        atlas,
        index * 128,
        0,
        128,
        128,
        Math.round(t.px - 64 * 1.04),
        Math.round(t.py - 100 * 1.04),
        128 * 1.04,
        128 * 1.04,
      );
      if (
        kind === "0" &&
        t.index >= 0 &&
        t.x > 0 &&
        state.terrain[t.index - 1] === "1" &&
        fog !== "0"
      ) {
        c.strokeStyle = "#a8a16d";
        c.beginPath();
        c.moveTo(t.px - 32, t.py);
        c.lineTo(t.px, t.py - 16);
        c.stroke();
      }
    }
    // Match the original painter order, including partially explored tile edges.
    for (const t of chunk.tiles) {
      const fog = t.index < 0 ? "0" : state.fog[t.index];
      if (fog !== "2") {
        c.beginPath();
        diamond(c, t.px, t.py, 32.8, 16.8);
        c.fillStyle = fog === "0" ? "#10231b" : "#13251b80";
        c.fill();
      }
      if (grid) {
        c.beginPath();
        diamond(c, t.px, t.py, 32, 16);
        c.strokeStyle = fog === "0" ? "#c9d2a228" : "#e1dfb245";
        c.stroke();
      }
    }
    stats.builds++;
    stats.tiles += chunk.tiles.length;
  }
  function draw(
    context,
    state,
    atlas,
    camera,
    origin,
    width,
    height,
    showGrid,
    fillOutside = false,
  ) {
    if (
      terrain !== state.terrain ||
      atlasImage !== atlas ||
      mapWidth !== state.width ||
      mapHeight !== state.height ||
      grid !== showGrid ||
      extendLand !== fillOutside
    ) {
      clear();
      terrain = state.terrain;
      if (atlasImage !== atlas) {
        // Share only the seven ground cells, not the 141.5 MiB decoded unit atlas,
        // with each chunk context. Avoid giant texture uploads on a cache miss.
        terrainSprites.width = 7 * 128;
        terrainSprites.height = 128;
        terrainSprites
          .getContext("2d")
          .drawImage(atlas, 0, 0, 7 * 128, 128, 0, 0, 7 * 128, 128);
      }
      atlasImage = atlas;
      mapWidth = state.width;
      mapHeight = state.height;
      grid = showGrid;
      extendLand = fillOutside;
    }
    const z = camera.zoom,
      left = camera.x - origin.x / z,
      top = camera.y - origin.y / z,
      minX = Math.floor(left / SIZE),
      maxX = Math.floor((left + width / z) / SIZE),
      minY = Math.floor(top / SIZE),
      maxY = Math.floor((top + height / z) / SIZE),
      needed = new Set();
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) needed.add(x + "," + y);
    context.save();
    context.imageSmoothingEnabled = false;
    // Shared rounded boundaries prevent gaps between adjacent chunks while moving.
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const key = x + "," + y;
        let chunk = chunks.get(key),
          temporary = false;
        if (!chunk) {
          if (chunks.size >= LIMIT) {
            const victim = [...chunks.keys()].find((k) => !needed.has(k));
            if (victim !== undefined) {
              const old = chunks.get(victim);
              old.canvas.width = old.canvas.height = 0;
              chunks.delete(victim);
            } else temporary = true;
          }
          chunk = create(x, y, state);
          if (!temporary) chunks.set(key, chunk);
        } else {
          chunks.delete(key);
          chunks.set(key, chunk);
        }
        paint(chunk, state, terrainSprites);
        const dx = Math.round((x * SIZE - camera.x) * z + origin.x),
          dy = Math.round((y * SIZE - camera.y) * z + origin.y),
          right = Math.round(((x + 1) * SIZE - camera.x) * z + origin.x),
          bottom = Math.round(((y + 1) * SIZE - camera.y) * z + origin.y);
        context.drawImage(
          chunk.canvas,
          PAD,
          PAD,
          SIZE,
          SIZE,
          dx,
          dy,
          right - dx,
          bottom - dy,
        );
        if (temporary) chunk.canvas.width = chunk.canvas.height = 0;
      }
    context.restore();
    stats.chunks = chunks.size;
    stats.bytes = chunks.size * (SIZE + 2 * PAD) ** 2 * 4;
  }
  return { draw, clear, stats };
})();
