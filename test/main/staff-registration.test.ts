import { describe, expect, test } from "vitest";
import { createTestWindow, loadModules } from "../helpers/module-loader.js";

function setup() {
  return createTestWindow(
    `<div class="container k-block"><form id="smart-form"><input type="hidden" name="token" value="transport-value">
      <h5 class="NORMAL_BLK">Registration</h5><h5 class="AY_BLK" style="display:none">Temporary staff</h5>
      <div class="tagline"><span>\u4EBA\u54E1\u8CC7\u8A0A Personal information</span></div>
      <div class="row"><div class="col s2">&nbsp;</div><div class="col s8">
        <label class="field-label" for="I_PJ_ID">\u57F7\u884C\u4EFB\u52D9\u8A08\u756B\u7DE8\u865F Mission Program Number</label>
        <input id="I_PJ_ID" name="I_PJ_ID" value="existing-project">
        <input type="checkbox" id="I_SYS_2" name="I_SYS" value="2"><label for="I_SYS_2">\u4EBA\u4E8B\u5BA4\u4EBA\u54E1\u8655\u7406\u8868</label>
        <input type="checkbox" id="CHK_RULES"><label for="CHK_RULES">Original consent wording</label>
        <button id="PP_SUB" type="submit" class="disabled">\u9001\u51FA Send</button>
      </div></div><div id="grid" class="k-grid"><table><tbody><tr><td>Original record</td></tr></tbody></table></div></form></div>
      <div id="float_menu"><a>+</a><ul><li><a id="MD4" title="Notices">!</a></li><li><a href="identity.php">I</a></li><li><a href="registration.php">R</a></li><li><a href="history.php">H</a></li></ul></div>`,
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/3/3000/PE30001.php",
  ).window;
}

describe("Staff registration cleanup", () => {
  test("preserves form controls, consent, values, records, and original navigation handlers", () => {
    const window = setup();
    const document = window.document as unknown as Document;
    const controls = [...document.querySelectorAll("#smart-form input, #smart-form button")];
    const record = document.querySelector("#grid td");
    const notice = document.querySelector<HTMLElement>("#MD4");
    let clicks = 0;
    notice?.addEventListener("click", () => {
      clicks++;
    });
    loadModules(window, ["src/staff-registration/content.ts"]);
    expect([...document.querySelectorAll("#smart-form input, #smart-form button")]).toEqual(
      controls,
    );
    expect(document.querySelector<HTMLInputElement>("#I_PJ_ID")?.value).toBe("existing-project");
    expect(document.querySelector<HTMLInputElement>('[name="token"]')?.value).toBe(
      "transport-value",
    );
    expect(document.querySelector<HTMLInputElement>("#CHK_RULES")?.checked).toBe(false);
    expect(document.querySelector('label[for="CHK_RULES"]')?.textContent).toBe(
      "Original consent wording",
    );
    expect(document.querySelector("#PP_SUB")?.classList.contains("disabled")).toBe(true);
    expect(document.querySelector("#grid td")).toBe(record);
    expect(document.querySelector("header #MD4")).toBe(notice);
    notice?.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Enter" }) as unknown as Event,
    );
    expect(clicks).toBe(1);
    expect(document.querySelector<HTMLElement>(".AY_BLK")?.style.display).toBe("none");
  });

  test("switches presentation labels and restores the preference without duplicate UI", () => {
    const window = setup();
    const document = window.document as unknown as Document;
    loadModules(window, ["src/staff-registration/content.ts"]);
    expect(document.querySelector("h1")?.textContent).toBe("\u52A9\u7406\u767B\u9304\u7CFB\u7D71");
    document.querySelector<HTMLInputElement>('[role="switch"]')?.click();
    expect(document.querySelector('label[for="I_PJ_ID"]')?.textContent).toBe(
      "Mission program number",
    );
    expect(window.sessionStorage.getItem("ccxp-lite-staff-registration-english")).toBe("true");
    loadModules(window, ["src/staff-registration/content.ts"]);
    expect(document.querySelectorAll(".ccxp-registration-header")).toHaveLength(1);
    expect(document.querySelector("#grid td")?.textContent).toBe("Original record");
  });
});
