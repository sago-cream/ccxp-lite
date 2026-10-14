import assert from "node:assert/strict";
import path from "node:path";
import type { Frame, Page } from "playwright";
import { setProfileMenuMode, toggleProfileTimer } from "./profile-fixtures.js";

export async function assertInitialSessionTimer(
  page: Page,
  nav: Frame,
  outputDir: string,
  capture: (page: Page, screenshotPath: string) => Promise<void>,
  verifyVisible: boolean,
): Promise<void> {
  const profile = nav.locator(".ccxp-lite-sidebar-profile");
  const trigger = profile.locator(".ccxp-lite-profile-trigger");
  const toggle = profile.locator(".ccxp-lite-session-timer-toggle");
  const timer = profile.locator(".ccxp-lite-session-timer");
  await trigger.click();
  await toggleProfileTimer(toggle);
  if (verifyVisible) {
    await timer.waitFor({ state: "visible" });
    assert.match((await timer.textContent()) ?? "", /^\d{2}:[0-5]\d$/u);
    const widths = await timer.evaluate((element) => {
      const probe = element.cloneNode(false) as HTMLElement;
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      element.parentElement?.append(probe);
      try {
        return Array.from({ length: 10 }, (_, digit) => {
          probe.textContent = `${digit}${digit}:${digit}${digit}`;
          return probe.getBoundingClientRect().width;
        });
      } finally {
        probe.remove();
      }
    });
    assert.ok(
      Math.max(...widths) - Math.min(...widths) < 0.1,
      `Countdown width stays stable for every digit: ${widths.join(", ")}`,
    );
  }
  await trigger.press("Escape");
  await capture(page, path.join(outputDir, "session-timer-initial.png"));
  await trigger.click();
  await toggleProfileTimer(toggle);
  assert.equal(await timer.isVisible(), false);
  await trigger.press("Escape");
}

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
  const toggle = profile.locator(".ccxp-lite-session-timer-toggle");
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
  await toggleProfileTimer(toggle);
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
  await setProfileMenuMode(mode, "layered");
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
  await setProfileMenuMode(mode, "classic");
  await trigger.click();
  await toggleProfileTimer(toggle);
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
    const collapse = englishNav.locator(".ccxp-lite-sidebar-collapse");
    if ((await collapse.count()) > 0) {
      assert.equal(await collapse.getAttribute("aria-label"), "Collapse sidebar");
    }
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
    await toggleProfileTimer(englishProfile.locator(".ccxp-lite-session-timer-toggle"));
    await capture(englishPage, path.join(outputDir, "session-timer-english.png"));
    await setProfileMenuMode(englishProfile.locator("#ccxp-lite-profile-mode"), "layered");
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
    const englishPopupBounds = await englishProfile
      .locator(".ccxp-lite-profile-popover")
      .boundingBox();
    assert.ok(englishPopupBounds);
    assert.ok(englishPopupBounds.x >= 0 && englishPopupBounds.x + englishPopupBounds.width <= 375);
    await capture(englishPage, path.join(outputDir, "profile-english-layered-375.png"));
    await toggleProfileTimer(englishProfile.locator(".ccxp-lite-session-timer-toggle"));
    await setProfileMenuMode(englishProfile.locator("#ccxp-lite-profile-mode"), "classic");
  } finally {
    await englishPage.close();
  }
}
