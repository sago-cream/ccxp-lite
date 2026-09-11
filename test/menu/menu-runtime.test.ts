import { describe, expect, test, vi } from "vitest";
import {
  createTestWindow,
  loadModules,
  menuModulePaths,
  requireValue,
} from "../helpers/module-loader.js";

describe("sidebar runtime", () => {
  test("detects external-only routes and opens them in a new tab", () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);
    const sidebarRuntime = requireValue(window.CCXP_LITE.sidebarRuntime, "sidebarRuntime");
    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation((() => undefined) as unknown as typeof window.open);
    const linkItem: CcxpLiteSidebarLinkItem = {
      id: "external",
      label: "External Inquiry",
      href: "/ccxp/INQUIRE/PE/1/14D/report",
      target: "main",
    };
    expect(sidebarRuntime.isExternalLinkTarget(linkItem, window.document)).toBe(true);
    sidebarRuntime.openLeafDestination(window.document, window.document, linkItem, () => undefined);
    expect(openSpy).toHaveBeenCalledWith(
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PE/1/14D/report",
      "_blank",
      "noopener",
    );
  });
  test("stores active leaf for layered main-target routes", () => {
    const { window } = createTestWindow(
      "<!doctype html><html><body><div class='ccxp-lite-sidebar-content'></div></body></html>",
    );
    loadModules(window, menuModulePaths);
    const sidebarState = requireValue(window.CCXP_LITE.sidebarState, "sidebarState");
    const sidebarRuntime = requireValue(window.CCXP_LITE.sidebarRuntime, "sidebarRuntime");
    const state = sidebarState.getSidebarUiState(window.document);
    state.sidebarVariant = "layered";
    const rerender = vi.fn();
    sidebarRuntime.openLeafDestination(
      window.document,
      window.document,
      {
        id: "grades",
        label: "Semester Grades",
        href: "/grades",
        target: "main",
      },
      () => {
        rerender(undefined);
      },
    );
    expect(state.activeLeaf?.label).toBe("Semester Grades");
    expect(rerender).toHaveBeenCalled();
  });
  test("activates legacy links into the destination frame and records the initial main URL once", () => {
    const { window } = createTestWindow(
      "<!doctype html><html><body><frame name='main' src='/start'></frame></body></html>",
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/index.php?ACIXSTORE=ABC123",
    );
    const document = window.document as Document;
    loadModules(window, menuModulePaths);
    const sidebarRuntime = requireValue(window.CCXP_LITE.sidebarRuntime, "sidebarRuntime");
    const destinationFrame = document.createElement("iframe");
    sidebarRuntime.activateLegacyLink(
      {
        id: "grades",
        label: "Semester Grades",
        href: "/grades",
        target: "main",
      },
      document,
      destinationFrame,
    );
    expect(destinationFrame.src).toBe("https://www.ccxp.nthu.edu.tw/grades");
    sidebarRuntime.captureInitialMainFrameUrl();
    sidebarRuntime.captureInitialMainFrameUrl();
    expect(window.sessionStorage.getItem(sidebarRuntime.INITIAL_MAIN_URL_STORAGE_KEY)).toBe(
      "https://www.ccxp.nthu.edu.tw/start",
    );
  });

  test("adapts visual inline priorities in embedded pages while preserving behavior styles", () => {
    const { window } = createTestWindow();
    const document = window.document as Document;
    loadModules(window, menuModulePaths);
    const sidebarRuntime = requireValue(window.CCXP_LITE.sidebarRuntime, "sidebarRuntime");
    const destinationFrame = sidebarRuntime.createDestinationFrame(
      document,
      document,
      { id: "legacy", label: "Legacy", href: "/legacy", target: "main" },
      () => undefined,
    );
    document.body.append(destinationFrame);
    const frameDocument = destinationFrame.contentDocument;
    if (!frameDocument) {
      throw new Error("Expected iframe document");
    }
    frameDocument.body.innerHTML =
      '<div id="legacy" style="color: red !important; width: 11px !important; display: none !important">Legacy</div>';

    destinationFrame.dispatchEvent(new Event("load"));

    const legacy = frameDocument.querySelector<HTMLElement>("#legacy");
    if (!legacy) {
      throw new Error("Expected legacy element");
    }
    expect(legacy.style.getPropertyValue("color")).toBe("red");
    expect(legacy.style.getPropertyPriority("color")).toBe("");
    expect(legacy.style.getPropertyPriority("width")).toBe("");
    expect(legacy.style.getPropertyPriority("display")).toBe("important");
    expect(frameDocument.body.classList.contains("ccxp-lite-main-skin")).toBe(true);
  });
});
