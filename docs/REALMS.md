# Monarch: civilizations, spectators and server updates

Current update · 24 October 2026 (Australia/Sydney). Public version stays **0.5.Monarch**.

## Restored building artwork

The owner preferred the previous building assets. All 330 building sprites are restored pixel-for-pixel from `67ca1fe`, before
the structural architecture overhaul. Goblin unit sprites now have prominent
pointed ears and Dwarves have forked beards with a brass-bound braid in every
shared action pose and age. This keeps the classic Town Centers, houses, production
buildings, towers and fortresses, plus the existing race house variants.
The rejected overhaul remains available in the historical
`milestone/monarch-spectator-realms` tag.

The single procedural atlas still uses polygons, lines, hatching and RGB Bayer
dithering. `raceBuilding` and `raceHouse` define the building sprites. Exact ground
footprints, tall forests, quiet unit poses and animated owner banners remain.
Studio and both current platforms use the same restored assets.

## Watch an AI battle

Open **Skirmish Lobby**, then choose **Watch AI vs AI** there (Windows or Web demo). Set the map and AI
civilizations, difficulty and teams in the local lobby, then start. The spectator
owns the lobby without occupying a kingdom. Alternatively choose **Spectate · AI
takes my seat** before a match starts; your civilization/color/team become AI and
your session moves to a free spectator seat. The host keeps host permissions.
Four spectator seats remain the limit. A full gallery rejects the move without
losing the player's seat. This is a pre-match choice, not an in-match escape.

In Windows Host Control, open its web dashboard: **Set up AI vs AI** fills an
empty dedicated council with two AI kingdoms; configure/start, then **Open
spectator window**. The spectator window has its own token, independent of the
operator console. Players, local hosts and dedicated operators may watch.

Commanders zoom from 1× to 2×; spectators from 1× to 4×. Defeated commanders retain
only team vision, even when zoomed out. Ordinary spectators see the whole map.
Native spectators use a receive-only stream with no recurring application polls,
pings or telemetry. TCP acknowledgments, initial connection and reconnects still
use network traffic. Web demo spectators use local worker messages, not a server.

## Age progression and leaving

Feudal requires a **completed Barracks**. Castle requires **two different completed
building types** from School, Forge/Blacksmith and Archery Range. Duplicate,
enemy and unfinished buildings do not count. Resources are also required. AI
planners construct the prerequisites. The simulation enforces the rules even if
someone bypasses the browser UI.

Escape offers a single **Surrender** exit with a final confirmation. Cancel keeps
the match running. Confirm returns to the main menu: solo resets; a LAN guest's
kingdom is defeated and their connection leaves; a host closes the council for
everyone. A defeated commander who stays connected watches only their team.
Lobby **Leave** remains available before the match.

The main-menu preview uses default fog of war and keeps its locked 1.7× zoom. Framing matches
commit `2fc6e69`: centered directly on the Town Center, with no extra pan offset. Gameplay camera panning is unchanged.

## Multicore host and update rates

Native servers automatically use up to four persistent snapshot workers, bounded
by available cores minus one. Use `crownfall.exe --workers 0` for inline work or
`--workers 1` through `--workers 8` to override. Core simulation, lobby changes,
commands and sockets have one owner. Independent per-view snapshots run in
parallel against an immutable world; a barrier finishes them before mutations.
This avoids copying the entire simulation or racing fog/cursor state. WebAssembly
runs inline and does not require cross-origin isolation or SharedArrayBuffer.

The web console's Tuning tab has separate player and spectator rates, from
**5–60 Hz**. Players and spectators both default to 20 Hz. Settings persist
in `server-policy.json`; explicitly saved rates are preserved. Existing hosts
with a saved 5 Hz spectator rate can select 20 Hz in Tuning and save.
Policies without an observer rate use 20 Hz. Diagnostics exposes `snapshotWorkers`, `serverThreading`,
policy, serialization timings, CPU/RAM and traffic. Start with defaults on old
hardware and raise rates only while watching those measurements.

These are requested snapshot-batch limits, not a claim of 60 simulation ticks or
exactly 60 physical TCP packets. Player polling rounds intervals up (60 Hz uses
17 ms); delivery depends on load and network/browser scheduling. Simulation stays
20 Hz and render FPS is independent. Ordinary native spectators share one
serialization; team spectators receive private fog-filtered snapshots. Slow
receivers retain bounded queues and disconnect instead of accumulating memory.

## Release platforms

Current playable packages and Studio runtime exports are **Windows x64 and Web**.
Web is a local AI demo: no LAN hosting/joining/server controls, including through
its API. Windows has full hosting. Linux/macOS releases are retired; older Linux
archives and milestone tags remain frozen. Unix development tools may still
compile internal tests and WebAssembly; they do not create Linux game releases.

## Checks for this update

The native Make suite covers 60 simulation scenarios, physics, HTTP authority,
AI lobbies, orders, fog, deltas, diagnostics, logging, discovery and receive-only
spectators. A dedicated realm-host regression checks inline/three-worker
concurrent requests, AI-only ownership, spectator-seat exhaustion, persisted
60 Hz policy and bounded streamed delivery without repeated viewer requests.

Chromium checks cover the menu/HUD, controls, militia research, rallies/garrisons,
queued orders, actual team fog, spectator zoom/exit, animation/destruction frames,
all 9,392 shipped sprite bounds and protected team colors/Guard weapons. Static
Web exports execute both game modules, construction/research, local AI watching,
server-mode rejection and confirmed exit in a nested static-site folder.
Windows desktop/DPI and real Wi-Fi hardware remain device checks.

## Town Center and panning follow-up

Town Center base range is eight tiles. Living garrisoned Villagers and ranged
units add arrows up to seven total; deployment/death removes the bonus. Towers
and Fortresses keep their ranged-unit garrison rule. See [gameplay](GAMEPLAY.md).
Camera position uploads are disabled in the shipped game. Cached ground sections,
a tile-pixel minimap and early off-screen rejection reduce panning work.
[Measurements, settings and memory bound](PANNING.md).

## Movement recovery and victory reveal

A unit that keeps trying to walk but makes less than 0.15 tile of progress from
its recovery anchor for three simulated seconds is moved to the nearest safe
free tile within three tiles. Its ID, health, carried resources, current order
and queued destinations are preserved. Candidates must be in bounds, walkable,
currently team-visible, clear of live units and outside hostile attack range.
If none is safe, the unit waits and retries after one simulated second. Normal
work, idling and garrisoning do not trigger relocation. Pause freezes this timer.
Exceptional search work is limited to eight units per tick; large simultaneous
stalls can recover later than the three-second threshold.

Once a winner is declared, the whole playable map is revealed to all remaining
connections, including defeated commanders. During an unfinished match, defeated
commanders remain limited to team vision. Victory does not grant command
permissions, restart the simulation or reveal another kingdom's private wallet.
Out-of-map preview fog and the locked main-menu camera are unchanged.
