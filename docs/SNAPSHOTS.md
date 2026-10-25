# Two camera boxes and snapshot traffic

**Current game behavior:** camera-priority requests are retired in the shipped UI.
Camera movement is local. This document describes the retained server API for
compatibility and developer tests. See [PANNING.md](PANNING.md) for the current
renderer and networking behavior.


The client sends **camera coordinates**, not screenshots. The authoritative C++
server still simulates the entire match at 20 ticks per simulated second. Camera
boxes determine which already-authorized entity changes deserve network bandwidth.
They never control AI, gathering, combat, movement, team vision or fog of war.

## What the boxes do

| Area | Detailed updates | Purpose |
|---|---|---|
| Inner, cyan | Normal player snapshot rate: 20 Hz by default | The normal zoom view, with an edge guard |
| Outer, amber | At most 4 Hz, on a 250 ms wall-clock schedule | Zoomed-out surroundings and prefetch before panning |
| Outside both | No detailed foreign entity records | A compact, authorized minimap overview refreshes at most once per second |

The boxes share a centre. Zooming out grows the outer box while the inner box
stays at normal-zoom size. Zooming in shrinks the inner box to the visible area.
The outer box always contains it. Footprints at a box edge are included.

**Your units and buildings, plus their current action targets, keep high priority
even outside both boxes.** Commands are sent immediately through the existing
ordered command queue. Camera priority does not make an off-screen army ignore
orders. A hidden enemy cannot become visible by being an action target.

Snapshots still contain changed records rather than every entity. An outer record
waits in the client's existing cache; its server fingerprint advances only when
the record is actually sent. Entering the inner box promotes it on the next poll.
Leaving both boxes evicts detailed foreign records. Losing sight or dying removes
cached records immediately, without waiting for the outer timer. These evictions
are not death animations. The browser smooths outer movement with a longer blend
and does not mistake an unchanged cached pose for a newly received motion sample.

The compact overview contains only ID, class, owner and position. It is for the
minimap, not selection, pathfinding or combat. Detailed positions override it.
Current fog hides stale overview dots, and death events remove them. The maximum
overview delay is roughly one second **plus network/poll delay**; it is deliberately
not a full-rate tactical feed. Independent spectators retain their existing full
visibility; defeated players retain only their team's shared vision.

## Controls and diagnostics

Open **Escape → Prioritize snapshots around the camera** to turn this on or off.
It defaults on and is saved in that browser. Turning it off rebuilds a complete
fog-filtered stream. **Show snapshot camera boxes** outlines the boxes in the
battlefield and minimap; the outer prefetch boundary can extend beyond the screen.

The FPS overlay shows the latest packet's fast/outer records, buffered candidates
and candidates outside the boxes. These are entity counts, not packet counts or
measurements of server simulation work. Host Console's player table and exported
JSON report show the same per-seat replication counters. The usual 5–20 Hz host
policy, spectator 20 Hz default and background-tab throttling still apply. A 4 Hz
outer timer cannot produce four updates if the client polls less often.

## Protocol and extension points

The browser adds the following to its existing `GET /api/state?stream=1&since=…`:

```text
view=1&cx=0&cy=2048&iw=640&ih=300&ow=1200&oh=500
```

`cx/cy` are the shared centre in isometric world pixels: `px=(tileX-tileY)*32`,
`py=(tileX+tileY)*16`. The other values are **half widths/heights**, not tile
counts. The native adapter rejects missing, nonfinite, malformed and out-of-range
coordinates and outer boxes smaller than the inner box.

`SnapshotView` and `SnapshotCursor` live in `games/crownfall/world.h`.
`World::json` applies fog first, then interest priority. `OuterIntervalMs=250` and
`OverviewIntervalMs=1000` are the central defaults. `application.cpp` supplies a
steady wall clock and owns one independent cursor per seat. No new world copies,
camera simulation threads or per-entity queues are created. Cursors remain about
96 KiB each; their count is bounded by the existing 21 session slots.

`web/game.js:snapshotCameraView` computes the boxes. `CrownStream` merges records
and the compact overview; `motion.js` handles presentation. Nonstream tools retain
the complete fog-filtered API. Missing revisions, changed camera mode and server
resets force a full baseline, including an outer and overview refresh.

The same code is compiled into Windows, Linux and WebAssembly and is included in
Engine Studio's editable project and export templates. WebAssembly uses the same
filter locally; its static Web build is still solo/local-AI, not a LAN server.

## Reproduce the measurements

```sh
make build/camera-benchmark
./build/camera-benchmark
python3 tests/camera_snapshot_test.py
python3 tests/browser_camera_test.py
```

The first fixture changes 1,000 unit positions over 200 polls, representing ten
seconds at 20 Hz. It deliberately bypasses population, pathfinding and fog to
isolate steady-state serialization. It excludes startup baselines, lobby/session
metadata and transport headers. It measures neither actual FPS nor physical LAN
packet loss. [The recorded run](camera-snapshot-sample.json) measured:

| Viewer | Complete delta traffic | Camera-priority traffic | Reduction | Mean serialization before → after |
|---|---:|---:|---:|---:|
| Player, 500 owned units | 56.24 MB | 30.46 MB | 45.8% | 2.35 → 1.33 ms |
| Spectator | 55.18 MB | 5.13 MB | 90.7% | 2.12 → 0.24 ms |

Your own moving units intentionally limit player savings. Results depend on unit
distribution, camera size, actions, fog changes and the host rate. This is spatial
interest filtering over the existing HTTP JSON transport, not binary compression,
UDP packet prioritization or a promise of those percentages for every match.
