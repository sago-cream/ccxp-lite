import { describe, expect, test } from "vitest";
import { createTestWindow, loadModules } from "../helpers/module-loader.js";

function setup() {
  const { window } = createTestWindow(
    `<div id="modal3"><div class="modal-content"></div></div><div><h4 class="header">Title<input id="_sid" type="hidden"></h4>
    <ul><li><div id="A_HEAD">A</div><div><form id="smart-form"></form></div></li>
    <li><div id="B_HEAD">B</div><div id="grid_pre"></div></li></ul></div>
    <div class="fixed-action-btn"><a class="btn-floating">+</a><ul><li><a id="MD4">Notice</a></li>
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
    expect((window.document as unknown as Document).querySelector(".fixed-action-btn #MD4")).toBe(
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
    expect(
      (window.document as unknown as Document).querySelector("h4 > span:first-child")?.textContent,
    ).toBe("Staff history system");
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

test("moves the original menu into header navigation and removes the floating trigger", () => {
  const window = setup();
  const document = window.document as unknown as Document;
  const menu = document.querySelector(".fixed-action-btn ul");
  loadModules(window, ["src/staff-history/shell.ts"]);
  const navigation = document.querySelector('[role="navigation"]');
  expect(navigation?.parentElement?.tagName).toBe("H4");
  expect(navigation?.querySelector("ul")).toBe(menu);
  expect(navigation?.querySelectorAll("a")).toHaveLength(4);
});

test("keeps startup guidance in the header without suppressing unrelated host alerts", async () => {
  const window = setup();
  const document = window.document as unknown as Document;
  loadModules(window, ["src/staff-history/shell.ts"]);
  const guidance = document.createElement("div");
  guidance.className = "toast";
  guidance.textContent = "\u82E5\u767C\u751F\u5217\u8868\u7A7A\u767D";
  const alert = document.createElement("div");
  alert.className = "toast";
  alert.textContent = "Request failed";
  document.body.append(guidance, alert);
  await window.happyDOM.waitUntilComplete();
  expect(document.querySelector("#modal3 .ccxp-staff-notices")).not.toBeNull();
  expect(document.querySelector(".ccxp-staff-toolbar details")).toBeNull();
  expect(guidance.isConnected).toBe(false);
  expect(alert.isConnected).toBe(true);
  const toggle = document.querySelector<HTMLInputElement>('[role="switch"]');
  expect(toggle?.checked).toBe(false);
  toggle?.click();
  expect(document.querySelector(".ccxp-staff-notices")?.textContent).toContain("browser cache");
  expect(toggle?.checked).toBe(true);
});
