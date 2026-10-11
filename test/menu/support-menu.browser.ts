import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import type { Frame, Page } from "playwright";
import { expect, test } from "vitest";

async function assertSupportMenuToggle(scope: Page | Frame, triggerSelector: string) {
  const trigger = scope.locator(triggerSelector);
  const menu = scope.locator("#ccxp-lite-support-menu");
  await trigger.waitFor();
  expect(await menu.isVisible()).toBe(false);
  await trigger.click();
  await menu.waitFor({ state: "visible" });
  await scope.waitForFunction(
    (selector) => document.querySelector(selector)?.getAttribute("aria-expanded") === "true",
    triggerSelector,
  );
  await trigger.click();
  await menu.waitFor({ state: "hidden" });
  await scope.waitForFunction(
    (selector) => document.querySelector(selector)?.getAttribute("aria-expanded") === "false",
    triggerSelector,
  );
  await trigger.press("Enter");
  await menu.waitFor({ state: "visible" });
  await menu.getByRole("link", { name: "GitHub", exact: true }).press("Escape");
  await menu.waitFor({ state: "hidden" });
}

test("packaged support menu closes when CCXPLite is clicked again on landing and navigation pages", async () => {
  const profile = mkdtempSync(path.join(tmpdir(), "ccxp-support-menu-"));
  const extension = path.resolve("dist/crx/unpacked");
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  context.setDefaultTimeout(5000);
  try {
    const fixtureRoot = path.resolve("test/browser-fixtures");
    const assets = JSON.parse(
      readFileSync(path.join(fixtureRoot, "host-assets.json"), "utf8"),
    ) as Record<string, { file: string; contentType: string } | undefined>;
    const fixtures = new Map([
      ["/ccxp/INQUIRE/IN_INQ_STU.php", "navigation.html"],
      ["/ccxp/INQUIRE/index.php", "login.html"],
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
      const fixture = fixtures.get(url.pathname);
      const asset = assets[url.pathname];
      if (
        url.origin !== "https://www.ccxp.nthu.edu.tw" ||
        (fixture === undefined && asset === undefined)
      ) {
        await route.abort();
        return;
      }
      await route.fulfill({
        contentType: asset?.contentType ?? "text/html; charset=utf-8",
        body: readFileSync(path.join(fixtureRoot, asset?.file ?? fixture ?? "")),
      });
    });
    const page = await context.newPage();
    await page.goto("https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/index.php");
    await page.locator("body[data-ccxp-lite-landing-applied='true']").waitFor();
    await assertSupportMenuToggle(page, ".ccxp-lite-landing-brand-partner-link");
    await page.locator(".ccxp-lite-landing-brand-partner-link").click();
    await page.locator("#ccxp-lite-support-menu").waitFor({ state: "visible" });
    await page.locator("input[name='account']").click();
    await page.locator("#ccxp-lite-support-menu").waitFor({ state: "hidden" });

    await page.goto("https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php");
    const nav = page.frameLocator("frame[src*='IN_INQ_STU.php']");
    await nav.locator("body[data-ccxp-lite-sidebar-applied='true']").waitFor();
    const navFrame = page.frames().find((frame) => frame.url().includes("IN_INQ_STU.php"));
    if (!navFrame) {
      throw new Error("Missing navigation frame");
    }
    await assertSupportMenuToggle(navFrame, ".ccxp-lite-sidebar-brand-partner-link");
    await nav.locator(".ccxp-lite-sidebar-brand-partner-link").click();
    await nav.locator("#ccxp-lite-support-menu").waitFor({ state: "visible" });
    await page.frameLocator('frame[name="main"]').locator(".ccxp-home-wordmark").click();
    await nav.locator("#ccxp-lite-support-menu").waitFor({ state: "hidden" });
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 30_000);
