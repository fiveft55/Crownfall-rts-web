# Make updates and new games

The engine is a reusable **host and tool layer**. On'Gate: Legacy is one game module; it no longer owns the platform entry point. Orbit is a second, smaller module that proves a game can use the host without importing On'Gate: Legacy's units, civilizations, AI or combat rules.

## The boundary

| Folder / interface | Owns |
|---|---|
| `engine/application.h` | The small game/host contract: `step(realSeconds)` and `request(id, rawRequest, peer)` |
| `engine/main.cpp`, `network.*`, `http.*` | Native process, sockets, nonblocking HTTP and the platform clock |
| `engine/web_main.cpp`, `http_web.cpp`, `web-worker.js` | Browser worker/WebAssembly host and local request bridge |
| `engine/json.*`, `diagnostics.*`, `project.*`, `export.*` | Generic data, resource counters, local text editing and packaging |
| `games/crownfall/` | RTS simulation, AI, catalog, content validation, lobby and gameplay request adapter |
| `games/orbit/` | A separate click-to-steer collection game, its own simulation and browser presentation |
| `web/` | On'Gate: Legacy presentation and the shared Studio interfaces |

CMake builds separate `engine_core`, `engine_services`, `game_crownfall`, `game_orbit` and host targets. `engine_core` can be built on its own. The module registry/factory in `engine/application.cpp` is the explicit place where the shipped host chooses linked games. Modules are C++ source modules linked at build time, not arbitrary downloaded binary plugins or hot-loaded scripts.

## Make an update to On'Gate: Legacy

- **A new map or civilization:** use its designers. Export again; no compiler is needed.
- **UI, sprites or sounds:** edit the browser sources. Regenerate the atlas after changing its generator. Reload to test, then export.
- **New rules, units or combat:** edit `games/crownfall/`. Run simulation and integration checks. Rebuild all runtime templates you intend to ship, then export.
- **Hosting, diagnostics or export improvements:** change `engine/`. These services can serve all linked games. Keep game-specific decisions in the module.

There is no promise that every possible new genre can be built by sliders. New game mechanics require code. The split keeps that code out of networking and packaging.

## Start a separate game

First try the existing example: in Studio choose **Project & export → New project profile**, choose **Orbit**, save and export. Run the result. It has different graphics and rules while using the same native/browser hosts.

To implement another game:

1. Copy `games/orbit/` to `games/your-game/`. Give its C++ class/factory a distinct name. Keep its HTML, JS and assets in its own `web/` folder.
2. Implement `Application::step(double)`. The host supplies elapsed real seconds. Decide your own simulation storage, fixed-step policy and game rules; never depend on render FPS for simulation correctness.
3. Implement `Application::request(...)`. Parse only your supported API operations and answer using `HttpServer::respond`. Validate commands. The Web host sends the same HTTP-shaped API requests without opening sockets.
4. Add the factory declaration to `engine/application.h`. Add a module ID, display name and presentation folder to `gameModules()` in `engine/application.cpp`; add its factory branch in `makeApplication()`.
5. Add a CMake library for the new module, link it into `engine_apps`, and include it in the Web exception-options/warning lists. Add its sources to the small Makefile too if you use Make. Do not link On'Gate: Legacy's simulation unless the new game deliberately uses it.
6. Rebuild and test native and Web runtime templates. Studio reads its module choices from the registry automatically. Save a profile with your new module and export.

Native test command:

```sh
./build/crownfall --game orbit --web games/orbit/web --data data/orbit --port 8081
```

Open `http://127.0.0.1:8081`. The legacy executable filename is shared; `--game` selects its module. Studio's RTS playtest and map/civilization panels currently target Crownfall. Test a different module through its exported package or the command above; adding module-specific editors is another source extension.

For the existing browser bridge, presentation code should use `fetch('/api/...', options)` for its game API and relative URLs for local assets. It supports the string URL/method/header/body pattern used by both examples. It is not a general replacement for every feature of the browser Fetch API. The Web exporter inserts its bootstrap before game scripts, starts a worker, mounts per-project saved data, and loads the selected module.

## Maintain your game

Keep your game source, manifest and content in version control. Keep compiled templates tied to the source release that built them. Back up `data/` and source before applying SDK updates. Review generic engine changes separately from your game's changes; rebuild and run your regression checks before shipping. There is no automatic migration or conflict resolver for arbitrary future game schemas.

See [EXPORTS.md](EXPORTS.md) for platform toolchain installation and the exact rebuild/export commands, and [STUDIO.md](STUDIO.md) for the editor workflow.
