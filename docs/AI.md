# AI kingdoms and difficulty

Choose **Solo AI Difficulty** on the welcome screen before **Play Solo**. Normal is the default. Your last choice is remembered in this browser. The active match's difficulty appears in the council/game information and survives reloads and match restarts.

For several opponents, choose **Solo & local AI games → War Council · Multiple AI**. This opens a local lobby with you and one computer, without requiring a LAN host or other players. Raise kingdom seats above the default two and click **Add AI Kingdom** for more, then set each computer’s difficulty, civilization and team in its row. Ready yourself and click **Start Match**. The gear button returns you to this lobby after a match starts.

For co-op, choose **Host & Play** and have friends join as players. The playing host adds AI kingdoms to the same lobby. Give the friends one team number and the AI another. Use **No team** for free-for-all opponents. You can also add an AI teammate or create several competing teams. Identical nonzero team numbers share current vision, explored terrain and victory; they cannot damage each other. Units, production queues and resources still belong to individual kingdoms.

Human and AI kingdoms share the sixteen kingdom seats: examples include one human plus nine computers, or two friends plus eight computers. LAN has four additional spectators and can use a dedicated operator instead of a playing host. Empty seats remain empty. Computers are always ready; every human must ready up. Changes to the roster, map, civilization, AI level or team clear human readiness. Start requires at least two opposing kingdoms; teams are locked while playing. Returning to the lobby and restarting preserve the AI roster and its settings.

## What changes

| Setting | Easy | Normal | Hard | Expert |
|---|---:|---:|---:|---:|
| Worker goal | 10 | 16 | 24 | 32 |
| Army goal limit | 8 | 28 | 48 | 72 |
| Earliest opening raid | 4:00 | 1:50 | 1:30 | 1:10 |
| Minimum opening force | 4 | 5 | 4 | 3 |
| Minimum later raid force | 4 | 5 | 7 | 9 |
| Minimum interval between raids | 120 s | 70 s | 45 s | 30 s |
| Strategic decision interval | 4 s | 2 s | 1 s | 0.5 s |
| Barracks goal | 1 | 1 | 2 | 2 |
| Archery range goal | 1 | 1 | 1 | 2 |
| Farm goal | 3 | 5 | 8 | 10 |

Times use simulated game time; changing game speed changes their real-world duration. A raid also requires enough surviving soldiers. Economy, losses, terrain, and resources can delay it. An army goal includes units already paid for in production queues.

Easy builds a smaller force and gives you a longer opening. Normal is balanced. Hard and Expert reserve resources for a small opening attack before building their full workforce, then seek larger follow-up waves. They also prioritize age advancement sooner and use more production buildings. A reserved research budget pauses new recruitment until the age cost can be paid.

All levels pay the same costs, gather at their civilization's normal rate, and use the same unit health, speed, damage and training rules. There are no difficulty resource grants or combat multipliers. The opponent remains a rule-based AI; the difficulty settings are not a learning system or an AoE II AI implementation.

## Customize the AI

`games/crownfall/ai.h` contains the four named `AIProfile` entries, descriptions and numerical goals. `World::ai(int owner)` in `games/crownfall/world.cpp` turns those goals into decisions. The browser loads names and descriptions from `/api/difficulties`; it does not maintain a separate difficulty table.

Keep queue depths within `MaxQueue`, worker/army goals within the intended population budget, and opening forces small enough to fund without stalling growth. Playtest actual raid timing: lowering a raid timer alone does not help if a large economy or research budget consumes every resource first.

The server validates the selected difficulty, stores it with match settings, and reapplies it during restart. Editing local browser preferences during a match does not change the running simulation. Return to the local or LAN lobby to change an AI’s difficulty before the next start. Quick **Play Solo** keeps its original one-opponent behavior.

Each kingdom has an `AIController` in `World::controllers`: its enabled flag, difficulty, think clock, raid clock and raid count. The fixed simulation tick advances only enabled, undefeated controllers. Their plans use their own villagers, resources, queues and civilization. Raid targeting chooses the nearest surviving hostile Town Center, so an AI can fight any enemy slot and will skip teammates. Strategic settlement locations are known to the planner; actual combat acquisition still obeys shared team vision and normal range rules. There is no AI thread, process or extra entity pool per computer.

Native tests check independent controllers, friendly-fire prevention, shared vision, team victory, all sixteen controller slots, raid gates, research timing, economy differences and unchanged starting stats/costs. HTTP tests cover every mode, invalid settings, default selection and restart persistence. `python3 tests/browser_difficulty_test.py` verifies the selector, descriptions, remembered choice and active-session authority through the browser. These browser tests use the optional Playwright setup described in [INSTALL.md](INSTALL.md).

`python3 tests/lobby_ai_test.py` verifies local and mixed LAN rosters against the native server. `python3 tests/browser_lobby_ai_test.py` exercises local multi-AI and friends-versus-AI setup through browser controls, including settings, ready/start, reload and return to lobby.

The economy update lets established computer kingdoms build Schools and Blacksmiths and research through the same paid, age-gated interface as humans. A kingdom with sufficient repair supplies may assign a worker to repair its damaged Town Center. Repairers are excluded from the gathering/rebuilding reassignment pass. These are normal villagers consuming normal resources.

## Random civilizations

Choose **Random civilization** in the main menu for quick solo, or in any editable human/AI civilization selector in the local or LAN lobby. Ready and start as usual. The authoritative server independently draws one available civilization per random seat at match start; all clients receive the same resolved name, race, statistics, starting resources and legal roster. Fixed selections remain fixed. Repeated people are possible.

The draw includes the ten current peoples and saved custom civilizations. Legacy Riverborn/Oakwardens/Ironvale compatibility aliases are excluded, so they do not add duplicate chances. A waiting lobby keeps showing Random; it does not draw repeatedly during polling or show a tentative result. Restart draws again while preserving the Random choice and map seed. Returning to the lobby preserves each seat's choice. This works in the WebAssembly local worker as well as Windows/Linux LAN servers and Engine Studio exports.

For engine/API customization, the reserved choice value is `__random__`, which cannot collide with a valid authored civilization ID. The convenience API value `random` also draws randomly unless a saved custom civilization already owns that ID. `randomCivilization`, `validateCivilization` and `prepare` in `games/crownfall/application.cpp` implement validation and once-per-match resolution. The draw uses a separate `std::mt19937` seeded from the host's random source; it never consumes the world's deterministic map/simulation RNG. Each eligible content ID has equal probability. The core `World` receives a concrete civilization, not a sentinel or per-tick random rule.

Run `tests/random_civilization_test.py` and `tests/browser_random_civilization_test.py` after changing this feature. They cover solo, local AI, sixteen LAN kingdoms, actual traits, authority/readiness, polling stability, restart, kicked-seat compaction and authored-ID compatibility.
