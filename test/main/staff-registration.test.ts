import { describe, expect, test } from "vitest";
import { createTestWindow, loadModules } from "../helpers/module-loader.js";

function setup() {
  return createTestWindow(
    `<div class="container k-block"><form id="smart-form"><input type="hidden" name="token" value="transport-value">
      <h5 class="NORMAL_BLK">Registration</h5><h5 class="AY_BLK" style="display:none">Temporary staff</h5>
      <div class="tagline"><span>\u4EBA\u54E1\u8CC7\u8A0A Personal information</span></div>
      <div class="row"><div class="col s2">&nbsp;</div><div class="col s8">
        <label class="field-label" for="I_PJ_ID">\u57F7\u884C\u4EFB\u52D9\u8A08\u756B\u7DE8\u865F Mission Program Number</label>
        <input id="I_PJ_ID" name="I_PJ_ID" value="existing-project"><input id="I_DETAIL" placeholder="Description (limit 100 words)"><p>student assistants (the rules in Ministry of Education)</p><p>employed assistants (the rules in Ministry of Labor)</p><p>I have read all the rules</p>
        <input type="checkbox" id="I_SYS_2" name="I_SYS" value="2"><label for="I_SYS_2">\u4EBA\u4E8B\u5BA4\u4EBA\u54E1\u8655\u7406\u8868</label>
        <input type="checkbox" id="CHK_RULES"><label for="CHK_RULES">Original consent wording</label>
        <button id="PP_SUB" type="submit" class="disabled">\u9001\u51FA Send</button>
      </div></div><div id="grid" class="k-grid"><table><tbody><tr><td>Original record</td></tr></tbody></table></div></form></div>
      <div id="float_menu"><a>+</a><ul><li><a id="MD4" title="Notices">!</a></li><li><a href="identity.php">I</a></li><li><a href="registration.php">R</a></li><li><a href="history.php">H</a></li></ul></div>`,
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/3/3000/PE30001.php",
  ).window;
}

describe("Staff registration cleanup", () => {
  test("releases the startup mask when the expected form is absent", () => {
    const window = setup();
    const document = window.document as unknown as Document;
    document.querySelector("#smart-form")?.remove();
    loadModules(window, ["src/staff-registration/content.ts"]);
    expect(document.documentElement.dataset.ccxpRegistrationReady).toBe("true");
  });

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
    expect(document.documentElement.dataset.ccxpRegistrationReady).toBe("true");
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
    expect(document.querySelector("#smart-form")?.textContent).not.toContain(
      "I have read all the rules",
    );
    expect(document.querySelector("#smart-form")?.textContent).not.toContain(
      "the rules in Ministry",
    );
    expect(document.querySelector<HTMLInputElement>("#I_DETAIL")?.placeholder).toBe("Description");
    document.querySelector<HTMLInputElement>('[role="switch"]')?.click();
    expect(document.querySelector("#smart-form")?.textContent).toContain(
      "I have read all the rules",
    );
    expect(document.querySelector<HTMLInputElement>("#I_DETAIL")?.placeholder).toBe(
      "Description (limit 100 words)",
    );
    expect(document.querySelector('label[for="I_PJ_ID"]')?.textContent).toBe(
      "Mission program number",
    );
    expect(window.sessionStorage.getItem("ccxp-lite-staff-registration-english")).toBe("true");
    loadModules(window, ["src/staff-registration/content.ts"]);
    expect(document.querySelectorAll(".ccxp-registration-header")).toHaveLength(1);
    expect(document.querySelector("#grid td")?.textContent).toBe("Original record");
  });
});

test("collects startup reminders in the info popup and preserves unrelated alerts", async () => {
  const window = setup();
  const document = window.document as unknown as Document;
  loadModules(window, ["src/staff-registration/content.ts"]);
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = "\u57FA\u672C\u5DE5\u8CC7 29,500";
  const identity = document.createElement("div");
  identity.className = "ns-box";
  identity.innerHTML =
    '<div class="ns-content"><div>\u5982\u6709\u7279\u6B8A\u8EAB\u4EFD<a href="identity.php">Identity</a></div></div>';
  const link = identity.querySelector("a");
  const alert = document.createElement("div");
  alert.className = "toast";
  alert.textContent = "Validation failed";
  document.body.append(toast, identity, alert);
  await window.happyDOM.waitUntilComplete();
  const popup = document.querySelector<HTMLElement>("#ccxp-registration-reminders");
  const button = document.querySelector<HTMLButtonElement>(".ccxp-registration-info > button");
  expect(popup?.textContent).toContain("29,500");
  expect(popup?.querySelector("a")).toBe(link);
  expect(toast.isConnected).toBe(false);
  expect(identity.isConnected).toBe(false);
  expect(alert.isConnected).toBe(true);
  expect(popup?.hidden).toBe(true);
  button?.click();
  expect(button?.getAttribute("aria-expanded")).toBe("true");
  button?.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }) as unknown as Event,
  );
  expect(popup?.hidden).toBe(true);
  expect(document.activeElement).toBe(button);
});
