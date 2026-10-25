# On'Gate: Legacy progress and recovery points

This is the persistent project timeline for the owner and future Codex sessions.
The Git history is the authoritative source. Milestone tags are permanent names;
they are never moved to a newer build. Dates below are Git commit dates in UTC.

## On'Gate: Legacy · public rename

The owner renamed Crownfall to **On'Gate: Legacy**. Version remains0.6.SilkRoad.
Current Windows, Studio and Web packages use Windows-safe `OnGate-Legacy` names.
Recovery tag: `milestone/ongate-legacy`. Branding/launch paths, static Web exports,
LAN discovery and archive checks are verified; physical Windows testing remains
unverified in this environment.
Internal crownfall module IDs, settings keys, protocols and executable filenames
are retained for compatibility; existing custom projects keep their chosen title.
Older milestone entries below retain the names and downloads used at the time.

## 0.6 SilkRoad · 26 October 2026

Recovery tag for the completed release: `milestone/silkroad`. The source and package
commits are separate so the Windows `BUILD-INFO.txt` revision can identify the exact
implementation. Previous Monarch tags and the retired Linux archive stay unchanged.

- Gameplay: protected Town Centers; connected wall dragging; four-direction, three-cell Gates replacing owned walls; global age advance; Feudal Schools; Shift construction queues; half-cost foundation refunds; emergency garrison ejection; Castle Swordsmanship/additional Town Centers and continued survival.
- Presentation: Legacy/Silk-Road baked building sheets and SHA manifest, uniform towers, tall flag-free walls, strike/recovery attacks, recruit cancel portraits and garrison portraits, real map names and close-up work/combat sound.
- Browser rooms: authoritative host-tab C++/Wasm, private manual WebRTC invitations, bounded messages/backpressure, per-channel seat identity and receive-only spectator pushes. Tested through a temporary local TURN/TCP relay because managed Chromium blocks non-proxied UDP. This does not prove all Internet NAT combinations.
- Steam: optional native SDK adapter/build settings prepared. No App ID/SDK is configured; friend invitations/Steam relay gameplay remain unfinished. Canvas remains the renderer; WebGPU/WebGL/mobile/Android workstreams remain future work.
- Verification: 66 existing native simulation scenarios, six new SilkRoad rule groups, crowd physics and the complete localhost API suite; real wall/Gate/queue/cancel/age controls; 9,062 sprite bounds, colors, guard weapons and motion; actual static-site three-browser WebRTC ready/start/movement, observer no-poll flow, authority and disconnect cleanup. Windows cross-compilation and archive/template checks do not substitute for physical Windows testing.

Read [SilkRoad](SILKROAD.md), [Steam preparation](STEAMWORKS.md) and the refreshed
illustrated handbook. Never describe the separate million-disc benchmark as a
million-unit RTS match or claim guaranteed 100 FPS on untested legacy hardware.

## Download a known milestone

Open a milestone's **files and downloads** link, then open `downloads/` and choose
Windows, Linux or Web. Download the archive itself using GitHub's download/raw
button. Extract the whole archive before starting it. Engine Studio is a separate
Windows ZIP. Packages include `BUILD-INFO.txt` and an adjacent SHA-256 file.

| Milestone | Commit | What it contains | Files and downloads |
|---|---|---|---|
| First verified Windows alpha · 2026-10-20 | `0cc4658` | Native Windows game and launchers; early alpha animation and gameplay refinements. Windows download only at this point. | [windows-alpha](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/windows-alpha/downloads) |
| Independent engine and exports · 2026-10-20 | `2d337e0` | Windows/Linux/Web game packages, independent Windows Studio, two separate game modules and exports. | [engine-exports](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/engine-exports/downloads) |
| Economy and ages · 2026-10-21 | `8848e0b` | Paid repairs, School/Blacksmith research, construction categories and three-age settlement art; all four packages. | [economy-ages](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/economy-ages/downloads) |
| Camera priority and animation · 2026-10-21 | `658e5f8` | Ten fantasy peoples, Fortress roster, exact grid sizes, two camera boxes, action logs, smoother readable sprites; all four packages. | [camera-animation](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/camera-animation/downloads) |
| Random civilizations and relaxed idles · 2026-10-22 | `d3d510f` | Removed muscle flexing, refined adult archer silhouettes, Random for solo and human/AI lobby seats; all four packages. | [random-civilizations](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/random-civilizations/downloads) |
| Heraldry & steel · 2026-10-22 | `milestone/heraldry-and-steel` | Reference-inspired faction-coloured archers, armored mounted paladins, single-weapon Queen’s Guards, upright buildings and tall resources, Studio animation-sheet exports and this persistent history/handoff; all four packages. | [heraldry-and-steel](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/heraldry-and-steel/downloads) |
| Host Control & Wi-Fi · 2026-10-22 | `milestone/host-control-wifi` | Native Windows host window, saved settings/logs, invite links, UDP discovery, refreshed responsive browser dashboard and Wi-Fi/hardware documentation; all four packages and matching Studio templates. | [host-control-wifi](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/host-control-wifi/downloads) |
| Separate spectator windows · 2026-10-22 | `milestone/spectator-windows` | Native/web host spectator windows, isolated sessions and receive-only 5 Hz feeds; shared ordinary snapshots, private team fog, no recurring viewer polls/pings/telemetry; all four packages. | [spectator-windows](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/spectator-windows/downloads) |
| Monarch · 2026-10-22 | `milestone/monarch` / `0.5.Monarch` | Unified host/play and dedicated councils, explicit leaving, owner colors, original quiet folk, Barracks Militia Drill, bento UI, localhost/server modes and measured crowd physics; all four packages. | [monarch](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/monarch/downloads) |
| Classic UI & graphics · 2026-10-22 | `milestone/monarch-classic-ui` | Refined original compact UI/HUD, 60 FPS default, presets through 200 plus custom, minimal responsive native host paired with a friendlier web console; all four packages. | [monarch-classic-ui](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/monarch-classic-ui/downloads) |
| Reference main menu · 2026-10-22 | `milestone/monarch-menu-reference` | Owner’s header/left rail/settlement/footer layout, top-right player/settings, locked 1.7× animated preview and normal in-game camera; all four packages. | [monarch-menu-reference](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/monarch-menu-reference/downloads) |
| Sharp menu and live faction preview · 2026-10-22 | `milestone/monarch-sharp-ui` | Wider rail, square aligned controls, header story/name/version, no preview fog/fade, instant race/banner appearance, uniform Escape actions and fresh 64×64 maps; all four packages. | [monarch-sharp-ui](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/monarch-sharp-ui/downloads) |

