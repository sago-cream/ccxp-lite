import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { expect, test } from "vitest";
import { routeWorkLogFixture } from "../../scripts/work-log-fixtures.js";

test("packaged sidebar supports native dragging and persists order across a frameset reload", async () => {
  const extension = path.resolve("dist/crx/unpacked");
  const profile = mkdtempSync(path.join(tmpdir(), "ccxp-ordering-"));
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
    viewport: { width: 1280, height: 960 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  try {
    const fixtures = new Map([
      ["/ccxp/INQUIRE/IN_INQ_STU.php", "navigation.html"],
      ["/ccxp/INQUIRE/JH/4/4.19/JH4j002.php", "profile-header.big5"],
      ["/ccxp/INQUIRE/select_entry.php", "frameset.html"],
      ["/ccxp/INQUIRE/top.php", "top.html"],
      ["/ccxp/INQUIRE/xp03_m.htm", "main.html"],
    ]);
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.protocol === "chrome-extension:") {
        await route.continue();
        return;
      }
      if (await routeWorkLogFixture(route)) {
        return;
      }
      const fixture = fixtures.get(url.pathname);
      await (url.origin === "https://www.ccxp.nthu.edu.tw" && fixture !== undefined
        ? route.fulfill({
            contentType: "text/html",
            body: readFileSync(path.resolve("test/browser-fixtures", fixture)),
          })
        : route.abort());
    });
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php?ACIXSTORE=fixture&hint=123456789",
    );
    const frame = page.frames().find((candidate) => candidate.url().includes("IN_INQ_STU.php"));
    if (!frame) {
      throw new Error("Missing navigation fixture frame");
    }
    await frame.waitForFunction(() => document.body.dataset.ccxpLiteSidebarApplied === "true");
    await frame.locator(".ccxp-lite-empty-row").waitFor();
    const root = frame.locator('[data-ccxp-lite-order-group="root"]');
    const rows = root.locator(":scope > [data-ccxp-lite-order-item]");
    const original = await rows.evaluateAll((items: readonly HTMLElement[]) =>
      items.map((item) => item.dataset.ccxpLiteOrderItem),
    );
    expect(original.length).toBeGreaterThan(2);
    const source = rows.nth(2).locator(":scope > button");
    const target = rows.nth(1).locator(":scope > button");
    await source.dragTo(target, { targetPosition: { x: 20, y: 3 } });
    const reordered = [original[0], original[2], original[1], ...original.slice(3)];
    await expect
      .poll(
        async () =>
          await rows.evaluateAll((items: readonly HTMLElement[]) =>
            items.map((item) => item.dataset.ccxpLiteOrderItem),
          ),
      )
      .toEqual(reordered);
    expect(
      await frame.evaluate(() =>
        localStorage.getItem("ccxp-lite-sidebar-order::/ccxp/INQUIRE/select_entry.php"),
      ),
    ).not.toBeNull();
    await page.reload();
    const reloadedFrame = page
      .frames()
      .find((candidate) => candidate.url().includes("IN_INQ_STU.php"));
    if (!reloadedFrame) {
      throw new Error("Missing reloaded navigation fixture frame");
    }
    await reloadedFrame.waitForFunction(
      () => document.body.dataset.ccxpLiteSidebarApplied === "true",
    );
    await reloadedFrame.locator(".ccxp-lite-empty-row").waitFor();
    const reloadedRows = reloadedFrame.locator(
      '[data-ccxp-lite-order-group="root"] > [data-ccxp-lite-order-item]',
    );
    expect(
      await reloadedRows.evaluateAll((items: readonly HTMLElement[]) =>
        items.map((item) => item.dataset.ccxpLiteOrderItem),
      ),
    ).toEqual(reordered);
    await reloadedRows.nth(1).locator(":scope > button").press("Alt+Shift+ArrowDown");
    expect(
      await reloadedRows.evaluateAll((items: readonly HTMLElement[]) =>
        items.map((item) => item.dataset.ccxpLiteOrderItem),
      ),
    ).toEqual(original);
    // The retained host frameset, navigation declarations, and assets come from the live-derived
    // fixtures.
    expect(await reloadedFrame.locator(".ccxp-lite-sidebar-shell").count()).toBe(1);
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 30_000);
