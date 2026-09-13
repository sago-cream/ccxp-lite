import { TestEvent } from "../helpers/dom-event.js";
import { expect, test } from "vitest";
import { createTestWindow, loadModules, requireValue } from "../helpers/module-loader.js";

test("switches labels without changing form values and reapplies after a body replacement", async () => {
  const { window } = createTestWindow(
    '<div id="noticeDiv"><div id="noticeDiv1">Old trigger</div><div id="noticeDiv2" style="display:none">Update details</div></div><div id="divTitle"><span>\u6A19\u984C</span><span>National Tsing Hua University</span></div><form><label>\u65E5\u671F<br><span class="engContent">Working date</span></label><select name="department"><option value="EJ03">EJ03 - \u4E2D\u6587 / Department</option></select><input name="note" value="\u4E2D\u6587\u8CC7\u6599"><input type="submit" value="\u65B0\u589E(Add)"></form>',
  );
  const doc = window.document as unknown as Document;
  doc.body.insertAdjacentHTML(
    "beforeend",
    '<a href="20141023_Manual.pdf">Manual</a><div><a href="https://goo.gl/example">Slides</a></div><div id="divContact">\u64CD\u4F5C\u554F\u984C\u8ACB\u5148\u6D3D\u5DE5\u4F5C\u55AE\u4F4D\u5F8C\u6D3D\u4EBA\u4E8B\u5BA4</div>',
  );
  loadModules(window, [".build/design/ui.js", "src/work-log/locale.ts"]);
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
  const toggle = requireValue(doc.querySelector<HTMLInputElement>('[role="switch"]') ?? undefined);
  expect(toggle.getAttribute("aria-checked")).toBe("false");
  expect(requireValue(doc.querySelector("form label") ?? undefined).textContent).toBe(
    "\u65E5\u671F",
  );
  const noticeButton = requireValue(
    doc.querySelector<HTMLButtonElement>(".ccxp-lite-work-log-notice > button") ?? undefined,
  );
  const notice = requireValue(
    doc.querySelector<HTMLElement>(
      ".ccxp-lite-work-log-notice > .ccxp-lite-account-guide-info-popup",
    ) ?? undefined,
  );
  expect(doc.querySelector("#noticeDiv")).toBeNull();
  const nav = requireValue(doc.querySelector("#ccxp-lite-work-log-nav") ?? undefined);
  expect(nav.firstElementChild?.tagName).toBe("H1");
  expect(nav.children.item(1)?.contains(noticeButton)).toBe(true);
  expect(nav.lastElementChild?.contains(toggle)).toBe(true);
  expect(notice.querySelectorAll("a")).toHaveLength(2);
  expect(notice.querySelector("#divContact")).not.toBeNull();
  expect(notice.querySelector("details #noticeDiv2")).not.toBeNull();
  expect(noticeButton.getAttribute("aria-label")).toBe("\u64CD\u4F5C\u8AAA\u660E");
  expect(notice.hidden).toBe(true);
  noticeButton.click();
  expect(notice.hidden).toBe(false);
  noticeButton.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }) as unknown as Event,
  );
  expect(notice.hidden).toBe(true);
  noticeButton.click();
  doc.body.click();
  expect(notice.hidden).toBe(true);
  toggle.click();
  expect(requireValue(doc.querySelector("form label") ?? undefined).textContent).toBe(
    "Working date",
  );
  expect(noticeButton.getAttribute("aria-label")).toBe("Instructions");
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
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
  requireValue(doc.querySelector<HTMLInputElement>('[role="switch"]') ?? undefined).click();
  const button = requireValue(
    doc.querySelector<HTMLInputElement>('[name="S_SUBMIT"]') ?? undefined,
  );
  let submittedValue = "";
  button.addEventListener("click", () => {
    submittedValue = button.value;
    first.dispatchEvent(new TestEvent("pagehide"));
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
  nextDoc.dispatchEvent(new TestEvent("DOMContentLoaded"));
  expect(nextDoc.documentElement.dataset.ccxpLiteWorkLogSection).toBe("search");
  expect(nextDoc.documentElement.dataset.ccxpLiteWorkLogLanguage).toBe("en");
  expect(nextDoc.querySelector("#listForm")?.textContent).toBe("Search resultsReturned record");
  expect(nextDoc.querySelector<HTMLElement>("#listForm")?.hidden).toBe(false);
  expect(nextDoc.querySelector("#queTask #listForm")).not.toBeNull();
  expect(nextDoc.querySelectorAll("#ccxp-lite-work-log-sections input")).toHaveLength(2);
  await first.happyDOM.close();
  await second.happyDOM.close();
});

