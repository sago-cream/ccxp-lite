import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { expect, test } from "vitest";
import { routeWorkLogFixture } from "../../scripts/work-log-fixtures.js";

const origin = "https://www.ccxp.nthu.edu.tw";
const extension = path.resolve("dist/crx/unpacked");

// Behavioral instrumentation only: this is not a visual fixture or a live Cloudflare response. The
// closed shadow root matches the observed embedding.
const host = `<script>
window.fixtureReady = false;
window.turnstileOrAncestorMoved = 0;
window.turnstileOrFormDetached = 0;
const origMoveBefore = Element.prototype.moveBefore;
if (typeof origMoveBefore === 'function') {
  Element.prototype.moveBefore = function(node, child) {
    const widget = document.querySelector('.cf-turnstile');
    if (widget && (node === widget || (node instanceof Node && node.contains(widget)))) {
      window.turnstileOrAncestorMoved++;
    }
    return origMoveBefore.call(this, node, child);
  };
}
new MutationObserver(function(records) {
  const form = document.forms.form1;
  const widget = document.querySelector('.cf-turnstile');
  for (const record of records) {
    for (const node of record.removedNodes) {
      if (
        node === form ||
        node === widget ||
        (node instanceof Node && ((form && node.contains(form)) || (widget && node.contains(widget))))
      ) {
        window.turnstileOrFormDetached++;
      }
    }
  }
}).observe(document.body, { childList: true, subtree: true });
window.fixtureNativeChallenge = document.querySelector('[name=fnstr]');
window.fixtureNativeChallenge.value = 'fixture-native-challenge';
window.onTurnstileSuccess = function(token) {
  document.getElementsByName('code')[0].value = token;
};
window.mountFixtureChallenge = function() {
  const widget = document.querySelector('.cf-turnstile');
  const frame = document.createElement('iframe');
  const response = document.createElement('input');
  response.type = 'hidden'; response.name = 'cf-turnstile-response';
  widget.append(response);
  frame.srcdoc = '<p>Behavior fixture</p>';
  frame.addEventListener('load', function() {
    window.fixtureLoads = (window.fixtureLoads || 0) + 1;
    frame.contentWindow.fixtureIdentity = 'original-context';
    window.fixtureReady = true;
  });
  widget.attachShadow({mode: 'closed'}).append(frame);
  window.fixtureFrame = frame;
  window.fixtureResponse = response;
};
if (!location.search.includes('late')) window.mountFixtureChallenge();
</script>`;

test.each(
  ["zh", "en"].flatMap((locale) =>
    ["early", "late"].flatMap((timing) => [1280, 320].map((width) => ({ locale, timing, width }))),
  ),
)(
  "captured $locale host retains closed-shadow $timing widget and native POST at $width px",
  async ({ locale, timing, width }) => {
    const fixture = readFileSync(
      `test/browser-fixtures/login-turnstile-host${locale === "en" ? "-en" : ""}.html`,
      "utf8",
    );
    const profile = mkdtempSync(path.join(tmpdir(), "ccxp-turnstile-"));
    const context = await chromium.launchPersistentContext(profile, {
      channel: "chromium",
      viewport: { width, height: 960 },
      headless: true,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
    try {
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.protocol === "chrome-extension:") {
          await route.continue();
        } else if (url.origin === origin && url.pathname === "/ccxp/INQUIRE/index.php") {
          await route.fulfill({
            contentType: "text/html; charset=utf-8",
            body: fixture.replace("</body>", `${host}</body>`),
          });
        } else if (url.origin === origin && url.pathname.endsWith("/pre_select_entry.php")) {
          await route.fulfill({
            contentType: "text/html",
            body: "<p>Offline submission received</p>",
          });
        } else if (!(await routeWorkLogFixture(route))) {
          await route.abort();
        }
      });
      const page = context.pages()[0] ?? (await context.newPage());
      await page.goto(
        `${origin}/ccxp/INQUIRE/index.php?${timing}&lang=${locale === "en" ? "english" : "chinese"}`,
      );
      await page.locator("html[data-ccxp-lite-loading-ready='true']").waitFor();
      await page.locator("body[data-ccxp-lite-landing-applied='true']").waitFor();
      await page.waitForFunction(() =>
        [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].every(
          (link) => link.sheet !== null,
        ),
      );
      if (timing === "late") {
        await page.evaluate("window.mountFixtureChallenge()");
      }
      await page.waitForFunction("window.fixtureReady");
      expect(
        await page.evaluate(`({
        loads: window.fixtureLoads,
        turnstileOrAncestorMoved: window.turnstileOrAncestorMoved,
        turnstileOrFormDetached: window.turnstileOrFormDetached,
        identity: window.fixtureFrame.contentWindow.fixtureIdentity,
        connected: window.fixtureFrame.isConnected,
        associated: document.querySelector('[name=code]').form === document.forms.form1,
        nativeChallengeConnected: window.fixtureNativeChallenge.isConnected && window.fixtureNativeChallenge.form === document.forms.form1
      })`),
      ).toEqual({
        loads: 1,
        turnstileOrAncestorMoved: 0,
        turnstileOrFormDetached: 0,
        identity: "original-context",
        connected: true,
        associated: true,
        nativeChallengeConnected: true,
      });
      await page.evaluate(`{
        for (const token of ['fixture-first', '', 'fixture-renewed']) {
          window.fixtureResponse.value = token;
          window.onTurnstileSuccess(token);
          if (new FormData(document.forms.form1).get('code') !== token) throw new Error('Lost host token');
        }
      }`);
      await page.locator("[name=account]").fill("fixture-account");
      await page.locator("[name=passwd]").fill("fixture-password");
      const request = page.waitForRequest((candidate) => candidate.method() === "POST");
      await (timing === "early"
        ? page.locator(".ccxp-lite-login-primary-button").click()
        : page.locator("[name=passwd]").press("Enter"));
      const submitted = await request;
      const fields = new URLSearchParams(submitted.postData() ?? "");
      expect(new URL(submitted.url()).pathname).toBe("/ccxp/INQUIRE/pre_select_entry.php");
      expect(fields.get("fnstr")).toBe("fixture-native-challenge");
      expect(fields.get("code")).toBe("fixture-renewed");
      expect(fields.get("cf-turnstile-response")).toBe("fixture-renewed");
      expect(fields.get("Submit")).toBe(locale === "en" ? "Login" : "\u767B\u5165");
      expect(fields.get("account")).toBe("fixture-account");
      expect(fields.get("passwd")).toBe("fixture-password");
    } finally {
      await context.close();
      rmSync(profile, { recursive: true, force: true });
    }
  },
  30_000,
);
