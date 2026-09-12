import { describe, expect, test } from "vitest";
import { applyTokens, cssVariables } from "@ccxp-lite/tokens";
import { createDialogActionButton, createRenderer, mountInfoPopover } from "@ccxp-lite/ui";
import {
  createTestWindow,
  loadModules,
  requireValue,
  sharedModulePaths,
} from "../helpers/module-loader.js";

describe("design workspace integration", () => {
  test("the standalone module and classic bridge render the same buttons in another document", () => {
    const { window } = createTestWindow();
    loadModules(window, sharedModulePaths);
    const target = (window.document as Document).implementation.createHTMLDocument("Example");
    const classic = requireValue(window.CCXP_LITE.uiButtons);
    for (const variant of ["primary", "secondary", "danger"] as const) {
      const moduleButton = createDialogActionButton(target, "Action", variant);
      expect(moduleButton.ownerDocument).toBe(target);
      expect(moduleButton.outerHTML).toBe(
        classic.createDialogActionButton(target, "Action", variant).outerHTML,
      );
    }
  });

  test("theme injection and standalone tokens apply the same map to separate roots", () => {
    const { window } = createTestWindow();
    loadModules(window, sharedModulePaths);
    const document = window.document as Document;
    const standalone = document.implementation.createHTMLDocument("Standalone");
    applyTokens(standalone.documentElement);
    requireValue(window.CCXP_LITE.sharedTheme).ensureThemeDocument(document, "nav");
    for (const name of Object.keys(cssVariables)) {
      expect(document.documentElement.style.getPropertyValue(name)).toBe(
        standalone.documentElement.style.getPropertyValue(name),
      );
    }
  });

  test("standalone popovers dispose their document listeners without an application global", () => {
    const { window } = createTestWindow();
    const document = window.document as Document;
    const dom = createRenderer(document);
    const mounted = mountInfoPopover(document, "Help content", "Help");
    const root = dom.element("section", {}, [mounted.element]);
    document.body.append(root);
    const trigger = requireValue(
      mounted.element.querySelector<HTMLButtonElement>("button") ?? undefined,
    );
    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    mounted.destroy();
    document.body.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });
});
