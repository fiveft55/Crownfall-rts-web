> Want the ongoing Windows-x64/web UI in a desktop .exe? Use the
> [classic desktop app](DESKTOP-CLASSIC.md). This page describes the older
> separate Win32/GDI+ prototype.

# Fully native Windows game — first playable port

The **windows-exe** edition runs `OnGateLegacy.exe` in a native Windows window.
Win32 creates the UI; GDI+ draws the map and baked PNG sprites. The existing C++17
World runs directly in the process. No HTML, JavaScript, WebView2, browser process,
HTTP listener, Node or Python is used at runtime.

This is an **initial offline native frontend**, not full presentation/network parity
with the existing Windows edition. The existing Windows/Web downloads remain
available. Native LAN hosting/joining/spectators, audio, map/civilization editors,
custom key configuration, minimap, destruction effects and the full browser HUD
are not ported yet. Do not claim the native edition already supports these.

## Run

Download `downloads/windows-exe/OnGate-Legacy-Native-Windows-x64.zip`, extract the
whole ZIP, and double-click **OnGateLegacy.exe**. Keep `assets/` beside it. Windows
10/11 x64 is the target. No separate engine server or browser needs starting.
Choose civilization, square map64–128, map preset,1–15 AI opponents and difficulty,
then **Start native skirmish**. Custom civilization JSON can be placed in the
native profile's `content.json` using the existing content schema.

The native profile uses `%LOCALAPPDATA%\OnGateLegacy\Native`. It is separate from
browser storage. This build does not import browser preferences or save matches.

## Controls

- Click or drag a box to select your units; Shift adds selections.
- Right-click resources/enemies/buildings/ground for contextual orders; Shift-right-click queues movement. Select a production building and right-click to set its rally point.
- Choose a building in the bottom buttons and left-click visible ground to place it. Shift-place queues construction. Right-click cancels placement. R rotates Gates. Native walls currently place one segment at a time.
- Use the bottom buttons for training, research, age advancement, repairs, deploy, stop, attack-move, patrol, defend and hold. Illegal orders display feedback; prices/disabled-state tooltips are still pending.
- Arrow keys or middle-mouse drag pan; mouse wheel zooms. G toggles the tile grid. H selects/focuses a Town Center. M arms movement, A attack-move, P patrol, S stops.
- Delete removes units; buildings require two confirmations and Town Centers remain protected.
- Escape offers surrender/return to setup, resume or remain paused. Space resumes/pauses. Game → New match returns to setup. Closing the window ends the process; it leaves no server behind.

The 20 Hz simulation retains SilkRoad costs, collision/path recovery, economic
orders, combat, upgrades, Gates, garrisons, AI and victory rules. The native draw
loop targets about60 updates/second; this is not an FPS guarantee. GDI+ is currently
a software-rendering baseline, not a DirectX/Vulkan GPU renderer. The atlas decodes
to roughly149 MiB RGBA; the owner-color cache is capped at12 MiB. Native Windows
controls and in-process rules alone do not guarantee low memory use.

## Build and customize

Install Visual Studio2022 Desktop C++ and CMake. From Developer PowerShell:

```powershell
cmake -S . -B build/native -A x64 -DONGATE_DESKTOP=ON -DBUILD_TESTING=OFF
cmake --build build/native --config Release --target OnGateLegacy
python scripts/package-native.py --exe build/native/Release/OnGateLegacy.exe
```

Python is optional packaging tooling. To package manually, copy the executable,
`web/atlas.png` to `assets/atlas.png`, and `assets/native/frames.json` to
`assets/frames.json`. The PNG is shared with the original edition. Rebuild frame
metadata with `python scripts/generate-native-frames.py` after changing the atlas
layout (development Playwright/Chromium only). No generator ships in the runtime.

`engine/desktop_windows.cpp` owns only native presentation/input; rules stay in
`games/crownfall/world.cpp` and `catalog.h`. `--self-test` checks all frame bounds,
a real World movement order and the native drawing path on Windows. This cloud
release is cross-compiled and archive-checked; physical Windows UI execution is
not verified here. The dedicated Windows CI workflow runs the self-test.
