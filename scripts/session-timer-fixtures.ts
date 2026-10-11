import assert from "node:assert/strict";
import path from "node:path";
import type { Frame, Page } from "playwright";

// Synthetic idle responses are served at the live legacy timer's original endpoint.
export async function assertSessionTimer(
  page: Page,
  nav: Frame,
  outputDir: string,
  capture: (page: Page, screenshotPath: string) => Promise<void>,
): Promise<void> {
  const header = page.frames().find((frame) => new URL(frame.url()).pathname.endsWith("/top.php"));
  assert.ok(header);
  const originalHeaderUrl = header.url();
  const originalViewport = page.viewportSize();
  assert.ok(originalViewport);
  const profile = nav.locator(".ccxp-lite-sidebar-profile");
  const timer = profile.locator(".ccxp-lite-session-timer");
  const warning = profile.locator(".ccxp-lite-session-warning");
  const toggle = profile.locator(".ccxp-lite-session-timer-toggle input");
  const trigger = profile.locator(".ccxp-lite-profile-trigger");
  const mode = profile.locator("#ccxp-lite-profile-mode");
  const idleUrl = (idle: number) => {
    const url = new URL(originalHeaderUrl);
    url.searchParams.set("fixture-idle", String(idle));
    return url.href;
  };
  assert.equal(await timer.isVisible(), false);
  await header.goto(idleUrl(1498));
  await warning.waitFor({ state: "visible" });
  assert.equal(await timer.isVisible(), false, "Hidden timer must still warn at five minutes");
  await trigger.click();
  await toggle.check();
  await trigger.press("Escape");
  await timer.waitFor({ state: "visible" });
  assert.match((await timer.textContent()) ?? "", /^0[45]:\d{2}$/u);
  await capture(page, path.join(outputDir, "session-timer-classic.png"));
  await trigger.click();
  const popup = profile.locator(".ccxp-lite-profile-popover");
  const warningBounds = await warning.boundingBox();
  const popupBounds = await popup.boundingBox();
  assert.ok(warningBounds && popupBounds);
  assert.ok(
    warningBounds.y + warningBounds.height <= popupBounds.y,
    "Reminder sits above settings",
  );
  await capture(page, path.join(outputDir, "session-timer-settings.png"));
  await trigger.press("Escape");
  await warning.getByRole("button").click();
  assert.equal(await warning.isVisible(), false);
  // A search rerenders the profile; the warning stays dismissed and visibility stays enabled.
  await nav.locator(".ccxp-lite-sidebar-search-input").fill("\u6559\u5B78");
  assert.equal(await warning.isVisible(), false);
  assert.equal(await timer.isVisible(), true);
  await nav.locator(".ccxp-lite-sidebar-search-input").fill("");
  await header.goto(idleUrl(0));
  await nav.waitForFunction(
    () =>
      document.querySelector(".ccxp-lite-session-timer")?.textContent.startsWith("29:") === true,
  );
  await header.goto(idleUrl(1501));
  await warning.waitFor({ state: "visible" });
  await trigger.click();
  await mode.selectOption("layered");
  assert.equal(await warning.isVisible(), true);
  assert.equal(await timer.isVisible(), true);
  for (const width of [1280, 600, 375]) {
    // eslint-disable-next-line no-await-in-loop -- Measure and capture each viewport after resizing.
    await page.setViewportSize({ width, height: originalViewport.height });
    // eslint-disable-next-line no-await-in-loop -- Layout is specific to the current viewport.
    const fits = await profile.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const reminder = element.querySelector(".ccxp-lite-session-warning")?.getBoundingClientRect();
      return (
        rect.right <= window.innerWidth &&
        reminder !== undefined &&
        reminder.left >= 0 &&
        reminder.right <= window.innerWidth
      );
    });
    assert.equal(fits, true, `Timer and reminder must fit at ${width}px`);
    // eslint-disable-next-line no-await-in-loop -- Keep captures paired with the preceding viewport assertions.
    await capture(page, path.join(outputDir, `session-timer-layered-${width}.png`));
  }
  await page.setViewportSize(originalViewport);
  await trigger.click();
  await mode.selectOption("classic");
  await trigger.click();
  await toggle.uncheck();
  await trigger.press("Escape");
  await header.goto(originalHeaderUrl);
  await warning.waitFor({ state: "hidden" });
  assert.equal(await timer.isVisible(), false);
  const englishPage = await page.context().newPage();
  try {
    await englishPage.addInitScript(() => {
      sessionStorage.setItem("ccxp-lite-locale", "en");
    });
    await englishPage.goto(page.url());
    const englishNav = englishPage.frames().find((frame) => frame.url().includes("IN_INQ_STU.php"));
    const englishHeader = englishPage
      .frames()
      .find((frame) => new URL(frame.url()).pathname.endsWith("/top.php"));
    assert.ok(englishNav && englishHeader);
    await englishNav.locator("body[data-ccxp-lite-sidebar-applied='true']").waitFor();
    await englishNav.getByText("\u6E2C\u8A66\u540C\u5B78", { exact: true }).waitFor();
    await englishPage.frameLocator('frame[name="main"]').locator(".ccxp-home-wordmark").waitFor();
    await englishNav.waitForFunction(() =>
      [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].every(
        (link) => link.disabled || link.sheet !== null,
      ),
    );
    await englishHeader.goto(idleUrl(1501));
    const englishProfile = englishNav.locator(".ccxp-lite-sidebar-profile");
    await englishProfile
      .getByRole("status")
      .getByText("Logout in 5 min due to inactivity")
      .waitFor();
    await englishProfile.getByRole("button", { name: "Settings", exact: true }).click();
    await englishProfile.getByLabel("Show session timer").check();
    await capture(englishPage, path.join(outputDir, "session-timer-english.png"));
    await englishProfile.locator("#ccxp-lite-profile-mode").selectOption("layered");
    await englishPage.setViewportSize({ width: 375, height: originalViewport.height });
    const englishDismissBounds = await englishProfile
      .getByRole("button", { name: "Dismiss reminder" })
      .boundingBox();
    assert.ok(englishDismissBounds);
    assert.ok(
      englishDismissBounds.x + englishDismissBounds.width <= 375,
      "English reminder keeps its dismiss button in the viewport",
    );
    await capture(englishPage, path.join(outputDir, "session-timer-english-layered-375.png"));
    await englishProfile.getByRole("button", { name: "Dismiss reminder" }).click();
    assert.equal(await englishProfile.locator(".ccxp-lite-session-warning").isVisible(), false);
    await englishProfile.getByRole("button", { name: "Settings", exact: true }).click();
    await englishProfile.getByLabel("Show session timer").uncheck();
    await englishProfile.locator("#ccxp-lite-profile-mode").selectOption("classic");
  } finally {
    await englishPage.close();
  }
}
