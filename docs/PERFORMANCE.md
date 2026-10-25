# Current Monarch performance

[The Monarch guide](MONARCH.md#legacy-hardware-and-measured-limits) distinguishes full RTS work from the independent million-body physics benchmark. [Final measurements](BENCHMARKS-MONARCH.json) record both. The older numerical tables below are historical baseline measurements, rather than a 2010-hardware or million-RTS-unit claim.


## Reproduce it

```sh
make benchmark
```

The benchmark prints JSON. It creates **1,000 units and 2,500 houses** on a 128×128 map, warms up, and measures 1,200 ticks per scenario: one simulated minute. It checks allocation calls during those tick loops and separately measures an omniscient JSON snapshot.

The stress setup bypasses normal gameplay population limits. Houses are population buildings, not simulations of individual households. This benchmark measures the native simulation, not end-to-end browser FPS or a twenty-one-device LAN.

## Measured result

Representative GCC `-O2` results for A New Era in the supplied Linux cloud environment. Other verification work was running during measurement. Houses now have nonoverlapping 2 × 2 footprints, and their river corridor remains clear.

| Scenario | Mean tick | 95th percentile | Slowest tick | Tick heap allocations |
|---|---:|---:|---:|---:|
| Idle estate | 1.449 ms | 5.797 ms | 12.155 ms | 0 |
| Moving army, open terrain | 1.371 ms | 5.687 ms | 8.982 ms | 0 |
| Repeated bridge pathfinding | 5.593 ms | 10.084 ms | 15.832 ms | 0 |

The fixed simulated step is 50 ms. These recorded ticks stayed within that budget on this machine; hardware, load, map layout and contention can change the result. This does not establish browser FPS or full-LAN bandwidth under the same load.

| Memory / serialization measurement | Observed |
|---|---:|
| Entity record | 180 bytes |
| Reserved entity slots | 8,192 |
| Fixed `World` storage | 2,652,224 bytes (about 2.53 MiB) |
| Benchmark peak RSS | 8,436 KiB |
| Full omniscient large-world snapshot | about 860–865 KB |
| Full large-world serialization | about 6.7–8.2 ms |
| Unchanged world delta, without lobby/session metadata | 944 bytes, about 0.43–0.50 ms |

The delta measurement takes two successive snapshots **without a tick between them**, including in the moving-army fixture. It measures the unchanged path, not the bandwidth of an army that continues moving. The full game API adds lobby/session metadata; a separate 16-player HTTP fixture measured about 57 KB full / 7.7 KB unchanged. `docs/benchmark-sample.json` and [DIAGNOSTICS.md](DIAGNOSTICS.md) record the scope.

## Why storage stays bounded

Entities, sixteen players' fog, occupancy, buckets, the shared 16,384-node pending-route pool, a 256-entry death journal and fallen-unit sight lifetimes have fixed capacities. A house does not own an atlas, thread or sixteen-point route array. Shared definitions stay shared. Reused slots carry generation IDs so stale selections do not become new units.

The five-second fallen-unit sight feature uses one **byte per map cell per player** (256 KiB at the maximum map/player capacity). Vision updates decrement those cells on their quarter-second schedule. It does not create lingering units, threads or heap timers. Camera priority adds a few counters and timestamps to each cursor, rather than extra copies of the world. A separate cursor is roughly 96 KiB per stream; the server reserves its 21 session cursors on the heap, outside `World` storage.

Monarch shares a 4096×9056 atlas, **141.5 MiB decoded RGBA** (the preceding atlas was 163.25 MiB). Browser decoding/upload can cost additional memory. Owner-dye frames for all units and architecture use a shared LRU capped by **both 12 MiB RGBA and 1,024 entries**, including tall building frame sizes. Skin/metal remain protected. No texture is allocated per entity. Quiet eight-pose idles reduce atlas rows; movement/combat/work retain sixteen poses. New profiles use Balanced 60 FPS/up to 1.5× pixels; Legacy selects 30 FPS/1×, and High quality selects 200 FPS/up to 2×. Frame-rate presets run through 200 FPS, with whole-number custom limits from 1–1000. New profiles default to 60 FPS; valid saved limits are preserved. Invalid edits keep the last valid cap. The viewport terrain/fog cache is invalidated by camera/fog/grid/map/resize changes and does not cache the whole map. Actual FPS depends on the device/browser/driver.


## Costs that remain

No simulation uses zero RAM. The zero-allocation result applies to the benchmark's measured tick loops. JSON, commands, AI planning, mod loading, network buffers and the browser still allocate. Full snapshots and sprite sorting still cost CPU. Native process RSS includes more than the fixed `World` object; browser canvases, atlas decoding and framebuffers are separate again.

The nonblocking transport caps concurrent sockets at 128, request bodies at 512 KiB and response writes at 64 KiB per ready connection pass. Incomplete requests expire after three seconds; slow responses have a ten-second deadline. Buffer memory grows with simultaneous requests and response sizes, especially during asset downloads. Monitor actual RSS and traffic while reproducing a problem.

## Network scale

The browser sends an initial baseline, then revisioned deltas. Default camera priority sends normal-rate inner-box changes, outer-box changes up to 4 Hz and compact minimap records at most once per second. Owned entities/action targets remain urgent; fog and removals are immediate. [Two-box design, controls, protocol and measured savings](SNAPSHOTS.md). Nonstream tools retain complete filtered state. Terrain is sent once; unchanged entities and fog are omitted. Removed entities are explicit, including enemies leaving sight. A lost/mismatched baseline forces a full resync. Complete filtered snapshots remain available for nonstream tools.

Players default to 20 scheduled updates/sec; the host can lower that to 5/10/15 Hz. Observers also default to 20 scheduled updates/sec (tunable 5–60 Hz) and background tabs at 1/sec. Commands trigger an early refresh. A large moving army still changes many entities: an unchanged-world number must not be treated as its traffic rate. Compression and binary snapshots are not implemented.

All 21 HTTP sessions and multiple real loopback source IPs are tested. Sixteen physical players on Wi-Fi/Ethernet still need measurement on your hardware. A weak network can remain the bottleneck even when native ticks are fast. Use the host graphs and exported reports to distinguish traffic, latency, simulation and rendering costs.

## Useful optimization order

1. Reproduce a representative slow scenario and measure tick, serialization, network and rendering separately.
2. Optimize the part exceeding its budget. Do not redesign the whole engine based on total CPU alone.
3. For mass movement, consider one flow field per formation or hierarchical routes instead of many searches.
4. For many idle buildings, keep active production/tower lists or schedule completion events.
5. For network load, measure changed-state traffic, resyncs and observer load before raising limits.
6. Repeat correctness tests after changing order, storage layout or scheduling.

Do not increase `MaxEntities` and assume everything scales linearly. Fog reveal cost, crowded buckets, path searches, snapshot size and browser sorting all depend on actual world activity.

Browser Canvas 2D can use hardware acceleration when the browser/driver permits it. Enable graphics acceleration in the browser system settings and restart it if needed. The game does not claim that a render-cap setting can enable a disabled GPU or make a 60 Hz display show 144 FPS.

The movement-recovery update adds per-entity stall tracking. Current GNU x64
`sizeof(Entity)` is 196 bytes and `sizeof(World)` is 2,784,464 bytes; earlier
benchmark tables above describe their original revisions, not this new layout.
Recovery searches are bounded to eight units per tick and use existing local
buckets. No new claim about older benchmark timings is made.
