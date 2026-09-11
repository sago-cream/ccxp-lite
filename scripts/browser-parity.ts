import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { parseArgs } from "node:util";
import path from "node:path";
import { tmpdir } from "node:os";
import { assertWorkLogReady, routeWorkLogFixture, workLogPath } from "./work-log-fixtures.js";
import pixelmatch from "pixelmatch";
import type { BrowserContext, Frame, Page } from "playwright";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const projectRoot = process.cwd();
const fixtureRoot = path.join(projectRoot, "test", "browser-fixtures");
const defaultExtensionDir = path.join(projectRoot, "dist", "crx", "unpacked");
const defaultOutputDir = path.join(projectRoot, ".browser-parity");
const viewport = { width: 1280, height: 960 };
const ccxpOrigin = "https://www.ccxp.nthu.edu.tw";
const maximumPixelDifferenceRatio = 0.000_06;

type Probe = Readonly<{
  name: string;
  selector: string;
  properties: readonly string[];
  inlinePriorities?: readonly string[];
}>;

interface CaptureResult {
  readonly screenshots: Readonly<Record<string, string>>;
  readonly styles: Readonly<Record<string, unknown>>;
}

const fixtureByPath = new Map<string, string>([
  ["/ccxp/INQUIRE/", "login.html"],
  ["/ccxp/INQUIRE/IN_INQ_STU.php", "navigation.html"],
  ["/ccxp/INQUIRE/JH/B/B.2/B.2.3/JHB23001.php", "standalone.html"],
  ["/ccxp/INQUIRE/select_entry.php", "frameset.html"],
  ["/ccxp/INQUIRE/top.php", "top.html"],
  ["/ccxp/INQUIRE/xp03_m.htm", "main.html"],
]);

const visualProperties = [
  "display",
  "visibility",
  "position",
  "overflow",
  "width",
  "height",
  "margin",
  "padding",
  "color",
  "background-color",
  "background-image",
  "border",
  "border-radius",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
];

const loginProbes: readonly Probe[] = [
  { name: "shell", selector: ".ccxp-lite-landing-shell", properties: visualProperties },
  {
    name: "account",
    selector: "input[name='account']",
    properties: visualProperties,
    inlinePriorities: ["width", "color"],
  },
  {
    name: "password",
    selector: "input[name='passwd']",
    properties: visualProperties,
    inlinePriorities: ["width", "border"],
  },
  {
    name: "submit",
    selector: "form button[type='submit'], form input[type='submit']",
    properties: visualProperties,
  },
  {
    name: "languages",
    selector: "ul.links",
    properties: visualProperties,
    inlinePriorities: ["font-size", "visibility"],
  },
];

const standaloneProbes: readonly Probe[] = [
  {
    name: "body",
    selector: "body",
    properties: visualProperties,
    inlinePriorities: ["background-color"],
  },
];

const sidebarProbes: readonly Probe[] = [
  { name: "shell", selector: ".ccxp-lite-sidebar-shell", properties: visualProperties },
  {
    name: "search",
    selector: ".ccxp-lite-sidebar-search-input",
    properties: visualProperties,
  },
  {
    name: "first-row",
    selector: ".ccxp-lite-row-button, .ccxp-lite-category-card",
    properties: visualProperties,
  },
];

const destinationProbes: readonly Probe[] = [
  {
    name: "back",
    selector: ".ccxp-lite-back-button",
    properties: visualProperties,
  },
  {
    name: "frame",
    selector: ".ccxp-lite-destination-frame",
    properties: visualProperties,
  },
];

function readFixture(fileName: string) {
  return readFileSync(path.join(fixtureRoot, fileName), "utf8");
}

function assertExtension(extensionDir: string) {
  const manifestPath = path.join(extensionDir, "manifest.json");
  try {
    readFileSync(manifestPath);
  } catch {
    throw new Error(`Missing packaged extension manifest: ${manifestPath}`);
  }
}

