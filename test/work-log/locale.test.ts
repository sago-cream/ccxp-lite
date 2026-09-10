import { expect, test } from "vitest";
import { createTestWindow, loadModules, requireValue } from "../helpers/module-loader.js";

test("switches labels without changing form values and reapplies after a body replacement", async () => {
  const { window } = createTestWindow(
    '<div id="noticeDiv"><div id="noticeDiv1">Old trigger</div><div id="noticeDiv2" style="display:none">Update details</div></div><div id="divTitle"><span>\u6A19\u984C</span><span>National Tsing Hua University</span></div><form><label>\u65E5\u671F<br><span class="engContent">Working date</span></label><select name="department"><option value="EJ03">EJ03 - \u4E2D\u6587 / Department</option></select><input name="note" value="\u4E2D\u6587\u8CC7\u6599"><input type="submit" value="\u65B0\u589E(Add)"></form>',
  );
  const doc = window.document as unknown as Document;
  loadModules(window, ["src/work-log/locale.ts"]);
  doc.dispatchEvent(new Event("DOMContentLoaded"));
  const toggle = requireValue(doc.querySelector<HTMLInputElement>('[role="switch"]') ?? undefined);
  expect(toggle.getAttribute("aria-checked")).toBe("false");
  expect(requireValue(doc.querySelector("form label") ?? undefined).textContent).toBe(
    "\u65E5\u671F",
  );
  const noticeButton = requireValue(
    doc.querySelector<HTMLButtonElement>(".ccxp-lite-work-log-notice > button") ?? undefined,
  );
  const notice = requireValue(doc.querySelector<HTMLElement>("#noticeDiv2") ?? undefined);
  expect(doc.querySelector("#noticeDiv")).toBeNull();
  expect(notice.hidden).toBe(true);
  noticeButton.click();
  expect(notice.hidden).toBe(false);
  doc.body.click();
  expect(notice.hidden).toBe(true);
  toggle.click();
  expect(requireValue(doc.querySelector("form label") ?? undefined).textContent).toBe(
    "Working date",
  );
  expect(requireValue(doc.querySelector("option") ?? undefined).textContent).toBe(
    "EJ03 - Department",
  );
  expect(requireValue(doc.querySelector("select") ?? undefined).value).toBe("EJ03");
  expect(
    requireValue(doc.querySelector<HTMLInputElement>('[name="note"]') ?? undefined).value,
  ).toBe("\u4E2D\u6587\u8CC7\u6599");
  toggle.click();
  expect(requireValue(doc.querySelector("form label") ?? undefined).textContent).toBe(
    "\u65E5\u671F",
  );
  toggle.click();
  doc.body.innerHTML = '<div id="divTitle">\u6A19\u984C<span class="engContent">Title</span></div>';
  await window.happyDOM.waitUntilComplete();
  expect(
    requireValue(doc.querySelector('[role="switch"]') ?? undefined).getAttribute("aria-checked"),
  ).toBe("true");
  expect(requireValue(doc.querySelector("#divTitle") ?? undefined).textContent).toBe("Title");
  await window.happyDOM.close();
});

