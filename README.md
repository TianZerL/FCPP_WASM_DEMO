# FCPP_WASM_DEMO

[Play](https://tianzerl.github.io/FCPP_WASM_DEMO/) the open source NES platformer game [Nova the Squirrel](https://github.com/NovaSquirrel/NovaTheSquirrel) via [FCPP](https://github.com/TianZerL/FCPP) and wasm!

# Build
```shell
mkdir build && cd build
emcmake cmake .. -DFCPP_EMSCRIPTEN_PRESET=ON -DFCPP_BUILD_TEST_WASM_EMBIND=ON
emmake make
```
