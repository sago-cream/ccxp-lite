import { describe, expect, test, vi } from "vitest";
import { createTestWindow, loadModules } from "../helpers/module-loader.js";

function setup() {
  const { window } = createTestWindow(
    "",
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/3/3000/PE30003.php",
  );
  const document = window.document as unknown as Document;
  const columns = [
    { field: "SERIAL_NO", title: "ID" },
    { field: "H_TIME", title: "Times" },
    { field: "H_HOUR", title: "Hours" },
    { field: "H_NT", title: "Hourly", hidden: true },
    { field: "AMT", title: "Monthly" },
  ];
  document.body.innerHTML = `<div id="grid"><div class="k-grid-header"><table><tr>${columns.map((c) => `<th data-field="${c.field}">${c.title}</th>`).join("")}</tr></table></div><div class="k-grid-content"><table><tbody><tr class="k-master-row"><td>42</td><td>0</td><td>20</td><td>private</td><td>4,000</td></tr></tbody></table></div></div>`;
  const element = document.querySelector<HTMLElement>("#grid");
  if (!element) {
    throw new Error("Missing grid fixture");
  }
  let visible = false;
  element.getBoundingClientRect = () => ({ width: visible ? 1000 : 0 }) as DOMRect;
  const handlers = new Map<string, Set<() => void>>();
  const grid = {
    columns,
    hideColumn: vi.fn((column: (typeof columns)[number]) => {
      Object.assign(column, { hidden: true });
    }),
    reorderColumn: vi.fn(),
    resizeColumn: vi.fn(),
    resize: vi.fn(),
    bind: (name: string, fn: () => void) => {
      const set = handlers.get(name) ?? new Set();
      set.add(fn);
      handlers.set(name, set);
    },
    unbind: (name: string, fn: () => void) => {
      handlers.get(name)?.delete(fn);
    },
  };
  const observers: Array<{ callback: () => void; disconnect: ReturnType<typeof vi.fn> }> = [];
  const scope = window as unknown as Record<string, unknown>;
  scope.jQuery = () => ({ data: () => grid });
  scope.ResizeObserver = class {
    disconnect = vi.fn();
    observe = vi.fn();
    constructor(callback: () => void) {
      observers.push({ callback, disconnect: this.disconnect });
    }
  };
  scope.setTimeout = () => 1;
  scope.clearTimeout = vi.fn();
  return {
    window,
    document,
    grid,
    handlers,
    observers,
    load: () => {
      loadModules(window, ["src/staff-history/tables.ts"]);
    },
    show: () => {
      visible = true;
      for (const observer of observers) {
        observer.callback();
      }
    },
  };
}

describe("Staff History table presentation", () => {
  test("waits until visible and groups only host-visible fields without changing values", () => {
    const state = setup();
    state.load();
    expect(state.grid.hideColumn).not.toHaveBeenCalled();
    state.show();
    expect(state.grid.hideColumn).toHaveBeenCalledTimes(3);
    const details = state.document.querySelector("details");
    expect(details?.textContent).toContain("0");
    expect(details?.textContent).toContain("4,000");
    expect(details?.textContent).not.toContain("private");
    expect(state.document.querySelectorAll("td")).toHaveLength(5);
    state.show();
    expect(state.grid.hideColumn).toHaveBeenCalledTimes(3);
  });
  test("retains detail fields after reinjection and redraw without duplicate handlers", () => {
    const state = setup();
    state.load();
    state.show();
    state.load();
    expect(state.observers[0].disconnect).toHaveBeenCalledOnce();
    state.document.querySelector("details")?.remove();
    for (const callback of state.handlers.get("dataBound") ?? []) {
      callback();
    }
    expect(state.document.querySelector("details")?.textContent).toContain("4,000");
    expect(state.document.querySelectorAll("details")).toHaveLength(1);
    expect(state.handlers.get("dataBound")?.size).toBe(1);
    expect(state.grid.hideColumn).toHaveBeenCalledTimes(3);
  });
});
