/* eslint-disable no-await-in-loop -- Capture each settled viewport in sequence. */
import assert from "node:assert/strict";
import path from "node:path";
import type { Frame, Page } from "playwright";

export async function assertMenuLayout(
  page: Page,
  nav: Frame,
  outputDir: string,
  capture: (page: Page, screenshotPath: string) => Promise<void>,
  assertHead: boolean,
): Promise<void> {
  const originalViewport = page.viewportSize();
  assert.ok(originalViewport);
  try {
    for (const width of [1280, 602, 601, 600, 375]) {
      await page.setViewportSize({ width, height: originalViewport.height });
      await capture(page, path.join(outputDir, `menu-layout-${width}.png`));
      if (assertHead) {
        const frameWidth = await nav.evaluate(() => window.innerWidth);
        assert.equal(
          await nav.locator(".ccxp-lite-menu-heading").isVisible(),
          frameWidth <= 600,
          `Menu heading follows its frame's 600px breakpoint at page width ${width}px`,
        );
        const layout = await nav.locator(".ccxp-lite-sidebar-content").evaluate((element) => {
          const styles = getComputedStyle(element);
          const dashboard = element.querySelector(".ccxp-lite-dashboard-shell");
          const rect = dashboard?.getBoundingClientRect();
          return {
            left: styles.paddingLeft,
            right: styles.paddingRight,
            dashboardLeft: rect?.left,
            dashboardRight: rect?.right,
            viewportWidth: window.innerWidth,
            overflows: element.scrollWidth > element.clientWidth,
          };
        });
        assert.equal(layout.left, "16px");
        assert.equal(layout.right, "16px");
        assert.equal(layout.dashboardLeft, 16);
        assert.equal(layout.dashboardRight, layout.viewportWidth - 16);
        assert.equal(layout.overflows, false);
      }
    }
  } finally {
    await page.setViewportSize(originalViewport);
  }
}
