# Technology and core structures · 0.6.SilkRoad

This explains **what we use, why we use it, and what it changes in the game**. For playing instructions and pictures, start with the [illustrated field guide](FIELD_GUIDE.md). For actual research such as Forging and Wheelbarrow, see [the guide's research table](FIELD_GUIDE.md#ages-and-research-are-separate-decisions) and [Economy](ECONOMY.md).

“Core structures” here means both the engine's data structures and the rules that define buildings, units, maps and sessions. A pixel on the screen is a representation of that state; it is not the state itself.

See [SilkRoad](SILKROAD.md) for browser-room authority/bounds and construction queues, and [Steam preparation](STEAMWORKS.md) for SDK-dependent limitations. Canvas remains the renderer; no custom WebGL/WebGPU backend is shipped.

![Browser room authority and spectator transport](images/guide-silkroad-network.svg)

The Electron desktop build uses the same shared UI in sandboxed Chromium. Its
optional [Steam480 sidecar](STEAM480-DESKTOP.md) wraps the private SDK while a
bounded main-process adapter permits gameplay HTTP/SSE only. AI now uses
[frontier scouting and last-seen base memory](AI-SCOUTING.md) in fixed-size C++
records; shared rules and team fog remain authoritative.

## 1. The short version

![Commands enter C++ rules, then filtered snapshots become graphics; native Windows and WebAssembly are two deployment paths](images/guide-technology.svg)

Think of C++ as the referee and record book. JavaScript is the display and control desk. JSON is a form for sending instructions or saving designs. Canvas paints the picture; Web Audio produces the sound. The compiler turns source into a runnable Windows program or a WebAssembly module.

## 2. The technology stack and its consequences

| Technology | Job | Effect on core structures | Where to look |
|---|---|---|---|
| **C++17** | Simulation, validation, AI, native HTTP, content and exports | Shared definitions plus compact changing entity records; explicit capacities and ownership. Real costs, damage, collision and vision belong here. C++ is compiled, not edited live during a match. | `games/crownfall/`, `engine/` |
| **Standard C++ containers and fixed-capacity buffers** | Entity state, tile grids, queues and reusable storage | Bounds prevent unbounded growth. Shared definitions avoid copying a complete unit recipe into each unit. A fixed pool still occupies real memory. | `world.h`, `models.h`, `catalog.h` |
| **JavaScript + HTML/CSS** | Mouse/keyboard, menus, HUD, tools, interpolation | Translates user actions into commands and snapshots into UI. Changing CSS affects placement/readability, not legal costs or ground occupancy. | `web/game.js`, `controls.js`, `style.css`, `studio.*` |
| **Canvas 2D** | Isometric battlefield and sprite drawing | Uses projected tile coordinates, atlas cells and caches. It does not decide movement/collisions. The browser chooses its acceleration path; this is not a custom Vulkan/DirectX engine. | `web/art.js`, `ground.js`, `motion.js`, `damage.js` |
| **Procedural polygons, lines, hatching and RGB dithering** | Original pixel art | Bakes two selectable PNG themes used by many units, ages and poses; no runtime full-sheet generation. Changing a sprite does not change its logical footprint. Regenerate the atlas after editing its generator. | `web/art.js`, `scripts/generate_atlas.py` |
| **Web Audio API** | Synthesized score and sound effects | Sound follows events and user volume preferences. It never determines whether an attack actually deals damage. | `web/sound.js` |
| **HTTP over TCP** | Commands, snapshots, diagnostics and pushed native observer streams | The server authenticates session roles and filters visibility. Reliable delivery has scheduling and bandwidth costs; JSON deltas reduce repeated state, not all traffic. | `engine/http.*`, `network.*`, game application adapter |
| **Optional UDP discovery** | Find Windows hosts on the local network | Broadcast/replies help locate a server. It does not replace TCP gameplay, open a firewall automatically, or provide Internet matchmaking. | `engine/discovery.*`, `network.*` |
| **JSON** | Custom maps/civilizations, project settings, policies, API messages and profiles | Stable IDs and validation preserve compatibility. The format is data, not unrestricted executable scripting. Server content and browser preferences have different storage locations. | `content.*`, `project.*`, `diagnostics.*`, `controls.js` |
| **WebAssembly + Emscripten** | Compile the C++ game module for the Web demo | Runs local AI rules inside a browser worker with the browser platform adapter. It shares gameplay source with Windows, but does not expose a native LAN server. Static browser rooms use a WebRTC adapter and a hosting tab. | `engine/web_main.cpp`, `http_web.cpp`, Web export templates |
| **CMake / CPack and a C++ compiler** | Build native targets and package ZIPs | A C++ change requires a new runtime. Studio exports use runtime templates; stale templates export old rules. Windows can use Visual Studio, or a developer can cross-compile with MinGW. | `CMakeLists.txt`, `cmake/`, `packaging/` |
| **Python, Playwright and Chromium** | Development tests, screenshots, atlas/export tooling | Optional authoring/verification tools. No Python interpreter is used for in-match movement, networking or the shipped Windows game/Studio. | `tests/`, `scripts/` |

There is no Node.js server dependency for players, and no database service, remote font or downloaded art service needed for a normal offline match. Development tools may need their own installation.

## 3. How one command travels through the core

Example: **right-click a tree with a villager selected**.

1. `web/game.js` resolves the clicked object/tile and selected IDs. The client sends an interaction command; it does not award itself wood.
2. The application adapter identifies the commander from its session, checks permissions and passes the order to the world.
3. The C++ world validates ownership, target visibility and the interaction. The villager receives an order and destination.
4. Simulation ticks move the villager, gather a carried load and return it to a completed friendly Town Center. Only delivery adds to the stockpile.
5. A filtered snapshot reports the new positions, orders and resources. Player views hide enemy information they are not allowed to know.
6. JavaScript interpolates the visible motion, chooses work frames, updates counters and plays appropriate sound.

A client could alter its local picture, but the server still decides the authoritative outcome. A hidden enemy must stay absent from player data, rather than merely being drawn transparent.

## 4. The important data structures

| Structure | Plain-language meaning | Rule to preserve when editing |
|---|---|---|
| Catalog definition | A shared recipe: cost, health, range, speed, age, producer and footprint | Use the same definition for validation and relevant UI; append stable IDs instead of renumbering saved content. |
| Entity | One changing unit/building/resource record: ID, owner, kind, position, health, orders and timers | An entity is not a private thread, a copied map or a fresh atlas. Reusing a slot must clear old orders, garrison and queue references. |
| Player/civilization state | Economy, age, researched levels and faction multipliers | A story alone grants nothing; multipliers must be validated and applied by C++. Keep private player economies private. |
| Tile grids | Terrain, occupied cells and visibility per map location | Render height is not occupied size. Town Center/Fortress = 3×3; ordinary buildings = 2×2; resources/walls = 1×1. |
| Spatial buckets | Nearby entities grouped by location | Reduce broad collision/search work. Rebuild when required so a moved unit is not checked only in its old bucket. Do not silently drop contacts to fake performance. |
| Waypoint pool | Reusable route nodes shared by mobile units | At most 16 pending points per unit and 16,384 across the match. Return nodes on cancellation, death and slot reuse. Houses do not each allocate a private route array. |
| Production/research state | Small queues, progress values and technology arrays | Production is bounded to eight queued entries per building. Research has real payment, age checks and cancellation semantics. |
| Visibility and death records | Team sight, remembered land and short sight grace after a death | Five-second grace uses simulated time. Spectators and defeated commanders have different permissions. Do not turn “left sight” into a fake death. |
| Snapshot baseline/delta | The last transmitted view and its changes | Keep entity removal, reset boundaries, fog and revision recovery correct. A smaller packet that loses a death/order is not a valid optimization. |

The current full RTS is bounded to **8,192 entity slots** and maps up to **128×128**. The million-disc crowd benchmark tests a different, simpler workload. Neither the benchmark nor these limits promise a million RTS units or zero RAM consumption. See [engine internals](ENGINE.md), [crowd benchmark](MONARCH.md) and [performance measurements](PERFORMANCE.md).

## 5. Three clocks; three different effects

| Clock | Current normal setting | Changes what? | Does not change… |
|---|---|---|---|
| Simulation | 20 fixed ticks per simulated second, 0.05 s each | Movement, gathering, combat, timers and legal outcomes | The monitor's refresh rate. Pause and game speed affect simulated time. |
| Snapshots | Players and spectators default to 20 Hz; host tuning 5–60 Hz | How often state is requested/pushed and the bandwidth/serialization budget | The number of simulation ticks. More updates are not free CPU/network work. |
| Rendering | 60 FPS default; presets through 200, custom 1–1000 | How often the browser draws/interpolates the visible world | Attack damage, resource creation or server authority. A cap is not a guaranteed achieved frame rate. |

Native full spectators share serialization of a full-map view; defeated commanders receive private team-filtered views. Receive-only means no recurring spectator gameplay polling/ping/telemetry, **not zero TCP acknowledgements or setup traffic**. Waiting lobbies and background polling may use slower schedules. Previously saved explicit tuning remains in force until changed.

### What “multicore” actually means here

The simulation mutates the world on one thread. A bounded worker pool can prepare independent native snapshots while the world is immutable. A barrier finishes those reads before mutation resumes. Worker count is automatic up to four by default, configurable 0–8. A worker does not run its own independent army or map simulation. WebAssembly snapshots run inline; the Web demo does not require SharedArrayBuffer or cross-origin isolation.

This design avoids copying a complete live world for every viewer. It also keeps a clear synchronization boundary. Turning movement into unsynchronized parallel writes would introduce races rather than automatically make the game faster.

## 6. Rendering choices and their structural impact

- **Shared atlas:** many units reuse generated frames. Owner-color dye protects skin, hair and metal instead of repainting the whole sprite. Unit types use quiet eight-pose idle and sixteen-pose movement/work/attack cycles.
- **World-anchored ground chunks:** panning translates cached terrain instead of repainting every map tile. The cache is bounded to 128 padded 258×258 RGBA canvases, about 32.5 MiB of pixel buffers; browser bookkeeping can use additional memory.
- **Cropped terrain strip:** ground contexts use only the terrain cells, reducing large texture uploads from the full atlas.
- **Fog-aware invalidation:** caches must rebuild when relevant fog, terrain, grid or map settings change. Caching an old clear tile must not reveal a newly hidden area.
- **Cached minimap and off-screen rejection:** avoid redrawing static overview terrain or processing visible detail for every off-screen object.
- **Local camera:** pan/zoom and debug camera boxes stay client-side. Camera positions are not sent in recurring player state polls. The current main-menu camera matches `2fc6e69` at 1.7×; its exterior tiles remain opaque fog.

These reduce repeated work; they do not remove all rendering cost or guarantee 100+ FPS on every processor. [Measured panning work](PANNING.md) · [art and animation layout](ART.md).

## 7. What changes need a rebuild?

| Intended change | Edit | Immediate structural effect | Apply it safely |
|---|---|---|---|
| New resource layout or player starts | Map designer / map JSON | Terrain/object/start data | Save, validate and configure a new playtest. No C++ rebuild. |
| Faction story, allowed data multipliers and starting supplies | Civilization designer / content JSON | Validated definition used at match setup | Save and configure the next match. New behavior outside the format needs code. |
| Menu spacing, font or icon | Browser HTML/CSS/JS | Presentation only | Reload the affected page and check narrow screens. |
| Walk/attack poses or building appearance | `web/art.js`, motion/damage code | Atlas/visual selection, not hit range or footprint | Regenerate `atlas.png` when needed, then reload and verify bounds/facing/owner dye. |
| Gathering speed, repair cost, unit stats or age rules | Catalog/world C++ | Actual authoritative game behavior | Rebuild Windows **and** WebAssembly, refresh Studio runtime templates, run meaningful native/network checks and export again. |
| New unit or building class | Stable kinds, catalog, world, content validation, UI and art | Extends several coupled systems | Add all rule/production/pathing/visibility/art hooks; test save compatibility, then rebuild both targets. |
| New server role, message or snapshot field | Application/HTTP/network plus matching client | Authority, protocol and information exposure | Test permissions, resets, slow clients and team fog; rebuild affected runtimes and clients together. |
| Live rates or IP policy | Host Console Tuning | Persisted server policy | Save; inspect CPU, serialization and network counters. No compiler needed. |
| New independent game | Implement the engine application interface and game module | New rules isolated from On'Gate: Legacy | Use Orbit as a small example; rebuild and select the module in Project & export. |

A **source edit** is not a new executable. A **sprite-sheet export** is not a rebuilt simulation. Studio can edit text and validate JS/JSON, but does not include a C++ compiler, breakpoint debugger, campaign trigger graph or universal drag-and-drop game engine.

## 8. File map and storage

```text
engine/                  shared HTTP, platform, project, export and diagnostic services
  application.*          game-module interface and selection
  main.cpp               native process, clock and request scheduling
  web_main.cpp           browser/WebAssembly adapter
  diagnostics.*          process/timing counters and persisted host policy
  project.*              authorized source operations and backup boundary

games/crownfall/          this RTS's rules, content and session adapter
  catalog.h              types, prices, research, footprints and capacities
  world.*                economy, movement, collision, combat, vision and research
  races.h / content.*    built-in peoples and editable content validation
  application.cpp        lobby, roles, commands and snapshot envelopes

games/orbit/              smaller independent module proving engine separation
web/                     menus, Canvas art, audio, input, host console and Studio
export-templates/        compiled Windows/Web runtimes used by Studio exports
```

| Stored item | Location | Backup advice |
|---|---|---|
| Saved maps and civilizations | Server/Studio `data/content.json` | Export JSON and copy the file before upgrading. |
| Live host rates and IP policy | `data/server-policy.json` | Preserve consciously; an old saved rate overrides a new default. |
| Source and project text | Studio's `project/` | Commit or copy changes before replacing the application. |
| Source backups from Studio saves | `data/studio-backups/` | Bounded history, not a substitute for external backups. |
| Keys, camera, audio and graphics preferences | That browser's local storage | Export keyboard/camera profiles; other preferences are separate. |
| Active session, units and selection | Live engine/browser state | Not a persistent saved match. Restarting loses the ongoing battle. |

## 9. Development and release checklist

1. Identify the smallest layer that owns the change. Keep UI changes out of simulation when the rule is unchanged.
2. Take a source/content backup. Inspect the current version and recoverable [milestones](PROGRESS.md).
3. For C++ rule/API changes, run `make check` internally or the documented Windows build/tests. Add a meaningful scenario for new behavior; do not rely only on a disabled UI button.
4. For art/layout changes, regenerate relevant assets and inspect the result. For network changes, exercise role/fog authorization, restart/delta recovery and slow/disconnected receivers.
5. Rebuild affected Windows/Web runtimes, refresh templates, then export. Test actual extracted packages. A source ZIP passing tests does not prove its bundled executable is current.
6. Record the exact source revision in `BUILD-INFO.txt`, check ZIP integrity/SHA-256 and source/runtime parity, and publish a unique recovery milestone. Windows and Web are supported release targets; do not create new Linux/macOS releases.

Installation: [C++ and general tools](INSTALL.md) · [Visual Studio / Windows](WINDOWS.md) · [Studio](STUDIO.md) · [exports](EXPORTS.md) · [new modules](NEW_GAMES.md).

## 10. Maintain these handbooks

The editable sources are `docs/FIELD_GUIDE.md` and `docs/TECHNOLOGY.md`.
The screenshots are from a real current playtest; avoid replacing them with
concept art that implies unimplemented features. SVG diagrams have descriptive
titles and text, and remain editable vector files.

```sh
python3 scripts/generate-guide-visuals.py
# Optional documentation tools only:
python3 -m pip install Markdown playwright
# Use an installed Chromium, or: python3 -m playwright install chromium
python3 scripts/capture-guide.py
python3 scripts/render-guide.py --pdf
```

The renderer creates offline `docs/field-guide.html`, `docs/technology.html` and
the combined `docs/OnGate-Legacy-Handbook.pdf`. Recheck relative links, section
anchors, mobile widths, diagram labels and the PDF after regeneration. Update
prices/capacities from the catalog and verify workflow labels against the UI.

## 11. Movement recovery state

Each entity now has three floats (stall time and position anchor) plus a walk
attempt flag. The current GNU x64 build measures 196 bytes per `Entity` and
2,784,464 bytes for fixed `World` storage; process/browser/network memory is
additional. Recovery uses simulated time, local buckets and a bounded nearby
search. It repositions the same entity; it does not create/delete a replacement
or consume population/resources. Waypoint pools and cargo stay intact.

Victory reveal is authoritative: the world marks playable tiles visible and
explored for all players after a winner is decided. Full and delta snapshots
carry that fog transition. Before victory, normal player/team filters apply.
