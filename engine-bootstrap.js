/* Install before a game's presentation scripts. Normal assets still use the static website. */
"use strict";
window.CrownWeb = true;
(() => {
  const originalFetch = window.fetch.bind(window),
    worker = new Worker("./engine-worker.js"),
    pending = new Map();
  let sequence = 0;
  worker.onmessage = ({ data }) => {
    const task = pending.get(data.id);
    if (task) {
      clearTimeout(task.timeout);
      pending.delete(data.id);
      task.resolve(
        new Response(data.body, {
          status: data.status,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
  };
  worker.onerror = (error) => {
    for (const task of pending.values()) {
      clearTimeout(task.timeout);
      task.reject(Error(error.message || "WebAssembly worker failed"));
    }
    pending.clear();
  };
  window.fetch = (input, options = {}) => {
    const url = new URL(
      typeof input === "string" ? input : input.url,
      location.href,
    );
    if (!url.pathname.startsWith("/api/")) return originalFetch(input, options);
    const method = options.method || "GET",
      headers = new Headers(options.headers || {}),
      body = options.body || "";
    let request =
      method +
      " " +
      url.pathname +
      url.search +
      " HTTP/1.1\r\nHost: localhost:8080\r\n";
    headers.forEach((value, key) => (request += key + ": " + value + "\r\n"));
    request +=
      "Content-Length: " +
      new TextEncoder().encode(body).length +
      "\r\n\r\n" +
      body;
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(Error("Browser simulation timed out"));
      }, 30000);
      pending.set(id, { resolve, reject, timeout });
      worker.postMessage({ id, request });
    });
  };
})();
