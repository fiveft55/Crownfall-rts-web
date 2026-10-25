# On'Gate: Legacy 0.5.Monarch for Windows

## Play the portable build

Use **64-bit Windows 10 or 11**, with Microsoft Edge, Chrome or Firefox. WSL, Visual Studio, Python, npm and a separate game engine are not required to play. This is a native Windows C++ server with a browser game interface.

1. [Download `OnGate-Legacy-Windows-x64.zip` from GitHub](https://github.com/fiveft55/codex-rts-gametest/raw/refs/heads/main/downloads/windows/OnGate-Legacy-Windows-x64.zip) and choose **Extract All**. Keep the whole extracted folder, including `web/`; do not run from inside the ZIP.
2. Double-click **Play OnGate Legacy.cmd**. It starts `crownfall.exe`, waits for the server to respond, and opens your default browser.
3. Choose **Play Solo**, or **Skirmish Lobby** to configure multiple AIs, difficulties, civilizations and teams before starting.
4. Keep the console window open while playing. Close it or press Ctrl+C to stop the local server.

Extract into a folder you can write to, such as Documents or Downloads. Saved civilizations and maps go in `data/content.json` beside the executable; back up that directory when replacing a build. Do not overwrite your data with another player's data. The package contains the server, original art/audio/UI, editors and documentation. `BUILD-INFO.txt` records its source revision and compiler. It uses Windows system DLLs and statically linked C++ support libraries.

## If the terminal says to extract the game

The launcher checks for `crownfall.exe` in its own folder before starting. This message means that check failed. Open the downloaded ZIP's **Extract All** command, then open the extracted **OnGate-Legacy-Windows-x64** folder. Its contents should include both launchers, `crownfall.exe`, and `web/index.html`. Run the launcher from that extracted folder. Opening a `.cmd` directly inside a ZIP can extract only the launcher into a temporary folder, leaving the executable behind.

The updated launcher prints the exact missing path and separately checks for the web assets. It also uses `pushd` to support launching from a Windows network folder. If a complete extraction still leaves out `crownfall.exe`, report whether the file appears in the ZIP and what the printed missing path says.

## LAN games and the dedicated server

Double-click **OnGate Legacy Server.cmd** to open **CrownfallHost.exe**, the native Host Control window. Choose an adapter/ports, enable Wi-Fi / UDP discovery and click **Start server**. **Host Console** opens the browser operator GUI. **Copy invite** gives friends a reachable LAN address. [Complete Wi-Fi and hardware guide](HOSTING.md). Use **Open a player tab** to play yourself. Friends use the copied LAN IPv4 address in their browser and choose **Join as Player**. They do not need to install the Windows package. Linux and Windows hosts/clients use the same protocol and content.

The lobby supports sixteen combined human/AI kingdoms, four additional spectators and one dedicated operator. Add computers as opponents or teammates; assign matching team numbers to friends for co-op. Every human readies up before the operator starts. See [the server guide](SERVER.md) and [AI guide](AI.md) in the extracted package.

If Windows Firewall asks, allow the server on your **Private** home network for LAN play. Solo works through the local address. Use `ipconfig` if an address printed for a VPN or virtual adapter is not reachable by friends. Internet port forwarding is not needed.

## Choose another port or run manually

From a terminal opened in the extracted folder:

```bat
"Play OnGate Legacy.cmd" 9090
"OnGate Legacy Server.cmd" --port 9090
crownfall.exe --web web --data data --port 9090
crownfall.exe --help
```

Use one of the first three commands at a time. If the port is already occupied, stop the other server or choose a different port. The play launcher opens the local address on the selected port. With engine arguments the server launcher retains its terminal mode and prints available addresses. Without arguments it opens the native control window. Both launchers resolve their own folder, so paths with spaces work.

The build is unsigned. If Windows shows a publisher warning, check that the ZIP came from this repository/build and compare its SHA-256 with the accompanying `.sha256` file. No antivirus, firewall, TLS verification or global PowerShell execution-policy changes are needed. You can inspect the two text launchers and run the executable manually.

```powershell
Get-FileHash .\OnGate-Legacy-Windows-x64.zip -Algorithm SHA256
```

## Build it yourself on Windows

Install **Visual Studio 2022 Community** or **Build Tools for Visual Studio 2022**, selecting **Desktop development with C++**, the MSVC x64 toolset, a Windows SDK, and **C++ CMake tools for Windows**. Open **Developer PowerShell for VS 2022** and change to this repository. Python 3 is optional for building, but required for the HTTP/lobby tests; it is available at python.org.

```powershell
cmake -S . -B build/windows -G "Visual Studio 17 2022" -A x64
cmake --build build/windows --config Release --parallel 2
ctest --test-dir build/windows -C Release --output-on-failure
cpack --config build/windows/CPackConfig.cmake -C Release -B dist
```

Or, in a shell that permits your local scripts, run `./scripts/build-windows.ps1`. It performs these same build, test and package steps and stops on failure. Its `-SkipTests` switch is only for an intentional untested local build. The output is `dist/OnGate-Legacy-Windows-x64.zip` and its SHA-256. Compiling does not require any proprietary game assets. CMake links Winsock/IP Helper and the static MSVC runtime, with a 16 MiB reserved stack for the engine's bounded world buffers.

The GitHub **Windows portable build** workflow builds only the Windows game ZIP with MSVC on `windows-2022`, runs simulation and real HTTP/lobby integration tests, checks the extracted package/launcher from a path with spaces, and uploads the portable ZIP and checksum. In the repository's **Actions** tab, open a successful run and download the `OnGate-Legacy-Windows-x64-0.5.Monarch` artifact. Extract the downloaded artifact, then extract the game ZIP inside it. This job has no Linux/Web export dependency. The complete authoring kit uses the separate manual **Engine Studio SDK** workflow, with Emscripten 3.1.69. Workflow results establish whether a particular commit passed Windows CI; a configured workflow alone does not establish that it ran.

A red Actions result is an automated source-build failure, not an error inside the already-committed ZIP. The ready-to-play repository download above works independently. Older failed runs remain in Actions history after fixes; check the newest run for the current result.

## Cross-compile from Linux

Install CMake, Make and the MinGW-w64 x64 POSIX C++ toolchain using your distribution's package manager. On Debian/Ubuntu the relevant compiler package is `g++-mingw-w64-x86-64-posix`.

```sh
cmake -S . -B build/windows-cross -DCMAKE_TOOLCHAIN_FILE=cmake/windows-mingw.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build build/windows-cross --parallel 2
cpack --config build/windows-cross/CPackConfig.cmake -B dist
```

Cross-compiling creates Windows programs; it cannot run them directly on Linux. Run the test executable on Windows, use the Windows CI workflow, or explicitly use Wine for compatibility checks. Real Windows firewall behavior, the default browser and `.cmd` launchers should also be checked on a Windows desktop.

## Package validation

The cloud Windows package uses GCC 14 / MinGW-w64 12. [PROGRESS.md](PROGRESS.md) records each release's actual native/Wine/browser/package checks and Windows CI result. Monarch adds host-as-player, color/departure and shared physics tests beside the existing simulation/network suites. Verify the packaged `BUILD-INFO.txt` and adjacent SHA-256 file; historical CI success alone does not verify a new commit.

These compatibility checks do not exercise a real Windows desktop's browser association, SmartScreen or Windows Firewall prompts. The CI workflow provides separate MSVC/native-Windows checks when it runs; verify its result for the commit you download. Browser auto-opening and real-device LAN access remain desktop checks.

## Engine Studio and Host Console

For the independent authoring app, download [OnGate-Legacy-Engine-Windows-x64.zip](https://github.com/fiveft55/codex-rts-gametest/raw/refs/heads/main/downloads/windows/OnGate-Legacy-Engine-Windows-x64.zip), extract it and open **CrownfallStudio.exe**. It includes the complete editable source project and browser editors. [STUDIO.md](STUDIO.md) explains first maps/civilizations, code editing, backups, playtesting and rebuilding C++.

The game package also includes **OnGate Legacy Host Console.cmd**, which opens native Host Control. Start/stop, saved preferences, invite copying, UDP scanning and log saving are documented in [HOSTING.md](HOSTING.md). Its Host Console button opens the independent browser dashboard. Existing operators can open the same GUI from Escape. The new host supports 16 active players plus four spectators and the operator; active kicks, IP policy and diagnostics are covered in [DIAGNOSTICS.md](DIAGNOSTICS.md). The native Studio launcher was cross-compiled; its browser workspace and bundled server are tested separately. Real Windows desktop launching, browser associations and firewall prompts still need native desktop verification.

For a local-only server choose **Localhost only** in native Host Control. **Server host** listens on Wi-Fi/Ethernet or a selected adapter. [Both modes, host/play flow and leaving](MONARCH.md#localhost-and-server-host-modes).
