import { afterEach, expect, test, vi } from "vitest";
import { TestEvent } from "../helpers/dom-event.js";
import { createTestWindow, loadModules, requireValue } from "../helpers/module-loader.js";

afterEach(() => vi.restoreAllMocks());

test("publishes the legacy server clock, accepts numeric idle strings, and cleans up on pagehide", () => {
  const { window } = createTestWindow("<label id='idle'>25.0</label>");
  const document = window.document as unknown as Document;
  Reflect.set(window, "maxlifetime", 1800);
  Reflect.set(window, "idle", "1500");
  Reflect.set(window, "start_time", 120_000);
  let publish: (() => void) | undefined;
  vi.spyOn(window, "setInterval").mockImplementation(((callback: () => void) => {
    publish = callback;
    return 42;
  }) as typeof window.setInterval);
  const clear = vi.spyOn(window, "clearInterval");
  loadModules(window, ["src/menu/session-clock.ts"]);
  const read = () =>
    JSON.parse(document.documentElement.dataset.ccxpLiteSessionClock ?? "null") as {
      deadline: number;
    } | null;
  expect(read()?.deadline).toBe(420_000);
  Reflect.set(window, "idle", 0);
  Reflect.set(window, "start_time", 130_000);
  requireValue(publish)();
  expect(read()?.deadline).toBe(1_930_000);
  Reflect.set(window, "idle", "invalid");
  requireValue(publish)();
  expect(read()).toBeNull();
  Reflect.set(window, "idle", 0);
  requireValue(publish)();
  window.dispatchEvent(new TestEvent("pagehide"));
  expect(clear).toHaveBeenCalledWith(42);
  expect(read()).toBeNull();
  window.dispatchEvent(new TestEvent("pageshow"));
  expect(read()?.deadline).toBe(1_930_000);
});
