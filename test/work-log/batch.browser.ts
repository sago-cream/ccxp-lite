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
<table><tbody><tr><th>Work date</th><td>${select("I_TASK_DT_Year", ["2026", "2027"], "2026")}
${select("I_TASK_DT_Month", numbers(12, 1), "09")}
${select("I_TASK_DT_Day", numbers(31, 1), "10")}
</td></tr><tr><th>Work time</th><td>
${select("I_TASK_A_TM_Hour", numbers(24), "08")}
${select("I_TASK_A_TM_Minute", numbers(60), "00")}
${select("I_TASK_Z_TM_Hour", numbers(25), "10")}
${select("I_TASK_Z_TM_Minute", numbers(60), "00")}
</td></tr></tbody></table>
<input type="radio" name="I_LAB_SERIAL" value="task-1" checked>
<input type="radio" name="I_LAB_SERIAL" value="task-2">
${select("I_SRV_ID", ["DEPT"], "DEPT")}
<input name="I_TASK_NOTE" value="__NOTE__" maxlength="15">
<input type="submit" name="S_SUBMIT" value="Add" onclick="toSubmit(this.form, 'ins'); return false">
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

test("switches date modes without changing native values and validates the shared time", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const posts: string[] = [];
    await page.route("**/*", async (route) => {
      const body = route.request().postData();
      if (body !== null) {
        posts.push(body);
      }
      await route.fulfill({ contentType: "text/html", body: fixture() });
    });
    await page.goto(endpoint);
    await page.addScriptTag({ content: source });
    await page.addStyleTag({ path: "src/work-log/content.css" });
    expect(await page.locator(".ccxp-lite-single-date").isVisible()).toBe(true);
    expect(await page.locator("#ccxp-lite-batch fieldset").isVisible()).toBe(false);
    await page.getByRole("button", { name: "\u591A\u65E5", exact: true }).click();
    expect(await page.locator(".ccxp-lite-single-date").isVisible()).toBe(true);
    expect(await page.locator('[name="I_TASK_DT_Year"]').count()).toBe(1);
    expect(await page.locator("#ccxp-lite-weekday-row").isVisible()).toBe(true);
    expect(await page.locator("#ccxp-lite-weekday-label").textContent()).toBe(
      "\u50C5\u767B\u9304\u4EE5\u4E0B\u661F\u671F",
    );
    await page.getByLabel("\u7D50\u675F\u65E5\u671F\u6708", { exact: true }).selectOption("01");
    await page.getByLabel("\u7D50\u675F\u65E5\u671F\u65E5", { exact: true }).selectOption("31");
    await page.getByLabel("\u7D50\u675F\u65E5\u671F\u6708", { exact: true }).selectOption("02");
    expect(
      await page.getByLabel("\u7D50\u675F\u65E5\u671F\u65E5", { exact: true }).inputValue(),
    ).toBe("28");
    await page.getByLabel("\u7D50\u675F\u65E5\u671F\u6708", { exact: true }).selectOption("09");

    await page.locator('[name="I_TASK_Z_TM_Hour"]').selectOption("07");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    expect(await page.getByRole("status").textContent()).toContain(
      "\u7D50\u675F\u6642\u9593\u5FC5\u9808\u665A\u65BC",
    );
    expect(posts).toHaveLength(0);
    await page.getByRole("button", { name: "\u55AE\u65E5", exact: true }).click();
    expect(await page.locator('[name="I_TASK_DT_Day"]').inputValue()).toBe("10");
    expect(await page.locator('[name="I_TASK_Z_TM_Hour"]').inputValue()).toBe("07");
    expect(await page.locator(".ccxp-lite-single-date").isVisible()).toBe(true);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.waitForLoadState();
    expect(posts).toHaveLength(1);
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
    await page.getByRole("button", { name: "\u591A\u65E5", exact: true }).click();
    await page.getByLabel("\u7D50\u675F\u65E5\u671F\u65E5", { exact: true }).selectOption("11");
    await page.getByRole("button", { name: "Add", exact: true }).click();
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
    await page.getByRole("button", { name: "Add", exact: true }).click();
    expect(await page.getByRole("status").textContent()).toContain(
      "\u5DF2\u767B\u9304\u6216\u5F85\u78BA\u8A8D",
    );
    expect(posts).toHaveLength(4);
  } finally {
    await browser.close();
  }
}, 20_000);

