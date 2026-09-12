import { TestEvent } from "../helpers/dom-event.js";
import { expect, test, vi } from "vitest";
import { createTestWindow, loadModules, requireElement } from "../helpers/module-loader.js";

test("allows another attempt after host validation rejects a submission", () => {
  const { window } = createTestWindow(
    '<form id="insForm" accept-charset="big5"></form>',
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/1/14D/PE14D1.php",
  );
  const doc = window.document as unknown as Document;
  const original = vi.fn(() => false);
  const scope = window as unknown as {
    toSubmit: (form: HTMLFormElement, action: string) => unknown;
  };
  scope.toSubmit = original;
  loadModules(window, ["src/work-log/page.ts"]);
  const form = requireElement(doc.querySelector<HTMLFormElement>("form"));
  scope.toSubmit(form, "ins");
  scope.toSubmit(form, "ins");
  expect(original).toHaveBeenCalledTimes(2);
  expect(form.getAttribute("accept-charset")).toBe("big5");
  expect(window.sessionStorage.getItem("ccxp-lite-pe14d-submit-state")).toBeNull();
  window.close();
});

test("ignores the transport's initial blank load and prevents duplicate submissions", () => {
  const { window } = createTestWindow(
    '<form id="insForm" accept-charset="big5"></form>',
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/1/14D/PE14D1.php",
  );
  const doc = window.document as unknown as Document;
  const original = vi.fn(() => true);
  const scope = window as unknown as {
    toSubmit: (form: HTMLFormElement, action: string) => unknown;
  };
  scope.toSubmit = original;
  loadModules(window, ["src/work-log/page.ts"]);
  const form = requireElement(doc.querySelector<HTMLFormElement>("form"));
  scope.toSubmit(form, "ins");
  const frame = requireElement(doc.querySelector<HTMLIFrameElement>("iframe"));
  frame.dispatchEvent(new TestEvent("load"));
  expect(doc.querySelector("form")).toBe(form);
  scope.toSubmit(form, "ins");
  expect(original).toHaveBeenCalledTimes(1);
  window.close();
});
