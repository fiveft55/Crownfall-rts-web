# Dedicated LAN server and operator console

## One native process, separate browser seats

`build/crownfall` is the independent server application. It runs the simulation and serves the GUI from the same TCP port. It can run on a computer that nobody plays on; the operator console is a browser GUI. Windows also includes a native process-control window: [Host Control and Wi-Fi setup](HOSTING.md).

```sh
make
./build/crownfall --web web --data data --port 8080 --wifi
```

The process prints available addresses. Open a reachable LAN address in a browser and choose **Host & Play** to host as a commander. For an independent operator, open **Hosting Console** and reserve that separate seat instead. The console provides map settings, player capacity, seed, readiness, player removal before a match, and start controls. During a match it shows population, age, kills and elimination status; it can pause, change speed, restart, or return everyone to the lobby.

Use the gear button to hide/show the in-match console. It does not pause the match. Ctrl+C in the server terminal stops the server.

## Seat contract

| Seat | Capacity | Takes a player slot? | Battlefield vision | Gameplay commands | Server controls |
|---|---:|---|---|---|---|
| Human / AI kingdom | 16 combined | Yes | Own and team fog | Own entities only | No |
| Defeated LAN commander | Existing kingdom seat | Yes | Team fog only | No | No |
| Spectator | 4 | No | Full map / economies | No | No |
| Dedicated operator | 1 | No | Full map / economies | No | Yes |

**Play Solo** immediately starts one human against one AI. **Skirmish Lobby** instead lets one human configure up to fifteen AI kingdoms before starting, with no LAN participants or separate operator required. That local commander owns map, AI, team and match controls. Each AI has its own Easy, Normal, Hard or Expert difficulty. The extra operator is optional for LAN hosting; a playing host owns kingdom 0 instead. Capacity starts at two and can be increased.