The existing `0.1.ALPHA`, `0.2Akira`, `0.3_NewEra` and previous milestone tags
remain unchanged. **0.5.Monarch** coordinates the current public label, native
API, browser UI, package resources and Studio export defaults. Earlier packages
retain their original labels and must be kept in separate folders.

## Quick heading polish · 2026-10-22

Removed both settlement captions. Left-aligned the three-line story beside the
logo, enlarged its middle heading and bundled the open-licensed Cinzel royal
font for logos/headings. Restored the default preview fog at the owner’s follow-up
request, without restoring the oval fade. Minimal syntax/layout/font-load checks only, per owner
request; all four archives refreshed. Checkpoint: `milestone/monarch-royal-headings`.

## Expanded command ribbon · 2026-10-22

The battlefield ribbon is taller and gives the action grid its full remaining
width. Commands, Economy and Military tabs stay compact; build/train/research
buttons fit two full rows at desktop widths. Narrow screens place actions across
the whole bottom row and scroll excess actions within that panel. Camera framing,
minimap view outlines, targeting/edge-pan bounds and snapshot boxes follow the
actual ribbon height. Minimal targeted layout/camera checks only. Checkpoint:
`milestone/monarch-command-ribbon`.

## Resource header spacing · 2026-10-22

Added right padding and gaps to the top-bar Food/Wood/Gold/Stone/Population
counters. Narrow displays scroll within the resource strip rather than crowding
numbers into neighboring headers. Small visual check only; all four packages
refreshed. Checkpoint: `milestone/monarch-resource-spacing`.

## Compact ribbon and camera limits · 2026-10-23 (Australia/Sydney)

Reduced the command ribbon to 220 px (200 on short displays) with compact action
icons and scrollable overflow. Mobile uses at most 260 px / 40% of viewport height.
The settlement/selection panel is wider (310 px desktop, 270 px compact desktop)
with more portrait/text spacing; mobile gives it extra width beside the minimap.
The visible battlefield is bounded against the actual isometric tile extents,
with an eight-tile outside margin. Panning, dragging, minimap focus and zoom use
the same bounds; oversized views of small maps stay centered. Menu framing stays
locked. Focused layout/camera checks only. Checkpoint:
`milestone/monarch-compact-camera`.

## Camera behavior restored · 2026-10-23 (Australia/Sydney)

At the owner’s request, reverted only the camera change from the compact-camera
milestone. Restored the exact earlier `web/game.js`, including its original
projected-coordinate pan limits and unrestricted focus/drag behavior. The shorter
ribbon, wider settlement panel, resource spacing and locked menu remain intact.
JavaScript syntax and exact comparison with the known earlier file checked;
all four archives refreshed. Checkpoint: `milestone/monarch-camera-restored`.

## Development timeline

| Date | Commit | Development delivered |
|---|---|---|
| 2026-10-20 | `e8e37b5` | Original Crownfall engine/game, LAN multiplayer and mod workshop. |
| 2026-10-20 | `aefe0d5`, `a2f8e51` | Four AI difficulty settings; multiple AI seats and friends-versus-AI teams. |
| 2026-10-20 | `a7f005e`, `eb6d5e6` | Portable Windows launchers and committed downloadable Windows build. |
| 2026-10-20 | `35b98d6` | Natural movement/work/combat, rally/garrison/queues, controls and alpha refinements. |
| 2026-10-20 | `4eb4598` | Networking optimization, diagnostics, host management, Engine Studio and destruction/death effects. |
| 2026-10-20 | `7c2eec6` | Reusable application interface, separate Orbit module, Windows/Linux/WebAssembly exports. |
| 2026-10-21 | `5c49010` | Resource-cost repairs, economic upgrades and age-specific artwork. |
| 2026-10-21 | `94fcc7b` | Requested grid footprints, resource placement and tile fits. |
| 2026-10-21 | `5bcecef` | A New Era: fantasy peoples, stories, stats, legal military rosters and Fortress champions. |
| 2026-10-21 | `66dff02`, `6b0cd5c`, `04fb578` | Rules spacing, frame scheduling, camera-priority traffic, action logs and exact log timestamps. |
| 2026-10-22 | `677b9c7`, `b94ad67` | Relaxed idles, archer refinements, authoritative Random choices and browser readiness check. |
| 2026-10-22 | `milestone/host-control-wifi` | Comfortable native host process control, bounded UDP discovery beside TCP gameplay, Wi-Fi invites, searchable seats/events, log export and hosting/hardware guide. |
| 2026-10-22 | `0.5.Monarch` source checkpoint | Unified hosting/lifecycle/color ownership, original quiet sprites, Militia research, bento UI and measured reusable crowd physics. |
| 2026-10-22 | `30d2274`, `ef6db07` | Independent host spectator windows and bounded receive-only snapshot fanout; continuous-reading test clients exercise Windows socket buffering during host administration. |

