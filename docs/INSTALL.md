# Installation and everyday development

## What is required

You need a C++17 compiler, Make, and a modern desktop browser. GCC 9+ or Clang 10+ is a reasonable baseline. Development and tests here used GCC on Linux. There are no third-party C++ libraries. The browser uses Canvas 2D and Web Audio.

C++ is useful here because entity layout, storage capacity, allocation and CPU work are under direct control. The core can compile with optimization and run independently of the browser. JavaScript handles the platform-specific presentation and editors, which keeps UI changes quick.

### Debian / Ubuntu / WSL Ubuntu

```sh
sudo apt-get update
sudo apt-get install -y build-essential python3
cd /path/to/codex-rts-gametest
make
make run
```

Python is needed for the HTTP tests, not to run the game.

### Fedora

```sh
sudo dnf install gcc-c++ make python3
make
make run
```

### Windows 10 / 11 x64

Use the portable `OnGate-Legacy-Windows-x64.zip` and double-click **Play OnGate Legacy.cmd**. It contains the native `.exe`, browser assets, dedicated server launcher and editors. WSL and compilers are not required to play. For source builds with Visual Studio 2022/CMake, package generation, ports and Windows LAN setup, see [WINDOWS.md](WINDOWS.md).

## Current packages

Windows x64 is the full native game and LAN host. WebAssembly is the local AI
demo, built with Emscripten from the same C++ gameplay. Independent Windows
Studio exports Windows/Web/source. See [exports](EXPORTS.md).

Linux/macOS releases, packaging and CI are retired. The Unix commands above
remain useful for internal development/testing and Web builds; they do not
produce supported Linux releases. Older tagged Linux downloads remain frozen.
Build Windows with Visual Studio/CMake using [WINDOWS.md](WINDOWS.md).

## Addresses and ports

The native executable prints local and detected IPv4 LAN addresses. Use the local address on the server itself, and a reachable LAN address from another machine. The default TCP port is 8080.

```sh
./build/crownfall --web web --data data --port 9090
./build/crownfall --help
```

`--web` is the directory holding the shipped browser files. `--data` is where saved workshop content is kept. Relative paths are relative to the process working directory. `scripts/dev.sh` resolves the repository and web paths for you.

## Build modes

```sh
make                                      # -O2 release build
make clean
make CXXFLAGS='-std=c++17 -O0 -g -Wall -Wextra -Wpedantic'
make test                                 # Meaningful simulation scenarios
make check                                # Simulation + HTTP integration
```

Make tracks source and header changes. Rebuild after changing C++. Browser code reloads after refreshing the page; static responses disable caching. Do not expect a running native process to adopt a newly compiled binary: stop and restart it.

To run a sanitizer check without changing the normal executable:

```sh
mkdir -p build
g++ -Iengine -Igames/crownfall -std=c++17 -O1 -g -fno-omit-frame-pointer \
  -fsanitize=address,undefined tests/world_test.cpp games/crownfall/world.cpp \
  games/crownfall/content.cpp engine/json.cpp -o build/tests-sanitized
./build/tests-sanitized
```

## Optional art and browser tooling

These tools are for development only. They are not runtime dependencies.

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install playwright
playwright install chromium
python3 scripts/generate_atlas.py
python3 tests/browser_smoke.py
python3 tests/browser_difficulty_test.py
python3 tests/browser_lobby_ai_test.py
python3 tests/art_bounds_test.py
python3 tests/browser_assets_test.py
```

The Python scripts reuse an installed `chromium` or `chromium-browser` when found; otherwise they use Playwright's browser. The shipped PNG already exists, so normal players do not need the generator.

For the optional animated documentation gallery, install `Pillow` in the same
development environment and run `python3 tests/browser_animation_test.py`.
Studio's PNG/JSON sprite-sheet export works without Python or Pillow.

## Keep your work

Saved custom designs live in `data/content.json`. Export individual designs from the workshop before sharing or migrating them. `data/`, `.venv/`, generated binaries, test screenshots and logs are ignored by Git. Back up data you care about; active matches and browser session tokens are not persistent save games.

Cloud tasks already have an isolated checkout. Use the existing repository; creating another Git worktree is unnecessary. To resume development in a fresh task, build with `make`, then start the native process again. Live processes do not survive environment snapshots.