function prepareOutputDirectory(outputDir: string) {
  if (outputDir === projectRoot || outputDir === path.parse(outputDir).root) {
    throw new Error(`Refusing to clear unsafe output directory: ${outputDir}`);
  }
  if (existsSync(outputDir)) {
    throw new Error(`Output directory already exists; choose a fresh --output path: ${outputDir}`);
  }
  mkdirSync(outputDir, { recursive: true });
}

async function routeFixtures(context: BrowserContext) {
  await context.route("**/*", async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.protocol === "chrome-extension:") {
      await route.continue();
      return;
    }
    if (await routeWorkLogFixture(route)) {
      return;
    }
    const fixtureName = fixtureByPath.get(requestUrl.pathname);
    if (requestUrl.origin === ccxpOrigin && fixtureName !== undefined) {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body:
          fixtureName === "frameset.html" && requestUrl.searchParams.has("work-log")
            ? readFixture(fixtureName).replace("xp03_m.htm", "PE/1/14D/PE14D1.php")
            : readFixture(fixtureName),
      });
      return;
    }
    await route.abort("blockedbyclient");
  });
}

async function stabilize(page: Page) {
  await Promise.all(
    page.frames().map(async (frame) => {
      await frame
        .addStyleTag({
          content:
            "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
        })
        .catch(() => undefined);
      await frame
        .evaluate(
          async () =>
            await Promise.race([
              document.fonts.ready,
              new Promise((resolve) => {
                setTimeout(resolve, 2000);
              }),
            ]),
        )
        .catch(() => undefined);
    }),
  );
  await page.waitForTimeout(100);
}

async function collectStyles(scope: Page | Frame, probes: readonly Probe[]) {
  return await scope.evaluate(
    (entries) =>
      Object.fromEntries(
        entries.map((probe) => {
          const element = document.querySelector<HTMLElement>(probe.selector);
          if (!element) {
            throw new Error(`Missing parity probe ${probe.name}: ${probe.selector}`);
          }
          const computed = getComputedStyle(element);
          return [
            probe.name,
            {
              tagName: element.tagName,
              properties: Object.fromEntries(
                probe.properties.map((propertyName) => [
                  propertyName,
                  computed.getPropertyValue(propertyName),
                ]),
              ),
              inlinePriorities: Object.fromEntries(
                (probe.inlinePriorities ?? []).map((propertyName) => [
                  propertyName,
                  element.style.getPropertyPriority(propertyName),
                ]),
              ),
            },
          ];
        }),
      ),
    probes,
  );
}

async function capturePage(page: Page, outputPath: string) {
  await stabilize(page);
  await page.screenshot({
    path: outputPath,
    animations: "disabled",
    caret: "hide",
  });
}

function directoryDigest(directory: string): string {
  const hash = createHash("sha256");
  for (const name of readdirSync(directory, { recursive: true }).map(String).toSorted()) {
    const file = path.join(directory, name);
    if (statSync(file).isFile()) {
      hash.update(name);
      hash.update(readFileSync(file));
    }
  }
  return hash.digest("hex");
}

