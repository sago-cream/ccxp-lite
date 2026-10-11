import assert from "node:assert/strict";
import type { Frame, Locator, Page } from "playwright";

// Exercise the packaged base's native controls and the head's action rows.
export async function setProfileMenuMode(
  mode: Locator,
  variant: "classic" | "layered",
): Promise<void> {
  if (await mode.evaluate((element) => element.tagName === "SELECT")) {
    await mode.selectOption(variant);
    return;
  }
  const current = async () =>
    await mode.evaluate(
      (element) =>
        element.closest<HTMLElement>(".ccxp-lite-sidebar-shell")?.dataset.ccxpLiteSidebarVariant,
    );
  if ((await current()) !== variant) {
    await mode.click();
  }
  assert.equal(await current(), variant);
}

export async function toggleProfileTimer(control: Locator): Promise<void> {
  const checkbox = control.locator("input");
  await ((await checkbox.count()) > 0
    ? checkbox.setChecked(!(await checkbox.isChecked()))
    : control.click());
}

export async function recordProfileActions(page: Page, nav: Frame): Promise<void> {
  const profile = nav.locator(".ccxp-lite-sidebar-profile");
  const toggle = profile.locator(".ccxp-lite-session-timer-toggle");
  const mode = profile.locator("#ccxp-lite-profile-mode");
  const trigger = profile.locator(".ccxp-lite-profile-trigger");
  await page.waitForTimeout(1200);
  await toggleProfileTimer(toggle);
  await page.waitForTimeout(1200);
  await toggleProfileTimer(toggle);
  await page.waitForTimeout(1200);
  await setProfileMenuMode(mode, "layered");
  await trigger.click();
  await page.waitForTimeout(1200);
  await setProfileMenuMode(mode, "classic");
  await trigger.click();
  await page.waitForTimeout(1200);
}
