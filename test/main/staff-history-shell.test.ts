import { describe, expect, test } from "vitest";
import { createTestWindow, loadModules } from "../helpers/module-loader.js";

function setup() {
  const { window } = createTestWindow(
    `<div><h4 class="header">Title<input id="_sid" type="hidden"></h4>
    <ul><li><div id="A_HEAD">A</div><div><form id="smart-form"></form></div></li>
    <li><div id="B_HEAD">B</div><div id="grid_pre"></div></li></ul></div>
    <div class="fixed-action-btn"><ul><li><a id="MD4">Notice</a></li>
    <li><a href="identity.php">Identity</a></li><li><a href="entry.php">Entry</a></li>
    <li><a href="history.php">History</a></li></ul></div>`,
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/3/3000/PE30003.php",
  );
  for (const id of ["A_HEAD", "B_HEAD"]) {
    (window.document as unknown as Document)
      .querySelector(`#${id}`)
      ?.addEventListener("click", () => {
        (window.document as unknown as Document)
          .querySelector(`#${id}`)
          ?.classList.toggle("active");
      });
  }
  return window;
}

describe("Staff History shell", () => {
  test("keeps host elements and handlers while exposing keyboard navigation", () => {
    const window = setup();
    const notice = (window.document as unknown as Document).querySelector("#MD4");
    const form = (window.document as unknown as Document).querySelector("#smart-form");
    let clicks = 0;
    notice?.addEventListener("click", () => {
      clicks++;
    });
    loadModules(window, ["src/staff-history/shell.ts"]);
    expect((window.document as unknown as Document).querySelector(".ccxp-staff-toolbar #MD4")).toBe(
      notice,
    );
    expect((window.document as unknown as Document).querySelector("#smart-form")).toBe(form);
    expect((window.document as unknown as Document).querySelector("#_sid")).not.toBeNull();
    expect(
      (window.document as unknown as Document)
        .querySelector("#A_HEAD")
        ?.classList.contains("active"),
    ).toBe(true);
    notice?.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Enter" }) as unknown as Event,
    );
    expect(clicks).toBe(1);
    const second = (window.document as unknown as Document).querySelector("#B_HEAD");
    second?.dispatchEvent(new window.KeyboardEvent("keydown", { key: " " }) as unknown as Event);
    expect(second?.classList.contains("active")).toBe(true);
    expect(second?.getAttribute("aria-controls")).toBeTruthy();
  });

  test("restores language and chosen section and does not duplicate on reinjection", () => {
    const window = setup();
    window.sessionStorage.setItem(
      "ccxp-lite-staff-history-view",
      JSON.stringify({ active: "B_HEAD", english: true }),
    );
    loadModules(window, ["src/staff-history/shell.ts"]);
    loadModules(window, ["src/staff-history/shell.ts"]);
    expect(
      (window.document as unknown as Document).querySelectorAll(".ccxp-staff-toolbar"),
    ).toHaveLength(1);
    expect(
      (window.document as unknown as Document)
        .querySelector("#B_HEAD")
        ?.classList.contains("active"),
    ).toBe(true);
    expect(
      (window.document as unknown as Document)
        .querySelector("#A_HEAD")
        ?.classList.contains("active"),
    ).toBe(false);
    expect((window.document as unknown as Document).querySelector("h4")?.textContent).toBe(
      "Staff history",
    );
    (
      (window.document as unknown as Document).querySelector(
        ".ccxp-staff-language",
      ) as unknown as HTMLButtonElement
    ).click();
    expect(
      (
        JSON.parse(window.sessionStorage.getItem("ccxp-lite-staff-history-view") ?? "{}") as {
          english: boolean;
        }
      ).english,
    ).toBe(false);
  });
});
