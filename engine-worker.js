/* Generic engine host. The selected C++ game module lives in WebAssembly, off the render thread. */
"use strict";
importScripts("./engine.js");
let runtime,
  config,
  last = 0,
  persistencePending = false;
const ready = (async () => {
  config = await (await fetch("./game-project.json")).json();
  runtime = await createEngine({
    locateFile: (path) => new URL(path, self.location.href).href,
  });
  const dataPath = "/projects/" + config.id + "/data";
  runtime.FS.mkdirTree(dataPath);
  runtime.FS.mount(
    runtime.FS.filesystems.IDBFS,
    { autoPersist: true },
    dataPath,
  );
  await new Promise((resolve) =>
    runtime.FS.syncfs(true, (error) => {
      if (error) console.warn("Save restore unavailable", error);
      resolve();
    }),
  );
  try {
    runtime.FS.stat(dataPath + "/content.json");
  } catch (_) {
    const content = await fetch("./content.json");
    if (content.ok)
      runtime.FS.writeFile(dataPath + "/content.json", await content.text());
  }
  if (
    !runtime.ccall(
      "engine_init",
      "number",
      ["string", "string"],
      [config.module, dataPath],
    )
  )
    throw Error("Cannot initialize game module");
  last = performance.now();
  setInterval(() => {
    const now = performance.now();
    runtime.ccall("engine_step", null, ["number"], [(now - last) / 1000]);
    last = now;
  }, 25);
})();
onmessage = async ({ data }) => {
  try {
    await ready;
    const body = runtime.ccall(
      "engine_request",
      "string",
      ["string"],
      [data.request],
    );
    const status = runtime.ccall("engine_status", "number", [], []);
    postMessage({ id: data.id, body, status });
    if (data.request.startsWith("POST /api/content") && !persistencePending) {
      persistencePending = true;
      runtime.FS.syncfs(false, () => {
        persistencePending = false;
      });
    }
  } catch (error) {
    postMessage({
      id: data.id,
      status: 500,
      body: JSON.stringify({ error: error.message }),
    });
  }
};
