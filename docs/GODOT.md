# Godot edition: Windows, Android and Steam480 testing

This is an early native Godot frontend over the existing C++17 RTS simulation.
It does not embed the browser. Godot4.6.3 draws sprites/UI; a GDExtension calls the
same World tick, pathfinding, combat, economy and command validation as the other
editions. JavaScript/Python prepare assets only. No game rules were reimplemented
in GDScript. Existing Windows/Web editions stay available; this is not yet full
HUD/editor/audio parity with them.

For the complete ongoing Windows-x64/web layout in a desktop app, use the
[new classic desktop edition](DESKTOP-CLASSIC.md). This Godot prototype keeps its
separate early interface and Steam480/ENet protocol.

## Downloads and controls

- `downloads/windows-exe/OnGate-Legacy-Godot-Windows-x64.zip`: extract everything,
  then run OnGateLegacy.exe. Keep PCK and DLLs beside it. No browser needed.
- `downloads/android/OnGate-Legacy-Godot-arm64.apk`: Android7/API24+ ARM64 test APK.
  Allow installation from your download source. This is development-signed, not
  a Play Store release. Production needs your own persistent signing key.

Choose map size64–128,2–16 kingdoms, civilization and AI difficulty. Offline
skirmish starts after Ready/Start (a lone host can start directly). In LAN mode,
Host opens UDP45856; friends enter the host's LAN IP and choose player or spectator.
Windows and Android use the same ENet protocol. Open the host's Windows firewall
for UDP45856 on a trusted private LAN. Guest Wi-Fi isolation may block it.
All humans ready before the host starts; unfilled kingdoms are AI. Four spectator
seats are separate. Host departure ends the room; disconnected kingdom seats
return to AI control. This early lobby has no team editor, custom-map picker or
host kick UI yet. Full snapshots are pushed at20Hz; no camera coordinates are sent.
This is an initial transport, not a measured high-player-count bandwidth claim.

Android combines player and host in one app. Tap your unit, then a destination or
resource. Drag pans; menu Zoom+/− controls zoom. A phone host must remain open in
the foreground; this is not a background Android server service. Windows uses
click/right-click, Shift queues, wheel zoom, arrows and the inset pan frame. The
physical screen border no longer pans. Collect is first for villagers; Delete is
last. Buildings use two raze confirmations; Town Centers remain protected.
Rally/route markers remain in the original frontend; decorative building flags
are removed. Godot has no building flags. The translucent frame does not cover
terrain with a filled panel or block ordinary gameplay clicks.

## Steam friends and relay testing — Windows only

The owner explicitly authorized App ID480 for development. Both players must:

1. Run Steam, sign in to separate accounts, and launch the Godot Windows build.
2. Host: choose kingdom count, then **Steam host · App480 test**. Wait for a lobby ID.
3. Friend: paste that decimal ID into the address field, then **Join Steam lobby ID**.
4. Both click Ready; host clicks Start. Keep Steam and the game open.

The Invite Steam friends button requests Steam's overlay dialog. Overlay and
invite launch behavior need real-account verification; App480 can be identified
as Spacewar and may launch that development app instead. Use the manual lobby ID
path while testing. No claim of validated account-to-account Steam play is made
from this cloud environment.

SteamRelay uses SDK1.65's friends-only matchmaking and SteamNetworkingSockets P2P.
It disables direct ICE and requests Steam Datagram Relay, so Google STUN/TURN
settings do not apply here. Valve must grant the signed-in accounts/backend a
working relay session; the SDK alone cannot guarantee that. Lobby metadata must
match `ongate_protocol=silkroad-godot-1`; unrelated App480 rooms are rejected.
Connections must be members of the current lobby. The host assigns game seats
and validates every command with the C++ rules. Never trust a client-supplied owner.
Messages are chunked32KiB, capped4MiB, with bounded partial assemblies, timeouts
and pending reliable bytes. Full snapshots can recover after lost unreliable
packets. Commands use reliable delivery and per-peer limits. This is development
architecture, not production authentication/rate-limit hardening.

Steam headers/full SDK remain outside Git. Windows includes only Steam's runtime
DLL, governed by Valve's Steamworks terms. No account keys or credentials ship.
Android uses LAN/offline modes; this SDK does not give Android a Steam login/relay
client. Once your real App ID is approved, replace the explicit test initializer,
update protocol/build metadata, ship entitled test branches, validate identity,
invite launching, reconnection, relay-only routes, defeated-team vision and
multi-device load before production. Never advertise480 as your production ID.

## Build and extend

Install Godot4.6.3 + its matching export templates, CMake, Python developer tools,
and a C++17 compiler. Clone `godotengine/godot-cpp` branch4.5 (tested revision
27d9dd23c83871e0619fca5dc2cddfbfd69e926a). For the Windows extension, use MSVC x64
or MinGW x64 and supply your private SDK directory:

```powershell
python scripts/prepare-godot.py
cmake -S godot/native -B build/godot-windows -DGODOT_CPP_DIR=C:/dev/godot-cpp -DSTEAMWORKS_SDK=C:/private/steamworks/sdk
cmake --build build/godot-windows --config Release --parallel 2
```

Put the resulting ongate.dll in godot/bin. MinGW builds also require its matching
libwinpthread-1.dll there; MSVC builds do not need that DLL (remove its dependency
entry when using MSVC). Godot's dependencies section exports runtime DLLs. Install
Godot's Android SDK/JDK tooling in Editor Settings. Build the ARM64 extension with
NDKr27c:

```sh
cmake -S godot/native -B build/godot-android \
 -DGODOT_CPP_DIR=/path/to/godot-cpp \
 -DCMAKE_TOOLCHAIN_FILE=/path/to/android-ndk-r27c/build/cmake/android.toolchain.cmake \
 -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-24 -DANDROID_STL=c++_static
cmake --build build/godot-android --parallel 2
```

`godot/bin/libongate-arm64.so` is registered in ongate.gdextension. Sprite pages
are <=4096px with overlap to support mobile texture limits; the palette shader
protects skin/metal while tinting reserved dye pixels. Native reset now uses a
heap temporary rather than placing a2.7MiB World on small Android thread stacks.

Import the Godot project and export Windows/Android from Project→Export. The
committed presets use installed default templates; configure local overrides if
needed. Windows Steam test exports include steam_appid.txt containing480. Do not
bundle the full private SDK. No Linux/macOS release is produced.

Run `godot --headless --path godot -- --smoke-test` for native startup/ticking.
The two scripts in godot/tests test real separate-process LAN seat assignment,
ready/start, remote movement and private fog. The APK is signature/architecture
checked. Physical Windows/Android GPU, touch, battery, Wi-Fi interoperability and
live Steam account tests remain unverified here. The Godot HUD, sound/editor
integration and detailed animation/selection polish still need further work.
