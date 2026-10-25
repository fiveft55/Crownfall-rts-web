# Map Forge: a level designer for tile battlefields

Open **⌘ Workshop → Map Forge**. You can edit a draft before hosting a server, and the operator can save custom maps afterward.

## Create a map

Choose an open-meadow, river or lake template. Set width and height between 48 and 128 tiles, including rectangular sizes. Choose 2–16 player starts and click **Apply Size / Starts**. That action regenerates the terrain and start layout; export or save the old design first if you want to keep it.

Give the map a display name and stable ID. The ID is how the server distinguishes saved maps. Saving with an existing ID replaces that map's saved design.

## Paint

- **Grass, water, bridge, earth:** paint logical terrain cells. Water blocks land units; a bridge is walkable.
- **Tree, berries, gold, stone:** place a resource object at a tile center. Painting another resource on the same cell replaces that object.
- **Erase object:** removes a resource object without changing its terrain.
- **Place Start:** choose the start number and click to reposition it. Starts need border clearance and at least ten tiles of separation.

Left-drag paints. Middle-drag pans. The mouse wheel or zoom slider magnifies the map. The brush-size control paints a larger square area. **Undo/Redo** restore terrain/resource/start strokes. The grid checkbox controls editor grid lines independently of the in-game grid. The inspector reports the hovered tile and object count.

The inner 3×3 outline shows the Town Center footprint; the resource brush avoids it. A dry 17×17 area is reserved around every start so Town Centers, initial houses, villagers and optional resources have usable land. Water painting avoids those reserved areas; moving a start clears its new footprint. This protection is also applied on the server when loading a map.

## Make it playable

Use **Check Land Routes**. Every start must connect to the first start through walkable terrain. If a river splits the map, paint bridges. The game has no ships, so disconnected islands are not currently playable.

Enable **Starting resources near each kingdom** to add the usual nearby berries, wood, gold and stone. Disable it to author the resource distribution yourself. If you disable it and forget resources, players can run out; route validation does not prove your economy is well balanced.

Hand-placed resources must be on land. Avoid placing them inside Town Center or house footprints. The editor reserves terrain but does not guarantee tactical balance or prevent every visual overlap. Test your map in solo or with another player after saving.

## Save, use and share

**Save Map to Server** validates the draft and registers it in `data/content.json`. Select it in the welcome map options or the operator's lobby map list. Choose a player capacity no larger than its number of starts. A match with fewer players uses the first starts in order.

**Export JSON** downloads a portable design. **Import JSON** loads a draft for review, then Save registers it. Data is validated again by C++, even if a file bypasses the UI. Invalid dimensions, terrain strings, objects, starts or land routes produce a readable error.

Custom maps define terrain, resources and starting settlements. They do not yet store triggers, campaign scripts, arbitrary preplaced armies, elevation, ships, destructible bridges or win-condition scripts. Those need engine extensions; the data model and renderer are documented in [MODDING.md](MODDING.md).

**Automatic resources** adds both each kingdom’s initial supplies and deterministic neutral forest, berry, gold and stone patches. Disable it to use only hand-placed objects. Existing imported maps can contain overlaps; inspect the larger Town Center footprint before saving an update.
