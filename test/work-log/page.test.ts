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

test.each(["\u67E5\u8A62", "Search"])(
  "search posts canonical action with the selected filters (%s)",
  (label) => {
    const { window } = createTestWindow(
      `<form id="queForm" method="post" accept-charset="big5">
      <input name="Q_TASK_A_DT_Day" value="01">
      <input name="Q_TASK_Z_DT_Day" value="30">
      <input name="Q_PASS_MARK" value="N">
      <input type="submit" name="S_SUBMIT" value="${label}">
    </form>`,
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/1/14D/PE14D1.php",
    );
    const doc = window.document as unknown as Document;
    const form = requireElement(doc.querySelector<HTMLFormElement>("form"));
    const nativeSubmit = vi.fn(() => {
      const posted = new window.FormData(form);
      expect(posted.getAll("S_SUBMIT")).toEqual(["\u67E5\u8A62(Search)"]);
      expect(posted.get("Q_TASK_A_DT_Day")).toBe("01");
      expect(posted.get("Q_TASK_Z_DT_Day")).toBe("30");
      expect(posted.get("Q_PASS_MARK")).toBe("N");
    });
    form.submit = nativeSubmit;
    const scope = window as unknown as {
      toSubmit: (form: HTMLFormElement, action: string) => unknown;
    };
    scope.toSubmit = (target) => {
      target.submit();
      return true;
    };
    loadModules(window, ["src/work-log/page.ts"]);
    expect(scope.toSubmit(form, "que")).toBe(false);
    expect(nativeSubmit).toHaveBeenCalledTimes(1);
    expect(form.querySelectorAll('[name="S_SUBMIT"]')).toHaveLength(1);
    expect(form.getAttribute("accept-charset")).toBe("big5");
    expect(doc.querySelector("iframe")).toBeNull();
    window.close();
  },
);

test("search validation rejection cleans up the action and allows retry", () => {
  const { window } = createTestWindow(
    '<form id="queForm"><input type="submit" name="S_SUBMIT" value="Search"></form>',
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/1/14D/PE14D1.php",
  );
  const doc = window.document as unknown as Document;
  const form = requireElement(doc.querySelector<HTMLFormElement>("form"));
  const original = vi.fn(() => false);
  const scope = window as unknown as {
    toSubmit: (form: HTMLFormElement, action: string) => unknown;
  };
  scope.toSubmit = original;
  loadModules(window, ["src/work-log/page.ts"]);
  expect(scope.toSubmit(form, "que")).toBe(false);
  expect(scope.toSubmit(form, "que")).toBe(false);
  expect(original).toHaveBeenCalledTimes(2);
  expect(form.querySelectorAll('[name="S_SUBMIT"]')).toHaveLength(1);
  window.close();
});