test.each(["reject", "uncertain", "stop"] as const)(
  "stops safely on %s without submitting the following date",
  async (mode) => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(5000);
      const posts: string[] = [];
      await page.route("**/*", async (route) => {
        const body = route.request().postData() ?? "";
        if (body !== "") {
          posts.push(body);
        }
        const fields = new URLSearchParams(body);
        const insert = body !== "" && fields.get("S_SUBMIT") !== "Loading Data";
        if (mode === "stop" && insert) {
          await page
            .getByRole("button", {
              name: "\u5B8C\u6210\u76EE\u524D\u4E00\u7B46\u5F8C\u505C\u6B62",
              exact: true,
            })
            .click();
        }
        let html = fixture(fields, insert && mode === "stop");
        if (mode === "reject") {
          html = html.replace("</body>", "<script>window.rejectInsert = true;</script></body>");
        }
        await route.fulfill({ contentType: "text/html", body: html });
      });
      await page.goto(endpoint);
      await page.addScriptTag({ content: source });
      await page.getByRole("button", { name: "\u591A\u65E5", exact: true }).click();
      await page.getByLabel("\u7D50\u675F\u65E5\u671F\u65E5", { exact: true }).selectOption("11");
      await page.getByRole("button", { name: "Add", exact: true }).click();
      await page.waitForFunction(
        (expected) => document.querySelector('[role="status"]')?.textContent.includes(expected),
        {
          reject: "Rejected by host",
          uncertain: "\u672A\u80FD\u78BA\u8A8D",
          stop: "\u5DF2\u505C\u6B62",
        }[mode],
      );
      expect(posts).toHaveLength(mode === "reject" ? 1 : 2);
      expect(posts.some((body) => body.includes("I_TASK_DT_Day=11"))).toBe(false);
      const journal = await page.evaluate(() =>
        sessionStorage.getItem("ccxp-lite-work-log-batch-journal"),
      );
      expect(journal).toContain({ reject: "{}", stop: "done", uncertain: "pending" }[mode]);
      expect(await page.locator('[name="I_TASK_NOTE"]').isEnabled()).toBe(true);
    } finally {
      await browser.close();
    }
  },
  20_000,
);

test("rejects unsupported Big5 characters before submitting", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route("**/*", async (route) => {
      await route.fulfill({ contentType: "text/html", body: fixture() });
    });
    await page.goto(endpoint);
    await page.addScriptTag({ content: source });
    await page.getByRole("button", { name: "\u591A\u65E5", exact: true }).click();
    await page.locator('[name="I_TASK_NOTE"]').fill("\u{1F600}");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    expect(await page.getByRole("status").textContent()).toContain("Big5");
  } finally {
    await browser.close();
  }
}, 20_000);

test("waits for host parsing before grouping and copying date controls", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route("**/*", async (route) => {
      await route.fulfill({
        contentType: "text/html",
        body: fixture().replace("</head>", `<script>${source}</script></head>`),
      });
    });
    await page.goto(endpoint);
    expect(await page.locator(".ccxp-lite-single-date select").count()).toBe(3);
    expect(
      await page.getByLabel("\u7D50\u675F\u65E5\u671F\u6708", { exact: true }).inputValue(),
    ).toBe("09");
    expect(
      await page.getByLabel("\u7D50\u675F\u65E5\u671F\u65E5", { exact: true }).inputValue(),
    ).toBe("10");
  } finally {
    await browser.close();
  }
}, 20_000);

test("does not create another date picker during a transient panel detach", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route("**/*", async (route) => {
      await route.fulfill({ contentType: "text/html", body: fixture() });
    });
    await page.goto(endpoint);
    await page.addScriptTag({ content: source });
    await page.getByRole("button", { name: "\u591A\u65E5", exact: true }).click();
    await page.locator('[name="I_TASK_DT_Year"]').focus();
    await page.evaluate(() => {
      const form = document.querySelector("#insForm");
      const panel = document.querySelector("#ccxp-lite-batch");
      const dates = document.querySelector(".ccxp-lite-single-date");
      const cell = panel?.closest("td");
      if (!form || !panel || !dates || !cell) {
        throw new Error("Missing enhanced date controls");
      }
      cell.append(dates);
      panel.remove();
      form.append(document.createTextNode(""));
      (globalThis as typeof globalThis & { detachedBatchPanel?: Element }).detachedBatchPanel =
        panel;
    });
    await page.waitForTimeout(0);
    await page.evaluate(() => {
      const panel = (globalThis as typeof globalThis & { detachedBatchPanel?: Element })
        .detachedBatchPanel;
      const dates = document.querySelector(".ccxp-lite-single-date");
      const cell = dates?.closest("td");
      const settings = panel?.querySelector("fieldset");
      if (!panel || !dates || !cell || !settings) {
        throw new Error("Missing detached date controls");
      }
      cell.prepend(panel);
      settings.before(dates);
    });
    expect(await page.locator(".ccxp-lite-single-date").count()).toBe(1);
    expect(
      await page.locator('.ccxp-lite-date-parts[aria-label="\u7D50\u675F\u65E5\u671F"]').count(),
    ).toBe(1);
    expect(await page.locator("#ccxp-lite-batch select").count()).toBe(6);
  } finally {
    await browser.close();
  }
}, 20_000);
