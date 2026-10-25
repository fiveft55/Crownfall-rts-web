# Civilizations, data mods, and engine extensions

## Make your first civilization without coding

1. Open **⌘ Workshop → Civilization Designer**.
2. Choose an existing civilization and **Duplicate**, or click **New Civilization**.
3. Give it a unique stable ID such as `winter-wardens`, a display name and a story.
4. Set starting food, wood, gold and stone. Use sliders for health, damage, movement, gathering, construction and training.
5. **Save Civilization**. Choose it in the welcome screen for solo, or in your own LAN lobby row.

The preview and sliders update as you edit. `1.00×` means normal. For example, `1.25×` gathering collects resources 25% faster. Health applies to owned units and buildings; attack affects damage; movement affects mobile units; construction affects villagers' building work; training affects production progress. Age damage scaling still applies on top of the civilization bonus.

Starting resources are limited to 0–5,000 each; multipliers to 0.25–4.00. These are guardrails against invalid data, not a balance system. You can make an overpowered civilization. Agree on mods before competitive play.

Changing civilization clears your readiness. Saved edits apply when preparing a new/restarted match, not partway through a running one.

## Share a design

Click **Export JSON**. Another operator opens the workshop, clicks **Import JSON**, reviews the draft and saves it. Importing into the UI does not automatically modify the server. Before hosting, content saving is available locally; after hosting, only the operator (or the solo match owner) may persist designs.

A stable ID replaces the existing design with that ID. Use **Duplicate** and a new ID when preserving an original. Display names can contain spaces and Unicode; stable IDs use 1–32 lowercase letters, numbers and hyphens.

Server data lives in `data/content.json`, or the directory passed with `--data`. Writes validate a copy, write a temporary file and rename it into place. Invalid data or a failed write does not replace the in-memory registry. Export important work and back up this file.

## Civilization JSON

[examples/winter-wardens.json](../examples/winter-wardens.json) is an importable example:

```json
{
  "kind": "civilization",
  "id": "winter-wardens",
  "name": "The Winter Wardens",
  "description": "A patient people, known for enduring halls and careful harvests.",
  "resources": [300, 480, 180, 220],
  "health": 1.15,
  "attack": 0.95,
  "speed": 0.95,
  "gather": 1.1,
  "build": 1.2,
  "train": 1.0
}
```

The resource array is always **food, wood, gold, stone**. Existing civilizations all use the shared unit roster. The editor does not yet define unique units, research trees, civilization-specific buildings or arbitrary event scripts.

## Map JSON

Use the [Map Forge guide](MAP_EDITOR.md) to generate a correct file rather than typing thousands of tile IDs. Its fields are:

| Field | Meaning |
|---|---|
| `kind` | `"map"` |
| `id`, `name` | Stable ID and display name |
| `width`, `height` | 48–128 logical tiles per side |
| `terrain` | One row-major string with exactly `width * height` characters |
| `spawns` | 2–16 `{ "x": ..., "y": ... }` start positions |
| `objects` | Up to 3,000 `{ "kind": ..., "x": ..., "y": ... }` resource placements |
| `autoResources` | Add a standard starting economy near each active start |

Tile IDs: `0` grass, `1` water, `2` bridge, `3` earth. Resource kinds: `11` tree, `12` berries, `13` gold, `14` stone. Coordinates use world tiles, with `.5` placing an object in the center of a tile. For a tile `(x,y)`, its terrain character is at `y * width + x`.

Player starts must have enough border clearance, be at least ten tiles apart and connect by land. The editor and runtime reserve a dry 17×17 settlement area. Server-side validation checks dimensions, arrays, bounds, terrain values, resource placement and connectivity. The map's start count limits the lobby capacity; unused starts are not AI kingdoms.

## Add something beyond the GUI

The engine intentionally keeps a small boundary between definitions, state and presentation:

| Change | Start here |
|---|---|
| Base unit health, cost, speed, damage or training time | `games/crownfall/catalog.h` |
| Civilization fields and saved map shape | `games/crownfall/models.h` |
| Valid ranges and JSON persistence | `games/crownfall/content.cpp` |
| Gathering, combat, construction or victory rules | `games/crownfall/world.cpp` |
| New validated command | `World::command` + the server command route |
| New visual action or feedback | `web/game.js` |
| Sprite shape, palette or animation frames | `web/art.js`, then regenerate `atlas.png` |
| Music phrase, timbre or event sound | `web/sound.js` |
| Editor controls | `web/workshop.js` and the matching model/validator |

The browser loads shared base definitions from `/api/catalog`. Editing an existing catalog entry and recompiling updates names, costs, health references, age requirements and training labels without duplicating those edits in JavaScript.

To add a new unit family rather than rebalance an existing one:

1. Extend `Kind` and its definition together. Existing code groups kinds into mobile units, buildings and resources; update those range checks deliberately.
2. Add production-building validation and behavior in `World::enqueue` / `World::update`.
3. Add a meaningful scenario to `tests/world_test.cpp` for its behavior and cost rules.
4. Add renderer metadata, an action and a sprite frame/index. The current packed atlas layout has explicit family ranges; expand it before adding frames.
5. Update the editor/schema if modders should control the new mechanic.
6. Rebuild, regenerate the atlas if needed, and run native, HTTP and browser checks.

For a new game mode, consider changing the victory/economy rules while reusing movement, entity storage, the map editor and sessions. For a radically different game, split RTS-specific rules away from the generic storage and platform adapter. This is editable C++, not a generic scripting VM: importing JSON never executes arbitrary code.

## Keep changes understandable

Prefer one clearly named field over unrelated numeric flags. Validate imported data before changing the current world. Keep assets shared and mutable state in the entity. Preserve fixed-step timing, stable IDs, ownership checks and fog filtering when adding features. Measure a representative workload before increasing capacities or replacing algorithms.

## Economy/research and age artwork

[ECONOMY.md](ECONOMY.md) documents repairs and the School/Blacksmith. Their technology data lives in `games/crownfall/catalog.h`; effect/accounting rules live in `world.cpp`. Building IDs 15 and 16 are appended; resource IDs 11–14 remain unchanged. Use `isBuilding`/`isResource` and catalog footprints rather than assuming every ID above 10 is a resource.

Artwork uses three ages, compact building/action regions and frame helpers; see [ART.md](ART.md). Regenerate the atlas and rebuild all C++ runtime templates after rule/catalog edits before exporting a new game version. Existing map/civilization JSON keeps its format.

The fantasy race templates, military roster and Fortress rules are documented in [A New Era](NEW_ERA.md).
