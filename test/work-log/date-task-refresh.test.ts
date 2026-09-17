import { expect, test, vi } from "vitest";
import { createTestWindow, loadModules, requireElement } from "../helpers/module-loader.js";
import { TestEvent } from "../helpers/dom-event.js";

function createWorkLogFixture() {
  const url = "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/1/14D/PE14D1.php";
  const html = `
    <div id="insTask">
      <form id="insForm">
        <table>
          <tr>
            <td>
              <select name="I_TASK_DT_Year">
                <option value="2026" selected>2026</option>
                <option value="2027">2027</option>
              </select>
              <select name="I_TASK_DT_Month">
                <option value="09" selected>09</option>
                <option value="10">10</option>
                <option value="11">11</option>
              </select>
              <select name="I_TASK_DT_Day">
                <option value="10" selected>10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </td>
          </tr>
          <tr id="trLabSerial"><td>Task 1</td></tr>
        </table>
      </form>
    </div>
    <div id="queTask">
      <form id="queForm">
        <table>
          <tr>
            <td>
              <select name="Q_TASK_A_DT_Year"><option value="2026" selected>2026</option></select>
              <select name="Q_TASK_A_DT_Month"><option value="09" selected>09</option><option value="10">10</option></select>
              <select name="Q_TASK_A_DT_Day"><option value="01" selected>01</option></select>
              <select name="Q_TASK_Z_DT_Year"><option value="2026" selected>2026</option></select>
              <select name="Q_TASK_Z_DT_Month"><option value="09" selected>09</option><option value="10">10</option></select>
              <select name="Q_TASK_Z_DT_Day"><option value="30" selected>30</option></select>
            </td>
          </tr>
        </table>
      </form>
    </div>
  `;
  return createTestWindow(html, url);
}

test("native date change dispatches events and triggers getLabInsList when month changes", () => {
  const { window } = createWorkLogFixture();
  const doc = window.document as unknown as Document;
  const form = requireElement(doc.querySelector<HTMLFormElement>("#insForm"));
  const toSubmit = vi.fn(() => undefined);
  const setDay = vi.fn(() => undefined);
  const scope = window as unknown as {
    toSubmit: (target: HTMLFormElement, action: string) => unknown;
    setDay: (formId: string, prefix: string, condition: string) => unknown;
  };
  scope.toSubmit = toSubmit;
  scope.setDay = setDay;

  loadModules(window, [
    ".build/design/tokens.js",
    "src/shared/constants.ts",
    ".build/design/ui.js",
    "src/work-log/batch.ts",
  ]);
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));

  const nativeInput = requireElement(
    form.querySelector<HTMLInputElement>('input[data-ccxp-lite-date-prefix="I_TASK_DT_"]'),
  );
  expect(nativeInput.value).toBe("2026-09-10");

  const yearSelect = requireElement(
    form.querySelector<HTMLSelectElement>('[name="I_TASK_DT_Year"]'),
  );
  const monthSelect = requireElement(
    form.querySelector<HTMLSelectElement>('[name="I_TASK_DT_Month"]'),
  );
  const daySelect = requireElement(form.querySelector<HTMLSelectElement>('[name="I_TASK_DT_Day"]'));

  const monthChange = vi.fn();
  const dayChange = vi.fn();
  const dayBlur = vi.fn();
  monthSelect.addEventListener("change", () => {
    monthChange(undefined);
  });
  daySelect.addEventListener("change", () => {
    dayChange(undefined);
  });
  daySelect.addEventListener("blur", () => {
    dayBlur(undefined);
  });

  // Switch to next month: 2026-10-15.
  nativeInput.value = "2026-10-15";
  nativeInput.dispatchEvent(new TestEvent("change", { bubbles: true }));

  expect(yearSelect.value).toBe("2026");
  expect(monthSelect.value).toBe("10");
  expect(daySelect.value).toBe("15");
  expect(setDay).toHaveBeenCalledWith("insForm", "I_TASK_DT_", "onblur");
  expect(monthChange).toHaveBeenCalled();
  expect(dayChange).toHaveBeenCalled();
  expect(dayBlur).toHaveBeenCalled();
  expect(toSubmit).toHaveBeenCalledTimes(1);
  expect(toSubmit).toHaveBeenCalledWith(form, "getLabInsList");

  // Changing day within the same month (2026-10-20) should not re-trigger task refresh.
  toSubmit.mockClear();
  nativeInput.value = "2026-10-20";
  nativeInput.dispatchEvent(new TestEvent("change", { bubbles: true }));

  expect(daySelect.value).toBe("20");
  expect(toSubmit).not.toHaveBeenCalled();

  window.close();
});

test("search form date change does not trigger getLabInsList", () => {
  const { window } = createWorkLogFixture();
  const doc = window.document as unknown as Document;
  const queForm = requireElement(doc.querySelector<HTMLFormElement>("#queForm"));
  const toSubmit = vi.fn(() => undefined);
  const scope = window as unknown as {
    toSubmit: (target: HTMLFormElement, action: string) => unknown;
  };
  scope.toSubmit = toSubmit;

  loadModules(window, [
    ".build/design/tokens.js",
    "src/shared/constants.ts",
    ".build/design/ui.js",
    "src/work-log/batch.ts",
  ]);
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));

  const searchDate = requireElement(
    queForm.querySelector<HTMLInputElement>('input[data-ccxp-lite-date-prefix="Q_TASK_A_DT_"]'),
  );
  searchDate.value = "2026-10-01";
  searchDate.dispatchEvent(new TestEvent("change", { bubbles: true }));

  expect(toSubmit).not.toHaveBeenCalled();

  window.close();
});
