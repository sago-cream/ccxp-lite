import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { expect, test } from "vitest";

const tuitionLabels = [
  "Tuition Bills Download",
  "Payment Confirmation Proof(PDF Format)",
  "Tuition Inquiry",
  "Credit Fee Inquiry",
  "Credit Fee Explanation",
  "Payment Authorization Form",
  "Payment Authorization Status Inquiry",
];

test("packaged English sidebar exposes tuition payments and preserves its main-frame destination", async () => {
  const extension = path.resolve("dist/crx/unpacked");
  const profile = mkdtempSync(path.join(tmpdir(), "ccxp-english-payments-"));
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  context.setDefaultTimeout(5000);
  try {
    await context.addInitScript(() => {
      sessionStorage.setItem("ccxp-lite-locale", "en");
      localStorage.setItem("ccxp-lite-sidebar-variant", "classic");
    });
    const fixtures = new Map([
      ["/ccxp/INQUIRE/IN_INQ_STU.php", "test/menu/fixtures/english-payments.html"],
      ["/ccxp/INQUIRE/select_entry.php", "test/browser-fixtures/frameset.html"],
      ["/ccxp/INQUIRE/top.php", "test/browser-fixtures/top.html"],
      ["/ccxp/INQUIRE/xp03_m.htm", "test/browser-fixtures/main.html"],
    ]);
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.protocol === "chrome-extension:") {
        await route.continue();
        return;
      }
      const fixture = fixtures.get(url.pathname);
      if (url.pathname === "/ccxp/INQUIRE/NRT/RTQ92003.php") {
        await route.fulfill({
          contentType: "text/html",
          body: "<p>Tuition download destination</p>",
        });
      } else if (url.origin === "https://www.ccxp.nthu.edu.tw" && fixture !== undefined) {
        await route.fulfill({ contentType: "text/html", body: readFileSync(fixture) });
      } else {
        await route.abort();
      }
    });
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto("https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php?ACIXSTORE=fixture");
    const nav = page.frames().find((frame) => frame.url().includes("IN_INQ_STU.php"));
    if (!nav) {
      throw new Error("Missing navigation frame");
    }
    await nav.locator("body[data-ccxp-lite-sidebar-applied='true']").waitFor();
    await nav.getByTitle("Payments & Aid", { exact: true }).click();
    await nav.getByTitle("Tuition Payments", { exact: true }).click();
    await Promise.all(
      tuitionLabels.map(async (label) => {
        expect(await nav.getByTitle(label, { exact: true }).isVisible()).toBe(true);
      }),
    );
    await nav.getByTitle("Tuition Bills Download", { exact: true }).click();
    await page
      .frameLocator('frame[name="main"]')
      .getByText("Tuition download destination")
      .waitFor();
    const main = page.frames().find((frame) => frame.name() === "main");
    expect(main?.url()).toBe(
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/NRT/RTQ92003.php?ACIXSTORE=fixture",
    );
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 30_000);
