import { describe, expect, test } from "vitest";

import { createLoginHtml } from "../helpers/login-fixtures.js";
import {
  createTestWindow,
  loadModules,
  loginModulePaths,
  requireElement,
  requireValue,
} from "../helpers/module-loader.js";

describe("legacy style adaptation", () => {
  test("downgrades skin-owned priorities and preserves structural priorities", () => {
    const { window } = createTestWindow();
    loadModules(window, loginModulePaths);
    const document = window.document as Document;
    document.body.innerHTML = `
      <section style="position: fixed !important; display: none !important; overflow: hidden !important">
        <input
          style="color: red !important; width: 17px !important; border: 9px solid lime !important;
            font-size: 33px !important; opacity: 0 !important; --host-state: ready !important"
        />
      </section>
    `;
    const section = requireElement(document.querySelector<HTMLElement>("section"));
    const input = requireElement(document.querySelector<HTMLInputElement>("input"));
    const adapter = requireValue(window.CCXP_LITE.uiLegacyStyle);

    adapter.adaptLegacyStyles(document);

    for (const propertyName of ["color", "width", "border", "font-size", "opacity"]) {
      expect(input.style.getPropertyPriority(propertyName)).toBe("");
    }
    expect(input.style.color).toBe("red");
    expect(input.style.width).toBe("17px");
    expect(input.style.getPropertyPriority("--host-state")).toBe("important");
    for (const propertyName of ["position", "display", "overflow"]) {
      expect(section.style.getPropertyPriority(propertyName)).toBe("important");
    }
  });

  test("is idempotent and cleans legacy presentation attributes in a subtree", () => {
    const { window } = createTestWindow();
    loadModules(window, loginModulePaths);
    const document = window.document as Document;
    document.body.innerHTML = `
      <table background="texture.gif" bgcolor="#ffffff">
        <tbody><tr><td style="background-image: url(texture.gif) !important; color: navy !important">Info</td></tr></tbody>
      </table>
    `;
    const table = requireElement(document.querySelector<HTMLTableElement>("table"));
    const cell = requireElement(document.querySelector<HTMLTableCellElement>("td"));
    const adapter = requireValue(window.CCXP_LITE.uiLegacyStyle);

    adapter.adaptLegacyStyles(table);
    const once = table.outerHTML;
    adapter.adaptLegacyStyles(table);

    expect(table.outerHTML).toBe(once);
    expect(table.hasAttribute("background")).toBe(false);
    expect(table.hasAttribute("bgcolor")).toBe(false);
    expect(cell.style.backgroundImage).toBe('url("texture.gif")');
    expect(cell.style.getPropertyPriority("background-image")).toBe("");
    expect(cell.style.getPropertyPriority("color")).toBe("");
    expect(cell.style.color).toBe("navy");
  });

  test("the login pipeline adapts moved fields and language links", () => {
    const { window } = createTestWindow(createLoginHtml());
    loadModules(window, loginModulePaths);
    const document = window.document as Document;
    const account = requireElement(
      document.querySelector<HTMLInputElement>("input[name='account']"),
    );
    const languageLinks = requireElement(document.querySelector<HTMLElement>("ul.links"));
    account.style.setProperty("width", "11px", "important");
    account.style.setProperty("display", "block", "important");
    languageLinks.style.setProperty("font-size", "42px", "important");
    languageLinks.style.setProperty("visibility", "hidden", "important");
    const identified = requireValue(
      requireValue(window.CCXP_LITE.loginIdentify).identifyLoginSurface(document),
    );
    const result = requireValue(window.CCXP_LITE.loginRewrite).rewriteLoginSurface(
      document,
      identified,
    );

    requireValue(window.CCXP_LITE.loginStyle).applyLoginTheme(document, result);

    expect(document.body.contains(account)).toBe(true);
    expect(document.body.contains(languageLinks)).toBe(true);
    expect(account.style.getPropertyPriority("width")).toBe("");
    expect(account.style.getPropertyPriority("display")).toBe("important");
    expect(languageLinks.style.getPropertyPriority("font-size")).toBe("");
    expect(languageLinks.style.getPropertyPriority("visibility")).toBe("important");
  });
});
