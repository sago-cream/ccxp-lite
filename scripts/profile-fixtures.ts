import assert from "node:assert/strict";
import type { Locator } from "playwright";

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
