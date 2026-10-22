import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, vi } from "vitest";
import {
  createTestWindow,
  loadModules,
  requireElement,
  sharedModulePaths,
} from "../helpers/module-loader.js";

test("mounts a scoped export action above the result table without reskinning the page", () => {
  const { window } = createTestWindow(
    readFileSync(path.resolve("test/browser-fixtures/course-result.html"), "utf8"),
    "https://www.ccxp.nthu.edu.tw/ccxp/COURSE/JH/7/7.2/7.2.1/JH721003.php",
  );
  const document = window.document as unknown as Document;
  const open = vi.spyOn(window, "open").mockImplementation(() => window as unknown as Window);
  loadModules(window, [
    ...sharedModulePaths,
    "src/nthumods/parser.ts",
    "src/nthumods/url.ts",
    "src/nthumods/content.ts",
  ]);

  const button = requireElement(
    document.querySelector<HTMLButtonElement>("#ccxp-lite-nthumods-export"),
  );
  const resultTable = document.querySelectorAll("table")[1];
  const actionRow = requireElement(document.querySelector(".ccxp-lite-nthumods-actions"));
  expect(button.textContent).toBe("\u532F\u51FA\u81F3 NTHUMods");
  expect(button.disabled).toBe(false);
  expect(actionRow.nextElementSibling).toBe(resultTable);
  expect(document.querySelector(".header")?.textContent).toContain("\u9078\u8AB2\u7D50\u679C");
  expect(document.body.classList.contains("ccxp-lite-main-skin")).toBe(false);
  expect(document.querySelector("#ccxp-lite-nthumods-header")).toBeNull();
  button.click();
  expect(open).toHaveBeenCalledWith(
    "https://nthumods.com/zh/timetable/view?semester_11510=11510CS%20%20535100,11510EECS%20123456,11510MATH%20246810&source=ccxp",
    "_blank",
    "noopener,noreferrer",
  );
  expect(document.documentElement.dataset.ccxpLiteNthuModsReady).toBe("true");
  open.mockRestore();
  window.close();
});

test("disables the action and explains an empty result", () => {
  const { window } = createTestWindow(
    '<table><tbody></tbody></table><table><tbody><tr class="class3"><td>not-a-course</td></tr></tbody></table><form><input name="semester" value="115,10"></form>',
    "https://www.ccxp.nthu.edu.tw/ccxp/COURSE/JH/7/7.2/7.2.1/JH721003.php",
  );
  const document = window.document as unknown as Document;
  loadModules(window, [
    ...sharedModulePaths,
    "src/nthumods/parser.ts",
    "src/nthumods/url.ts",
    "src/nthumods/content.ts",
  ]);

  const button = requireElement(
    document.querySelector<HTMLButtonElement>("#ccxp-lite-nthumods-export"),
  );
  expect(button.disabled).toBe(true);
  expect(document.querySelector("#ccxp-lite-nthumods-reason")?.textContent).toBe(
    "\u6C92\u6709\u53EF\u532F\u51FA\u7684\u8AB2\u7A0B",
  );
  expect(document.querySelector(".ccxp-lite-nthumods-actions")?.nextElementSibling).toBe(
    document.querySelectorAll("table")[1],
  );
  window.close();
});
