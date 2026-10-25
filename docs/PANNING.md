# Camera panning and frame-time optimization

Monarch update · 24 October 2026 (Australia/Sydney).

## Camera movement stays local

The game no longer includes camera coordinates or view boxes in state requests.
Saved preferences cannot re-enable camera uploads. Keyboard panning, middle-drag,
minimap navigation and zoom change only local presentation. Moving the camera
never wakes a poll or sends a command. The optional camera guide boxes are local
debug drawings, not server subscriptions.

Normal gameplay networking continues: players receive fog-filtered delta updates
at the configured rate, and commands still send their target positions. Native
spectators keep their receive-only feed. The fixed simulation rate and server
worker/relay settings are unchanged. Web uses the same renderer with local
WebAssembly simulation.

The old server camera-priority API remains for compatibility/testing, but the
shipped game does not call it. Full fog-filtered updates may contain more entity
data than the former camera-filtered mode. Moving your view does not change
which data the server prepares. Hidden opponents remain filtered by the server;
defeated commanders retain team-only vision.

## What caused the extra work

Previously the ground was a viewport-sized image. Any fractional change to
camera X/Y invalidated it and traversed visible terrain twice: terrain, then fog
and grid. Even unchanged ground was rebuilt on every panning frame. The minimap
also used a separate fill call for each map tile every refresh.

`web/ground.js` now paints 256×256 projected-world sections with a one-pixel
border. Panning reuses/translates those images; zoom scales them. Only newly
visible sections and sections whose local fog changes repaint. Terrain/map/grid
changes invalidate the relevant cache. Shared rounded boundaries avoid seams.
Ground sections share a cropped 896×128 terrain strip (448 KiB), avoiding
repeated use of the entire decoded atlas in each canvas context. Fog is painted after terrain in its original order, and hidden cells are opaque.

The cache holds at most 128 sections: 128 × 258 × 258 × 4 bytes, about **32.5 MiB**
of retained RGBA pixels. Released sections have their canvas storage reset.
Very large viewports can draw uncached overflow sections while keeping that bound.
The normal viewport generally uses fewer sections. Atlas, browser/GPU overhead
and unit tint caches use additional memory; this figure is not total game RAM.

The minimap now writes a single small image, one pixel per map tile, and scales
it for display. It rebuilds that background only when terrain/fog/dimensions
change. Unit dots and the camera outline remain live. Off-screen entity and
mouse-hit candidates are rejected before animation/hit-mask work, with padding
for tall roofs and interpolated movement.

## Checking your machine

Open Settings → **Performance overlay** to see FPS, render time, ping, traffic
and retained ground-cache size. Keep the default 60 FPS cap when targeting a
steady 60 FPS. Enable graphics acceleration in your browser's system settings
and restart it if required. The legacy graphics preset lowers rendering load.
These settings do not change simulation speed.

Cloud renderer timings are measurements, not a guarantee that every computer,
browser or army size holds 60 FPS. First visits, newly revealed fog, unit art and
large battles still require work. `tests/browser_panning_test.py` verifies cache
reuse, fresh/cached pixel equality, opaque fog changes, grid/zoom invalidation,
bounded memory and camera-independent request cadence. The recorded benchmark samples capped animation frames and total render-loop
work on a paused map. The cache regression also measures isolated ground draws;
those synthetic draws are not displayed-frame FPS.

## Recorded cloud sample

A short 128×128 paused-map pan at 1440×1000, capped at 60 FPS, measured:

| Presentation | Observed FPS | Mean render work | 95th percentile render work |
|---|---:|---:|---:|
| Previous | 19.5 | 41.3 ms | 56.4 ms |
| Cached ground + local camera | 57.7 | 5.4 ms | 12.9 ms |

These are approximately 2.5-second headless cloud samples. The largest new render
frame was 24.9 ms, so this is an improvement in consistency, not a guarantee that
every frame stays below 16.7 ms. Read [the complete sample](panning-sample.json).
Run `python3 scripts/benchmark-panning.py` with the optional Playwright/Chromium
tools to repeat it against local milestone `07ce289`. It measures the whole
render loop rather than a synthetic loop that queues hundreds of canvas draws
without browser presentation. Network messages are also verified separately.
