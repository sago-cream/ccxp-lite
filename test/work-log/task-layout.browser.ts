import { existsSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { expect, test } from "vitest";
import { assertWorkLogReady, workLogPath } from "../../scripts/work-log-fixtures.js";

function ensurePackagedExtension(): string {
  const extension = path.resolve("dist/crx/unpacked");
  if (!existsSync(path.join(extension, "manifest.json"))) {
    const result = spawnSync("bun", ["run", "build:crx"], { stdio: "inherit" });
    if (result.status !== 0) {
      throw new Error("Failed to build unpacked extension for browser test");
    }
  }
  return extension;
}

test("packaged extension displays assistant task information in responsive 3-column grid without horizontal scroll and translates with English switch", async () => {
  const profile = mkdtempSync(path.join(tmpdir(), "ccxp-task-layout-"));
  const extension = ensurePackagedExtension();
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  context.setDefaultTimeout(5000);
  try {
    const fixtureRoot = path.resolve("test/browser-fixtures");
    const assetMap = JSON.parse(
      readFileSync(path.join(fixtureRoot, "host-assets.json"), "utf8"),
    ) as Record<string, { file: string; contentType: string } | undefined>;

    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.protocol === "chrome-extension:") {
        await route.continue();
        return;
      }
      if (url.origin !== "https://www.ccxp.nthu.edu.tw") {
        await route.abort();
        return;
      }
      const asset = assetMap[url.pathname];
      if (asset) {
        await route.fulfill({
          contentType: asset.contentType,
          body: readFileSync(path.join(fixtureRoot, asset.file)),
        });
        return;
      }
      if (url.pathname !== workLogPath) {
        await route.abort();
        return;
      }
      let html = readFileSync(path.join(fixtureRoot, "work-log.html"), "utf8");
      const taskTableHtml = `
        <tr id="trLabSerial">
          <th>\u4EFB\u52D9\u8CC7\u8A0A</th>
          <td>
            <table class="datatable4">
              <thead>
                <tr>
                  <th>\u6B64\u7B46\u5DE5\u6642\u8CC7\u6599\u6B78\u5C6C</th>
                  <th>\u300C\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u300D\u5E8F\u865F</th>
                  <th>\u4EFB\u52D9\u985E\u578B\u5C6C\u6027</th>
                  <th>\u5831\u652F\u7CFB\u7D71</th>
                  <th>\u8A08\u756B\u7DE8\u865F</th>
                  <th>\u4EFB\u52D9\u958B\u59CB\u65E5\u671F</th>
                  <th>\u4EFB\u52D9\u7D50\u675F\u65E5\u671F</th>
                  <th>\u61C9\u586B\u6642\u6578</th>
                  <th>\u672C\u6708\u5DF2\u6838\u6642\u6578</th>
                  <th>\u4EFB\u52D9\u5167\u5BB9</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input type="radio" name="I_LAB_SERIAL" value="400278" checked=""></td>
                  <td>400278</td>
                  <td>\u734E\u52A9\u751F</td>
                  <td>\u8655\u7406\u8868</td>
                  <td>115B3039M5</td>
                  <td>20260801</td>
                  <td>20270731</td>
                  <td></td>
                  <td></td>
                  <td>\u5354\u52A9\u958B\u767CLINE RAG ChatBOT</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>`;
      html = html.replace(/<tr id="trLabSerial"[\s\S]*?<\/tr>/u, taskTableHtml);
      await route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
    });

    const page = await context.newPage();
    await page.goto(`https://www.ccxp.nthu.edu.tw${workLogPath}`);
    await assertWorkLogReady(page);

    const taskGrid = page.locator("#trLabSerial .ccxp-lite-task-grid");
    expect(await taskGrid.isVisible()).toBe(true);

    const cards = await taskGrid.locator(".ccxp-lite-task-card").all();
    expect(cards.length).toBe(1);

    // Verify no horizontal scrolling: the content fits completely within the container.
    const scrollInfo = await page.locator("#trLabSerial > td").evaluate((td) => ({
      clientWidth: td.clientWidth,
      scrollWidth: td.scrollWidth,
    }));
    expect(scrollInfo.scrollWidth).toBeLessThanOrEqual(scrollInfo.clientWidth);

    // Verify 3-column information arrangement in the card.
    const fields = await cards[0].locator(".ccxp-lite-task-card-field").all();
    expect(fields.length).toBe(8);

    const box0 = await fields[0].boundingBox();
    const box1 = await fields[1].boundingBox();
    const box2 = await fields[2].boundingBox();
    const box3 = await fields[3].boundingBox();
    if (!box0 || !box1 || !box2 || !box3) {
      throw new Error("Missing field bounding boxes");
    }

    // Row 1: 3 columns laid out horizontally at the same Y
    expect(Math.round(box0.y)).toBe(Math.round(box1.y));
    expect(Math.round(box1.y)).toBe(Math.round(box2.y));
    expect(box1.x).toBeGreaterThan(box0.x);
    expect(box2.x).toBeGreaterThan(box1.x);

    // Row 2: wraps below Row 1
    expect(box3.y).toBeGreaterThan(box0.y);
    expect(Math.round(box3.x)).toBe(Math.round(box0.x));

    // Verify radio selection in the card header.
    const radio = cards[0].locator('input[type="radio"]');
    expect(await radio.isChecked()).toBe(true);

    // Verify default Chinese labels in task information.
    const getLabels = async () =>
      await page.locator("#trLabSerial").evaluate((row) => {
        const title = row.querySelector(".ccxp-lite-task-card-title");
        const titleText = title ? title.textContent.trim() : "";
        const dts = [...row.querySelectorAll(".ccxp-lite-task-card-field dt")].map((dt) =>
          dt.textContent.trim(),
        );
        return [titleText, ...dts];
      });

    expect(await getLabels()).toEqual([
      "\u6B64\u7B46\u5DE5\u6642\u8CC7\u6599\u6B78\u5C6C",
      "\u4EFB\u52D9\u985E\u578B\u5C6C\u6027",
      "\u5831\u652F\u7CFB\u7D71",
      "\u8A08\u756B\u7DE8\u865F",
      "\u4EFB\u52D9\u958B\u59CB\u65E5\u671F",
      "\u4EFB\u52D9\u7D50\u675F\u65E5\u671F",
      "\u61C9\u586B\u6642\u6578",
      "\u672C\u6708\u5DF2\u6838\u6642\u6578",
      "\u4EFB\u52D9\u5167\u5BB9",
    ]);

    // Switch to English and assert i18n translations.
    const englishSwitch = page.locator(".ccxp-lite-work-log-switch");
    await englishSwitch.click();

    expect(await getLabels()).toEqual([
      "Task assignment",
      "Task type",
      "Reimbursement system",
      "Project number",
      "Task start date",
      "Task end date",
      "Required hours",
      "Approved hours this month",
      "Task description",
    ]);

    // Switch back to Chinese and assert restored labels.
    await englishSwitch.click();

    expect(await getLabels()).toEqual([
      "\u6B64\u7B46\u5DE5\u6642\u8CC7\u6599\u6B78\u5C6C",
      "\u4EFB\u52D9\u985E\u578B\u5C6C\u6027",
      "\u5831\u652F\u7CFB\u7D71",
      "\u8A08\u756B\u7DE8\u865F",
      "\u4EFB\u52D9\u958B\u59CB\u65E5\u671F",
      "\u4EFB\u52D9\u7D50\u675F\u65E5\u671F",
      "\u61C9\u586B\u6642\u6578",
      "\u672C\u6708\u5DF2\u6838\u6642\u6578",
      "\u4EFB\u52D9\u5167\u5BB9",
    ]);
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 30_000);
