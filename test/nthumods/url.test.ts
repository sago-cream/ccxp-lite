import { describe, expect, test } from "vitest";
import { createTestWindow, loadModules, requireValue } from "../helpers/module-loader.js";

describe("NTHUMods URL builder", () => {
  test("normalizes semester and encodes each printed course id", () => {
    const { window } = createTestWindow();
    loadModules(window, ["src/nthumods/url.ts"]);
    const builder = requireValue(window.CCXP_LITE.nthuModsUrl);

    expect(builder.buildNthuModsUrl("zh", "115,10", ["11510CS  535100", "11510EECS 123456"])).toBe(
      "https://nthumods.com/zh/timetable/view?semester_11510=11510CS%20%20535100,11510EECS%20123456&source=ccxp",
    );
    expect(builder.buildNthuModsUrl("fr", "11510", ["one"])).toContain("https://nthumods.com/en/");
    expect(builder.buildNthuModsUrl("zh", "", ["one"])).toBeUndefined();
    expect(builder.buildNthuModsUrl("zh", "11510", [])).toBeUndefined();
    window.close();
  });

  test("caps ids defensively at 60", () => {
    const { window } = createTestWindow();
    loadModules(window, ["src/nthumods/url.ts"]);
    const builder = requireValue(window.CCXP_LITE.nthuModsUrl);
    const url = builder.buildNthuModsUrl(
      "en",
      "11510",
      Array.from({ length: 61 }, (_, index) => `11510CS ${String(index).padStart(6, "0")}`),
    );

    expect(url?.split(",")).toHaveLength(60);
    window.close();
  });
});
