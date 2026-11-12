/* eslint-disable no-await-in-loop -- Inspect each packaged frame and viewport in sequence. */
import assert from "node:assert/strict";
import path from "node:path";
import type { Frame, Page } from "playwright";

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function collectNavigationRegions(page: Page): Promise<readonly Region[]> {
  const result: Region[] = [];
  for (const frame of page.frames()) {
    const components = frame.locator(
      ".ccxp-lite-sidebar-header, .ccxp-lite-sidebar-list, .ccxp-lite-dashboard-shell, .ccxp-lite-pane-detail, .ccxp-lite-menu-heading, .ccxp-lite-profile-popover, .ccxp-lite-profile-avatar, .ccxp-home-header, .ccxp-home-content, .ccxp-lite-sidebar-brand-title, [data-ccxp-lite-remove-pinned-dialog] [role='dialog']",
    );
    for (const element of await components.all()) {
      const rect = await element.boundingBox();
      if (rect) {
        result.push(rect);
      }
    }
    const focus = frame.locator(":focus-visible");
    for (const element of await focus.all()) {
      const rect = await element.boundingBox();
      if (!rect) {
        continue;
      }
      // Only the focus outline/border may change; keep the input's content strict.
      const { x, y, width, height } = rect;
      result.push(
        { x: x - 3, y: y - 3, width: width + 6, height: 6 },
        { x: x - 3, y: y + height - 3, width: width + 6, height: 6 },
        { x: x - 3, y, width: 6, height },
        { x: x + width - 3, y, width: 6, height },
      );
    }
  }
  return result;
}

export async function assertP2Navigation(
  page: Page,
  nav: Frame,
  output: string,
  capture: (page: Page, file: string) => Promise<void>,
  isHead: boolean,
): Promise<void> {
  const viewport = page.viewportSize();
  assert.ok(viewport);
  const input = nav.locator(".ccxp-lite-sidebar-search-input");
  const previous = await input.inputValue();
  try {
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: viewport.height });
      await input.fill("");
      const emptySearch = await nav.locator(".ccxp-lite-sidebar-search").boundingBox();
      await input.fill("no-p2-navigation-match");
      if (isHead) {
        const filledSearch = await nav.locator(".ccxp-lite-sidebar-search").boundingBox();
        assert.ok(emptySearch && filledSearch);
        assert.ok(
          Math.abs(emptySearch.height - filledSearch.height) < 1,
          "Search height stays stable when clear appears",
        );
        const clear = nav.locator(".ccxp-lite-sidebar-search-clear");
        assert.equal(await clear.count(), 1);
        const emptyHintsFit = await nav
          .locator(".ccxp-lite-empty-title, .ccxp-lite-empty-body")
          .evaluateAll((elements: readonly Element[]) =>
            elements.every((element) => element.scrollWidth <= element.clientWidth),
          );
        assert.equal(emptyHintsFit, true, "Empty-result guidance wraps within its container");
        const icons = [
          await nav.locator(".ccxp-lite-sidebar-search > svg").boundingBox(),
          await clear.locator("svg").boundingBox(),
        ];
        assert.ok(icons[0] && icons[1]);
        assert.ok(
          Math.abs(icons[0].y + icons[0].height / 2 - icons[1].y - icons[1].height / 2) < 1,
          "Search and clear icons share a vertical center",
        );
        await clear.click();
        assert.equal(await input.inputValue(), "");
        assert.equal(await input.evaluate((node) => node === document.activeElement), true);
        assert.equal(await clear.isVisible(), false);
        await input.fill("no-p2-navigation-match");
      }
      await capture(page, path.join(output, `navigation-clear-${width}.png`));
    }
  } finally {
    await input.fill(previous);
    await page.setViewportSize(viewport);
  }
}
