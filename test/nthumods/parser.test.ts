import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { createTestWindow, loadModules, requireValue } from "../helpers/module-loader.js";

const fixturePath = path.resolve("test/browser-fixtures/course-result.html");

describe("NTHUMods course-result parser", () => {
  test("reads the hidden semester and only registered rows from the fixture", () => {
    const { window } = createTestWindow(
      readFileSync(fixturePath, "utf8"),
      "https://www.ccxp.nthu.edu.tw/ccxp/COURSE/JH/7/7.2/7.2.1/JH721003.php",
    );
    loadModules(window, ["src/nthumods/parser.ts"]);
    const parser = requireValue(window.CCXP_LITE.nthuModsParser);

    expect(parser.parseCourseResult(window.document)).toEqual({
      semester: "11420",
      courseIds: [
        "11420AIA 500200",
        "11420AIA 500300",
        "11420CS  541300",
        "11420EECS391000",
        "11420PE  206018",
      ],
    });
    window.close();
  });

  test("skips malformed rows, preserves order, deduplicates, and caps at 60", () => {
    const rows = Array.from(
      { length: 62 },
      (_, index) => `<tr class="class3"><td>11510CS ${String(index).padStart(6, "0")}</td></tr>`,
    ).join("");
    const { window } = createTestWindow(
      `<form><input type="hidden" name="year" value="115"><input type="hidden" name="term" value="10"><table><tbody></tbody></table><table><tbody>${rows}<tr class="class3"><td>bad</td></tr></tbody></table></form>`,
    );
    loadModules(window, ["src/nthumods/parser.ts"]);
    const parser = requireValue(window.CCXP_LITE.nthuModsParser);

    expect(parser.parseCourseResult(window.document).courseIds).toHaveLength(60);
    expect(parser.parseCourseResult(window.document).courseIds[0]).toBe("11510CS 000000");
    expect(parser.parseCourseResult(window.document).courseIds[59]).toBe("11510CS 000059");
    window.close();
  });

  test("derives the semester from a common course-number prefix when no field exists", () => {
    const { window } = createTestWindow(
      `<table><tbody></tbody></table><table><tbody>
        <tr class="class3"><td>11510CS 535100</td></tr>
        <tr class="class3"><td>11510EECS 123456</td></tr>
      </tbody></table>`,
    );
    loadModules(window, ["src/nthumods/parser.ts"]);
    const parser = requireValue(window.CCXP_LITE.nthuModsParser);

    expect(parser.parseCourseResult(window.document)).toEqual({
      semester: "11510",
      courseIds: ["11510CS 535100", "11510EECS 123456"],
    });
    window.close();
  });

  test("uses the most common prefix and excludes other semesters when prefixes disagree", () => {
    const { window } = createTestWindow(
      `<table><tbody></tbody></table><table><tbody>
        <tr class="class3"><td>11420CS 535100</td></tr>
        <tr class="class3"><td>11510EECS 123456</td></tr>
        <tr class="class3"><td>11510MATH 246810</td></tr>
        <tr class="class3"><td>11510PHYS 135790</td></tr>
      </tbody></table>`,
    );
    loadModules(window, ["src/nthumods/parser.ts"]);
    const parser = requireValue(window.CCXP_LITE.nthuModsParser);

    expect(parser.parseCourseResult(window.document)).toEqual({
      semester: "11510",
      courseIds: ["11510EECS 123456", "11510MATH 246810", "11510PHYS 135790"],
    });
    window.close();
  });
});
