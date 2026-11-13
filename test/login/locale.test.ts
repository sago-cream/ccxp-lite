import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { createEnglishLoginHtml } from "../helpers/login-fixtures.js";
import {
  createTestWindow,
  loadModules,
  loginModulePaths,
  requireValue,
} from "../helpers/module-loader.js";

test.each(["", "?lang=chinese"])(
  "recognizes the captured Chinese Turnstile login at index.php%s",
  (query) => {
    const { window } = createTestWindow(
      readFileSync("test/browser-fixtures/login-locale-zh.html", "utf8"),
      `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/index.php${query}`,
    );
    loadModules(window, loginModulePaths);
    const document = window.document as Document;
    const identify = requireValue(window.CCXP_LITE.loginIdentify);
    const surface = requireValue(identify.identifyLoginSurface(document));
    expect(surface.locale).toBe("zh");
    expect(surface.strings.loginTitle).toBe("\u767B\u5165");
    expect(document.documentElement.lang).toBe("zh");
    expect(window.sessionStorage.getItem("ccxp-lite-locale")).toBe("zh");
  },
);

test.each([
  ["chinese", "zh"],
  ["english", "en"],
])("recognizes the host's lang=%s parameter", (query, expected) => {
  const { window } = createTestWindow(
    "<html><body><form action='pre_select_entry.php'></form></body></html>",
    `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/index.php?lang=${query}`,
  );
  loadModules(window, loginModulePaths);
  const locale = requireValue(window.CCXP_LITE.loginLocale);
  expect(locale.resolveLoginLocale(window.document, undefined, undefined, undefined)).toBe(
    expected,
  );
});

test("retains English detection without an html language or query parameter", () => {
  const { window } = createTestWindow(createEnglishLoginHtml().replace('lang="en"', ""));
  loadModules(window, loginModulePaths);
  const surface = requireValue(
    requireValue(window.CCXP_LITE.loginIdentify).identifyLoginSurface(window.document),
  );
  expect(surface.locale).toBe("en");
  expect(surface.strings.loginTitle).toBe("Login");
});

test.each(["", "?lang=english"])(
  "recognizes the captured English login at index.php%s",
  (query) => {
    const { window } = createTestWindow(
      readFileSync("test/browser-fixtures/login-locale-en.html", "utf8"),
      `https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/index.php${query}`,
    );
    loadModules(window, loginModulePaths);
    const surface = requireValue(
      requireValue(window.CCXP_LITE.loginIdentify).identifyLoginSurface(window.document),
    );
    expect(surface.locale).toBe("en");
    expect(surface.strings.loginTitle).toBe("Login");
  },
);
