import assert from "node:assert/strict";
import type { Frame, Page } from "playwright";
import { setProfileMenuMode } from "./profile-fixtures.js";

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
  await popup.click({ position: { x: 3, y: 3 } });
  assert.equal(await popup.isVisible(), true, "Clicks inside settings must not dismiss the popup");
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
  const help = main.locator(".ccxp-home-info button");
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

export async function assertHomeFavorites(
  page: Page,
  nav: Frame,
  capture?: (name: string) => Promise<void>,
): Promise<void> {
  const main = page.frames().find((frame) => frame.name() === "main");
  assert.ok(main);
  // Establish the same real recent destination in full and scoped capture runs.
  const recentSearch = main.locator(".ccxp-home-search > input");
  await recentSearch.fill("\u586B\u5BEB\u6559\u5B78\u610F\u898B\u8ABF\u67E5");
  await main.locator(".ccxp-home-search-result").first().click();
  await main
    .getByText("The system is not available because it is not the period to open.", {
      exact: false,
    })
    .waitFor();
  await nav.locator(".ccxp-lite-sidebar-brand-button").click();
  await main.locator(".ccxp-home-wordmark").waitFor();
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
  const more = nav.locator(".ccxp-lite-sidebar-show-more");
  if ((await more.count()) > 0) {
    const visibleFavorites = nav.locator(
      '[data-ccxp-lite-order-group="category:category-favorites"] > [data-ccxp-lite-order-item]:visible',
    );
    assert.equal(await visibleFavorites.count(), 4);
    await more.press("Enter");
    assert.equal(await visibleFavorites.count(), 10);
    assert.equal(await more.getAttribute("aria-expanded"), "true");
    await more.press("Tab");
    assert.equal(
      await visibleFavorites.nth(4).evaluate((item) => item === item.ownerDocument.activeElement),
      true,
    );
    await more.focus();
    await more.press("Space");
    assert.equal(await visibleFavorites.count(), 4);
    assert.equal(await more.getAttribute("aria-expanded"), "false");
    await more.blur();
  }
  await search.blur();
  await page.mouse.move(1250, 920);
  if (capture) {
    await capture("home-favorites");
    const profile = nav.locator(".ccxp-lite-profile-trigger");
    await profile.click();
    await nav.locator(".ccxp-lite-profile-popover").waitFor({ state: "visible" });
    await capture("profile-expanded");
    await profile.press("Escape");
    const homeSearch = main.locator(".ccxp-home-search > input");
    await homeSearch.fill("\u6559\u5B78");
    await homeSearch.press("ArrowDown");
    await capture("home-search");
    await homeSearch.press("Escape");
    await homeSearch.fill("");
  }
  await main.locator(".ccxp-home-show-all").click();
  assert.equal(await cards.count(), 10);
  const star = cards.first().locator(".ccxp-lite-favorite-toggle");
  await star.click();
  const dialog =
    (await page.locator("dialog[open]").count()) > 0
      ? page.getByRole("dialog")
      : main.getByRole("dialog");
  await dialog.waitFor();
  if (capture) {
    await capture("dialog-remove-favorite");
  }
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

export async function captureNarrowHome(
  source: Page,
  capture: (page: Page, name: string) => Promise<void>,
  assertHead: boolean,
): Promise<void> {
  const page = await source.context().newPage();
  await page.setViewportSize({ width: 375, height: 960 });
  await page.addInitScript(() => {
    localStorage.setItem("ccxp-lite-sidebar-collapsed", "true");
    localStorage.setItem("ccxp-lite-sidebar-variant", "classic");
  });
  try {
    await page.goto(source.url(), { waitUntil: "load" });
    const nav = page.frames().find((frame) => frame.url().includes("IN_INQ_STU.php"));
    const main = page.frames().find((frame) => frame.name() === "main");
    assert.ok(nav && main);
    await main.locator(".ccxp-home-wordmark").waitFor();
    await main.locator(".ccxp-home-card").first().waitFor();
    await page.mouse.move(350, 100);
    await page.waitForFunction(
      () => document.querySelector("frameset[cols]")?.getAttribute("cols") === "64,*",
    );
    const compactMenu = nav.locator(".ccxp-lite-sidebar-open-menu");
    if (assertHead && (await compactMenu.count()) > 0) {
      await compactMenu.dispatchEvent("pointerdown", { pointerType: "touch" });
      assert.equal(
        await nav
          .locator(".ccxp-lite-sidebar-search-input")
          .evaluate((element) => element === element.ownerDocument.activeElement),
        true,
      );
      await main.locator(".ccxp-home-search > input").focus();
      await main.locator(".ccxp-home-search > input").blur();
      await page.waitForFunction(
        () => document.querySelector("frameset[cols]")?.getAttribute("cols") === "64,*",
      );
    }
    await capture(page, "home-favorites-narrow");
    const input = main.locator(".ccxp-home-search > input");
    await input.fill("\u6559\u5B78");
    await input.press("ArrowDown");
    await capture(page, "home-search-narrow");
    const last = main.locator(".ccxp-home-search-result").last();
    await main.locator(".ccxp-home-search-result").first().press("ArrowUp");
    assert.equal(
      await last.evaluate((element) => element === element.ownerDocument.activeElement),
      true,
    );
    await capture(page, "home-search-end-narrow");
    if (assertHead && (await main.locator(".ccxp-home-search-scroll-hint").count()) > 0) {
      assert.equal(await main.locator(".ccxp-home-search-scroll-hint").isVisible(), false);
    }
    await input.fill("fixture-no-matching-function");
    await capture(page, "home-search-empty-narrow");
    if (assertHead) {
      await input.fill("\u7CFB\u7D71");
      await main.waitForFunction(() => {
        const hint = document.querySelector<HTMLElement>(".ccxp-home-search-scroll-hint");
        return hint !== null && !hint.hidden;
      });
      await input.press("ArrowDown");
      await main.locator(".ccxp-home-search-result").first().press("ArrowUp");
      await main.waitForFunction(
        () => document.querySelector<HTMLElement>(".ccxp-home-search-scroll-hint")?.hidden,
      );
    }
    await input.press("Escape");
    await input.fill("");
    await main.locator(".ccxp-home-card-wrap > .ccxp-lite-favorite-toggle").first().click();
    const dialog =
      (await page.locator("dialog[open]").count()) > 0
        ? page.getByRole("dialog")
        : main.getByRole("dialog");
    await dialog.waitFor();
    if (assertHead) {
      const bounds = await dialog.boundingBox();
      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 375);
      if ((await page.locator("dialog[open]").count()) > 0) {
        assert.equal(
          await page.locator("dialog[open]").evaluate((element) => element.matches(":modal")),
          true,
        );
      }
      await dialog.getByRole("button").first().press("Shift+Tab");
      assert.equal(
        await dialog
          .getByRole("button")
          .last()
          .evaluate((element) => element === element.ownerDocument.activeElement),
        true,
      );
      await dialog.getByRole("button").last().press("Tab");
    }
    await capture(page, "dialog-remove-favorite-narrow");
    await dialog.getByRole("button").first().press("Escape");
    await nav.locator(".ccxp-lite-profile-trigger").click();
    await setProfileMenuMode(nav.locator("#ccxp-lite-profile-mode"), "layered");
    await page.waitForFunction(
      () => document.querySelector("frameset[cols]")?.getAttribute("cols") === "*,0",
    );
    await nav.locator(".ccxp-lite-profile-trigger").click();
    await nav.locator(".ccxp-lite-profile-popover").waitFor({ state: "visible" });
    await capture(page, "profile-expanded-narrow");
    await nav.locator(".ccxp-lite-profile-trigger").press("Escape");
    await capture(page, "sidebar-menu-narrow");
    const pinnedMore = nav.locator(".ccxp-lite-pinned-show-more");
    if (assertHead && (await pinnedMore.count()) > 0) {
      const visible = nav.locator(".ccxp-lite-pinned-list > [data-ccxp-lite-order-item]:visible");
      assert.equal(await visible.count(), 4);
      await pinnedMore.press("Enter");
      assert.equal(await visible.count(), 10);
      await pinnedMore.press("Space");
      assert.equal(await visible.count(), 4);
      const heading = await nav.locator(".ccxp-lite-menu-heading").boundingBox();
      assert.ok(heading && heading.x >= 0 && heading.x + heading.width <= 375);
      await nav.locator(".ccxp-lite-menu-return").click();
      assert.equal(
        await nav
          .locator(".ccxp-lite-sidebar-shell")
          .getAttribute("data-ccxp-lite-sidebar-variant"),
        "classic",
      );
    }
  } finally {
    await page.close();
    await source.evaluate(() => {
      localStorage.setItem("ccxp-lite-sidebar-collapsed", "false");
      localStorage.setItem("ccxp-lite-sidebar-variant", "classic");
    });
  }
}

