MinGW-w64 cross-compiled Windows builds include statically linked GCC C++/compiler
runtime support and MinGW-w64 runtime components. GCC runtime support is provided
under GPL version 3 with the GCC Runtime Library Exception, as reproduced in
GCC-runtime-notices.txt and GPL-3.txt. MinGW-w64 component copyright/license
notices are reproduced in MinGW-w64-notices.txt. These notice texts are shipped
with the verified Debian toolchain packages used for the cross-build.

The compiler itself and the Wine compatibility test environment are build/test
tools and are not included in the game package. Visual Studio builds use the
Microsoft runtime instead and omit this MinGW-specific notice directory.

The Studio Web template includes Emscripten-generated glue and LLVM/libc++/musl
runtime code. Associated copyright/license texts are provided in the WebAssembly,
LLVM, musl and Apache notice files. The Debian aggregate notices also describe
optional compiler/test components; those tools and tests are not part of the
compiled Web runtime. These notices do not change the license of game sources.
