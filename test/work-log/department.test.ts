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
    expect(select.hidden).toBe(true);
    expect(input.value).toContain("EM05");
    const suggestions = requireElement(
      doc.querySelector<HTMLElement>(`[id="${input.getAttribute("aria-controls")}"]`),
    );
    expect(input.hasAttribute("list")).toBe(false);
    expect(suggestions.hidden).toBe(true);
    input.focus();
    expect(suggestions.hidden).toBe(false);
    expect(suggestions.querySelectorAll('[role="option"]')).toHaveLength(2);
    date.value = "2026-09-09";
    input.value = "college";
    input.dispatchEvent(new TestEvent("input", { bubbles: true }));
    expect(suggestions.querySelectorAll('[role="option"]')).toHaveLength(1);
    expect(select.value).toBe("EM05");
    const enter = new window.KeyboardEvent("keydown", { key: "Enter", cancelable: true });
    input.dispatchEvent(enter as unknown as Event);
    expect(enter.defaultPrevented).toBe(true);
    expect(select.value).toBe("EU0A");
    expect(input.value).toContain("EU0A");
    expect(suggestions.hidden).toBe(true);
    expect(date.value).toBe("2026-09-09");
    input.value = "not a unit";
    input.dispatchEvent(new TestEvent("input", { bubbles: true }));
    expect(suggestions.querySelector('[role="status"]')).not.toBeNull();
    input.dispatchEvent(new TestEvent("blur"));
    expect(suggestions.hidden).toBe(true);
    expect(input.value).toContain("EU0A");
    input.value = "";
    input.dispatchEvent(new TestEvent("input", { bubbles: true }));
    expect(select.value).toBe("");
    expect(suggestions.querySelectorAll('[role="option"]')).toHaveLength(2);
    requireElement(suggestions.querySelector<HTMLElement>('[role="option"]')).click();
    expect(select.value).toBe("EM05");
    expect(suggestions.hidden).toBe(true);
    requireElement(input.form).reset();
    await Promise.resolve();
    expect(input.value).toContain("EM05");
    expect(select.value).toBe("EM05");
    await window.happyDOM.close();
  },
);
