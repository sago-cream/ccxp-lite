import { TestEvent } from "../helpers/dom-event.js";
import { describe, expect, test, vi } from "vitest";

import {
  requireElement,
  createTestWindow,
  loadModules,
  requireValue,
  sharedModulePaths,
} from "../helpers/module-loader.js";
import { createLoginHtml } from "../helpers/login-fixtures.js";

const loginCaptchaModulePaths = [
  ...sharedModulePaths,
  "src/login/locale.ts",
  "src/login/auth/captcha.ts",
];

async function flushPromises() {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe("login captcha", () => {
  test("binds once, shows loading, fills the input, and emits input/change events on success", async () => {
    const { window } = createTestWindow(createLoginHtml());
    const document = window.document as Document;
    const predictDigits = vi.fn().mockResolvedValue("654321");
    window.CCXP_LITE.decaptcha = { predictDigits };
    loadModules(window, loginCaptchaModulePaths);
    const loginCaptcha = requireValue(window.CCXP_LITE.loginCaptcha, "loginCaptcha");

    window.fetch = vi.fn() as unknown as typeof window.fetch;

    const image = requireElement(
      document.querySelector<HTMLImageElement>(".ccxp-lite-captcha-media-row img"),
      "legacy captcha image",
    );
    Object.defineProperty(image, "complete", {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(image, "naturalWidth", {
      configurable: true,
      get: () => 150,
    });
    Object.defineProperty(image, "naturalHeight", {
      configurable: true,
      get: () => 80,
    });

    const input = requireElement(
      document.querySelector<HTMLInputElement>("input[name='passwd2']"),
      "captcha input",
    );
    const inputSpy = vi.fn();
    const changeSpy = vi.fn();
    input.addEventListener("input", (event) => {
      inputSpy(event);
    });
    input.addEventListener("change", (event) => {
      changeSpy(event);
    });

    loginCaptcha.enableCaptchaAutofill(document, document);
    expect(input.getAttribute("aria-busy")).toBe("true");
    expect(
      (document.querySelector("form") as HTMLElement).dataset.ccxpLiteCaptchaAutofillBound,
    ).toBe("true");

    await flushPromises();
    await flushPromises();

    expect(input.value).toBe("654321");
    expect(input.getAttribute("aria-busy")).toBe("false");
    expect(inputSpy).toHaveBeenCalled();
    expect(changeSpy).toHaveBeenCalled();
    expect(window.fetch).not.toHaveBeenCalled();
    expect(predictDigits.mock.calls[0]?.[0]).toBe(image);

    loginCaptcha.enableCaptchaAutofill(document, document);
    expect(predictDigits).toHaveBeenCalledTimes(1);
  });

  test("falls back to manual entry and flashes timeout when download and image fallback both fail", async () => {
    const { window } = createTestWindow(createLoginHtml());
    const document = window.document as Document;
    window.CCXP_LITE.decaptcha = { predictDigits: vi.fn() };
    loadModules(window, loginCaptchaModulePaths);
    const loginCaptcha = requireValue(window.CCXP_LITE.loginCaptcha, "loginCaptcha");

    window.fetch = vi.fn(async () => {
      await Promise.resolve();
      const error = new Error("captcha-timeout");
      error.name = "TimeoutError";
      throw error;
    }) as unknown as typeof window.fetch;

    const input = requireElement(
      document.querySelector<HTMLInputElement>("input[name='passwd2']"),
      "captcha input",
    );
    const image = requireElement(
      document.querySelector<HTMLImageElement>(".ccxp-lite-captcha-media-row img"),
      "legacy captcha image",
    );
    Object.defineProperty(image, "complete", {
      configurable: true,
      get: () => false,
    });
    Object.defineProperty(image, "naturalWidth", {
      configurable: true,
      get: () => 0,
    });
    Object.defineProperty(image, "naturalHeight", {
      configurable: true,
      get: () => 0,
    });
    loginCaptcha.enableCaptchaAutofill(document, document);
    setTimeout(() => {
      image.dispatchEvent(new TestEvent("error"));
    }, 0);
    await flushPromises();
    await flushPromises();
    await flushPromises();

    expect(input.hasAttribute("aria-busy")).toBe(false);
    expect(input.dataset.timeoutFlash).toBe("true");
    expect(input.value).toBe("");
  });

  test("falls back to network bytes when the legacy captcha image is not ready", async () => {
    const { window } = createTestWindow(createLoginHtml());
    const document = window.document as Document;
    const predictDigits = vi.fn().mockResolvedValue("432109");
    window.CCXP_LITE.decaptcha = { predictDigits };
    loadModules(window, loginCaptchaModulePaths);
    const loginCaptcha = requireValue(window.CCXP_LITE.loginCaptcha, "loginCaptcha");

    window.fetch = vi.fn(
      async () =>
        await Promise.resolve({
          ok: true,
          arrayBuffer: async () => await Promise.resolve(new ArrayBuffer(8)),
        }),
    ) as unknown as typeof window.fetch;

    const image = requireElement(
      document.querySelector<HTMLImageElement>(".ccxp-lite-captcha-media-row img"),
      "legacy captcha image",
    );
    Object.defineProperty(image, "complete", {
      configurable: true,
      get: () => false,
    });
    Object.defineProperty(image, "naturalWidth", {
      configurable: true,
      get: () => 0,
    });
    Object.defineProperty(image, "naturalHeight", {
      configurable: true,
      get: () => 0,
    });

    const input = requireElement(
      document.querySelector<HTMLInputElement>("input[name='passwd2']"),
      "captcha input",
    );

    loginCaptcha.enableCaptchaAutofill(document, document);
    await flushPromises();
    await flushPromises();

    expect(input.value).toBe("432109");
    expect(input.getAttribute("aria-busy")).toBe("false");
    expect(predictDigits).toHaveBeenCalledTimes(1);
    expect(predictDigits.mock.calls[0]?.[0]).toBeInstanceOf(ArrayBuffer);
    expect(window.fetch).toHaveBeenCalledTimes(1);
  });
});

function networkCaptcha(source: string, origin = "https://www.ccxp.nthu.edu.tw") {
  const { window } = createTestWindow(createLoginHtml(), `${origin}/ccxp/INQUIRE/index.php`);
  const document = window.document as Document;
  const image = requireElement(document.querySelector<HTMLImageElement>("img"), "captcha image");
  image.src = source;
  Object.defineProperties(image, {
    complete: { configurable: true, get: () => false },
    naturalWidth: { configurable: true, get: () => 0 },
    naturalHeight: { configurable: true, get: () => 0 },
  });
  const predictDigits = vi.fn().mockResolvedValue("432109");
  const bytes = new ArrayBuffer(8);
  const fetch = vi.fn(
    async () =>
      await Promise.resolve({ ok: true, arrayBuffer: async () => await Promise.resolve(bytes) }),
  );
  window.CCXP_LITE.decaptcha = { predictDigits };
  window.fetch = fetch as unknown as typeof window.fetch;
  loadModules(window, loginCaptchaModulePaths);
  const input = requireElement(
    document.querySelector<HTMLInputElement>("[name='passwd2']"),
    "captcha input",
  );
  const loginCaptcha = requireValue(window.CCXP_LITE.loginCaptcha, "loginCaptcha");
  loginCaptcha.enableCaptchaAutofill(document, document);
  return { window, input, fetch, predictDigits, bytes };
}

test.each([
  "https://attacker.example/auth_img.php",
  "//attacker.example/ccxp/INQUIRE/auth_img.php",
  "https://www.ccxp.nthu.edu.tw.attacker.example/ccxp/INQUIRE/auth_img.php",
  "https://user:secret@www.ccxp.nthu.edu.tw/ccxp/INQUIRE/auth_img.php",
  "https://www.ccxp.nthu.edu.tw:8443/ccxp/INQUIRE/auth_img.php",
  "http://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/auth_img.php",
  "https://ccxp.nthu.edu.tw/ccxp/INQUIRE/auth_img.php",
  "https://[invalid/auth_img.php",
  "data:image/png,auth_img.php",
  "/ccxp/INQUIRE/account.php",
  "/ccxp/INQUIRE/%61uth_img.php",
  "/ccxp/INQUIRE/auth_img.php/../account.php",
  "/ccxp/INQUIRE/%2e%2e/account.php",
])("rejects captcha fetch destination %s and releases manual entry", async (source) => {
  const { window, input, fetch, predictDigits } = networkCaptcha(source);
  await flushPromises();
  await flushPromises();
  expect(fetch).not.toHaveBeenCalled();
  expect(predictDigits).not.toHaveBeenCalled();
  expect(input.hasAttribute("aria-busy")).toBe(false);
  expect(input.value).toBe("");
  input.value = "123456";
  expect(input.value).toBe("123456");
  await window.happyDOM.close();
});

test.each([
  ["https://www.ccxp.nthu.edu.tw", "auth_img.php?pwdstr=abc&v=1"],
  ["https://ccxp.nthu.edu.tw", "auth_img.php?pwdstr=abc&v=1"],
  [
    "https://www.ccxp.nthu.edu.tw",
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/auth_img.php?pwdstr=abc",
  ],
  ["https://ccxp.nthu.edu.tw", "https://ccxp.nthu.edu.tw/ccxp/INQUIRE/auth_img.php?pwdstr=abc"],
  ["https://www.ccxp.nthu.edu.tw", "//www.ccxp.nthu.edu.tw/ccxp/INQUIRE/auth_img.php?pwdstr=abc"],
  ["https://www.ccxp.nthu.edu.tw", "nested/../auth_img.php?pwdstr=abc"],
  ["https://www.ccxp.nthu.edu.tw", "auth_img.php?pwdstr=%2F%2Fevil.example&v=a%26b#fragment"],
  ["https://www.ccxp.nthu.edu.tw", "auth_img.php"],
])("downloads the canonical captcha URL on %s from %s", async (origin, source) => {
  const { window, input, fetch, predictDigits, bytes } = networkCaptcha(source, origin);
  await flushPromises();
  await flushPromises();
  expect(fetch).toHaveBeenCalledExactlyOnceWith(
    new URL(source, `${origin}/ccxp/INQUIRE/index.php`).toString(),
    expect.objectContaining({ credentials: "include", redirect: "error" }),
  );
  expect(predictDigits).toHaveBeenCalledExactlyOnceWith(bytes);
  expect(input.value).toBe("432109");
  expect(input.getAttribute("aria-busy")).toBe("false");
  await window.happyDOM.close();
});
