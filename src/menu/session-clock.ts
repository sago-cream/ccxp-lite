(function exposeLegacySessionClock() {
  // Runs in the legacy header's page world; only publishes its existing clock.
  const host = globalThis as typeof globalThis & {
    maxlifetime?: number;
    idle?: number | string;
    start_time?: number;
  };
  let interval: number | undefined;
  const publish = () => {
    const { maxlifetime } = host;
    const startTime = host.start_time;
    const idle = Number(host.idle);
    if (
      !Number.isFinite(maxlifetime) ||
      !Number.isFinite(idle) ||
      !Number.isFinite(startTime) ||
      maxlifetime === undefined ||
      host.idle === undefined ||
      startTime === undefined ||
      maxlifetime <= 0 ||
      idle < 0 ||
      (document.querySelector("#idle")?.textContent.trim() ?? "") === ""
    ) {
      delete document.documentElement.dataset.ccxpLiteSessionClock;
      return;
    }
    document.documentElement.dataset.ccxpLiteSessionClock = JSON.stringify({
      deadline: startTime + (maxlifetime - idle) * 1000,
      sampledAt: Date.now(),
    });
  };
  const start = () => {
    if (interval !== undefined) {
      globalThis.clearInterval(interval);
    }
    publish();
    interval = globalThis.setInterval(publish, 1000, undefined);
  };
  globalThis.addEventListener("pagehide", () => {
    globalThis.clearInterval(interval);
    interval = undefined;
    delete document.documentElement.dataset.ccxpLiteSessionClock;
  });
  globalThis.addEventListener("pageshow", start);
  start();
})();
