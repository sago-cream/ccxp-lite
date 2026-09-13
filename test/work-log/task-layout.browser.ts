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

test("packaged extension displays assistant task table horizontally without vertical collapse", async () => {
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

    const taskTable = page.locator("#trLabSerial table");
    expect(await taskTable.isVisible()).toBe(true);

    const styles = await taskTable.evaluate((table) => {
      const tr = table.querySelector("tr");
      const th = table.querySelector("th");
      const td = table.querySelector("td");
      const cellWrapper = table.closest("td");
      if (!tr || !th || !td || !cellWrapper) {
        throw new Error("Missing task table elements");
      }
      const tableStyle = getComputedStyle(table);
      const trStyle = getComputedStyle(tr);
      const thStyle = getComputedStyle(th);
      const tdStyle = getComputedStyle(td);
      return {
        tableDisplay: tableStyle.display,
        trDisplay: trStyle.display,
        thDisplay: thStyle.display,
        tdDisplay: tdStyle.display,
        tdOverflowX: getComputedStyle(cellWrapper).overflowX,
        hasFormFieldsClass: table.classList.contains("ccxp-lite-work-log-form-fields"),
      };
    });

    expect(styles.tableDisplay).toBe("table");
    expect(styles.trDisplay).toBe("table-row");
    expect(styles.thDisplay).toBe("table-cell");
    expect(styles.tdDisplay).toBe("table-cell");
    expect(styles.tdOverflowX).toBe("auto");
    expect(styles.hasFormFieldsClass).toBe(false);

    // Assert that headers and cells are laid out horizontally on the same row.
    const headers = await taskTable.locator("th").all();
    expect(headers.length).toBe(10);
    const firstHeaderBox = await headers[0].boundingBox();
    const secondHeaderBox = await headers[1].boundingBox();
    if (!firstHeaderBox || !secondHeaderBox) {
      throw new Error("Missing header bounding boxes");
    }
    expect(Math.round(firstHeaderBox.y)).toBe(Math.round(secondHeaderBox.y));
    expect(secondHeaderBox.x).toBeGreaterThan(firstHeaderBox.x);

    const dataCells = await taskTable.locator("td").all();
    expect(dataCells.length).toBe(10);
    const firstCellBox = await dataCells[0].boundingBox();
    const secondCellBox = await dataCells[1].boundingBox();
    if (!firstCellBox || !secondCellBox) {
      throw new Error("Missing cell bounding boxes");
    }
    expect(Math.round(firstCellBox.y)).toBe(Math.round(secondCellBox.y));
    expect(secondCellBox.x).toBeGreaterThan(firstCellBox.x);

    // Assert table borders, column and row dividers, and spacing below the label.
    const tableDetails = await page.locator("#trLabSerial").evaluate((row) => {
      const label = row.querySelector(":scope > th");
      const table = row.querySelector("table");
      const th0 = table?.querySelector("th:first-child");
      const thLast = table?.querySelector("th:last-child");
      const td0 = table?.querySelector("td:first-child");
      const tdLast = table?.querySelector("td:last-child");
      if (!label || !table || !th0 || !thLast || !td0 || !tdLast) {
        throw new Error("Missing table test elements");
      }
      const labelBox = label.getBoundingClientRect();
      const tableBox = table.getBoundingClientRect();
      return {
        spacingToTable: tableBox.top - labelBox.bottom,
        tableBorderTopWidth: getComputedStyle(table).borderTopWidth,
        th0BorderRightWidth: getComputedStyle(th0).borderRightWidth,
        th0BorderBottomWidth: getComputedStyle(th0).borderBottomWidth,
        thLastBorderRightWidth: getComputedStyle(thLast).borderRightWidth,
        td0BorderRightWidth: getComputedStyle(td0).borderRightWidth,
        tdLastBorderRightWidth: getComputedStyle(tdLast).borderRightWidth,
      };
    });

    expect(tableDetails.spacingToTable).toBeGreaterThanOrEqual(16);
    expect(tableDetails.tableBorderTopWidth).toBe("1px");
    expect(tableDetails.th0BorderRightWidth).toBe("1px");
    expect(tableDetails.th0BorderBottomWidth).toBe("1px");
    expect(tableDetails.thLastBorderRightWidth).toBe("0px");
    expect(tableDetails.td0BorderRightWidth).toBe("1px");
    expect(tableDetails.tdLastBorderRightWidth).toBe("0px");
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}, 30_000);
