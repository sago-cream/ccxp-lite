import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { expect, test } from "vitest";
import { routeWorkLogFixture } from "../../scripts/work-log-fixtures.js";

const origin = "https://www.ccxp.nthu.edu.tw";
const extension = path.resolve("dist/crx/unpacked");

// Opt in to Cloudflare's documented test key. Only the widget uses the network; the captured CCXP
// page and every login submission remain intercepted locally.
test.skipIf(process.env.CCXP_TURNSTILE_NETWORK !== "1").each(["zh", "en"])(
  "Cloudflare %s test widget completes with the packaged extension",
  async (locale) => {
    const profile = mkdtempSync(path.join(tmpdir(), "ccxp-turnstile-network-"));
    const context = await chromium.launchPersistentContext(profile, {
      channel: "chromium",
      headless: true,
      viewport: { width: 1280, height: 960 },
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
    try {
      const fixture = readFileSync(
        `test/browser-fixtures/login-turnstile-host${locale === "en" ? "-en" : ""}.html`,
        "utf8",
      )
        .replace(
          'data-sitekey="0x4AAAAAADgYtgN1iR6QSvJv"',
          'data-sitekey="1x00000000000000000000AA"',
        )
        .replace(
          "</head>",
          '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script></head>',
        )
        .replace(
          "</body>",
          `<script>
        function onTurnstileSuccess(token) {
          document.getElementsByName('code')[0].value = token;
        }
      </script></body>`,
        );
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (
          url.protocol === "chrome-extension:" ||
          url.origin === "https://challenges.cloudflare.com"
        ) {
          await route.continue();
        } else if (url.origin === origin && url.pathname === "/ccxp/INQUIRE/index.php") {
          await route.fulfill({ contentType: "text/html; charset=utf-8", body: fixture });
        } else if (url.origin === origin && url.pathname.endsWith("/pre_select_entry.php")) {
          await route.fulfill({ contentType: "text/html", body: "Offline submission received" });
        } else if (!(await routeWorkLogFixture(route))) {
          await route.abort();
        }
      });
      const page = context.pages()[0] ?? (await context.newPage());
      await page.goto(
        `${origin}/ccxp/INQUIRE/index.php?lang=${locale === "en" ? "english" : "chinese"}`,
      );
      await page.locator("body[data-ccxp-lite-landing-applied='true']").waitFor();
      await page.waitForFunction(() =>
        [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].every(
          (link) => link.sheet !== null,
        ),
      );
      await page.waitForFunction(
        () => {
          const token = document.querySelector<HTMLInputElement>('[name="code"]')?.value;
          const response = document.querySelector<HTMLInputElement>(
            '[name="cf-turnstile-response"]',
          )?.value;
          return token !== undefined && token.includes("DUMMY") && token === response;
        },
        undefined,
        { timeout: 30_000 },
      );
      const widget = page.locator(".cf-turnstile");
      const actions = page.locator(".ccxp-lite-login-action-group");
      const widgetBounds = await widget.boundingBox();
      expect(widgetBounds?.height).toBeGreaterThanOrEqual(65);
      const order = await page.evaluate(() => {
        const challenge = document.querySelector(".cf-turnstile");
        const buttons = document.querySelector(".ccxp-lite-login-action-group");
        return challenge?.nextElementSibling === buttons;
      });
      expect(order).toBe(true);
      const actionBounds = await actions.boundingBox();
      expect(actionBounds?.y).toBeGreaterThan(widgetBounds?.y ?? 0);
      const screenshots = process.env.CCXP_TURNSTILE_SCREENSHOTS;
      if (screenshots !== undefined && screenshots !== "") {
        await page.screenshot({
          path: path.join(screenshots, `login-turnstile-${locale}-1280.png`),
          fullPage: true,
        });
      }
      await page.setViewportSize({ width: 375, height: 960 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= globalThis.innerWidth),
      ).toBe(true);
      const narrowBounds = await widget.boundingBox();
      expect(narrowBounds?.width).toBeLessThanOrEqual(375);
      if (screenshots !== undefined && screenshots !== "") {
        await page.screenshot({
          path: path.join(screenshots, `login-turnstile-${locale}-375.png`),
          fullPage: true,
        });
      }
      await page.locator('[name="account"]').fill("fixture-account");
      await page.locator('[name="passwd"]').fill("fixture-password");
      const request = page.waitForRequest((candidate) => candidate.method() === "POST");
      await page.locator(".ccxp-lite-login-primary-button").click();
      const submitted = await request;
      const fields = new URLSearchParams(submitted.postData() ?? "");
      expect(fields.has("fnstr")).toBe(true);
      expect(fields.get("code")).toContain("DUMMY");
      expect(fields.get("code")).toBe(fields.get("cf-turnstile-response"));
    } finally {
      await context.close();
      rmSync(profile, { recursive: true, force: true });
    }
  },
  60_000,
);