The operator can also watch in a separate window: **Spectate** in native Host Control or **Open spectator window** in `/host.html` automatically reserves one of the four ordinary observer seats while preserving the administrative console. The new view uses receive-only push updates, with no routine spectator polling or telemetry. See [HOSTING.md](HOSTING.md#watch-in-a-separate-window).

A dedicated operator can also play: click **Open a player tab** and join in the new tab. That tab uses a distinct session. The operator tab remains administrative. Spectators can join while a LAN match is running, if one of four seats is free. Player late joins are rejected after start.

## Starting a match

1. Host chooses 2–16 kingdom seats. This maximum includes human and AI kingdoms; unused seats need not be filled.
2. Players join and pick civilizations in their own rows. The host can add/remove AI kingdoms and choose each computer’s civilization and difficulty.
3. Host assigns teams: matching numbers are allies; **No team** is free-for-all. For friends against computers, assign the friends Team 1 and the computers Team 2. AI teammates and multiple competing teams also work.
4. At least two opposing kingdoms must be present. Every human must be ready; computers are automatically ready.
5. The operator clicks **Start Match**. Operator and spectators do not ready up.

Changing the map, roster, civilization, AI difficulty or teams clears human readiness. The server enforces this, even if a browser tries to bypass the disabled button.

If the operator removes a player before start, that token becomes invalid. Remaining player slots are compacted at match start; tokens remain the same, and clients receive their current player ID. AI kingdoms reserve real slots and cannot be overwritten by a joining human. Empty seats stay empty until a human joins or the operator explicitly adds an AI. Allies share vision and explored terrain, cannot attack one another, and win together when no hostile kingdom remains. Their resources and entity ownership remain separate. Teams cannot be changed during a match.

## Reconnect and reset

Reloading an existing tab resumes its session from `sessionStorage`. Closing a tab can lose its token; there is no account-based recovery. An operator can remove stranded seats in the lobby. There is no automatic disconnect elimination or player replacement during an active match.

**Restart Match** resets the same map, human/AI roster, teams, difficulties and current civilization data. **Return to Lobby** lets the operator change settings and collects readiness again. Active matches are not saved to disk; a process restart loses the match and sessions. Workshop content stays in the data directory.

## LAN troubleshooting

- Confirm all computers use the same Wi-Fi/Ethernet network. A guest Wi-Fi network may isolate clients.
- Use the server computer's actual LAN IPv4 address. A container, VPN or virtual adapter address may not be reachable by other computers.
- Permit inbound TCP on the selected port in the host firewall if needed. Do not expose the port on your Internet router for this LAN workflow.
- If 8080 is occupied, choose `--port 9090` and use that port on every client.
- Keep the original operator tab open. A second browser does not inherit its administrative session.
- If a lobby setting fails, read the status message: a custom map needs enough starts for its capacity, and dimensions must be 48–128.

This is a trusted-LAN server, not a hardened Internet service. It uses HTTP session bearer tokens without TLS or accounts, a bounded nonblocking HTTP connection pool and no production account-based abuse controls. UDP discovery has separate bounded query/reply limits. Full-vision observer seats should only be given to people you trust during a competitive match.

## HTTP interface for future tools

Gameplay changes use POST. The C++ server parses the session from the `X-Session` header, never from a claimed player ID. Static assets have an explicit allowlist.

| Endpoint | Purpose |
|---|---|
| `GET /api/difficulties` | Shared AI difficulty names and descriptions |
| `GET /api/lan`, `POST /api/lan?action=scan` | Private native discovery status/scans; operator or local Studio only |
| `GET /api/info` | Public lobby summary; no tokens |
| `GET /api/preview` | Immutable menu preview; does not leak the live match |
| `POST /api/join?mode=host\|join\|watch\|solo\|skirmish` | Reserve a permitted seat; returns a private session token |
| `GET /api/spectator-stream` | Receive-only native LAN feed for ordinary spectators or defeated commanders; team fog enforced, one connection per seat |
| `GET /api/state` | Role-specific world snapshot and lobby state |
| `POST /api/lobby?action=ready\|civilization\|configure\|add_ai\|seat\|kick\|start` | Lobby updates; authority checked on server |
| `POST /api/surrender` | Local reset/main menu or LAN elimination/team observer |
| `POST /api/command?action=...` | Validated gameplay commands |
| `POST /api/control?action=pause\|speed\|restart\|lobby` | Operator controls; local/solo commander controls its own match |
| `GET /api/content` | Civilization/map registry |
| `POST /api/content` | JSON body: validate and save a civilization or map |

Content saving is available before hosting, or to the authenticated operator afterward. Other users can still create drafts and export files in the workshop. JSON bodies are bounded at 512 KiB. Persisted designs use a fixed registry file, not a client-supplied filesystem path.

`tests/network_test.py` exercises ten player seats, four observers and the separate operator and verifies capacity, role authority, fog, readiness, invalid input, pause, kicking, and custom content. `tests/browser_smoke.py` uses four separate browser contexts to exercise the operator, two players and a spectator through the UI. This does not substitute for testing physical devices on your own network.

AI lobby API examples (all require the operator/local commander’s `X-Session` header):

- `POST /api/lobby?action=add_ai&difficulty=3&civilization=riverborn&team=2` reserves the first empty kingdom slot as an Expert AI.
- `POST /api/lobby?action=seat&slot=2&difficulty=0&team=1` changes an existing AI to Easy and Team 1. `civilization=<id>` can also change its civilization. Team changes may target human or AI seats; humans choose their own civilization.
- `POST /api/lobby?action=kick&slot=2` removes that human or AI kingdom before start. A local commander cannot remove their own controlling seat.

Lobby `slots` and world `players` expose `ai`, `difficulty` (0–3) and `team` (0–16). A zero team is hostile to every other kingdom, including other zero-team kingdoms. Each AI slot has no session token. Clients cannot issue commands on its behalf. Failed seat-setting validation is atomic: it does not partially change the team or clear readiness. `tests/lobby_ai_test.py` checks two friends plus eight AIs alongside all four spectators and the operator. Browser coverage is in `tests/browser_lobby_ai_test.py`.

## Alpha orders and defeat

`/api/command` accepts `move`, `attackmove`, `patrol`, `defend`, `hold`, `stop`, `interact`, `queue_move`, `rally`, `spawninside`, `ungarrison`, `delete`, `raze`, `build`, `train` and `age`. `ids` is a space-separated selection; `x/y`, `target` and `kind` apply where appropriate. Rally/garrison commands enforce ownership. Route additions are checked against per-unit and global capacity before mutation. Private routes/rallies are withheld from ordinary allies and opponents. New snapshot metadata is type-specific: mobile units have `garrison`, `anchorX/Y`, `waypoints`; production/shelter buildings have rally fields; villagers have `carryType`.

`POST /api/surrender` requires a commander session. In solo/local mode it invalidates the local lobby and returns `returnMenu:true`. In active LAN it eliminates that kingdom and returns `returnMenu:false`; subsequent snapshots report `role:"team-spectator"` with the same player ID. The server continues calling `World::json(player)`, preserving shared team fog, while exposing allied economies/routes for watching. It rejects gameplay commands and attempts to promote that existing token through `mode=watch`. Separate observer/host tokens remain omniscient. Defeat by the last Town Center's destruction uses the same elimination path. See [GAMEPLAY.md](GAMEPLAY.md).

## Host monitoring and live player removal

The independent `/host.html` GUI supports CPU/memory/tick/traffic charts, private peer IP and player measurements, event export, live kicking and persistent IPv4 access policy. Open it from the operator tab's Escape menu or use the Windows Host Console launcher. Its private endpoints reject ordinary player/spectator sessions. Sixteen active kingdoms, four observers and a dedicated operator are supported; allowed/blocked address lists each hold up to 128 IPv4 addresses. [DIAGNOSTICS.md](DIAGNOSTICS.md) documents the console, endpoint authority, counters and measured optimizations.

Player browsers request `/api/state?stream=1&since=<revision>`. A matching revision returns a fog-filtered delta, with `delta:true`, changed `entities`, `removed` IDs, and fog only when changed. Full responses include terrain. Clients retain unchanged data; a mismatched revision forces a new full baseline. Nonstream consumers continue receiving full snapshots. Command ACKs include `commandId`; the next snapshot's `lastCommandId` supports command-to-snapshot latency measurement. Player and observer snapshots both default to 20 Hz; hosts can tune each from 5–60 Hz.

## Monarch lifecycle and connection modes

[The complete 0.5.Monarch guide](MONARCH.md) defines `--mode localhost`, `--mode server`, playing versus dedicated owners, color reservations and `/api/leave`. Both modes use this native C++ server, not Node/Python. A host who leaves closes the whole council and revokes every session. Private host endpoints accept the owning player session as well as the dedicated operator; ordinary players/observers remain unauthorized.
