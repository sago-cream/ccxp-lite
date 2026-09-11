import { describe, expect, test } from "vitest";
import {
  createTestWindow,
  loadModules,
  requireElement,
  requireValue,
  sharedModulePaths,
} from "../helpers/module-loader.js";

describe("document UI renderer and controller", () => {
  test("creates owned markup in the requested document and moves host nodes by identity", () => {
    const { window } = createTestWindow();
    loadModules(window, sharedModulePaths);
    const { window: childWindow } = createTestWindow();
    const childDocument = childWindow.document as Document;
    const hostInput = childDocument.createElement("input");
    hostInput.value = "preserved";
    const dom = requireValue(window.CCXP_LITE.uiRenderer).createRenderer(childDocument);

    const field = dom.element(
      "label",
      {
        className: "field",
        attributes: { title: "Account" },
        data: { state: "ready" },
        styleProperties: { "--field-order": "1" },
      },
      ["Account", hostInput],
    );

    expect(field.ownerDocument).toBe(childDocument);
    expect(field.lastChild).toBe(hostInput);
    expect(hostInput.value).toBe("preserved");
    expect(field.outerHTML).toBe(
      '<label class="field" title="Account" data-state="ready" style="--field-order: 1;">Account<input></label>',
    );
  });

  test("destroys element and document listeners through one lifecycle", () => {
    const { window } = createTestWindow();
    loadModules(window, sharedModulePaths);
    const document = window.document as Document;
    const button = document.createElement("button");
    document.body.append(button);
    const controller = requireValue(window.CCXP_LITE.uiController).createController(document);
    let buttonCalls = 0;
    let documentCalls = 0;
    let cleanupCalls = 0;
    controller.listen(button, "click", () => {
      buttonCalls++;
    });
    controller.listen(document, "click", () => {
      documentCalls++;
    });
    controller.addCleanup(() => {
      cleanupCalls++;
    });

    button.click();
    expect(buttonCalls).toBe(1);
    expect(documentCalls).toBe(1);
    controller.destroy();
    controller.destroy();
    button.click();

    expect(buttonCalls).toBe(1);
    expect(documentCalls).toBe(1);
    expect(cleanupCalls).toBe(1);
    expect(controller.destroyed).toBe(true);
  });

  test("mounted popovers stop reacting after their controller is destroyed", () => {
    const { window } = createTestWindow();
    loadModules(window, sharedModulePaths);
    const document = window.document as Document;
    const mounted = requireValue(window.CCXP_LITE.uiPopover).mountInfoPopover(
      document,
      "Help text",
      "Help",
    );
    document.body.append(mounted.element);
    const button = requireElement(mounted.element.querySelector<HTMLButtonElement>("button"));
    const popup = requireElement(
      mounted.element.querySelector<HTMLElement>(".ccxp-lite-account-guide-info-popup"),
    );

    button.click();
    expect(popup.hidden).toBe(false);
    mounted.destroy();
    document.body.click();
    button.click();

    expect(popup.hidden).toBe(false);
  });
});