Source commits can precede a refreshed downloadable package. Choose a **milestone
package commit** from the first table when you want the source and shipped builds
to match. A commit date alone does not prove a feature was validated.

## Windows ZIP workflow follow-up

The Windows workflow for package commit `52dd4fb` failed in the Ubuntu
**Build Web runtime and install templates** step; its dependent Windows job was
skipped. The public run annotation identifies that step, but detailed logs need
GitHub sign-in/API access not available in the cloud network policy.

The automatic Windows workflow now builds/tests/packages the game ZIP directly,
without Linux/Web exports or Studio packaging as prerequisites. The complete SDK
has its own manual `engine-studio.yml` workflow and selects Emscripten **3.1.69**,
the version verified for the published Web build. Ready-to-play ZIP downloads
remain checked into `downloads/`; users never need to run Actions. This is a
workflow/documentation update, not a new game binary milestone. Historical failed
runs remain visible; inspect the newest run for current CI results.

## Sharp menu and live faction preview

The owner requested the original sharp/compact visual language inside their
reference layout. This refinement widens the desktop navigation to 340 px,
moves the exact realm/kingdom/history text to the header, stacks game name and
runtime version at top left, and places a selected faction crest/tagline at
bottom left. Controls use one-line labels and aligned square 38 px boxes;
Escape’s surrender and confirmation actions use the same geometry.

The menu settlement has no oval fade, vignette or fog. Faction and banner choices
immediately update its race-specific units, buildings and cloth, including custom
civilizations. Random remains undecided until match start. A separate cached
snapshot prevents these local presentation changes from touching real match fog
or simulation. The locked 1.7× menu camera and normal 1–2× match camera remain.
Mobile navigation, preview and footer stack and scroll without overlapping.
Fresh native/Web/host/editor map choices start at 64×64; explicit larger/custom
maps remain supported. See [MENU.md](MENU.md) and its current screenshot.

Completed source checks: Make/API tests, all 13 Linux CTest suites and 60
simulation scenarios; responsive/faction/graphics/lifecycle browser checks;
controls, rally/queues/garrison, destruction/death, custom/Random lobbies,
camera streaming and receive-only host spectators. Regenerating the procedural
atlas produced identical PNG bytes; 9,392 sprite bounds, 655 animation sequences
and faction dye/Guard weapon/Studio sprite exports passed. Windows physics,
60 simulation scenarios, default-map/authority/order integrations and actual
Host Control/CMD launcher interaction passed under Wine. Physical Windows DPI,
real Wi-Fi devices and guaranteed FPS remain device-validation work.

Source and all four rebuilt packages are recorded by
`milestone/monarch-sharp-ui`; the previous fallback remains
`milestone/monarch-menu-reference`. Validation scope and package hashes are
recorded with the release below and in `downloads/README.md`.

## Previous owner-reference milestone

The owner supplied a wireframe and confirmed that its central oval means an
animated settlement preview and its top-right box means player name/settings.
That milestone followed the header/left rail/central preview/footer structure.
Civilization, banner, solo AI difficulty, map options and traits sit in the footer;
play, LAN, spectator and authoring actions remain in the rail. The name persists
locally. Desktop and narrow layouts share the same controls. The native server
terminal stays minimal and the in-game HUD keeps its classic design.

The owner then requested no menu-camera movement and a close settlement view.
Menu framing is locked to **1.7×**; wheel, arrows, middle-drag and minimap input
cannot move it. Match entry restores normal camera controls; leaving restores
the cached preview without a second simulation or fresh gameplay poll. Late
replies from a departed seat cannot replace the menu or invalidate a new seat.
Play buttons wait for initialization, preventing a fast join from being overwritten
by a late preview response. Solo surrender also preserves the exported game’s
subdirectory when returning to the menu. [Screenshot and layout contract](MENU.md).

Checks cover the frame geometry, animated pixels, saved name, locked camera under
all input paths, restored match camera, delayed initialization and stale-seat
recovery, five viewport sizes from 320×568 through 1440×1000, settings/persistence,
Random choices, lobby lifecycle, game controls, rallies/team vision/death/raze,
Studio/asset bounds and export checks. Package/source parity and native CI are
checked before publishing `milestone/monarch-menu-reference`. Earlier milestone
tags stay fixed, including `milestone/monarch-classic-ui`.

## Classic UI and graphics follow-up

The owner preferred the older game interface and a minimal terminal UI. The
classic compact left-hand panel and original HUD now retain Monarch hosting,
color, lobby and game features. Settings are available before play and through
Escape: default 60 FPS, presets through 200, custom whole-number 1–1000 input,
validation and local persistence. Windows Host Control remains a small native
process owner, with responsive labels/buttons/panes and DPI font/layout changes;
it opens the same bundled web dashboard for deeper analysis. Web Overview adds
three clear task shortcuts; all six views fit narrow windows with panel-local
table scrolling. macOS remains retired.

Validation covers real-browser settings/default/migration/custom persistence and
invalid inputs, deadline scheduling at 60/144/240 Hz, all six host views at
390/768/1440 pixels, existing Monarch controls/lifecycle/gameplay/observer tools,
and native host resizing at 780×700, 980×760 and 1280×900 under Wine. Hardware
DPI/physical browser associations still need device testing. Source and package
commits precede the unique `milestone/monarch-classic-ui` tag; old tags stay fixed.