test("search reload opens returned records and preserves native submit values", async () => {
  const fixture =
    '<div id="divTitle">Title</div><div id="insTask"></div><div id="queTask"><form id="queForm"><input type="submit" name="S_SUBMIT" value="\u67E5\u8A62(Search)"></form><form id="listForm"><table><tr><td>Returned record</td></tr></table></form></div>';
  const first = createTestWindow(fixture).window;
  const doc = first.document as unknown as Document;
  loadModules(first, ["src/work-log/locale.ts"]);
  doc.dispatchEvent(new Event("DOMContentLoaded"));
  requireValue(doc.querySelector<HTMLInputElement>('[role="switch"]') ?? undefined).click();
  const button = requireValue(
    doc.querySelector<HTMLInputElement>('[name="S_SUBMIT"]') ?? undefined,
  );
  let submittedValue = "";
  button.addEventListener("click", () => {
    submittedValue = button.value;
    first.dispatchEvent(new Event("pagehide"));
  });
  button.click();
  expect(submittedValue).toBe("\u67E5\u8A62(Search)");
  const second = createTestWindow(fixture).window;
  for (let index = 0; index < first.sessionStorage.length; index++) {
    const key = requireValue(first.sessionStorage.key(index) ?? undefined);
    second.sessionStorage.setItem(key, first.sessionStorage.getItem(key) ?? "");
  }
  const nextDoc = second.document as unknown as Document;
  loadModules(second, ["src/work-log/locale.ts"]);
  nextDoc.dispatchEvent(new Event("DOMContentLoaded"));
  expect(nextDoc.documentElement.dataset.ccxpLiteWorkLogSection).toBe("search");
  expect(nextDoc.documentElement.dataset.ccxpLiteWorkLogLanguage).toBe("en");
  expect(nextDoc.querySelector("#listForm")?.textContent).toBe("Returned record");
  expect(nextDoc.querySelector("#queTask #listForm")).not.toBeNull();
  expect(nextDoc.querySelectorAll("#ccxp-lite-work-log-sections input")).toHaveLength(2);
  await first.happyDOM.close();
  await second.happyDOM.close();
});

test("groups populated records and preserves controls in expandable details", async () => {
  const headers = [
    "Number",
    "\u5DE5\u4F5C\u65E5\u671F",
    "Time",
    "Hours",
    "Serial",
    "Department",
    "Work",
    "Modified",
    "Approved hours",
    "Approved",
    "Approval history",
    "Reason",
    "Rejection history",
    "Edit",
    "Delete",
  ];
  const values = [
    "1",
    "2026/09/10",
    "09:00 - 12:00",
    "3",
    "TASK-123",
    "Sample department",
    "Sample work",
    "2026/09/10 12:30",
    "3",
    "Yes",
    "Sample reviewer 2026/09/11",
    "Sample reason",
    "Sample rejection history",
    '<button type="button" id="edit-record">Edit</button>',
    '<button type="button" id="delete-record">Delete</button>',
  ];
  const fixture = `<div id="divTitle">Title</div><div id="insTask"></div><div id="queTask"><form id="listForm"><table><tr>${headers.map((value) => `<th>${value}</th>`).join("")}</tr><tr>${values.map((value) => `<td>${value}</td>`).join("")}</tr><tr><td colspan="17">Footer</td></tr></table><input type="hidden" name="S_SERIAL" value="123"></form></div>`;
  const { window } = createTestWindow(fixture);
  const doc = window.document as unknown as Document;
  const edit = requireValue(doc.querySelector<HTMLButtonElement>("#edit-record") ?? undefined);
  let edits = 0;
  edit.addEventListener("click", () => {
    edits++;
  });
  loadModules(window, ["src/work-log/locale.ts"]);
  doc.dispatchEvent(new Event("DOMContentLoaded"));
  const table = requireValue(doc.querySelector("table") ?? undefined);
  expect(table.rows[0].cells.length).toBe(5);
  expect(table.rows[1].cells.length).toBe(5);
  expect(table.rows[1].cells[1].textContent).toContain("09:00 - 12:00");
  expect(table.rows[1].cells[2].textContent).toContain("Sample work");
  const detail = requireValue(
    doc.querySelector<HTMLTableRowElement>(".ccxp-lite-record-detail") ?? undefined,
  );
  const toggle = requireValue(
    doc.querySelector<HTMLButtonElement>(".ccxp-lite-record-toggle") ?? undefined,
  );
  expect(detail.hidden).toBe(true);
  expect(detail.textContent).toContain("TASK-123");
  expect(detail.textContent).toContain("Sample reviewer 2026/09/11");
  expect(detail.textContent).toContain("Sample reason");
  toggle.click();
  expect(detail.hidden).toBe(false);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(doc.querySelector("#edit-record")).toBe(edit);
  expect(edit.form?.id).toBe("listForm");
  edit.click();
  expect(edits).toBe(1);
  requireValue(doc.querySelector<HTMLInputElement>('[role="switch"]') ?? undefined).click();
  expect(toggle.textContent).toBe("Details");
  expect(detail.hidden).toBe(false);
  toggle.click();
  expect(detail.hidden).toBe(true);
  await window.happyDOM.waitUntilComplete();
  expect(doc.querySelectorAll(".ccxp-lite-record-detail")).toHaveLength(1);
  expect(table.rows[3].cells[0].colSpan).toBe(5);
  expect(
    requireValue(doc.querySelector<HTMLInputElement>('[name="S_SERIAL"]') ?? undefined).value,
  ).toBe("123");
  await window.happyDOM.close();
});

