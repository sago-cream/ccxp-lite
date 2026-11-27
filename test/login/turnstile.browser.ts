import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { BrowserContext, Page } from "playwright";
import { chromium } from "playwright";
import { expect, test } from "vitest";

const extension = path.resolve(process.env.CCXP_TEST_EXTENSION ?? "dist/crx/unpacked");

// Behavioral shim models documented widget dimensions; no screenshots or live CAPTCHA solving.
const apiShim = `
function initialize() {
  const host = document.querySelector('.cf-turnstile');
  const frame = document.createElement('iframe');
  frame.title = 'Offline verification fixture';
  frame.src = 'https://challenges.cloudflare.com/fixture-widget';
  const compact = host.dataset.size === 'compact';
  frame.style.cssText = compact
    ? 'width:150px;min-width:150px;height:140px;border:0'
    : 'width:100%;min-width:300px;height:65px;border:0';
  host.attachShadow({mode: 'open'}).append(frame);
  const response = document.createElement('input');
  response.type = 'hidden';
  response.name = 'cf-turnstile-response';
  response.value = 'synthetic-token';
  host.append(response);
  frame.addEventListener('load', () => {
    host.dataset.fixtureLoads = String(Number(host.dataset.fixtureLoads || 0) + 1);
    onTurnstileSuccess('synthetic-token');
  });
}
`;

async function routeTurnstileFixture(
  context: BrowserContext,
  timing: "initialized" | "late-api",
  onFrameRequest: () => void,
) {
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === "chrome-extension:") {
      await route.continue();
      return;
    }
    switch (url.href) {
      case "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/": {
        await route.fulfill({
          contentType: "text/html; charset=utf-8",
          // Simulate synchronous loading so the initialized case runs before the rewrite.
          body: readFileSync("test/browser-fixtures/login-turnstile.html", "utf8").replace(
            "async defer",
            "",
          ),
        });
        break;
      }

      case "https://challenges.cloudflare.com/turnstile/v0/api.js": {
        await route.fulfill({
          contentType: "application/javascript",
          body:
            apiShim +
            (timing === "initialized"
              ? "if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize); else initialize();"
              : `const observer = new MutationObserver(() => {
                  if (document.body.dataset.ccxpLiteLandingApplied !== 'true') return;
                  observer.disconnect(); initialize();
                });
                if (document.body.dataset.ccxpLiteLandingApplied === 'true') initialize();
                else observer.observe(document.body, {attributes: true});`),
        });
        break;
      }

      case "https://challenges.cloudflare.com/fixture-widget": {
        onFrameRequest();
        await route.fulfill({ contentType: "text/html", body: "<p>Offline widget</p>" });
        break;
      }

      default: {
        await route.abort();
        break;
      }
    }
  });
}

async function waitForLandingStyles(page: Page) {
  await page.waitForFunction(() => {
    // Chromium populates link.sheet before nested CSS imports finish loading, and the fixture
    // aborts the host css/style.css link. Gate on computed styles from the imported landing sheets
    // instead.
    if (document.querySelector('[data-ccxp-lite-stylesheet="true"]') === null) {
      return false;
    }
    const form = document.querySelector<HTMLElement>("form.ccxp-lite-login-form");
    const notices = document.querySelector<HTMLElement>(".ccxp-lite-landing-notices");
    return (
      getComputedStyle(document.body).display === "flex" &&
      form !== null &&
      getComputedStyle(form).display === "flex" &&
      (notices === null || getComputedStyle(notices).display === "flex")
    );
  });
}

