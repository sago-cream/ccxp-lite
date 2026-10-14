/* eslint-disable no-await-in-loop -- Each menu interaction depends on the preceding UI state. */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { expect, test } from "vitest";

test("packaged headers omit ccxpLite and profile menus expose support links", async () => {
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
    expect(
      await page
        .locator(".ccxp-lite-landing-header")
        .getByText("ccxpLite", { exact: true })
        .count(),
    ).toBe(0);
    expect(await page.locator("#ccxp-lite-support-menu").count()).toBe(0);
    expect(
      await page
        .locator(".ccxp-lite-landing-footer")
        .getByRole("link", { name: "ccxpLite", exact: true })
        .getAttribute("href"),
    ).toBe("https://github.com/sago-cream/ccxp-lite");

    await page.goto("https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php");
    const nav = page.frameLocator("frame[src*='IN_INQ_STU.php']");
    await nav.locator("body[data-ccxp-lite-sidebar-applied='true']").waitFor();
    const navFrame = page.frames().find((frame) => frame.url().includes("IN_INQ_STU.php"));
    if (!navFrame) {
      throw new Error("Missing navigation frame");
    }
    expect(
      await nav.locator(".ccxp-lite-sidebar-header").getByText("ccxpLite", { exact: true }).count(),
    ).toBe(0);
    for (const variant of ["classic", "layered"]) {
      await page.setViewportSize({ width: 375, height: 480 });
      const trigger = nav.locator(".ccxp-lite-profile-trigger");
      await trigger.press("Enter");
      const popup = nav.locator("#ccxp-lite-profile-popover");
      await popup.waitFor({ state: "visible" });
      const popupBounds = await popup.boundingBox();
      expect(popupBounds).not.toBeNull();
      if (popupBounds) {
        expect(popupBounds.x).toBeGreaterThanOrEqual(0);
        expect(popupBounds.y).toBeGreaterThanOrEqual(0);
        expect(popupBounds.x + popupBounds.width).toBeLessThanOrEqual(375);
        expect(popupBounds.y + popupBounds.height).toBeLessThanOrEqual(480);
      }
      const preferences = popup.getByRole("region", { name: "\u504F\u597D\u8A2D\u5B9A" });
      const support = popup.getByRole("region", { name: "\u652F\u63F4\u8207\u9023\u7D50" });
      expect(await preferences.getByRole("button").count()).toBe(3);
      expect(
        await preferences
          .getByRole("button", { name: "\u9084\u539F\u9762\u677F\u6392\u5E8F", exact: true })
          .count(),
      ).toBe(1);
      expect(await preferences.getByRole("link").count()).toBe(0);
      expect(await support.getByRole("link").count()).toBe(2);
      const mode = preferences.locator("#ccxp-lite-profile-mode");
      expect(await mode.textContent()).toBe(
        variant === "classic"
          ? "\u4F7F\u7528\u9078\u55AE\u6A21\u5F0F"
          : "\u4F7F\u7528\u5074\u6B04\u6A21\u5F0F",
      );
      await mode.focus();
      await mode.press("Tab");
      const timerToggle = preferences.locator(".ccxp-lite-session-timer-toggle");
      expect(await timerToggle.evaluate((input) => input === document.activeElement)).toBe(true);
      await timerToggle.press("Space");
      expect(await timerToggle.textContent()).toBe(
        variant === "classic"
          ? "\u96B1\u85CF\u767B\u51FA\u5012\u6578"
          : "\u986F\u793A\u767B\u51FA\u5012\u6578",
      );
      await timerToggle.press("Tab");
      const restoreOrder = preferences.getByRole("button", {
        name: "\u9084\u539F\u9762\u677F\u6392\u5E8F",
        exact: true,
      });
      expect(await restoreOrder.evaluate((button) => button === document.activeElement)).toBe(true);
      await restoreOrder.press("Tab");
      const repo = popup.getByRole("link", { name: "ccxpLite", exact: true });
      const report = popup.getByRole("link", { name: "\u554F\u984C\u56DE\u5831", exact: true });
      expect(await repo.getAttribute("href")).toBe("https://github.com/sago-cream/ccxp-lite");
      expect(await report.getAttribute("href")).toContain("https://docs.google.com/forms/");
      expect(await repo.evaluate((link) => link === document.activeElement)).toBe(true);
      for (const link of [repo, report]) {
        expect(await link.getAttribute("target")).toBe("_blank");
        expect(await link.getAttribute("rel")).toBe("noopener noreferrer");
        expect(await link.locator("svg[aria-hidden='true']").count()).toBe(2);
      }
      const rows = await popup
        .locator(".ccxp-lite-profile-row")
        .evaluateAll((elements: readonly Element[]) =>
          elements.map((row) => {
            const icon = row.firstElementChild;
            const label = icon?.nextElementSibling;
            return {
              iconTag: icon?.tagName.toLowerCase(),
              iconHidden: icon?.getAttribute("aria-hidden"),
              iconX: icon?.getBoundingClientRect().x,
              labelX: label?.getBoundingClientRect().x,
              height: row.getBoundingClientRect().height,
            };
          }),
        );
      expect(rows).toHaveLength(6);
      for (const row of rows) {
        expect(row.iconTag).toBe("svg");
        expect(row.iconHidden).toBe("true");
        expect(row.iconX).toBe(rows[0].iconX);
        expect(row.labelX).toBe(rows[0].labelX);
        expect(row.height).toBe(36);
      }
      await report.press("Escape");
      await popup.waitFor({ state: "hidden" });
      expect(await trigger.getAttribute("aria-expanded")).toBe("false");
      await trigger.click();
      await nav.locator("#ccxp-lite-profile-mode").click();
    }
    await page.setViewportSize({ width: 1280, height: 960 });
    await nav.locator(".ccxp-lite-profile-trigger").click();
    await page.frameLocator('frame[name="main"]').locator(".ccxp-home-wordmark").click();
    await nav.locator("#ccxp-lite-profile-popover").waitFor({ state: "hidden" });
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 30_000);
