import { chromium } from "playwright";
import { expect, test } from "vitest";
import {
  assertWorkLogReady,
  routeWorkLogFixture,
  workLogPath,
} from "../../scripts/work-log-fixtures.js";

test("visual capture rejects the unstyled host page even when its form is present", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(500);
    await page.route("**/*", async (route) => {
      if (!(await routeWorkLogFixture(route))) {
        await route.abort();
      }
    });
    await page.goto(`https://www.ccxp.nthu.edu.tw${workLogPath}`);
    expect(await page.locator("#insTask #insForm").count()).toBe(1);
    await expect(assertWorkLogReady(page)).rejects.toThrow("ccxp-lite-main-skin");
  } finally {
    await browser.close();
  }
});