export async function captureNarrowDefaultMenu(
  source: Page,
  capture: (page: Page, name: string) => Promise<void>,
  assertHead: boolean,
): Promise<void> {
  const page = await source.context().newPage();
  await page.setViewportSize({ width: 375, height: 960 });
  await page.addInitScript(() => {
    localStorage.removeItem("ccxp-lite-sidebar-variant");
  });
  try {
    await page.goto(source.url(), { waitUntil: "load" });
    const nav = page.frames().find((frame) => frame.url().includes("IN_INQ_STU.php"));
    assert.ok(nav);
    const shell = nav.locator(".ccxp-lite-sidebar-shell");
    await shell.waitFor();
    await nav.locator(".ccxp-lite-profile-trigger").waitFor();
    if (assertHead) {
      assert.equal(await shell.getAttribute("data-ccxp-lite-sidebar-variant"), "layered");
    } else {
      await nav.locator(".ccxp-lite-profile-trigger").click();
      await setProfileMenuMode(nav.locator("#ccxp-lite-profile-mode"), "layered");
    }
    await page.waitForFunction(
      () => document.querySelector("frameset[cols]")?.getAttribute("cols") === "*,0",
    );
    await nav.locator(".ccxp-lite-pinned-card").first().waitFor();
    await nav.locator(".ccxp-lite-sidebar-content").click({ position: { x: 3, y: 3 } });
    await capture(page, "phone-menu-favorites");
    await nav.locator(".ccxp-lite-pinned-list .ccxp-lite-favorite-toggle").first().click();
    const dialog =
      (await page.locator("dialog[open]").count()) > 0
        ? page.getByRole("dialog")
        : nav.getByRole("dialog");
    await dialog.waitFor();
    await capture(page, "phone-menu-dialog");
    await dialog.getByRole("button").first().press("Escape");
    await nav.locator(".ccxp-lite-sidebar-search-input").fill("\u6559\u5B78");
    await nav.locator(".ccxp-lite-category-card").first().click();
    await nav.locator(".ccxp-lite-pane-detail").waitFor();
    await capture(page, "phone-menu-search");
    if (assertHead) {
      await nav.locator(".ccxp-lite-profile-trigger").click();
      await setProfileMenuMode(nav.locator("#ccxp-lite-profile-mode"), "classic");
      await nav.locator(".ccxp-lite-sidebar-search-input").fill("");
      const visibleFavorites = nav.locator(
        '[data-ccxp-lite-order-group="category:category-favorites"] > [data-ccxp-lite-order-item]:visible',
      );
      const more = nav.locator(".ccxp-lite-sidebar-show-more");
      const firstId = await visibleFavorites.first().getAttribute("data-ccxp-lite-order-item");
      await visibleFavorites.first().press("Alt+Shift+ArrowDown");
      assert.equal(
        await visibleFavorites.nth(1).getAttribute("data-ccxp-lite-order-item"),
        firstId,
      );
      assert.equal(await visibleFavorites.count(), 4);
      await visibleFavorites.nth(1).press("Alt+Shift+ArrowUp");
      assert.equal(
        await visibleFavorites.first().getAttribute("data-ccxp-lite-order-item"),
        firstId,
      );
      await visibleFavorites.last().press("Alt+Shift+ArrowDown");
      assert.equal(await visibleFavorites.count(), 4);
      assert.equal(
        await more.evaluate((element) =>
          element.previousElementSibling?.hasAttribute("data-ccxp-lite-order-item"),
        ),
        true,
      );
    }
  } finally {
    await page.close();
    await source.evaluate(() => {
      localStorage.setItem("ccxp-lite-sidebar-variant", "classic");
    });
  }
}