test("labels both working-department controls in each language", async () => {
  const { window } = createTestWindow(
    '<div id="divTitle">Title</div><div id="insTask"><form><table><tr><th>\u5DE5\u4F5C\u55AE\u4F4D</th><td><input type="text" name="KI_SRV_ID"><select name="I_SRV_ID"><option>EJ03</option></select></td></tr></table></form></div><div id="queTask"><form id="queForm"><table><tr><th>\u5DE5\u4F5C\u55AE\u4F4D</th><td><input type="text" name="KQ_SRV_ID"><select name="Q_SRV_ID"><option>\uFF0D\u8ACB\u9078\u64C7</option></select></td></tr></table></form></div>',
  );
  const doc = window.document as unknown as Document;
  loadModules(window, ["src/work-log/locale.ts"]);
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
  const cells = doc.querySelectorAll<HTMLElement>(".ccxp-lite-work-log-department-controls");
  expect(cells).toHaveLength(2);
  for (const cell of cells) {
    expect(cell.querySelectorAll("label")).toHaveLength(0);
    expect(cell.querySelector("input")?.getAttribute("aria-labelledby")).toBe(
      cell.closest("tr")?.querySelector("th")?.id,
    );
    expect(cell.querySelector("select")?.getAttribute("aria-label")).toBe(
      "\u9078\u64C7\u55AE\u4F4D",
    );
  }
  requireValue(doc.querySelector<HTMLInputElement>('[role="switch"]') ?? undefined).click();
  for (const cell of cells) {
    expect(cell.querySelectorAll("label")).toHaveLength(0);
    expect(cell.querySelector("select")?.getAttribute("aria-label")).toBe("Choose a unit");
  }
  await window.happyDOM.close();
});

test("maps approval checkboxes to the native search field", async () => {
  const { window } = createTestWindow(
    '<div id="divTitle">Title</div><div id="insTask"></div><div id="queTask"><form id="queForm"><table><tr><th>\u662F\u5426\u5BE9\u6838</th><td><select name="Q_PASS_MARK"><option value="ALL" selected>\u4E0D\u5206\u662F\u5426\u5BE9\u6838\u5168\u90E8</option><option value="Y">\u662F</option><option value="N">\u5426</option></select></td></tr></table></form></div>',
  );
  const doc = window.document as unknown as Document;
  loadModules(window, ["src/work-log/locale.ts"]);
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
  const native = requireValue(
    doc.querySelector<HTMLSelectElement>('select[name="Q_PASS_MARK"]') ?? undefined,
  );
  const approved = requireValue(
    doc.querySelector<HTMLInputElement>('[data-ccxp-lite-approval-kind="approved"]') ?? undefined,
  );
  const unapproved = requireValue(
    doc.querySelector<HTMLInputElement>('[data-ccxp-lite-approval-kind="unapproved"]') ?? undefined,
  );
  expect(approved.checked).toBe(true);
  expect(unapproved.checked).toBe(true);
  expect(native.value).toBe("ALL");
  approved.click();
  expect(native.value).toBe("N");
  approved.click();
  expect(native.value).toBe("ALL");
  unapproved.click();
  expect(native.value).toBe("Y");
  approved.click();
  expect(approved.checked).toBe(true);
  expect(native.value).toBe("Y");
  const toggle = requireValue(doc.querySelector<HTMLInputElement>('[role="switch"]') ?? undefined);
  toggle.click();
  expect(doc.querySelector(".ccxp-lite-work-log-approval-heading")?.textContent).toBe(
    "Filter by approval status",
  );
  expect(doc.querySelector(".ccxp-lite-work-log-approval-filter")?.textContent).toBe(
    "ApprovedNot approved",
  );
  await window.happyDOM.close();
});