for (const timing of ["initialized", "late-api"] as const) {
  for (const width of [1280, 375, 332, 331, 320]) {
    test(`packaged login preserves Turnstile with ${timing} widget at ${width}px`, async () => {
      const profile = mkdtempSync(path.join(tmpdir(), "ccxp-turnstile-"));
      const context = await chromium.launchPersistentContext(profile, {
        channel: "chromium",
        headless: true,
        viewport: { width, height: 960 },
        args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
      });
      context.setDefaultTimeout(5000);
      let frameRequests = 0;
      try {
        await routeTurnstileFixture(context, timing, () => {
          frameRequests++;
        });
        const page = context.pages()[0] ?? (await context.newPage());
        await page.goto("https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/");
        await page.waitForFunction(() => document.body.dataset.ccxpLiteLandingApplied === "true");
        await waitForLandingStyles(page);
        const host = page.locator(".cf-turnstile");
        await expect.poll(async () => await host.getAttribute("data-fixture-loads")).toBe("1");
        expect(frameRequests).toBe(1);
        expect(await host.getAttribute("data-size")).toBe(width < 332 ? "compact" : "flexible");
        expect(await host.getAttribute("data-theme")).toBe("light");
        expect(
          await host.evaluate((el) =>
            el.nextElementSibling?.classList.contains("ccxp-lite-login-action-group"),
          ),
        ).toBe(true);

        const widgetBox = await host.boundingBox();
        const buttonBox = await page.locator(".ccxp-lite-login-primary-button").boundingBox();
        expect(widgetBox).not.toBeNull();
        expect(buttonBox).not.toBeNull();
        expect(widgetBox?.x).toBe(buttonBox?.x);
        expect(widgetBox?.width).toBe(buttonBox?.width);
        const frameBox = await host.locator("iframe").boundingBox();
        expect(frameBox).not.toBeNull();
        if (!frameBox || !widgetBox) {
          throw new Error("Missing verification frame or container geometry");
        }
        if (width === 320) {
          expect(widgetBox.width).toBe(288);
        }
        expect(frameBox.x).toBeGreaterThanOrEqual(widgetBox.x);
        expect(frameBox.x + frameBox.width).toBeLessThanOrEqual(widgetBox.x + widgetBox.width + 1);
        if (width < 332) {
          expect(frameBox.width).toBe(150);
          expect(frameBox.x - widgetBox.x).toBeCloseTo((widgetBox.width - 150) / 2);
        }
        expect(widgetBox.y + widgetBox.height).toBeLessThan(buttonBox?.y ?? 0);
        expect(page.frames().some((frame) => frame.url().endsWith("/fixture-widget"))).toBe(true);
        expect(await page.locator("head script[src*='turnstile/v0/api.js']").count()).toBe(1);
        expect(await page.locator("input[name='passwd2']").count()).toBe(0);
        expect(await page.locator(".ccxp-lite-captcha-refresh").count()).toBe(0);
        const payload = await page.locator("form").evaluate((form: HTMLFormElement) => {
          const data = new FormData(form);
          return {
            code: data.get("code"),
            response: data.get("cf-turnstile-response"),
            action: form.getAttribute("action"),
          };
        });
        expect(payload).toEqual({
          code: "synthetic-token",
          response: "synthetic-token",
          action: "pre_select_entry.php",
        });
        expect(
          await page
            .locator(".ccxp-lite-landing-header")
            .evaluate((el) => el.nextElementSibling?.classList.contains("ccxp-lite-landing-body")),
        ).toBe(true);
      } finally {
        await context.close();
        rmSync(profile, { recursive: true, force: true });
      }
    }, 20_000);
  }
}

test("packaged login keeps flexible Turnstile and avoids clipping at 1050x680", async () => {
  const profile = mkdtempSync(path.join(tmpdir(), "ccxp-turnstile-1050-"));
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
    viewport: { width: 1050, height: 680 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  context.setDefaultTimeout(5000);
  let frameRequests = 0;
  try {
    await routeTurnstileFixture(context, "initialized", () => {
      frameRequests++;
    });
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto("https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/");
    await page.waitForFunction(() => document.body.dataset.ccxpLiteLandingApplied === "true");
    await waitForLandingStyles(page);
    const host = page.locator(".cf-turnstile");
    await expect.poll(async () => await host.getAttribute("data-fixture-loads")).toBe("1");
    expect(frameRequests).toBe(1);
    expect(await host.getAttribute("data-size")).toBe("flexible");

    const metrics = await page.evaluate(() => {
      const form = document.querySelector("form");
      const notices = document.querySelector(".ccxp-lite-landing-notices");
      const helper = document.querySelector(".ccxp-lite-login-helper-link");
      const footer = document.querySelector(".ccxp-lite-landing-footer");
      if (!form || !notices || !helper || !footer) {
        return undefined;
      }
      const bodyStyle = getComputedStyle(document.body);
      return {
        overflowX: bodyStyle.overflowX,
        overflowY: bodyStyle.overflowY,
        formRight: form.getBoundingClientRect().right,
        noticesRight: notices.getBoundingClientRect().right,
        footerRight: footer.getBoundingClientRect().right,
        helperBottom: helper.getBoundingClientRect().bottom,
        footerTop: footer.getBoundingClientRect().top,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    expect(metrics).toBeDefined();
    if (!metrics) {
      throw new Error("Missing landing layout metrics");
    }
    expect(metrics.overflowX).toBe("clip");
    expect(metrics.overflowY).toBe("visible");
    expect(metrics.formRight).toBeLessThanOrEqual(1050);
    expect(metrics.noticesRight).toBeLessThanOrEqual(1050);
    expect(metrics.footerRight).toBeLessThanOrEqual(1050);
    expect(metrics.helperBottom).toBeLessThanOrEqual(metrics.footerTop);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 20_000);