async function captureRevision(
  label: string,
  extensionDir: string,
  outputDir: string,
  workLogOnly: boolean,
  recordVideo: boolean,
): Promise<CaptureResult> {
  const profileDir = path.join(tmpdir(), `ccxp-lite-parity-${label}-${process.pid}-${Date.now()}`);
  const revisionOutputDir = path.join(outputDir, label);
  mkdirSync(revisionOutputDir, { recursive: true });
  const context = await chromium.launchPersistentContext(profileDir, {
    channel: "chromium",
    headless: true,
    viewport,
    locale: "zh-TW",
    timezoneId: "Asia/Taipei",
    colorScheme: "light",
    reducedMotion: "reduce",
    ...(recordVideo ? { recordVideo: { dir: revisionOutputDir, size: viewport } } : {}),
    args: [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`],
  });
  const screenshots: Record<string, string> = {};
  const styles: Record<string, unknown> = {};

  try {
    context.setDefaultTimeout(15_000);
    context.setDefaultNavigationTimeout(15_000);
    await routeFixtures(context);
    await context.addInitScript(() => {
      try {
        localStorage.setItem("ccxp-lite-sidebar-variant", "classic");
      } catch {
        // Storage is unavailable on browser-owned documents.
      }
    });
    const page = context.pages()[0] ?? (await context.newPage());

    if (!workLogOnly) {
      process.stdout.write(`[${label}] login\n`);
      await page.goto(`${ccxpOrigin}/ccxp/INQUIRE/`, { waitUntil: "domcontentloaded" });
      await page.locator("body[data-ccxp-lite-landing-applied='true']").waitFor();
      const password = page.locator("input[name='passwd']");
      await password.fill("parity-only");
      await page.locator(".ccxp-lite-password-toggle").click();
      if ((await password.getAttribute("type")) !== "text") {
        throw new Error("Password visibility control did not preserve interaction behavior");
      }
      const loginScreenshot = path.join(revisionOutputDir, "login.png");
      await capturePage(page, loginScreenshot);
      screenshots.login = loginScreenshot;
      styles.login = await collectStyles(page, loginProbes);

      process.stdout.write(`[${label}] standalone\n`);
      await page.goto(`${ccxpOrigin}/ccxp/INQUIRE/JH/B/B.2/B.2.3/JHB23001.php`, {
        waitUntil: "domcontentloaded",
      });
      await page.locator("body.ccxp-lite-main-skin").waitFor();
      const standaloneScreenshot = path.join(revisionOutputDir, "standalone.png");
      await capturePage(page, standaloneScreenshot);
      screenshots.standalone = standaloneScreenshot;
      styles.standalone = await collectStyles(page, standaloneProbes);

      process.stdout.write(`[${label}] sidebar classic\n`);
      await page.goto(`${ccxpOrigin}/ccxp/INQUIRE/select_entry.php`, {
        waitUntil: "commit",
      });
      await page.waitForFunction(() => {
        const navFrame = document.querySelector("frame[src*='IN_INQ_STU.php']");
        const navDocument = navFrame
          ? (Reflect.get(navFrame, "contentDocument") as Document | undefined)
          : undefined;
        return (
          navDocument?.querySelector<HTMLElement>("body")?.dataset.ccxpLiteSidebarApplied === "true"
        );
      });
      const navFrame = page.frames().find((frame) => frame.url().includes("IN_INQ_STU.php"));
      if (!navFrame) {
        throw new Error("Missing sanitized navigation frame");
      }
      await navFrame.locator(".ccxp-lite-sidebar-shell").waitFor();
      await navFrame.locator(".ccxp-lite-empty-row").waitFor();
      const classicScreenshot = path.join(revisionOutputDir, "sidebar-classic.png");
      await capturePage(page, classicScreenshot);
      screenshots["sidebar-classic"] = classicScreenshot;
      styles["sidebar-classic"] = await collectStyles(navFrame, sidebarProbes);

      process.stdout.write(`[${label}] sidebar layered search\n`);
      await page.locator(".ccxp-lite-sidebar-experiment-switch").click();
      await page.waitForFunction(
        () => document.querySelector("frameset[cols]")?.getAttribute("cols") === "*,0",
      );
      await navFrame
        .locator(".ccxp-lite-sidebar-search-input")
        .fill("\u586B\u5BEB\u6559\u5B78\u610F\u898B\u8ABF\u67E5");
      await navFrame.locator(".ccxp-lite-row-button, .ccxp-lite-category-card").first().waitFor();
      const layeredScreenshot = path.join(revisionOutputDir, "sidebar-layered-search.png");
      await capturePage(page, layeredScreenshot);
      screenshots["sidebar-layered-search"] = layeredScreenshot;
      styles["sidebar-layered-search"] = await collectStyles(navFrame, sidebarProbes);

      process.stdout.write(`[${label}] embedded destination\n`);
      await navFrame.locator("button[title='\u6559\u5B78\u610F\u898B']").click();
      await navFrame
        .locator("button[title^='\u586B\u5BEB\u6559\u5B78\u610F\u898B\u8ABF\u67E5']")
        .click();
      await navFrame.locator(".ccxp-lite-destination-frame:not([hidden])").waitFor();
      await navFrame
        .frameLocator(".ccxp-lite-destination-frame:not([hidden])")
        .getByText("The system is not available because it is not the period to open.", {
          exact: false,
        })
        .waitFor();
      const destinationScreenshot = path.join(revisionOutputDir, "embedded-destination.png");
      await capturePage(page, destinationScreenshot);
      screenshots["embedded-destination"] = destinationScreenshot;
      styles["embedded-destination"] = await collectStyles(navFrame, destinationProbes);
    }
    process.stdout.write(`[${label}] work-log (standalone and main frame)\n`);
    await page.goto(`${ccxpOrigin}${workLogPath}`, { waitUntil: "domcontentloaded" });
    styles["work-log-standalone-ready"] = await assertWorkLogReady(page);
    const standaloneWorkLog = path.join(revisionOutputDir, "work-log-standalone.png");
    await capturePage(page, standaloneWorkLog);
    screenshots["work-log-standalone"] = standaloneWorkLog;
    await page.goto(`${ccxpOrigin}/ccxp/INQUIRE/select_entry.php?work-log`, {
      waitUntil: "commit",
    });
    await page.waitForFunction((pathname) => {
      const frame = document.querySelector('frame[name="main"]');
      const doc = frame
        ? (Reflect.get(frame, "contentDocument") as Document | undefined)
        : undefined;
      return doc?.location.pathname === pathname;
    }, workLogPath);
    const mainFrame = page.frames().find((frame) => frame.url().includes(workLogPath));
    if (!mainFrame) {
      throw new Error("Missing work-log main frame");
    }
    styles["work-log-framed-ready"] = await assertWorkLogReady(mainFrame);
    await page.waitForFunction(
      () => document.querySelector("frameset[cols]")?.getAttribute("cols") === "324,*",
    );
    await mainFrame.getByRole("button", { name: "\u591A\u65E5", exact: true }).click();
    await mainFrame
      .locator("#ccxp-lite-batch")
      .getByLabel("\u7D50\u675F\u65E5\u671F", { exact: true })
      .fill("2026-09-11");
    const multiScreenshot = path.join(revisionOutputDir, "work-log-multiday.png");
    await capturePage(page, multiScreenshot);
    screenshots["work-log-multiday"] = multiScreenshot;
    styles["work-log-multiday"] = await collectStyles(mainFrame, [
      { name: "header", selector: "#ccxp-lite-work-log-nav", properties: visualProperties },
      { name: "note", selector: '[name="I_TASK_NOTE"]', properties: visualProperties },
      {
        name: "submit",
        selector: "#insTask .ccxp-lite-action-control-primary",
        properties: visualProperties,
      },
    ]);
    await mainFrame.locator('#insForm [name="S_SUBMIT"]').click();
    await mainFrame.waitForFunction(
      () =>
        document.querySelector('[role="dialog"]') !== null ||
        document.querySelector('[role="status"]')?.textContent.includes("\u6210\u529F 2 \u7B46"),
    );
    const submitScreenshot = path.join(revisionOutputDir, "work-log-submit.png");
    await capturePage(page, submitScreenshot);
    screenshots["work-log-submit"] = submitScreenshot;
    if (recordVideo) {
      await page.waitForTimeout(1000);
    }
    writeFileSync(
      path.join(revisionOutputDir, "capture-manifest.json"),
      `${JSON.stringify(
        {
          viewport,
          locale: "zh-TW",
          timezone: "Asia/Taipei",
          extensionDigest: directoryDigest(extensionDir),
          fixtureDigest: directoryDigest(fixtureRoot),
          source: "test/browser-fixtures/work-log.provenance.json",
          screenshots,
          workLogOnly,
          recordVideo,
          pipeline:
            "packaged extension; no injected extension modules, theme variables, or layout CSS",
        },
        undefined,
        2,
      )}\n`,
    );
    writeFileSync(
      path.join(revisionOutputDir, "computed-styles.json"),
      `${JSON.stringify(styles, undefined, 2)}\n`,
    );
    return { screenshots, styles };
  } finally {
    process.stdout.write(`[${label}] closing browser\n`);
    await Promise.all(
      context.pages().map(async (page) => {
        await page.close();
      }),
    );
    await context.close();
    process.stdout.write(`[${label}] browser closed\n`);
    rmSync(profileDir, { recursive: true, force: true });
  }
}

function compareScreenshot(basePath: string, headPath: string, diffPath: string) {
  const base = PNG.sync.read(readFileSync(basePath));
  const head = PNG.sync.read(readFileSync(headPath));
  if (base.width !== head.width || base.height !== head.height) {
    return { differentPixels: Number.POSITIVE_INFINITY, ratio: 1 };
  }
  const diff = new PNG({ width: base.width, height: base.height });
  const differentPixels = pixelmatch(base.data, head.data, diff.data, base.width, base.height, {
    includeAA: false,
    threshold: 0.1,
  });
  const ratio = differentPixels / (base.width * base.height);
  if (ratio > maximumPixelDifferenceRatio) {
    mkdirSync(path.dirname(diffPath), { recursive: true });
    writeFileSync(diffPath, PNG.sync.write(diff));
  }
  return { differentPixels, ratio };
}

function compareCaptures(
  base: CaptureResult,
  head: CaptureResult,
  outputDir: string,
): readonly string[] {
  const failures: string[] = [];
  if (
    JSON.stringify(Object.keys(base.screenshots).toSorted()) !==
    JSON.stringify(Object.keys(head.screenshots).toSorted())
  ) {
    failures.push("captured screenshot set changed");
  }
  for (const [name, basePath] of Object.entries(base.screenshots)) {
    if (!Object.hasOwn(head.screenshots, name)) {
      continue;
    }
    const headPath = head.screenshots[name];
    const difference = compareScreenshot(
      basePath,
      headPath,
      path.join(outputDir, "diff", `${name}.png`),
    );
    if (difference.ratio > maximumPixelDifferenceRatio) {
      failures.push(
        `${name}: ${difference.differentPixels} pixels changed (${(difference.ratio * 100).toFixed(4)}%)`,
      );
    }
  }
  if (JSON.stringify(base.styles) !== JSON.stringify(head.styles)) {
    failures.push("computed styles or inline priorities changed");
  }
  return failures;
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== "--"),
    options: {
      "base-extension": { type: "string", default: defaultExtensionDir },
      "head-extension": { type: "string", default: defaultExtensionDir },
      output: { type: "string", default: defaultOutputDir },
      "work-log-only": { type: "boolean", default: false },
      "record-video": { type: "boolean", default: false },
    },
    strict: true,
  });
  const baseExtensionDir = path.resolve(values["base-extension"]);
  const headExtensionDir = path.resolve(values["head-extension"]);
  const outputDir = path.resolve(values.output);
  assertExtension(baseExtensionDir);
  assertExtension(headExtensionDir);
  prepareOutputDirectory(outputDir);

  const base = await captureRevision(
    "base",
    baseExtensionDir,
    outputDir,
    values["work-log-only"],
    values["record-video"],
  );
  const head = await captureRevision(
    "head",
    headExtensionDir,
    outputDir,
    values["work-log-only"],
    values["record-video"],
  );
  const failures = compareCaptures(base, head, outputDir);
  writeFileSync(
    path.join(outputDir, "report.json"),
    `${JSON.stringify({ baseExtensionDir, headExtensionDir, failures }, undefined, 2)}\n`,
  );
  if (failures.length > 0) {
    if (process.env.ALLOW_VISUAL_CHANGE === "true") {
      process.stdout.write(`Visual differences acknowledged:\n${failures.join("\n")}\n`);
      return;
    }
    throw new Error(
      `Browser parity failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
    );
  }
  process.stdout.write("Browser parity passed for screenshots and computed styles.\n");
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
