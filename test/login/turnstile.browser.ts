import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { expect, test } from "vitest";

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

for (const timing of ["initialized", "late-api"] as const) {
  for (const width of [1280, 375, 332, 331, 320]) {
    test(`packaged login preserves Turnstile with ${timing} widget at ${width}px`, async () => {
      const extension = path.resolve(process.env.CCXP_TEST_EXTENSION ?? "dist/crx/unpacked");
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
        await context.route("**/*", async (route) => {
          const url = new URL(route.request().url());
          if (url.protocol === "chrome-extension:") {
            await route.continue();
          } else {
            switch (url.href) {
              case "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/": {
                await route.fulfill({
                  contentType: "text/html; charset=utf-8",
                  // Synchronous loading forces initialization before the rewrite; the late case
                  // waits for the extension marker instead. These are timing simulations.
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
                frameRequests++;
                await route.fulfill({ contentType: "text/html", body: "<p>Offline widget</p>" });

                break;
              }

              default: {
                await route.abort();
                break;
              }
            }
          }
        });
        const page = context.pages()[0] ?? (await context.newPage());
        await page.goto("https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/");
        await page.waitForFunction(() => document.body.dataset.ccxpLiteLandingApplied === "true");
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
