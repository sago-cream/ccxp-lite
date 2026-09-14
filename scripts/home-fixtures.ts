import assert from "node:assert/strict";
import type { Frame, Page } from "playwright";

export async function assertProfile(page: Page, nav: Frame, recordVideo = false): Promise<void> {
  const profile = nav.locator(".ccxp-lite-sidebar-profile");
  await profile.getByText("\u6E2C\u8A66\u540C\u5B78", { exact: true }).waitFor();
  assert.equal(await profile.locator(".ccxp-lite-profile-avatar").textContent(), "ST");
  const trigger = profile.locator(".ccxp-lite-profile-trigger");
  const popup = profile.locator(".ccxp-lite-profile-popover");
  assert.equal(await popup.isVisible(), false);
  await trigger.click();
  if (recordVideo) {
    await page.waitForTimeout(1200);
  }
  await profile.locator("label").click({ position: { x: 3, y: 3 } });
  assert.equal(await popup.isVisible(), true, "Label clicks must not dismiss the popup");
  const logout = profile.locator(".ccxp-lite-profile-logout");
  assert.equal(await logout.getAttribute("target"), "_top");
  assert.match((await logout.getAttribute("href")) ?? "", /logout\.php/u);
  const before = await logout.boundingBox();
  await logout.hover();
  assert.deepEqual(await logout.boundingBox(), before, "Legacy link hover must not move logout");
  if (recordVideo) {
    await page.waitForTimeout(1200);
  }
  await logout.press("Escape");
  assert.equal(await popup.isVisible(), false);
  await trigger.click();
  await page.frameLocator('frame[name="main"]').locator(".ccxp-home-wordmark").click();
  assert.equal(await popup.isVisible(), false, "Content frame clicks must dismiss the popup");
  const gap = await profile.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const content = element.parentElement?.querySelector(".ccxp-lite-sidebar-content");
    return {
      above: rect.top - (content?.getBoundingClientRect().bottom ?? 0),
      below: window.innerHeight - rect.bottom,
    };
  });
  assert.deepEqual(gap, { above: 16, below: 16 });
}

export async function assertHome(page: Page, nav: Frame, recordVideo = false): Promise<void> {
  const main = page.frames().find((frame) => frame.name() === "main");
  assert.ok(main);
  await main.locator(".ccxp-home-wordmark").waitFor();
  const help = main.getByRole("button", {
    name: "\u7CFB\u7D71\u4F7F\u7528\u8AAA\u660E",
    exact: true,
  });
  await help.click();
  assert.equal(await main.locator(".ccxp-home-info li").count(), 4);
  if (recordVideo) {
    await page.waitForTimeout(1500);
  }
  await help.press("Escape");
  assert.equal(await main.locator(".ccxp-home-info ul").isVisible(), false);
  await assertProfile(page, nav, recordVideo);
  const input = main.locator(".ccxp-home-search > input");
  const favorites = main.locator("#ccxp-home-cards");
  const before = await favorites.innerHTML();
  await input.fill("\u6559\u5B78");
  assert.ok((await main.locator(".ccxp-home-search-result").count()) > 0);
  assert.equal(await favorites.innerHTML(), before, "Search must not replace favorites");
  await input.press("ArrowDown");
  assert.equal(await main.locator(".ccxp-home-search-result:focus").count(), 1);
  if (recordVideo) {
    await page.waitForTimeout(1500);
  }
  await input.press("Escape");
  assert.equal(await main.locator(".ccxp-home-search-results").isVisible(), false);
  await input.fill("");
}

export async function assertHomeFavorites(page: Page, nav: Frame): Promise<void> {
  const main = page.frames().find((frame) => frame.name() === "main");
  assert.ok(main);
  const search = nav.locator(".ccxp-lite-sidebar-search-input");
  await search.fill("\u7CFB\u7D71");
  for (let index = 0; index < 10; index++) {
    // Choose individual functions so removing one cannot be masked by a pinned group.
    const star = nav
      .locator('.ccxp-lite-item .ccxp-lite-favorite-toggle[aria-pressed="false"]')
      .first();
    // eslint-disable-next-line no-await-in-loop -- Each click updates the persisted favorites before the next selection.
    await star.click();
  }
  await search.fill("");
  const cards = main.locator("#ccxp-home-cards > .ccxp-home-card-wrap");
  assert.equal(await cards.count(), 8);
  await main.locator(".ccxp-home-show-all").click();
  assert.equal(await cards.count(), 10);
  const star = cards.first().locator(".ccxp-lite-favorite-toggle");
  await star.click();
  const dialog = main.getByRole("dialog");
  await dialog.waitFor();
  await dialog.getByRole("button").first().click();
  assert.equal(await cards.count(), 10, "Cancel must keep the favorite");
  await star.click();
  await dialog.getByRole("button").last().click();
  await main.waitForFunction(
    () => document.querySelectorAll("#ccxp-home-cards > .ccxp-home-card-wrap").length === 9,
  );
  const input = main.locator(".ccxp-home-search > input");
  await input.fill("\u586B\u5BEB\u6559\u5B78\u610F\u898B\u8ABF\u67E5");
  await main.locator(".ccxp-home-search-result").first().click();
  await main
    .getByText("The system is not available because it is not the period to open.", {
      exact: false,
    })
    .waitFor();
  await nav.locator(".ccxp-lite-sidebar-brand-button").click();
  await main.locator(".ccxp-home-recents:not([hidden])").waitFor();
  assert.equal(await main.locator(".ccxp-home-recents .ccxp-home-card").count(), 1);
  await main.locator(".ccxp-home-recents .ccxp-lite-favorite-toggle").click();
  assert.equal(
    await main.locator(".ccxp-home-recents").isVisible(),
    false,
    "Hide recents when every entry is a favorite",
  );
}

export async function assertMenuProfile(page: Page, nav: Frame): Promise<void> {
  const original = page.viewportSize();
  assert.ok(original);

  for (const width of [1280, 600, 375]) {
    // eslint-disable-next-line no-await-in-loop -- Resize before measuring this viewport.
    await page.setViewportSize({ width, height: original.height });
    // eslint-disable-next-line no-await-in-loop -- Layout depends on the preceding resize.
    const bounds = await nav.locator(".ccxp-lite-sidebar-header").evaluate((header) => {
      const profile = header.querySelector(".ccxp-lite-sidebar-profile");
      const rect = profile?.getBoundingClientRect();
      const bar = header.getBoundingClientRect();
      return {
        height: bar.height,
        expected: Number.parseFloat(
          getComputedStyle(header).getPropertyValue("--ccxp-lite-size-landing-header-height"),
        ),
        fits:
          rect !== undefined &&
          rect.right <= window.innerWidth &&
          rect.top >= bar.top &&
          rect.bottom <= bar.bottom,
      };
    });
    assert.equal(bounds.height, bounds.expected);
    assert.equal(bounds.fits, true);
  }
  await page.setViewportSize(original);
}
