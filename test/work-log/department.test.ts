import { expect, test } from "vitest";
import { createTestWindow, loadModules, requireElement } from "../helpers/module-loader.js";
import { TestEvent } from "../helpers/dom-event.js";

test.each(["I", "Q"])(
  "%s department searches names and codes without submitting or resetting dates",
  async (prefix) => {
    const formId = prefix === "I" ? "insForm" : "queForm";
    const { window } = createTestWindow(`<div id="divTitle">Title</div><div id="insTask">
    <form id="${formId}"><input name="date" value="2026-09-10"><table><tr><td>
    <input type="text" name="K${prefix}_SRV_ID" maxlength="8" onkeyup="this.form.reset()">
    <select name="${prefix}_SRV_ID"><option value="">Please select</option>
    <option value="EM05" selected>EM05 - \u6E05\u83EF\u5B78\u9662\u5B78\u58EB\u73ED / Interdisciplinary Program</option>
    <option value="EU0A">EU0A - \u7AF9\u5E2B\u6559\u80B2\u5B78\u9662 / College of Education</option>
    </select></td></tr></table><input type="submit"></form></div>`);
    const doc = window.document as unknown as Document;
    loadModules(window, [".build/design/ui.js", "src/work-log/locale.ts"]);
    doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
    const input = requireElement(doc.querySelector<HTMLInputElement>(`[name="K${prefix}_SRV_ID"]`));
    const select = requireElement(doc.querySelector<HTMLSelectElement>("select"));
    const date = requireElement(doc.querySelector<HTMLInputElement>('[name="date"]'));
    const originalSize = select.size;
    date.value = "2026-09-09";
    const search = (query: string) => {
      input.value = query;
      input.dispatchEvent(new TestEvent("input", { bubbles: true }));
      return [...select.options].filter((option) => !option.hidden).map((option) => option.value);
    };
    expect(input.hasAttribute("maxlength")).toBe(false);
    expect(input.hasAttribute("onkeyup")).toBe(false);
    expect(search("\u7AF9\u5E2B")).toEqual(["EU0A"]);
    expect(select.size).toBeGreaterThan(1);
    expect(select.value).toBe("EM05");
    expect(search(" eu0 ")).toEqual(["EU0A"]);
    expect(search("college of education")).toEqual(["EU0A"]);
    const selectEnter = new window.KeyboardEvent("keydown", {
      key: "Enter",
      cancelable: true,
      bubbles: true,
    });
    input.dispatchEvent(selectEnter as unknown as Event);
    expect(selectEnter.defaultPrevented).toBe(true);
    expect(select.value).toBe("EU0A");
    select.dispatchEvent(new TestEvent("change", { bubbles: true }));
    const enter = new window.KeyboardEvent("keydown", {
      key: "Enter",
      cancelable: true,
      bubbles: true,
    });
    input.dispatchEvent(enter as unknown as Event);
    expect(enter.defaultPrevented).toBe(true);
    expect(date.value).toBe("2026-09-09");
    expect(search("no matching unit")).toEqual([]);
    expect(doc.querySelector('[role="status"]')?.textContent).toContain("0");
    expect(search("")).toEqual(["", "EM05", "EU0A"]);
    expect(select.value).toBe("EU0A");
    expect(select.size).toBe(originalSize);
    const composingEnter = new window.KeyboardEvent("keydown", {
      key: "Enter",
      isComposing: true,
      cancelable: true,
    });
    input.dispatchEvent(composingEnter as unknown as Event);
    expect(composingEnter.defaultPrevented).toBe(false);
    search("\u7AF9\u5E2B");
    requireElement(doc.querySelector<HTMLInputElement>('[role="switch"]')).click();
    expect(doc.querySelector('[role="status"]')?.textContent).toBe("1 matching units");
    requireElement(input.form).reset();
    await Promise.resolve();
    expect(input.value).toBe("");
    expect(select.value).toBe("EM05");
    expect([...select.options].every((option) => !option.hidden)).toBe(true);
    await window.happyDOM.close();
  },
);
