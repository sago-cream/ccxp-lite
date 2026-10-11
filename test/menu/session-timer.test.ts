import { afterEach, describe, expect, test, vi } from "vitest";
import { createSidebarShellHtml } from "../helpers/menu-fixtures.js";
import {
  createTestWindow,
  loadModules,
  menuModulePaths,
  requireElement,
  requireValue,
} from "../helpers/module-loader.js";

afterEach(() => vi.restoreAllMocks());

function setup(english = false) {
  const { window } = createTestWindow(createSidebarShellHtml());
  const document = window.document as unknown as Document;
  if (english) {
    document.documentElement.lang = "en";
  }
  let tick: (() => void) | undefined;
  vi.spyOn(window, "setInterval").mockImplementation(((callback: () => void) => {
    tick = callback;
    return 42;
  }) as typeof window.setInterval);
  const clear = vi.spyOn(window, "clearInterval");
  loadModules(window, menuModulePaths);
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Match the legacy frameset host.
  const frame = document.createElement("frame");
  frame.setAttribute("src", "/ccxp/INQUIRE/top.php");
  const header = createTestWindow(
    "<label id='idle'>0.3</label>",
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/top.php",
  ).window.document as unknown as Document;
  Object.defineProperty(frame, "contentDocument", { value: header });
  document.body.append(frame);
  const clock = (remaining: number, sampledAt = Date.now()) => {
    header.documentElement.dataset.ccxpLiteSessionClock = JSON.stringify({
      deadline: Date.now() + remaining * 1000,
      sampledAt,
    });
  };
  const overlays = requireValue(window.CCXP_LITE.sidebarOverlays);
  const state = requireValue(window.CCXP_LITE.sidebarState).getSidebarUiState(document);
  const mount = () => {
    overlays.mountSidebarVariantSwitch(document, state, {}, () => undefined);
  };
  const timer = () =>
    requireElement(document.querySelector<HTMLElement>(".ccxp-lite-session-timer"));
  const warning = () =>
    requireElement(document.querySelector<HTMLElement>(".ccxp-lite-session-warning"));
  const toggle = () =>
    requireElement(document.querySelector<HTMLButtonElement>(".ccxp-lite-session-timer-toggle"));
  return {
    window,
    document,
    header,
    clock,
    mount,
    timer,
    warning,
    toggle,
    clear,
    tick: () => {
      requireValue(tick)();
    },
  };
}

describe("legacy session countdown", () => {
  test("defaults hidden, persists visibility and follows the server clock across remounts", () => {
    const ui = setup();
    ui.clock(901);
    ui.mount();
    expect(ui.timer().hidden).toBe(true);
    expect(ui.timer().textContent).toBe("15:01");
    expect(ui.warning().hidden).toBe(true);
    expect(ui.toggle().textContent).toBe("\u986F\u793A\u767B\u51FA\u5012\u6578");
    const icon = ui.toggle().querySelector("svg");
    expect(icon).not.toBeNull();
    ui.toggle().click();
    expect(ui.toggle().querySelector("svg")).toBe(icon);
    expect(ui.timer().hidden).toBe(false);
    expect(ui.window.localStorage.getItem("ccxp-lite-show-session-timer")).toBe("true");
    ui.clock(900);
    ui.tick();
    expect(ui.timer().textContent).toBe("15:00");
    ui.mount();
    expect(ui.clear).toHaveBeenCalledWith(42);
    expect(ui.toggle().textContent).toBe("\u96B1\u85CF\u767B\u51FA\u5012\u6578");
    expect(ui.timer().hidden).toBe(false);
    ui.toggle().click();
    expect(ui.timer().hidden).toBe(true);
    expect(ui.toggle().textContent).toBe("\u986F\u793A\u767B\u51FA\u5012\u6578");
  });

  test("warns at five minutes while hidden, dismisses once per idle period, and rearms on activity", () => {
    const ui = setup();
    ui.clock(301);
    ui.mount();
    expect(ui.warning().hidden).toBe(true);
    ui.clock(300);
    ui.tick();
    expect(ui.timer().hidden).toBe(true);
    expect(ui.warning().hidden).toBe(false);
    expect(ui.warning().textContent).toContain(
      "5\u5206\u9418\u5F8C\u5C07\u56E0\u9592\u7F6E\u767B\u51FA",
    );
    requireElement(
      ui.document.querySelector<HTMLButtonElement>(".ccxp-lite-session-warning-dismiss"),
    ).click();
    expect(ui.warning().hidden).toBe(true);
    ui.mount();
    expect(ui.warning().hidden).toBe(true);
    ui.clock(1800);
    ui.tick();
    ui.clock(299);
    ui.tick();
    expect(ui.warning().hidden).toBe(false);
    ui.clock(-2);
    ui.tick();
    expect(ui.timer().textContent).toBe("00:00");
    expect(ui.warning().hidden).toBe(true);
  });

  test("hides unknown or stale clocks and supports English", () => {
    const ui = setup(true);
    ui.mount();
    expect(ui.toggle().textContent).toBe("Show session timer");
    ui.toggle().click();
    expect(ui.toggle().textContent).toBe("Hide session timer");
    expect(ui.timer().hidden).toBe(true);
    expect(ui.warning().hidden).toBe(true);
    ui.clock(240);
    ui.tick();
    expect(ui.warning().textContent).toContain("Logout in 5 min due to inactivity");
    ui.clock(240, Date.now() - 16_000);
    ui.tick();
    expect(ui.warning().hidden).toBe(true);
    ui.header.documentElement.dataset.ccxpLiteSessionClock = "invalid";
    ui.tick();
    expect(ui.timer().hidden).toBe(true);
  });
});