## Monarch release checkpoint

**0.5.Monarch** uses the permanent package checkpoint `milestone/monarch` and
release tag `0.5.Monarch`. Its implementation starts at `8a2b3e8`; the package
commit and BUILD-INFO identify the final source. Source commits can precede the
package publication; use the milestone download to obtain a matching complete
release. The preceding fallback remains `milestone/spectator-windows`.

Delivered: playing-host and dedicated-owner councils with two seats by default;
explicit leave/host closure and token/stream revocation; owner banner selection
and reservation through compaction/restarts; paid Barracks Militia Drill with
recruit/research clock separation; original uniform-scale humanoids and common
quiet breathing; empty-handed travelling workers; animated owner-colored
architecture; readable fantasy bento menus/HUD/tools; 2:1 zoom span and a legacy
rendering preset; explicit localhost/server bindings and refreshed native Host
Council. Defeated playing hosts retain administration with team-limited game fog.

The reusable engine pair enumerator has no cell caps. RTS collision buckets are
rebuilt after movement and corrections applied after frozen pair enumeration.
A separate million-body swept-disc benchmark is available in the native CLI;
**this is not one million fully simulated RTS units**. Full RTS capacity remains
8,192 slots. [Gameplay, transport and modding guide](MONARCH.md) and
[scoped measured results](BENCHMARKS-MONARCH.json).

