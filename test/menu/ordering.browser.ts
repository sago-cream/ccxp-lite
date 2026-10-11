import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Frame, Page } from "playwright";
import { chromium } from "playwright";
import { expect, test } from "vitest";
import { setProfileMenuMode } from "../../scripts/profile-fixtures.js";
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
  context.setDefaultTimeout(5000);
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
    await page.frameLocator('frame[name="main"]').locator(".ccxp-home-wordmark").waitFor();
    await frame.locator(".ccxp-lite-empty-row").waitFor();
    const root = frame.locator('[data-ccxp-lite-order-group="root"]');
    const rows = root.locator(":scope > [data-ccxp-lite-order-item]");
    await expect.poll(async () => await rows.count()).toBe(14);
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
    await page.frameLocator('frame[name="main"]').locator(".ccxp-home-wordmark").waitFor();
    const reloadedRows = reloadedFrame.locator(
      '[data-ccxp-lite-order-group="root"] > [data-ccxp-lite-order-item]',
    );
    await expect.poll(async () => await reloadedRows.count()).toBe(14);
    expect(
      await reloadedRows.evaluateAll((items: readonly HTMLElement[]) =>
        items.map((item) => item.dataset.ccxpLiteOrderItem),
      ),
    ).toEqual(reordered);
    const settings = reloadedFrame.locator(".ccxp-lite-profile-trigger");
    const restore = reloadedFrame.getByRole("button", {
      name: "\u9084\u539F\u9762\u677F\u6392\u5E8F",
      exact: true,
    });
    await settings.click();
    await restore.click();
    const main = page.frames().find((candidate) => candidate.name() === "main");
    if (!main) {
      throw new Error("Missing main fixture frame");
    }
    const dialog = main.getByRole("dialog", {
      name: "\u9084\u539F\u9078\u55AE\u7684\u539F\u59CB\u9806\u5E8F\uFF1F",
    });
    await dialog.waitFor();
    const cancel = dialog.getByRole("button", { name: "\u53D6\u6D88", exact: true });
    await expect
      .poll(async () => await cancel.evaluate((button) => button === document.activeElement))
      .toBe(true);
    await cancel.press("Shift+Tab");
    const confirm = dialog.getByRole("button", {
      name: "\u9084\u539F\u9762\u677F\u6392\u5E8F",
      exact: true,
    });
    expect(await confirm.evaluate((button) => button === document.activeElement)).toBe(true);
    await confirm.press("Tab");
    expect(await cancel.evaluate((button) => button === document.activeElement)).toBe(true);
    await cancel.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    expect(await settings.evaluate((button) => button === document.activeElement)).toBe(true);
    expect(
      await reloadedRows.evaluateAll((items: readonly HTMLElement[]) =>
        items.map((item) => item.dataset.ccxpLiteOrderItem),
      ),
    ).toEqual(reordered);
    await settings.click();
    await restore.click();
    await confirm.click();
    await expect
      .poll(
        async () =>
          await reloadedFrame.evaluate(
            () =>
              localStorage.getItem("ccxp-lite-sidebar-order::/ccxp/INQUIRE/select_entry.php") ===
              null,
          ),
      )
      .toBe(true);
    expect(
      await reloadedRows.evaluateAll((items: readonly HTMLElement[]) =>
        items.map((item) => item.dataset.ccxpLiteOrderItem),
      ),
    ).toEqual(original);
    await page.reload();
    const restoredFrame = page
      .frames()
      .find((candidate) => candidate.url().includes("IN_INQ_STU.php"));
    if (!restoredFrame) {
      throw new Error("Missing restored navigation fixture frame");
    }
    await restoredFrame.locator(".ccxp-lite-empty-row").waitFor();
    expect(
      await restoredFrame
        .locator('[data-ccxp-lite-order-group="root"] > [data-ccxp-lite-order-item]')
        .evaluateAll((items: readonly HTMLElement[]) =>
          items.map((item) => item.dataset.ccxpLiteOrderItem),
        ),
    ).toEqual(original);
    // The retained host frameset, navigation declarations, and assets come from the live-derived
    // fixtures.
    expect(await restoredFrame.locator(".ccxp-lite-sidebar-shell").count()).toBe(1);
    await assertRestoreDialogLayouts(page, restoredFrame, "zh");
    const englishPage = await context.newPage();
    await englishPage.addInitScript(() => {
      sessionStorage.setItem("ccxp-lite-locale", "en");
    });
    await englishPage.goto(page.url());
    const englishFrame = englishPage
      .frames()
      .find((candidate) => candidate.url().includes("IN_INQ_STU.php"));
    if (!englishFrame) {
      throw new Error("Missing English navigation fixture frame");
    }
    await englishFrame.locator("body[data-ccxp-lite-sidebar-applied='true']").waitFor();
    await englishPage
      .frameLocator('frame[name="main"]')
      .locator(".ccxp-home-wordmark")
      .waitFor({ state: "attached" });
    await assertRestoreDialogLayouts(englishPage, englishFrame, "en");
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 60_000);

async function assertRestoreDialogLayouts(page: Page, nav: Frame, locale: "en" | "zh") {
  const main = page.frames().find((candidate) => candidate.name() === "main");
  if (!main) {
    throw new Error("Missing main fixture frame");
  }
  const settings = nav.locator(".ccxp-lite-profile-trigger");
  const label = locale === "en" ? "Restore original order" : "\u9084\u539F\u9762\u677F\u6392\u5E8F";
  /* eslint-disable no-await-in-loop -- Each menu mode and viewport must settle before opening its dialog. */
  for (const mode of ["classic", "layered"] as const) {
    await settings.click();
    await setProfileMenuMode(nav.locator("#ccxp-lite-profile-mode"), mode);
    await settings.press("Escape");
    for (const width of [1280, 600, 375]) {
      await page.setViewportSize({ width, height: 960 });
      await nav.waitForFunction(() =>
        [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].every(
          (link) => link.disabled || link.sheet !== null,
        ),
      );
      await settings.click();
      await nav.getByRole("button", { name: label, exact: true }).click();
      const host = (await main.evaluate(() => document.body.clientWidth > 100)) ? main : nav;
      const dialog = host.getByRole("dialog");
      await dialog.waitFor();
      await page.waitForFunction(
        () => document.documentElement.dataset.ccxpLiteLoadingReady === "true",
      );
      const fits = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.left >= 0 &&
          rect.right <= window.innerWidth &&
          rect.top >= 0 &&
          rect.bottom <= window.innerHeight
        );
      });
      expect(fits).toBe(true);
      expect(
        await dialog.evaluate((element) =>
          [...element.querySelectorAll<HTMLElement>("h3, p, button")].every(
            (child) => child.scrollWidth <= child.clientWidth,
          ),
        ),
      ).toBe(true);
      expect(await main.evaluate(() => document.documentElement.dataset.ccxpLiteScope)).toBe(
        "main",
      );
      const cancel = dialog.getByRole("button").first();
      expect(await cancel.evaluate((button) => button === document.activeElement)).toBe(true);
      await cancel.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      expect(await settings.evaluate((button) => button === document.activeElement)).toBe(true);
    }
  }
  /* eslint-enable no-await-in-loop */
}
