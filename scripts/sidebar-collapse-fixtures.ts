/* eslint-disable no-await-in-loop -- Pointer, focus, and navigation assertions follow UI state in order. */
import assert from "node:assert/strict";
import path from "node:path";
import type { Frame, Page } from "playwright";

export async function assertSidebarCollapse(
  page: Page,
  initialNav: Frame,
  outputDir: string,
  capture: (page: Page, outputPath: string) => Promise<void>,
  recordVideo: boolean,
): Promise<Frame> {
  let nav = initialNav;
  const shell = nav.locator(".ccxp-lite-sidebar-shell");
  const button = nav.locator(".ccxp-lite-sidebar-collapse");
  const waitWidth = async (width: number) => {
    await page.waitForFunction(
      (expected) =>
        document.querySelector("frameset[cols]")?.getAttribute("cols") === `${expected},*`,
      width,
    );
  };
  const pause = async () => {
    if (recordVideo) {
      await page.waitForTimeout(1200);
    }
  };
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await button.waitFor();
  await waitWidth(324);
  await capture(page, path.join(outputDir, "sidebar-expanded.png"));
  await pause();
  // Keep a group open across the compact/preview transitions.
  const category = nav.locator(
    '.ccxp-lite-category > .ccxp-lite-row-button[title="\u500B\u4EBA\u8CC7\u6599"]',
  );
  await category.click();
  await button.click();
  await page.mouse.move(700, 800);
  await waitWidth(64);
  assert.equal(await shell.getAttribute("data-ccxp-lite-sidebar-compact"), "true");
  assert.equal(await category.getAttribute("aria-expanded"), "true");
  assert.equal(await button.isVisible(), false);
  assert.equal(await nav.locator(".ccxp-lite-profile-trigger").isVisible(), true);
  const compactBounds = await nav.locator(".ccxp-lite-profile-avatar").boundingBox();
  assert.ok(compactBounds && compactBounds.x >= 0 && compactBounds.x + compactBounds.width <= 64);
  assert.equal(await nav.locator(".ccxp-lite-sidebar-children:not([inert])").count(), 0);
  assert.equal(await nav.locator(".ccxp-lite-profile-trigger strong").isVisible(), false);
  await capture(page, path.join(outputDir, "sidebar-collapsed.png"));
  await pause();
  await page.mouse.move(63, 220);
  await waitWidth(64);
  await page.mouse.move(32, 220, { steps: 5 });
  await waitWidth(324);
  assert.equal(await shell.getAttribute("data-ccxp-lite-sidebar-collapsed"), "true");
  assert.equal(
    await button.getAttribute("aria-label"),
    "\u4FDD\u6301\u5074\u908A\u6B04\u5C55\u958B",
  );
  await capture(page, path.join(outputDir, "sidebar-hover-expanded.png"));
  await pause();
  await page.mouse.move(700, 800);
  await waitWidth(64);
  await pause();
  // Persisted compact state survives a full legacy frameset reload.
  await page.reload({ waitUntil: "commit" });
  nav = await readyNav(page);
  await waitWidth(64);
  assert.equal(
    await nav.locator(".ccxp-lite-sidebar-shell").getAttribute("data-ccxp-lite-sidebar-compact"),
    "true",
  );
  await nav.locator(".ccxp-lite-sidebar-brand-button").focus();
  await waitWidth(324);
  assert.equal(await nav.locator(".ccxp-lite-sidebar-collapse").isVisible(), true);
  await nav.locator(".ccxp-lite-sidebar-collapse").press("Enter");
  await page.mouse.move(700, 800);
  await waitWidth(324);
  assert.equal(
    await nav.locator(".ccxp-lite-sidebar-shell").getAttribute("data-ccxp-lite-sidebar-collapsed"),
    "false",
  );
  await capture(page, path.join(outputDir, "sidebar-pinned-expanded.png"));
  await pause();
  // Rapid hover reversal must settle at the final width.
  await nav.locator(".ccxp-lite-sidebar-collapse").click();
  await page.mouse.move(700, 800);
  await waitWidth(64);
  for (const x of [32, 700, 32, 700]) {
    await page.mouse.move(x, 220);
  }
  await waitWidth(64);
  const header = page.frames().find((frame) => new URL(frame.url()).pathname.endsWith("/top.php"));
  assert.ok(header);
  const headerUrl = header.url();
  const idleUrl = new URL(headerUrl);
  idleUrl.searchParams.set("fixture-idle", "1498");
  await header.goto(idleUrl.href);
  const warning = nav.locator(".ccxp-lite-session-warning");
  await warning.waitFor({ state: "visible" });
  await waitWidth(324);
  assert.equal(
    await nav.locator(".ccxp-lite-sidebar-shell").getAttribute("data-ccxp-lite-sidebar-collapsed"),
    "true",
  );
  await warning.getByRole("button").click();
  await header.goto(headerUrl);
  await page.mouse.click(700, 800);
  await waitWidth(64);
  const viewport = page.viewportSize();
  assert.ok(viewport);
  for (const width of [600, 375]) {
    await page.setViewportSize({ width, height: viewport.height });
    await waitWidth(64);
    await nav.locator(".ccxp-lite-profile-trigger").focus();
    await waitWidth(324);
    await nav.locator(".ccxp-lite-profile-trigger").click();
    await nav.locator("#ccxp-lite-profile-popover").waitFor({ state: "visible" });
    const bounds = await nav.locator("#ccxp-lite-profile-popover").boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width);
    await nav.locator(".ccxp-lite-profile-trigger").press("Escape");
    await page.mouse.click(width - 10, 800);
    await page.mouse.move(width - 10, 800);
    await waitWidth(64);
  }
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await nav
      .locator(".ccxp-lite-sidebar-collapse")
      .evaluate((element) => getComputedStyle(element).transitionDuration),
    "0s",
  );
  await nav.locator(".ccxp-lite-sidebar-brand-button").focus();
  await waitWidth(324);
  await nav.locator(".ccxp-lite-sidebar-collapse").press("Enter");
  await waitWidth(324);
  await page.reload({ waitUntil: "commit" });
  nav = await readyNav(page);
  await waitWidth(324);
  if ((await nav.locator(".ccxp-lite-sidebar-resize").count()) > 0) {
    const handle = nav.getByRole("separator");
    const bounds = await handle.boundingBox();
    assert.ok(bounds);
    await page.mouse.move(bounds.x + bounds.width / 2, 400);
    await page.mouse.down();
    await page.mouse.move(236, 400);
    await waitWidth(240);
    assert.equal(
      await nav.locator(".ccxp-lite-sidebar-shell").getAttribute("data-ccxp-lite-sidebar-compact"),
      "false",
    );
    await capture(page, path.join(outputDir, "sidebar-resize-minimum.png"));
    await pause();
    await page.mouse.move(123, 400);
    await waitWidth(64);
    await capture(page, path.join(outputDir, "sidebar-resize-snap.png"));
    await pause();
    await page.mouse.move(155, 400);
    await waitWidth(64);
    await page.mouse.move(416, 400);
    await waitWidth(420);
    await capture(page, path.join(outputDir, "sidebar-resize-expanded.png"));
    await pause();
    await page.mouse.move(320, 400);
    await waitWidth(324);
    await page.mouse.up();
    await page.mouse.move(700, 800);
  }
  return nav;
}

async function readyNav(page: Page) {
  await page
    .frameLocator("frame[src*='IN_INQ_STU.php']")
    .locator("body[data-ccxp-lite-sidebar-applied='true']")
    .waitFor();
  const nav = page.frames().find((frame) => frame.url().includes("IN_INQ_STU.php"));
  assert.ok(nav);
  await nav.locator(".ccxp-lite-empty-row").waitFor();
  return nav;
}
