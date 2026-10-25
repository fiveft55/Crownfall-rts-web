# Steamworks preparation — SilkRoad

**Status: optional SDK adapter prepared; Steam invitations and Steam relay gameplay
are not a released feature.** The owner has no App ID yet. The downloadable Windows
build has Steam disabled and works normally with LAN hosting. No Valve SDK files,
keys, App IDs or Steam redistributables are included.

## What exists

`engine/platform/steam_lobby.{h,cpp}` isolates Valve types behind a C++ interface.
The default implementation reports unavailable. The SDK implementation initializes
Steam, pumps callbacks on the native main thread, creates friends-only lobbies,
joins validated lobby IDs, publishes protocol/reachable endpoint metadata, and
leaves/cancels pending operations on shutdown. Capacity is bounded to 20 connected
seats (16 kingdoms and four spectators). It does not change simulation authority,
team fog, readiness or seat ownership. `--steam` enables initialization/callback
pumping in a native SDK build. It does not automatically create a Steam lobby.

## Build after receiving your App ID

1. Register the game with Steamworks and download the licensed Steamworks SDK
   through your developer account. Keep it outside this repository.
2. Install Visual Studio 2022 C++ and CMake. Use the x64 Developer PowerShell:

   ```powershell
   cmake -S . -B build/steam -A x64 -DCROWN_STEAMWORKS=ON -DSTEAMWORKS_SDK="C:/SDK/steamworks/sdk"
   cmake --build build/steam --config Release --parallel 2
   ```

3. Launch Steam and give your test accounts access to the real application. For
   development only, put your assigned decimal ID in `steam_appid.txt` beside the
   executable. Never substitute another game's App ID. Run `crownfall.exe --steam`.
   The SDK build copies `steam_api64.dll` beside the executable. Distribute it only
   under Valve's license. Current ordinary ZIP packaging does not include it;
   maintain a separate Steam depot and audit its DLL dependencies.
4. Check the startup status. Missing Steam/entitlement/ID must leave LAN available.

## Work still required before advertising Steam multiplayer

Connect the adapter's create/join calls to the native lobby owner and implement
`GameLobbyJoinRequested_t` / launch `+connect_lobby` handling. Treat Steam membership
as discovery, never an authorized game session; issue an ordinary private seat
session after capacity, color and host checks. Compare protocol/content versions
before joining. Do not publish host keys or session tokens in lobby metadata.

A Steam lobby is **not a gameplay relay**. The current browser renderer uses HTTP
or WebRTC. Either publish a reachable native HTTP endpoint (requires network
access/firewall configuration), or implement an authenticated native bridge using
SteamNetworkingSockets/Steam Datagram Relay. The browser must talk only to a local,
origin-restricted bridge. Do not expose Studio/admin APIs through it. The external
browser also does not provide the native game's Steam overlay; friend invitations
need a native integration/UI path and real-account testing.

Before release, test two entitled PCs: invitations, join-in-progress policy,
ready/AI/teams, kick and host exit, failed/revoked authentication, packet ordering,
reconnect, spectator receive-only flow and private defeated-team fog. Configure a
Windows-only depot and launch option, run Steam's validation and perform a clean
install test. None of those SDK/account-dependent checks has been performed here.

## Why this is separate

The same game rules compile to WebAssembly without Steam. Keeping the adapter in
native engine services avoids leaking SDK dependencies into future games, the
simulation, or static web exports. Default builds require no Steam installation.
