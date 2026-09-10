import fs from "node:fs";
import { chromium } from "playwright";
import ts from "typescript";
import { expect, test } from "vitest";

const source = ts.transpileModule(fs.readFileSync("src/work-log/batch.ts", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.None },
}).outputText;
const endpoint = "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/1/14D/PE14D1.php";

const numbers = (count: number, offset = 0) =>
  Array.from({ length: count }, (_unused, index) => String(index + offset).padStart(2, "0"));

function fixture(fields = new URLSearchParams(), success = false) {
  const select = (name: string, options: readonly string[], initial: string) =>
    `<select name="${name}">${options
      .map(
        (option) =>
          `<option value="${option}"${
            (fields.get(name) ?? initial) === option ? " selected" : ""
          }>${option}</option>`,
      )
      .join("")}</select>`;
  const date = `115${fields.get("I_TASK_DT_Month") ?? "09"}${fields.get("I_TASK_DT_Day") ?? "10"}`;
  const time = (prefix: string) =>
    `${fields.get(`I_TASK_${prefix}_TM_Hour`) ?? "08"}:${
      fields.get(`I_TASK_${prefix}_TM_Minute`) ?? "00"
    }`;
  const cells = [
    "123",
    date,
    `${time("A")}~${time("Z")}`,
    "2",
    "task-1",
    "Department",
    "__NOTE__",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
  return `<!doctype html><html><head><meta charset="big5"></head><body>
<form id="insForm" name="insForm" method="post" accept-charset="big5" action="PE14D1.php">
<input name="ACIXSTORE" value="test-session" type="hidden">
${select("I_TASK_DT_Year", ["2026", "2027"], "2026")}
${select("I_TASK_DT_Month", numbers(12, 1), "09")}
${select("I_TASK_DT_Day", numbers(31, 1), "10")}
${select("I_TASK_A_TM_Hour", numbers(24), "08")}
${select("I_TASK_A_TM_Minute", numbers(60), "00")}
${select("I_TASK_Z_TM_Hour", numbers(25), "10")}
${select("I_TASK_Z_TM_Minute", numbers(60), "00")}
<input type="radio" name="I_LAB_SERIAL" value="task-1" checked>
<input type="radio" name="I_LAB_SERIAL" value="task-2">
${select("I_SRV_ID", ["DEPT"], "DEPT")}
<input name="I_TASK_NOTE" value="__NOTE__" maxlength="15">
<input type="submit" name="S_SUBMIT" value="Add">
</form>
<form id="listForm"><table>${success ? `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>` : ""}</table></form>
<script>
window.toSubmit = function(form, action) {
  if (action === 'getLabInsList') form.S_SUBMIT.value = 'Loading Data';
  if (window.rejectInsert && action === 'ins') { alert('Rejected by host'); return false; }
  form.submit(); return true;
};
${success ? "alert('Add successfully!');" : ""}
</script></body></html>`;
}

test("previews weekly dates, deduplicates extras, rejects overlaps and invalidates changed forms", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(4000);
    await page.route("**/*", async (route) => {
      await route.fulfill({ contentType: "text/html", body: fixture() });
    });
    await page.goto(endpoint);
    await page.addScriptTag({ content: source });
    await page.locator("#ccxp-lite-batch summary").click();
    const dates = page.locator('#ccxp-lite-batch input[type="date"]');
    await dates.nth(0).fill("2026-09-07");
    await dates.nth(1).fill("2026-09-13");
    await page.locator('#ccxp-lite-batch input[type="text"]').fill("2026-09-07,2026-09-12");
    await page
      .getByRole("button", { name: "\u9810\u89BD\u767B\u9304\u6E05\u55AE", exact: true })
      .click();
    expect(await page.locator(".ccxp-lite-batch-preview input").count()).toBe(6);
    expect(await page.locator(".ccxp-lite-batch-preview").textContent()).toContain("2026-09-12");
    await page
      .getByRole("button", { name: "\uFF0B \u589E\u52A0\u6642\u6BB5", exact: true })
      .click();
    const times = page.locator(".ccxp-lite-batch-slot input");
    await times.nth(2).fill("09:00");
    await page
      .getByRole("button", { name: "\u9810\u89BD\u767B\u9304\u6E05\u55AE", exact: true })
      .click();
    expect(await page.getByRole("status").textContent()).toContain("\u4E0D\u53EF\u91CD\u758A");
    await times.nth(2).fill("13:00");
    await page
      .getByRole("button", { name: "\u9810\u89BD\u767B\u9304\u6E05\u55AE", exact: true })
      .click();
    expect(await page.locator(".ccxp-lite-batch-preview input").count()).toBe(12);
    await page.locator('[name="I_TASK_NOTE"]').fill("Changed");
    expect(
      await page
        .getByRole("button", { name: "\u958B\u59CB\u6279\u6B21\u767B\u9304", exact: true })
        .isDisabled(),
    ).toBe(true);
  } finally {
    await browser.close();
  }
}, 20_000);

test("submits sequential native Big5 forms with fresh date tasks and guards completed entries", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(4000);
    const posts: string[] = [];
    await page.route("**/*", async (route) => {
      const body = route.request().postData() ?? "";
      if (body !== "") {
        posts.push(body);
      }
      const fields = new URLSearchParams(body);
      const success = fields.get("S_SUBMIT") !== "Loading Data" && body !== "";
      // Native Big5 response: NOTE is the two-character word represented by these bytes.
      const html = fixture(fields, success).replaceAll("__NOTE__", "\u00B4\u00FA\u00B8\u00D5");
      await route.fulfill({
        contentType: "text/html; charset=big5",
        body: Buffer.from(html, "latin1"),
      });
    });
    await page.goto(endpoint);
    await page.addScriptTag({ content: source });
    await page.locator("#ccxp-lite-batch summary").click();
    await page.locator('#ccxp-lite-batch input[type="date"]').nth(1).fill("2026-09-11");
    await page
      .getByRole("button", { name: "\u9810\u89BD\u767B\u9304\u6E05\u55AE", exact: true })
      .click();
    await page
      .getByRole("button", { name: "\u958B\u59CB\u6279\u6B21\u767B\u9304", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector('[role="status"]')?.textContent.includes("\u6210\u529F 2 \u7B46"),
      undefined,
      { timeout: 5000 },
    );
    expect(posts).toHaveLength(4);
    expect(posts[0]).toContain("S_SUBMIT=Loading+Data");
    expect(posts[1]).toContain("I_TASK_NOTE=%B4%FA%B8%D5");
    expect(posts[1]).toContain("S_SUBMIT=%B7s%BCW%28Add%29");
    expect(posts[1]).toContain("I_LAB_SERIAL=task-1");
    expect(posts[1]).not.toContain("task-2");
    expect(posts[3]).toContain("I_TASK_DT_Day=11");
    await page
      .getByRole("button", { name: "\u9810\u89BD\u767B\u9304\u6E05\u55AE", exact: true })
      .click();
    expect(
      await page
        .getByRole("button", { name: "\u958B\u59CB\u6279\u6B21\u767B\u9304", exact: true })
        .isDisabled(),
    ).toBe(true);
    expect(await page.locator(".ccxp-lite-batch-preview input:checked").count()).toBe(0);
    expect(posts).toHaveLength(4);
  } finally {
    await browser.close();
  }
}, 20_000);
