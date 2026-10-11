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
      const trigger = nav.locator(".ccxp-lite-profile-trigger");
      await trigger.press("Enter");
      const popup = nav.locator("#ccxp-lite-profile-popover");
      await popup.waitFor({ state: "visible" });
      const repo = popup.getByRole("link", { name: "ccxpLite", exact: true });
      const report = popup.getByRole("link", { name: "\u554F\u984C\u56DE\u5831", exact: true });
      expect(await repo.getAttribute("href")).toBe("https://github.com/sago-cream/ccxp-lite");
      expect(await report.getAttribute("href")).toContain("https://docs.google.com/forms/");
      for (const link of [repo, report]) {
        expect(await link.getAttribute("target")).toBe("_blank");
        expect(await link.getAttribute("rel")).toBe("noopener noreferrer");
      }
      await report.press("Escape");
      await popup.waitFor({ state: "hidden" });
      expect(await trigger.getAttribute("aria-expanded")).toBe("false");
      await trigger.click();
      await nav
        .locator("#ccxp-lite-profile-mode")
        .selectOption(variant === "classic" ? "layered" : "classic");
    }
    await nav.locator(".ccxp-lite-profile-trigger").click();
    await page.frameLocator('frame[name="main"]').locator(".ccxp-home-wordmark").click();
    await nav.locator("#ccxp-lite-profile-popover").waitFor({ state: "hidden" });
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 30_000);