test("supports results-only pages with merged total cells", async () => {
  const { window } = createTestWindow(
    `<form id="listForm"><table><tr><th>\u5DE5\u4F5C\u65E5\u671F</th>${"<th>Column</th>".repeat(14)}</tr><tr><td colspan="3">\u7D2F\u8A08\u5DE5\u4F5C\u6642\u6578</td><td>6</td><td colspan="4">\u7D2F\u8A08\u6838\u5B9A\u5DE5\u4F5C\u6642\u6578</td><td>0</td><td colspan="6"></td></tr><tr><td colspan="17">Reminder</td></tr></table></form>`,
  );
  const doc = window.document as unknown as Document;
  loadModules(window, ["src/work-log/locale.ts"]);
  doc.dispatchEvent(new Event("DOMContentLoaded"));
  const table = requireValue(doc.querySelector("table") ?? undefined);
  expect(table.rows[0].cells.length).toBe(5);
  expect(table.rows[1].cells[0].colSpan).toBe(5);
  expect(doc.querySelector(".ccxp-lite-record-totals")?.textContent).toContain("6");
  expect(doc.querySelector(".ccxp-lite-record-totals")?.textContent).toContain("0");
  expect(doc.documentElement.dataset.ccxpLiteWorkLogSection).toBe("search");
  expect(doc.querySelector('[role="switch"]')).not.toBeNull();
  await window.happyDOM.close();
});

test("keeps transport responses raw and binds controls after importing them", async () => {
  const fixture =
    '<div id="divTitle">Title</div><div id="insTask"><form><input name="note" value="unchanged"></form></div><div id="queTask"><form id="queForm"></form><form id="listForm"></form></div>';
  const response = createTestWindow(fixture).window;
  response.name = "ccxp-lite-pe14d-transport";
  const responseDoc = response.document as unknown as Document;
  loadModules(response, ["src/work-log/locale.ts", "src/work-log/content.ts"]);
  responseDoc.dispatchEvent(new Event("DOMContentLoaded"));
  expect(responseDoc.querySelector("nav")).toBeNull();
  expect(responseDoc.querySelector("script")).toBeNull();
  expect(responseDoc.querySelector("#ccxp-lite-work-log-sections")).toBeNull();
  const visible = createTestWindow(fixture).window;
  const doc = visible.document as unknown as Document;
  loadModules(visible, ["src/work-log/locale.ts"]);
  doc.dispatchEvent(new Event("DOMContentLoaded"));
  doc.body.replaceWith(doc.importNode(responseDoc.body, true));
  await visible.happyDOM.waitUntilComplete();
  const language = requireValue(
    doc.querySelector<HTMLInputElement>('[role="switch"]') ?? undefined,
  );
  language.click();
  expect(doc.documentElement.dataset.ccxpLiteWorkLogLanguage).toBe("en");
  requireValue(doc.querySelector<HTMLInputElement>('[value="search"]') ?? undefined).click();
  expect(doc.documentElement.dataset.ccxpLiteWorkLogSection).toBe("search");
  expect(
    requireValue(doc.querySelector<HTMLInputElement>('[name="note"]') ?? undefined).value,
  ).toBe("unchanged");
  await visible.happyDOM.close();
  await response.happyDOM.close();
});
