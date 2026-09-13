import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { expect, test } from "vitest";
import {
  assertWorkLogReady,
  routeWorkLogFixture,
  workLogPath,
} from "../../scripts/work-log-fixtures.js";

function ensurePackagedExtension(): string {
  const extension = path.resolve("dist/crx/unpacked");
  if (!existsSync(path.join(extension, "manifest.json"))) {
    const result = spawnSync("bun", ["run", "build:crx"], { stdio: "inherit" });
    if (result.status !== 0) {
      throw new Error("Failed to build unpacked extension for browser test");
    }
  }
  return extension;
}

test("packaged department search shows results while typing and keeps dates in both tabs", async () => {
  const profile = mkdtempSync(path.join(tmpdir(), "ccxp-unit-search-"));
  const extension = ensurePackagedExtension();
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  context.setDefaultTimeout(5000);
  try {
    let posts = 0;
    await context.route("**/*", async (route) => {
      if (new URL(route.request().url()).protocol === "chrome-extension:") {
        await route.continue();
        return;
      }
      if (route.request().method() === "POST") {
        posts++;
      }
      if (!(await routeWorkLogFixture(route))) {
        await route.abort();
      }
    });
    const page = await context.newPage();
    await page.goto(`https://www.ccxp.nthu.edu.tw${workLogPath}`);
    await assertWorkLogReady(page);
    const addDate = page.locator('input[data-ccxp-lite-date-prefix="I_TASK_DT_"]');
    await addDate.fill("2026-09-09");
    const addSearch = page.locator('[name="KI_SRV_ID"]');
    await addSearch.fill("\u7AF9\u5E2B");
    expect(await page.locator('[name="I_SRV_ID"]').getAttribute("size")).toBe("2");
    expect(await page.locator('[name="I_SRV_ID"] option:not([hidden])').allTextContents()).toEqual([
      "EU0A - \u7AF9\u5E2B\u6559\u80B2\u5B78\u9662",
    ]);
    await addSearch.press("Enter");
    expect(await page.locator('[name="I_SRV_ID"]').inputValue()).toBe("EU0A");
    await page.locator('[name="I_SRV_ID"]').selectOption("EU0A");
    expect(await addDate.inputValue()).toBe("2026-09-09");
    expect(await page.locator('[name="I_TASK_DT_Day"]').inputValue()).toBe("09");
    await page.getByRole("radio", { name: "\u67E5\u8A62\u5DE5\u6642", exact: true }).check();
    const start = page.locator('#queForm input[data-ccxp-lite-date-prefix="Q_TASK_A_DT_"]');
    const end = page.locator('#queForm input[data-ccxp-lite-date-prefix="Q_TASK_Z_DT_"]');
    await start.fill("2026-09-02");
    await end.fill("2026-09-08");
    const search = page.locator('[name="KQ_SRV_ID"]');
    await search.fill("college of education");
    expect(await page.locator('[name="Q_SRV_ID"] option:not([hidden])').allTextContents()).toEqual([
      "EU0A - \u7AF9\u5E2B\u6559\u80B2\u5B78\u9662",
    ]);
    await search.press("Enter");
    expect(await page.locator('[name="Q_SRV_ID"]').inputValue()).toBe("EU0A");
    await page.locator('[name="Q_SRV_ID"]').selectOption("EU0A");
    expect(await start.inputValue()).toBe("2026-09-02");
    expect(await end.inputValue()).toBe("2026-09-08");
    await search.fill("not a department");
    expect(await page.locator('#queForm [role="status"]').textContent()).toContain("0");
    await search.fill("");
    expect(await page.locator('[name="Q_SRV_ID"]').inputValue()).toBe("EU0A");
    expect(posts).toBe(0);
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 30_000);

test("packaged department search works inside a nested CCXP frame", async () => {
  const profile = mkdtempSync(path.join(tmpdir(), "ccxp-unit-frame-"));
  const extension = ensurePackagedExtension();
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  context.setDefaultTimeout(5000);
  try {
    await context.route("**/*", async (route) => {
      const url = route.request().url();
      if (new URL(url).protocol === "chrome-extension:") {
        await route.continue();
        return;
      }
      if (url === "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php") {
        await route.fulfill({
          contentType: "text/html",
          body: `<!DOCTYPE html><html><body><iframe name="main" src="https://www.ccxp.nthu.edu.tw${workLogPath}"></iframe></body></html>`,
        });
        return;
      }
      if (!(await routeWorkLogFixture(route))) {
        await route.abort();
      }
    });
    const page = await context.newPage();
    await page.goto("https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php");
    const frame = page.frame({ name: "main" });
    if (!frame) {
      throw new Error("Missing main frame");
    }
    const searchInput = frame.locator('[name="KI_SRV_ID"]');
    const select = frame.locator('[name="I_SRV_ID"]');
    await searchInput.waitFor();
    await searchInput.fill("\u7AF9\u5E2B");
    expect(await select.getAttribute("size")).toBe("2");
    expect(await select.locator("option:not([hidden])").allTextContents()).toEqual([
      "EU0A - \u7AF9\u5E2B\u6559\u80B2\u5B78\u9662",
    ]);
    expect(
      await frame.locator(".ccxp-lite-work-log-department-status").first().textContent(),
    ).toContain("1");
    await searchInput.press("Enter");
    expect(await select.inputValue()).toBe("EU0A");
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 30_000);
