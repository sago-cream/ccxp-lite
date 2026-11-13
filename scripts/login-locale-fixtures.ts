import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { BrowserContext, Page } from "playwright";

const fixtureRoot = path.resolve("test/browser-fixtures");
const provenance = JSON.parse(
  readFileSync(path.join(fixtureRoot, "login-turnstile.provenance.json"), "utf8"),
) as { hostAssets: Array<{ route: string; file: string }> };
const assets = new Map(provenance.hostAssets.map((asset) => [asset.route, asset.file]));
assets.set("/ccxp/INQUIRE/images/ndPortalEn.png", "host-assets/turnstile-login/ndPortalEn.png");
const fixtures = { zh: "login-locale-zh.html", en: "login-locale-en.html" };

export async function captureLoginLocales(
  context: BrowserContext,
  page: Page,
  output: string,
  extension: string,
  assertCorrectLocale: boolean,
): Promise<void> {
  const savedLocale = await page.evaluate(() => sessionStorage.getItem("ccxp-lite-locale"));
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/ccxp/INQUIRE/index.php" && url.searchParams.has("locale-fixture")) {
      const locale = url.searchParams.get("locale-fixture") === "en" ? "en" : "zh";
      await route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: readFileSync(path.join(fixtureRoot, fixtures[locale])),
      });
      return;
    }
    const asset = assets.get(url.pathname);
    if (asset !== undefined && route.request().frame().url().includes("locale-fixture=")) {
      await route.fulfill({
        contentType: (
          { ".css": "text/css", ".gif": "image/gif", ".png": "image/png" } as Record<string, string>
        )[path.extname(asset)],
        body: readFileSync(path.join(fixtureRoot, asset)),
      });
      return;
    }
    await route.fallback();
  });
  const evidence: Array<Record<string, unknown>> = [];
  /* eslint-disable no-await-in-loop -- Capture each locale and viewport on the same page. */
  for (const locale of ["zh", "en"] as const) {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 960 });
      await page.goto(
        `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/index.php?locale-fixture=${locale}`,
      );
      await page.locator("body[data-ccxp-lite-landing-applied='true']").waitFor();
      const actual = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        title: document.querySelector("h1")?.textContent,
        account: document.querySelector(".ccxp-lite-login-field-label")?.textContent,
        passwordHelp: document
          .querySelector(".ccxp-lite-password-help-popup-shell")
          ?.previousElementSibling?.getAttribute("aria-label"),
        helper: document.querySelector(".ccxp-lite-login-helper-link")?.textContent,
        clockInOut: document.querySelector("a[href='https://punch.ccxp.nthu.edu.tw/']")
          ?.textContent,
        theme: getComputedStyle(document.documentElement)
          .getPropertyValue("--ccxp-lite-primary")
          .trim(),
      }));
      assert.notEqual(actual.theme, "", "The packaged theme must finish before capture");
      if (assertCorrectLocale) {
        assert.equal(actual.lang, locale);
        assert.equal(actual.title, locale === "zh" ? "\u767B\u5165" : "Login");
        assert.equal(actual.clockInOut, locale === "zh" ? "\u7C3D\u5230\u9000" : "Clock in / out");
        assert.equal(actual.account, locale === "zh" ? "\u5E33\u865F" : "Username");
        assert.equal(
          actual.helper,
          locale === "zh"
            ? "\u9996\u6B21\u767B\u5165 / \u5FD8\u8A18\u5BC6\u78BC?"
            : "First login / Forgot password?",
        );
        assert.equal(
          actual.passwordHelp,
          locale === "zh" ? "\u5BC6\u78BC\u898F\u5247" : "Password rules",
        );
      }
      await page.evaluate(async () => await document.fonts.ready);
      const file = `login-locale-${locale}-${width}.png`;
      await page.screenshot({
        path: path.join(output, file),
        animations: "disabled",
        caret: "hide",
      });
      evidence.push({
        file,
        width,
        actual,
        fixture: fixtures[locale],
        fixtureSha256: createHash("sha256")
          .update(readFileSync(path.join(fixtureRoot, fixtures[locale])))
          .digest("hex"),
      });
    }
  }
  /* eslint-enable no-await-in-loop */
  await page.evaluate((locale) => {
    if (locale === null) {
      sessionStorage.removeItem("ccxp-lite-locale");
    } else {
      sessionStorage.setItem("ccxp-lite-locale", locale);
    }
  }, savedLocale);
  await page.setViewportSize({ width: 1280, height: 960 });
  writeFileSync(
    path.join(output, "login-locales.json"),
    `${JSON.stringify(
      {
        localeScriptSha256: createHash("sha256")
          .update(readFileSync(path.join(extension, "login/locale.js")))
          .digest("hex"),
        limitations:
          "Anonymous live-derived DOM with host assets; no API or simulated verification widget. Captures certify locale labels, not Cloudflare behavior.",
        evidence,
      },
      undefined,
      2,
    )}\n`,
  );
}