Validation completed during implementation: sixty simulation scenarios, thirteen
Linux CTest suites including exact/brute-force physics contacts and new hosting
API checks; real browser host/player/observer closure, colors, window authority,
Militia research and production, camera/legacy settings, existing controls,
construction/economy/rallies/team fog/ten-race rosters/tools; all 9,056 unit poses
and 9,392 ground bounds; protected skin recoloring and a 12 MiB tint-cache bound;
actual Windows Host Council/CMD/Studio-layout controls under Wine, including
localhost preferences and job cleanup. Native Windows CI, extracted release
packages and export parity are checked before publishing the new milestone.
The [native Windows CI run for `8a2b3e8`](https://github.com/fiveft55/codex-rts-gametest/actions/runs/39818986366)
passed all fourteen native suites, Host Council controls and extracted ZIP
checks, producing the 0.5.Monarch ZIP. Windows simulation also passed sixty
scenarios under Wine. The final invite follow-up prefers non-loopback LAN
adapters in both consoles and excludes loopback from printed LAN addresses.

The [final native Windows run](https://github.com/fiveft55/codex-rts-gametest/actions/runs/39820169775)
also passed all fourteen suites, Host Council controls and extracted ZIP checks.
The Linux job in [the matching native run](https://github.com/fiveft55/codex-rts-gametest/actions/runs/39820169861)
passed all thirteen suites and packaging. Its macOS compile failure prompted an
explicit owner decision to retire macOS builds: CI, packaging and launcher support
are now removed. Historical failed runs remain visible; they are not new failures.
Supported releases are Windows x64, Linux x64 and WebAssembly.

Physical browser associations, real-device Wi-Fi and 2010-hardware performance
are not established by these checks.

## Previous spectator checkpoint

**Completed:** [milestone/spectator-windows](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/spectator-windows).
Host Control's **Spectate** button and browser **Open spectator window** open an
independent ordinary observer session while retaining the operator console.
Spectators consume one of four observer slots, add no kingdom, retain their token
on reload, and receive an explicit error if all seats are taken.

Native HTTP now supports bounded receive-only chunked NDJSON. Spectators make one
subscription and receive updates at up to 5 Hz: no routine state/camera polls,
pings or telemetry uploads. Four ordinary viewers share one world serialization
per batch. Fallen commanders use separate, team-fog snapshots and return to
normal commands after revival. Stream authorization, kicks, disconnects,
one-connection-per-seat, complete restart baselines and bounded output keep slow
or stale clients outside the simulation thread. TCP setup/ACK/reconnect packets
remain necessary; no zero-RAM, zero-CPU or zero-wire-upload claim is made.

Checks cover all eleven native suites, existing gameplay/order/slow-peer and UDP
regressions, real host/popups, copied-credential stripping, reloads, full observers,
no recurring browser requests, team fog and revival. The four-viewer integration
measured three shared batches/three serializations with zero extra HTTP requests.
Windows control checks cover readiness of the new button and the native process
workflow under Wine; default-browser window associations remain a desktop check.
All four package runtimes/templates and extracted exports are verified before
publishing. [Hosting and resource details](HOSTING.md#watch-in-a-separate-window).

Implementation is in `30d2274`. The Windows CI follow-up `ef6db07` keeps test
viewers reading during kick/restart/policy checks: deliberately unread sockets
can correctly hit the bounded slow-receiver cutoff on Windows' smaller buffers.
The server's queue limit stays intact. Failure-only workflow annotations now show
each failed suite separately with ephemeral identifiers redacted.

The [real Windows run for `ef6db07`](https://github.com/fiveft55/codex-rts-gametest/actions/runs/39748968080)
passed all twelve native suites, Host Control window checks and extracted ZIP
checks, and produced the portable ZIP. Local extracted Windows/Linux spectator
browser checks and independent Studio checks also pass. Physical default-browser
associations and multi-device Wi-Fi performance remain outside this validation.

## Previous host-control checkpoint

**Completed:** [milestone/host-control-wifi](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/host-control-wifi).
The tag names the package commit; `BUILD-INFO.txt` identifies the source revision.
Previous packages remain available at the permanent milestones above.

No-argument **Crownfall Server.cmd** / **Crownfall Host Console.cmd** now open
**CrownfallHost.exe**. It owns only its server/scanner children, offers adapter,
TCP/UDP and name settings, remembers preferences, copies invites, discovers/join
hosts and saves bounded process logs. Stop/close confirms loss of the current
match. A busy TCP port is reported without adopting the existing process; a busy
UDP port leaves TCP gameplay available. Studio and Crownfall Windows exports
include the matching host executable; other game modules retain their own UI.

The browser dashboard has a more spacious responsive layout, Wi-Fi invites,
source-address discovery cards, seat filtering, readiness-gated start and filtered,
freezable log downloads. Host control actions are logged. **UDP discovery is
optional; gameplay remains browser HTTP/TCP over either Wi-Fi or Ethernet.**
No Ethernet cable, Internet connection, hotspot creation or router forwarding is
required for an ordinary same-LAN game. [HOSTING.md](HOSTING.md) covers setup,
ports/firewalls, client isolation, hardware/AP limits, CLI, protocol and sources.

Validation: all ten native suites (58 simulation scenarios plus HTTP/API tests),
Make checks, actual loopback UDP replies/scans, malformed/spoofed data, bounded
burst handling, operator permissions, disabled/busy UDP fallback; Chromium invite
copying, real discovery, safe links, narrow-screen width, readiness, roster search
and frozen/filtered log download; existing Studio/gameplay tools and two-module
native/static-Web exports. Under Wine, the actual native window and both CMD
launchers passed start/scan/stop, saved settings, busy-TCP recovery, Job Object
cleanup, Studio asset fallback, foreign working directories and Unicode names/
installation paths. Extracted Windows/Linux and independent Studio checks also
pass. Archive hashes, CRCs and exact native/Host/Studio/template/source parity
are required before publishing the four downloadable packages.

The simulation, artwork, fog and seat contract remain as in the previous
milestone. UDP uses bounded nonblocking work outside World ticks; no claim of a
higher measured frame rate is made. These checks do **not** establish physical
Windows firewall/browser-association behavior, multi-device Wi-Fi latency, router
capacity or guaranteed FPS. Check the real network using the hosting guide.

## Previous artwork checkpoint

**Completed:** [milestone/heraldry-and-steel](https://github.com/fiveft55/codex-rts-gametest/tree/milestone/heraldry-and-steel).
Implementation commit `633adf3` contains the artwork, runtime integration and
persistent handoff; the milestone tag identifies the later package commit with
matching Windows game, independent Windows Studio, Linux and Web downloads.
All retain version **0.1.ALPHA**.

The bowkeepers use faction-coloured cloth, gold trim and race-specific skin/hair.
Paladins now wear silver plate on pale warhorses, with cape, rein/gauntlet gestures
and a new mounted idle. The Queen's Guard has its own armor/mantle/circlet and
separate bow/sword rows selected at the existing 1.8-tile close-combat threshold.
Buildings keep exact tile occupancy while their full-resolution roofs rise above
ground anchors. Trees regain their tall pine/broadleaf foliage, and berries/mines
retain upright detail with single-tile bases; canopy and tile gathering both work.
Studio previews/scrubs action frames and exports transparent PNG
sheets with matching JSON frame maps. [Artwork and examples](ART.md).

Validation completed locally: all nine native suites, including 58 simulation
scenarios; full Make/API checks; 601 animation sequences and 10,896 unit poses;
11,232 ground/upright sprite bounds; faction colour isolation and the bounded
1,024-frame cache; Guard close/ranged switching; browser controls, construction,
rally/garrison/queues, destruction/death, team fog and the ten-race/age/Fortress
flow; Studio's actual PNG/JSON downloads; Windows executable/launchers and asset
workflow under Wine; all four export targets for two independent game modules;
static WebAssembly play without a gameplay server; extracted Windows/Linux and
independent Studio package checks. Archive CRCs, SHA-256 files and source/runtime
parity are checked before publishing packages.

The upright atlas uses **163.25 MiB decoded RGBA**, up from 99 MiB; faction frames
are shared and capped at 12 MiB RGBA plus browser overhead. This is a visual-detail
tradeoff, not a claim of reduced texture memory. These are stylized procedural
sprites with mirrored facing. Physical Windows desktop rendering, real-LAN
latency and guaranteed 100+ FPS have not been established by these tests.

The previous verified fallback is **`milestone/random-civilizations`**. Its checks
included nine native suites (58 simulation scenarios plus HTTP integrations),
16-player Random selection and restarts, browser controls/animation/lobbies,
Windows execution under Wine, extracted package launches, independent Studio,
static WebAssembly play, and all four GitHub download hashes. This does not
establish physical Windows desktop or real-LAN latency/FPS measurements.

Fast fallback downloads: [previous Windows game](https://raw.githubusercontent.com/fiveft55/codex-rts-gametest/refs/tags/milestone/random-civilizations/downloads/windows/Crownfall-Windows-x64.zip) · [previous Windows Engine Studio](https://raw.githubusercontent.com/fiveft55/codex-rts-gametest/refs/tags/milestone/random-civilizations/downloads/windows/Crownfall-Engine-Windows-x64.zip).

## Safely return to an older milestone

For playing, download and extract an old package into a **new folder**. Keep the
current install and your saves until you have checked the old version. Everyone
in a LAN match should use the same milestone. Mixing versions is unsupported.

For source inspection, first save your work on a branch. Check `git status` and
commit only intended files; back up untracked files separately. Then:

```sh
git fetch origin --tags
git switch -c recovery/random-civilizations milestone/random-civilizations
```

This creates an independent local recovery branch and preserves `main`. Use a
different branch name if that one already exists. Rebuild using that milestone's
instructions, or use its already-built downloads. To return to the latest source:

```sh
git switch main
git pull --ff-only origin main
```

Do not use `reset --hard` or force-push `main` to recover. If an older behavior
must become the new release, make a normal fix/revert commit and rebuild
all affected packages.

Git protects tracked source and committed builds, **not your personal content**.
Back up the native `data/` directory, customized Studio project files and any
external project folders before changing versions. Export browser map/civilization
designs as JSON; Web saves live in project-specific IndexedDB and are not in Git.
Do not assume save/content compatibility between milestones.

## Reference map for the next session

Start with [../AGENTS.md](../AGENTS.md) and `git status`. For details use
[INSTALL.md](INSTALL.md), [ENGINE.md](ENGINE.md), [STUDIO.md](STUDIO.md),
[EXPORTS.md](EXPORTS.md), [ART.md](ART.md), [AI.md](AI.md), [GRID.md](GRID.md),
[NEW_ERA.md](NEW_ERA.md), [SNAPSHOTS.md](SNAPSHOTS.md) and
[DIAGNOSTICS.md](DIAGNOSTICS.md) and [HOSTING.md](HOSTING.md). Inspect current files rather than assuming an
earlier chat or an ignored local checkpoint is current.

## Keep this record useful

After a meaningful update, record the problem, delivered behavior, implementation
commit, package milestone and completed checks here. State skipped checks and
new memory/runtime limits. Add a new unique milestone tag to the verified package
commit; preserve all old tags and archives. Keep the latest checkpoint current
and leave enough file references for another session to resume from the repository.

## Civilization architecture and spectator realms · 2026-10-24 Sydney

Source and package work for the current update. See [REALMS.md](REALMS.md) for
implementation, modding and host instructions. Distinct procedural construction
for all ten peoples, local AI-only spectator owners and pre-match seat conversion,
4× spectator zoom, completed-building age gates and one confirmed Surrender exit.
Native snapshot workers and independent 5–60 Hz viewer policies keep simulation
authority on one thread. Main-menu framing shifts one tile left/two down.
Windows and Web demo are the current release/export targets; legacy Linux
archives remain unchanged. Validation/package milestone is recorded on completion.

Verified publication: `milestone/monarch-spectator-realms`; clean implementation
revision `94c9f6cfb229f4dc7ea5feb611e38e48c9519bb3`. Current Windows game,
independent Windows Studio and Web demo ZIPs record that source revision.
All archive CRC/SHA checks and exact source/asset/runtime/template parity passed.
The previous Linux archive's SHA-256 is unchanged; no Linux runtime/export/CI
release was generated.

`make check` passed, including 60 simulation scenarios and the new inline/three-
worker concurrent snapshot/AI-owner/60 Hz streaming regression. Chromium passed
classic menu/HUD, controls, militia/age gates, era/fortress, rally/garrison/queues,
team fog, AI spectator zoom/exit, protected dye/Guard weapons, 9,392 sprite bounds
and animation/destruction checks. Both modules exported for Windows/Web/source;
retired Linux export is rejected. Static Web gameplay/local AI viewing and server
rejection passed without a native API server. Actual extracted Windows game
passed the realm-host API and browser spectator flow under Wine; independent
Studio passed authorization, editable source, diagnostics and bundled templates.
Windows simulation/physics executables also passed under Wine. These checks do
not replace physical Windows desktop/DPI or real Wi-Fi hardware testing.

## Restored buildings and adjusted menu · 2026-10-24 Sydney

The owner rejected the structural building overhaul. Restore `web/art.js` and
`web/atlas.png` exactly from `67ca1fe`; preserve all newer simulation, spectator,
server and platform changes. Menu camera moves up one tile/right two relative
to its previous position and locks at 1.5×. Net projected offset from the Town
Center is x+64/y+32; gameplay camera behavior is unchanged. Previous milestones
remain permanent. Current recovery tag: `milestone/monarch-classic-buildings`.

The same follow-up adds pointed Goblin ears and visible forked Dwarven beards
to the unit generator across shared actions/ages. Building-cell comparison against
`67ca1fe` protects the restoration while unit rows change. Native simulation and
network runtimes are unchanged; package updates replace presentation/source files.

Verified presentation source: `d33b3a870a0c735f1558dcf545a000b51293e0f0`.
Classic menu/HUD browser checks passed at locked 1.5×. All 330 restored building
cells match `67ca1fe` pixel-for-pixel; the 9,392 sprite bounds and asset/owner-dye/
Guard-weapon/Studio sheet checks passed after the Goblin/Dwarf changes. Visually
inspected the updated folk sprites. Actual extracted static Web AI viewing,
projected menu offset and return-to-menu checks passed. All three ZIPs passed
CRC/SHA and source/asset/runtime/template parity; native/Host/Studio/Wasm runtimes
remain byte-identical to the previous release. Simulation suites were not rerun
for these presentation-only edits. Linux's frozen archive is unchanged.

## Local camera, panning and Town Center defense · 2026-10-24 Sydney

Replace per-pan ground redraws with bounded world chunks and a cropped terrain
strip. Cache the minimap background; reject distant animation/hit candidates early.
No camera position/box parameters leave the shipped client, and old preferences
cannot opt back in. Regular player updates and receive-only observers remain.
Read [panning measurements and limitations](PANNING.md).

Watch AI vs AI moves from the main menu into Skirmish Lobby. Town Center base
range becomes eight (was six); garrisoned Villagers and ranged troops add arrows,
capped at seven total, with deployment/death removing the bonus. The preview
moves three tiles left/two up from its previous framing, keeps 1.5× zoom and has
no fog; match and defeated-team fog stay authoritative. Buildings/unit assets
are unchanged. New recovery tag: `milestone/monarch-local-camera`.

Validation: `make check`, 61 simulation scenarios including Town Center range,
bonus/cap/deployment/death and Tower exclusion; HTTP/authority/fog/streaming tests;
local-camera request/cadence, ground/fog/grid/zoom/cache-bound checks; existing
controls, tall-building/rally/team-vision and classic menu browser checks. Both
modules export Windows/Web/source; static Web gameplay and lobby spectating pass.
The short cloud pan sample recorded about 19.5→57.7 FPS and 41.3→5.4 ms mean
render work. It is a measured headless scenario, not a physical hardware promise.

Published packages record clean source `ca271fee720821dfe0ca12e6d9bd5d29891a9fb3`.
Windows game/independent Studio and Web demo have matching source, renderer, assets
and runtime templates; CRC/SHA and exact parity checks passed. Windows simulation
(61 scenarios), host-worker/API regressions and actual extracted panning passed
under Wine. Extracted Studio source/authorization/exports and static Web game,
camera framing, eight-tile TC catalog and skirmish viewing passed. Linux archive
SHA remains unchanged. Physical Windows desktop/DPI and Wi-Fi device tests remain
outside this cloud validation.

## Full-border menu preview · 2026-10-24 Sydney

Menu zoom changes to 1.1×, keeping the selected civilization and existing framing.
Decorative cached grass continues past the preview's finite map boundary so all
four corners and UI borders have land. This is enabled only by the menu renderer;
gameplay map bounds, occupancy, fog and camera behavior remain unchanged.
Recovery tag: `milestone/monarch-menu-land`.

Verified all four corners and 164 border samples at each of six viewport sizes
(320×568 through 3840×2160). Map state remains unchanged, cache stays bounded,
and the default gameplay renderer leaves out-of-map space empty. Existing
menu/controls/faction/graphics and panning/fog/cache browser checks pass.
No simulation or artwork changes; native and WebAssembly runtimes are reused.

Publication source: `4cc1838ba2e274ad03f9eb1fd3829cd65f58db7e`. Windows game,
Windows Studio and Web demo ZIP CRC/SHA, exact asset/source/runtime/template
parity and clean metadata passed. Actual extracted Windows preview passed all
six viewport/border cases under Wine; extracted static Web passed menu framing,
skirmish viewing and returning to the 1.1× menu. Native/Host/Studio/Web runtimes
are byte-identical to the previous release; no simulation suites were rerun for
these presentation-only edits. Legacy Linux archive is unchanged.


## 24 October 2026 · Menu fog and 1.2× framing

Restored default fog of war in the main-menu settlement preview and increased
its locked zoom to 1.2×. Existing camera offset and decorative land at UI borders
remain in place. Renderer now reads the original preview snapshot’s fog directly.
Recovery tag: `milestone/monarch-menu-fog`. No simulation/runtime changes.

Browser verification passed: actual hidden preview tiles render fog, 1.2× zoom,
all preview borders filled at six viewport sizes, bounded cache and immutable
simulation state.

Publication source: `c2c1dee`. Updated Windows game, Studio and Web ZIPs passed
CRC/SHA checks, clean metadata and exact source/runtime/template parity. The
actual extracted Web demo passed preview framing, AI spectator skirmish and
return-to-menu checks with no JavaScript errors or API network calls. Native
runtimes are reused; the legacy Linux archive remains unchanged.


## 24 October 2026 · Fog beyond the preview map

Out-of-map preview tiles now render as unexplored fog instead of visible grass,
covering UI corners and borders consistently. Kept the 1.2× zoom and framing.
Playable map bounds and team vision are unchanged. Recovery tag:
`milestone/monarch-preview-edge-fog`.

Verified opaque exterior fog, ordinary hidden tiles, all borders at six viewport
sizes, 1.2× zoom, bounded terrain cache and unchanged simulation state.

Published packages use source `eea67a2`. Windows game/Studio and Web archives
were repacked with current presentation files and metadata; native executables
and WebAssembly bytes were verified unchanged. All ZIP CRC/SHA checks passed.
The extracted Web download renders opaque exterior fog at 1.2× without JS errors.
No simulation changes or Windows runtime retesting for this renderer-only fix.
Legacy Linux archive is unchanged.


## 24 October 2026 · Matching 20 Hz snapshot defaults

Players and spectators now both default to 20 Hz (50 ms update intervals).
Updated native policy defaults, loading of policies without an observer rate,
Web client fallback and host-console selection. Saved explicit host tuning is
preserved, with each rate still configurable from 5–60 Hz. Existing hosts with
a saved spectator rate can select 20 Hz in Tuning. Receive-only shared spectator
feeds and defeated players’ private team fog are preserved.
Recovery tag: `milestone/monarch-snapshots-20hz`.

`make check` passed: native simulation/physics and all HTTP/network suites.
Added checks for matching 50 ms player/observer defaults, real 20 Hz observer
feed cadence in inline and three-worker modes, missing-field policy fallback
and preservation of explicitly saved 60 Hz tuning.

Publication source: `149039d`. Windows native and WebAssembly runtimes rebuilt;
Studio export templates refreshed. Host-console browser checks passed matching
20 Hz selections, live tuning and persisted reload. Actual extracted Web ZIP
passed player/spectator 50 ms scheduling, AI skirmish viewing, confirmed exit and
1.2× menu restoration, with no JS errors or API network calls. All three ZIPs
passed CRC/SHA, clean revision metadata and exact source/runtime/template parity.
Windows builds compiled successfully; no physical Windows/Wine runtime test in
this session. Legacy Linux archive remains unchanged.


## 24 October 2026 · Restore 2fc6e69 civilization preview framing

Restored the exact camera settings from `2fc6e698ed2a437eb18e75b993681132ae1fd332`:
locked 1.7× zoom centered on the Town Center, without additional pan offsets.
Kept the current opaque unexplored fog over out-of-map preview tiles, normal
preview fog, cached terrain rendering and matching 20 Hz snapshot defaults.
Recovery tag: `milestone/monarch-preview-classic-shot`.

Browser checks passed: historical zoom/center, out-of-map opaque fog, preview
borders at six screen sizes, bounded cache, unchanged state, live faction/banner
selection, locked menu input, match entry/exit and host/graphics controls.
No simulation or native/WebAssembly runtime changes.

Publication source: `6532c25`. Windows game, Windows Studio and Web ZIPs
repacked with current camera, documentation and clean source metadata. Archive
CRC/SHA and exact camera/fog source parity passed; native executables and WASM
bytes are unchanged from the 20 Hz release. Actual extracted Web ZIP passed
historical 1.7×/Town Center framing, opaque exterior fog, 20 Hz scheduling,
AI spectator play and menu return, without JS errors or API network calls.
Legacy Linux archive remains unchanged.


## 24 October 2026 · Illustrated player and technology handbook

Added `FIELD_GUIDE.md` and `TECHNOLOGY.md`: first match, HUD/controls, economy,
footprints, age gates/research, ten peoples, LAN/AI/spectator roles, authoring,
troubleshooting, stack-to-structure ownership and edit/rebuild guidance. Five
current screenshots and five accessible SVG diagrams support the explanation.
Offline HTML pages and a combined printable PDF are generated from Markdown,
with reusable capture, diagram and rendering scripts. Corrected older README
camera/artwork text, the gameplay guide’s garrison capacity and numeric version.
Recovery tag: `milestone/monarch-illustrated-handbook`.
No game logic, assets, settings or network behavior changed.

Validation: real screenshots captured without JavaScript errors; Markdown
file targets, HTML images/anchors and 1440/768/390 px layouts checked. SVG label
bounds and XML passed. The tagged 22-page A4 PDF has extractable text on every
page and chapter bookmarks. No simulation suite rerun for documentation-only work.

Publication source: `8051468`. Windows game, Studio and Web archives include the
offline illustrated handbook/PDF and matching diagrams/screenshots. ZIP CRC,
SHA-256 and exact handbook parity passed; native, WebAssembly and JavaScript
runtime bytes remain unchanged. The extracted Web package’s handbook passed
image/anchor, three-width layout and SVG label checks. PDF has no temporary
localhost links. Legacy Linux archive is unchanged.


## 24 October 2026 · Stuck-unit recovery and post-victory map reveal

Added simulated-time stall detection and bounded safe nearby relocation after
three seconds of attempted walking without meaningful movement. Same entity,
orders, waypoint queue, cargo and health are preserved. Unsafe or unavailable
tiles cause a delayed retry. Normal work/idle/garrison states are excluded.
Corrected immediate path-abandonment when a mover is embedded in a solid cell.
Victory now reveals the playable map for all views, including defeated teams;
in-progress team fog and private economy/command permissions remain protected.
Updated handbook/current rule references. Recovery tag:
`milestone/monarch-unit-recovery-victory`.

The hosting lobby and web Host Console now use square-size dropdowns
(64/80/96/112/128), with width/height shown only for Custom dimensions.
The main-menu map list includes the same square presets. No map-size rule or
map-editor dimensions were removed.

`make check` passed: 66 simulation scenarios, crowd physics and every native
HTTP/network suite. Tests cover post-building and isolated-cell stalls, safety
waits, cargo/order preservation, simultaneous distinct placements, no false
work/garrison recovery, and victory full/delta fog with private wallets intact.
Browser checks confirm winning/defeated views reveal, 20 Hz remains, and host
preset/custom sizes apply to real native maps, persist through reloads and
remain read-only for guests.

Publication source: `597d22f`. Rebuilt Windows and WebAssembly, refreshed Studio
runtime templates, and packaged the Windows game, Windows Studio and Web demo.
Actual extracted WebAssembly reproduced a worker trapped inside its newly
completed house and verified safe recovery with unchanged ID/health/cargo;
map presets/custom rectangles, defeat/victory reveal, 20 Hz, 1.7× preview and
the bundled offline handbook passed, without JS errors or API network calls.
ZIP CRC/SHA, clean revision metadata, exact runtime/source/template and handbook
parity passed for all three archives. The updated handbook is 23 pages.
Windows targets compiled successfully; no physical Windows/Wine runtime test
in this session. Legacy Linux archive remains unchanged.


## 24 October 2026 · Proposed 0.6 SilkRoad roadmap

Created `roadmaps/0.6 Silkroad/` from the owner's eleven planning topics:
prioritized scope, technology/core trade-offs, delivery milestones and prototype
gates. Covers gameplay, rendering, code/engine/asset independence, repository
organization, WebGL/WebGPU, Steam/session hosting, mobile browsers, Android
portable-mobile hosting and shader quality policy. Links from the root README.
This is planning only: runtime version, source behavior, downloads and historical
releases are unchanged. No 0.6 implementation/build or repository cleanup began.