test("translates native date control names", async () => {
  const { window } = createTestWindow(
    '<div id="divTitle">Title</div><div id="insTask"><input class="ccxp-lite-native-date" data-ccxp-lite-date-label-zh="\u5DE5\u4F5C\u65E5\u671F" data-ccxp-lite-date-label-en="Working date"></div><div id="queTask"></div>',
  );
  const doc = window.document as unknown as Document;
  loadModules(window, ["src/work-log/locale.ts"]);
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
  const date = requireValue(
    doc.querySelector<HTMLInputElement>(".ccxp-lite-native-date") ?? undefined,
  );
  expect(date.getAttribute("aria-label")).toBe("\u5DE5\u4F5C\u65E5\u671F");
  requireValue(doc.querySelector<HTMLInputElement>('[role="switch"]') ?? undefined).click();
  expect(date.getAttribute("aria-label")).toBe("Working date");
  await window.happyDOM.close();
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
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
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
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
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
  responseDoc.dispatchEvent(new TestEvent("DOMContentLoaded"));
  expect(responseDoc.querySelector("nav")).toBeNull();
  expect(responseDoc.querySelector("script")).toBeNull();
  expect(responseDoc.querySelector("#ccxp-lite-work-log-sections")).toBeNull();
  const visible = createTestWindow(fixture).window;
  const doc = visible.document as unknown as Document;
  loadModules(visible, ["src/work-log/locale.ts"]);
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
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

test("does not mark nested tables inside form cells as presentation form fields", async () => {
  const fixture =
    '<div id="divTitle">Title</div>' +
    '<div id="insTask">' +
    "<form>" +
    "<table>" +
    "<tbody>" +
    '<tr id="trLabSerial">' +
    "<th>\u4EFB\u52D9\u8CC7\u8A0A</th>" +
    "<td>" +
    '<table id="nestedTaskTable">' +
    "<tr><th>\u5E8F\u865F</th><th>\u4EFB\u52D9</th></tr>" +
    "<tr><td>1</td><td>Test</td></tr>" +
    "</table>" +
    "</td>" +
    "</tr>" +
    "</tbody>" +
    "</table>" +
    "</form>" +
    "</div>";
  const { window } = createTestWindow(fixture);
  const doc = window.document as unknown as Document;
  loadModules(window, [".build/design/ui.js", "src/work-log/locale.ts"]);
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
  const formTable = doc.querySelector("#insTask form > table");
  const nestedTable = doc.querySelector("#nestedTaskTable");
  expect(formTable?.classList.contains("ccxp-lite-work-log-form-fields")).toBe(true);
  expect(formTable?.getAttribute("role")).toBe("presentation");
  expect(nestedTable?.classList.contains("ccxp-lite-work-log-form-fields")).toBe(false);
  expect(nestedTable?.getAttribute("role")).toBeNull();
  await window.happyDOM.close();
});

test("translates task information table headers when toggling English", async () => {
  const fixture =
    '<div id="divTitle">Title</div>' +
    '<div id="insTask">' +
    "<form>" +
    "<table>" +
    "<tbody>" +
    '<tr id="trLabSerial">' +
    "<th>\u4EFB\u52D9\u8CC7\u8A0A</th>" +
    "<td>" +
    "<table>" +
    "<thead>" +
    "<tr>" +
    "<th>\u6B64\u7B46\u5DE5\u6642\u8CC7\u6599\u6B78\u5C6C</th>" +
    "<th>\u300C\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u300D\u5E8F\u865F</th>" +
    "<th>\u4EFB\u52D9\u985E\u578B\u5C6C\u6027</th>" +
    "<th>\u5831\u652F\u7CFB\u7D71</th>" +
    "<th>\u8A08\u756B\u7DE8\u865F</th>" +
    "<th>\u4EFB\u52D9\u958B\u59CB\u65E5\u671F</th>" +
    "<th>\u4EFB\u52D9\u7D50\u675F\u65E5\u671F</th>" +
    "<th>\u61C9\u586B\u6642\u6578</th>" +
    "<th>\u672C\u6708\u5DF2\u6838\u6642\u6578</th>" +
    "<th>\u4EFB\u52D9\u5167\u5BB9</th>" +
    "</tr>" +
    "</thead>" +
    "</table>" +
    "</td>" +
    "</tr>" +
    "</tbody>" +
    "</table>" +
    "</form>" +
    "</div>";
  const { window } = createTestWindow(fixture);
  const doc = window.document as unknown as Document;
  loadModules(window, [".build/design/ui.js", "src/work-log/locale.ts"]);
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));

  const toggle = requireValue(doc.querySelector<HTMLInputElement>('[role="switch"]') ?? undefined);
  const getHeaders = () =>
    [...doc.querySelectorAll("#trLabSerial th")].map((th) => th.textContent.trim());

  // Default Chinese.
  expect(getHeaders()).toEqual([
    "\u4EFB\u52D9\u8CC7\u8A0A",
    "\u6B64\u7B46\u5DE5\u6642\u8CC7\u6599\u6B78\u5C6C",
    "\u300C\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u300D\u5E8F\u865F",
    "\u4EFB\u52D9\u985E\u578B\u5C6C\u6027",
    "\u5831\u652F\u7CFB\u7D71",
    "\u8A08\u756B\u7DE8\u865F",
    "\u4EFB\u52D9\u958B\u59CB\u65E5\u671F",
    "\u4EFB\u52D9\u7D50\u675F\u65E5\u671F",
    "\u61C9\u586B\u6642\u6578",
    "\u672C\u6708\u5DF2\u6838\u6642\u6578",
    "\u4EFB\u52D9\u5167\u5BB9",
  ]);

  // Switch to English.
  toggle.click();
  expect(getHeaders()).toEqual([
    "Task information",
    "Task assignment",
    "Assistant Registration System serial number",
    "Task type",
    "Reimbursement system",
    "Project number",
    "Task start date",
    "Task end date",
    "Required hours",
    "Approved hours this month",
    "Task description",
  ]);

  // Switch back to Chinese.
  toggle.click();
  expect(getHeaders()).toEqual([
    "\u4EFB\u52D9\u8CC7\u8A0A",
    "\u6B64\u7B46\u5DE5\u6642\u8CC7\u6599\u6B78\u5C6C",
    "\u300C\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u300D\u5E8F\u865F",
    "\u4EFB\u52D9\u985E\u578B\u5C6C\u6027",
    "\u5831\u652F\u7CFB\u7D71",
    "\u8A08\u756B\u7DE8\u865F",
    "\u4EFB\u52D9\u958B\u59CB\u65E5\u671F",
    "\u4EFB\u52D9\u7D50\u675F\u65E5\u671F",
    "\u61C9\u586B\u6642\u6578",
    "\u672C\u6708\u5DF2\u6838\u6642\u6578",
    "\u4EFB\u52D9\u5167\u5BB9",
  ]);

  await window.happyDOM.close();
});

test("hides unsearched empty results and replaces the dated host caption", async () => {
  const { window } = createTestWindow(
    '<div id="divTitle">Title</div><div id="insTask"></div><div id="queTask"><form id="queForm"></form><form id="listForm"><p class="H12" style="font-size:20px">1150901\u81F31150930\u7684\u67E5\u8A62\u7D50\u679C(Search Result from 1150901 to 1150930)</p><table><tr><th>Date</th></tr><tr><td>0</td></tr></table></form></div>',
  );
  const doc = window.document as unknown as Document;
  loadModules(window, ["src/work-log/locale.ts"]);
  doc.dispatchEvent(new TestEvent("DOMContentLoaded"));
  requireValue(doc.querySelector<HTMLInputElement>('[value="search"]') ?? undefined).click();
  expect(doc.querySelector<HTMLElement>("#listForm")?.hidden).toBe(true);
  expect(doc.querySelector<HTMLElement>("p.H12")?.hidden).toBe(true);
  expect(doc.querySelector("#listForm h2")?.textContent).toBe("\u641C\u5C0B\u7D50\u679C");
  await window.happyDOM.close();
});
