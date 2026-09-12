/* eslint-disable no-await-in-loop -- One browser page is intentionally reused across ordered scenarios. */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const siteDirectory = path.resolve("storybook-static");
const index = JSON.parse(readFileSync(path.join(siteDirectory, "index.json"), "utf8")) as {
  entries: Record<string, { id: string; type: string }>;
};
const stories = Object.values(index.entries).filter((entry) => entry.type === "story");
assert.ok(stories.length > 0, "Build Storybook before running its browser checks.");
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const requested = path.resolve(
      siteDirectory,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (!requested.startsWith(`${siteDirectory}${path.sep}`)) {
      return new Response("Not found", { status: 404 });
    }
    const file = Bun.file(requested);
    return (await file.exists()) ? new Response(file) : new Response("Not found", { status: 404 });
  },
});
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
const page = await browser.newPage();
page.on("pageerror", (error) => errors.push(error.message));
const outputDirectory = path.resolve(".build/design-review");
mkdirSync(outputDirectory, { recursive: true });
const storyUrl = (id: string, locale = "en") =>
  `${server.url}iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`;

try {
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 960 });
    for (const locale of ["zh-TW", "en"]) {
      for (const story of stories) {
        await page.goto(storyUrl(story.id, locale));
        await page.locator(".ds-surface").waitFor();
        assert.equal(await page.locator("html").getAttribute("lang"), locale);
        assert.equal(
          await page.evaluate(() =>
            getComputedStyle(document.documentElement)
              .getPropertyValue("--ccxp-lite-primary")
              .trim()
              .toLowerCase(),
          ),
          "#9f5fa5",
        );
      }
    }
    process.stdout.write(`Rendered ${stories.length} stories in both languages at ${width}px.\n`);
  }

  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto(storyUrl("components-action-button--primary"));
  const primary = page.getByRole("button", { name: "Confirm submission", exact: true });
  await primary.waitFor();
  assert.equal(await primary.evaluate((element) => element.getBoundingClientRect().height), 40);
  await page.keyboard.press("Tab");
  assert.equal(await primary.evaluate((element) => element.matches(":focus-visible")), true);

  await page.goto(storyUrl("components-help-popover--closed"));
  const help = page.getByRole("button", { name: "Instructions" });
  await help.click();
  assert.equal(await help.getAttribute("aria-expanded"), "true");
  await page.screenshot({ path: path.join(outputDirectory, "popover.png") });
  await page.keyboard.press("Escape");
  assert.equal(await help.getAttribute("aria-expanded"), "false");

  await page.goto(storyUrl("components-form-field--with-help"));
  await page.getByLabel("Account", { exact: true }).fill("student-example");
  assert.equal(await page.getByLabel("Account", { exact: true }).inputValue(), "student-example");
  await page.screenshot({ path: path.join(outputDirectory, "field.png") });

  await page.goto(storyUrl("recipes-composition--confirmation"));
  const open = page.getByRole("button", { name: "Preview confirmation" });
  await open.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Cancel", exact: true })
      .evaluate((element) => element === document.activeElement),
    true,
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .getByRole("button", { name: "Confirm", exact: true })
      .evaluate((element) => element === document.activeElement),
    true,
  );
  await page.screenshot({ path: path.join(outputDirectory, "confirmation.png") });
  await page.keyboard.press("Escape");
  assert.equal(await dialog.count(), 0);
  assert.equal(await open.evaluate((element) => element === document.activeElement), true);
  await open.click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  assert.equal(await page.getByRole("status").textContent(), "Confirmed.");

  const documentation = [
    [
      "start-here-design-guidelines--docs",
      "ccxpLite \u8A2D\u8A08\u6307\u5357",
      "ccxpLite design guidelines",
    ],
    [
      "start-here-composition-recipes--docs",
      "\u5143\u4EF6\u7D44\u5408\u6307\u5357",
      "Composition recipes",
    ],
    ["foundations-tokens--docs", "\u8A2D\u8A08\u8B8A\u6578", "Tokens"],
    ["components-action-button--docs", "\u64CD\u4F5C\u6309\u9215", "Action button"],
  ];
  for (const [id, zh, en] of documentation) {
    for (const locale of ["zh-TW", "en"]) {
      await page.goto(`${server.url}iframe.html?id=${id}&viewMode=docs&globals=locale:${locale}`);
      await page.getByRole("heading", { level: 1, name: locale === "en" ? en : zh }).waitFor();
      assert.equal(await page.locator("html").getAttribute("lang"), locale);
      if (id === "components-action-button--docs") {
        await page
          .getByRole("button", {
            name: locale === "en" ? "Cancel" : "\u53D6\u6D88",
            exact: true,
          })
          .waitFor();
      }
    }
  }

  // Check the actual toolbar channel, including standalone docs and navigation after a switch.
  await page.goto(`${server.url}?path=/docs/start-here-design-guidelines--docs`);
  const docs = page.frameLocator("#storybook-preview-iframe");
  await docs
    .getByRole("heading", { level: 1, name: "ccxpLite \u8A2D\u8A08\u6307\u5357" })
    .waitFor();
  await page.getByRole("button", { name: "\u8A9E\u8A00 / Language" }).click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await docs.getByRole("heading", { level: 1, name: "ccxpLite design guidelines" }).waitFor();
  await page.locator("#foundations-tokens").getByText("Tokens", { exact: true }).waitFor();
  await page.locator("#start-here-composition-recipes--docs").click();
  await docs.getByRole("heading", { level: 1, name: "Composition recipes" }).waitFor();
  await page.getByRole("button", { name: "\u8A9E\u8A00 / Language" }).click();
  await page
    .getByRole("option", { name: "\u7E41\u9AD4\u4E2D\u6587\uFF08\u53F0\u7063\uFF09", exact: true })
    .click();
  await docs
    .getByRole("heading", { level: 1, name: "\u5143\u4EF6\u7D44\u5408\u6307\u5357" })
    .waitFor();
  await page
    .locator("#foundations-tokens")
    .getByText("\u8A2D\u8A08\u8B8A\u6578", { exact: true })
    .waitFor();
  await page.locator("#components-action-button").click();
  await docs.getByRole("heading", { level: 1, name: "\u64CD\u4F5C\u6309\u9215" }).waitFor();
  await docs.getByRole("button", { name: "\u53D6\u6D88", exact: true }).waitFor();
  await page.getByRole("button", { name: "\u8A9E\u8A00 / Language" }).click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await docs.getByRole("heading", { level: 1, name: "Action button" }).waitFor();
  await docs.getByRole("button", { name: "Cancel", exact: true }).waitFor();
  await page.locator("#components-form-field").click();
  await docs.getByRole("heading", { level: 1, name: "Form field" }).waitFor();
  const fields = docs.getByRole("textbox", { name: "Account", exact: true });
  await fields.nth(2).waitFor();
  assert.equal(await fields.count(), 3);
  const fieldIds = await fields.evaluateAll((elements: readonly Element[]) =>
    elements.map((element) => element.id),
  );
  assert.equal(new Set(fieldIds).size, 3, "Inline examples must have unique label targets.");
  await page.getByRole("button", { name: "\u8A9E\u8A00 / Language" }).click();
  await page
    .getByRole("option", { name: "\u7E41\u9AD4\u4E2D\u6587\uFF08\u53F0\u7063\uFF09", exact: true })
    .click();
  await page.locator("#start-here-composition-recipes--docs").click();
  await page.reload();
  await docs
    .getByRole("heading", { level: 1, name: "\u5143\u4EF6\u7D44\u5408\u6307\u5357" })
    .waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-TW");
  await page.screenshot({ path: path.join(outputDirectory, "catalog-zh-TW.png") });
  assert.deepEqual(errors, [], "Storybook must not emit browser errors.");
  process.stdout.write(
    `Component interactions and documentation passed. Captures: ${outputDirectory}\n`,
  );
} finally {
  await browser.close();
  await server.stop(true);
}
