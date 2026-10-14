import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { expect, test } from "vitest";
import { routeWorkLogFixture } from "../../scripts/work-log-fixtures.js";

test("packaged sidebar resizes only through its handle with stable snap thresholds", async () => {
  const extension = path.resolve("dist/crx/unpacked");
  const profile = mkdtempSync(path.join(tmpdir(), "ccxp-resize-"));
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
    const navFrame = () => {
      const result = page.frames().find((candidate) => candidate.url().includes("IN_INQ_STU.php"));
      if (!result) {
        throw new Error("Missing navigation fixture frame");
      }
      return result;
    };
    let frame = navFrame();
    await frame.waitForFunction(() => document.body.dataset.ccxpLiteSidebarApplied === "true");
    await page.frameLocator('frame[name="main"]').locator(".ccxp-home-wordmark").waitFor();
    await frame.locator(".ccxp-lite-empty-row").waitFor();
    let shell = frame.locator(".ccxp-lite-sidebar-shell");
    let handle = frame.getByRole("separator");
    const width = async () => await page.locator("frameset[cols]").getAttribute("cols");
    const expectWidth = async (value: number) => {
      await expect.poll(width).toBe(`${value},*`);
      expect(await frame.locator(".ccxp-lite-sidebar-resize").getAttribute("aria-valuenow")).toBe(
        String(value),
      );
    };
    const begin = async () => {
      const bounds = await handle.boundingBox();
      if (!bounds) {
        throw new Error("Missing resize handle");
      }
      await page.mouse.move(bounds.x + bounds.width / 2, 400);
      await page.mouse.down();
    };
    await expectWidth(324);
    expect(await page.locator("frameset[cols] > frame[noresize]").count()).toBe(2);
    await page.mouse.move(324, 400);
    await page.mouse.down();
    await page.mouse.move(500, 400, { steps: 5 });
    await page.mouse.up();
    await expectWidth(324);
    await begin();
    // A captured pointer continues delivering movement after crossing into the main frame.
    expect(
      await frame
        .locator(".ccxp-lite-row-button")
        .first()
        .evaluate((element) => getComputedStyle(element).transitionDuration),
    ).toBe("0s");
    await page.mouse.move(400, 400);
    await expectWidth(404);
    await page.mouse.move(700, 400);
    await expectWidth(480);
    await page.mouse.move(236, 400);
    await expectWidth(240);
    expect(await shell.getAttribute("data-ccxp-lite-sidebar-compact")).toBe("false");
    await page.mouse.move(124, 400);
    await expectWidth(240);
    await page.mouse.move(123, 400);
    await expectWidth(64);
    expect(await shell.getAttribute("data-ccxp-lite-sidebar-compact")).toBe("true");
    await page.mouse.move(155, 400);
    await expectWidth(64);
    await page.mouse.move(156, 400);
    await expectWidth(240);
    await page.mouse.move(124, 400);
    await expectWidth(240);
    await page.mouse.move(123, 400);
    await expectWidth(64);
    await page.mouse.move(155, 400);
    await expectWidth(64);
    await page.mouse.move(300, 400);
    await expectWidth(304);
    await page.mouse.up();
    expect(await shell.getAttribute("data-ccxp-lite-sidebar-resizing")).toBeNull();
    expect(await frame.evaluate(() => localStorage.getItem("ccxp-lite-sidebar-width"))).toBe("304");
    // Search rerenders and navigation do not reset the selected width.
    await frame.locator(".ccxp-lite-sidebar-search-input").fill("\u500B\u4EBA");
    await expectWidth(304);
    await frame.locator(".ccxp-lite-sidebar-search-input").fill("");
    await page.reload();
    frame = navFrame();
    await frame.waitForFunction(() => document.body.dataset.ccxpLiteSidebarApplied === "true");
    shell = frame.locator(".ccxp-lite-sidebar-shell");
    handle = frame.getByRole("separator");
    await expectWidth(304);
    await begin();
    await page.mouse.move(440, 400);
    await expectWidth(444);
    await handle.press("Escape");
    await page.mouse.up();
    await expectWidth(304);
    // Keyboard access includes minimum-size clamping and collapsed/expanded navigation.
    await handle.press("ArrowLeft");
    await expectWidth(288);
    await handle.press("ArrowLeft");
    await expectWidth(272);
    await handle.press("ArrowLeft");
    await expectWidth(256);
    await handle.press("ArrowLeft");
    await expectWidth(240);
    await handle.press("ArrowLeft");
    await expectWidth(64);
    await handle.press("ArrowRight");
    await expectWidth(240);
    await handle.press("End");
    await expectWidth(480);
    await handle.press("Home");
    await expectWidth(64);
    await page.mouse.move(700, 800);
    await page.reload();
    frame = navFrame();
    await frame.waitForFunction(() => document.body.dataset.ccxpLiteSidebarApplied === "true");
    shell = frame.locator(".ccxp-lite-sidebar-shell");
    handle = frame.getByRole("separator");
    await expectWidth(64);
    // Start a fresh drag from the rail and expand past the reopening threshold.
    await begin();
    await page.mouse.move(155, 400);
    await expectWidth(64);
    await page.mouse.move(156, 400);
    await expectWidth(240);
    await page.mouse.move(290, 400);
    await expectWidth(294);
    await page.mouse.up();
    await page.mouse.move(700, 800);
    await expectWidth(294);
    // Collapse-button preview and pinning retain the chosen expanded width.
    await frame.locator(".ccxp-lite-sidebar-collapse").click();
    await page.mouse.move(700, 800);
    await expectWidth(64);
    // Enter through the resize strip, then move into the rail without another pointerenter.
    await page.mouse.move(63, 220);
    await expectWidth(64);
    await page.mouse.move(32, 220, { steps: 5 });
    await expectWidth(294);
    expect(await shell.getAttribute("data-ccxp-lite-sidebar-collapsed")).toBe("true");
    expect(await frame.evaluate(() => localStorage.getItem("ccxp-lite-sidebar-collapsed"))).toBe(
      "true",
    );
    await page.mouse.move(700, 800);
    await expectWidth(64);
    await page.mouse.move(32, 220, { steps: 5 });
    await expectWidth(294);
    await frame.locator(".ccxp-lite-sidebar-collapse").click();
    await page.mouse.move(700, 800);
    await expectWidth(294);
    // The dedicated control disappears in the full-width menu mode.
    await frame.locator(".ccxp-lite-profile-trigger").click();
    await frame.locator("#ccxp-lite-profile-mode").click();
    expect(await handle.isVisible()).toBe(false);
    expect(await width()).toBe("*,0");
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 30_000);
