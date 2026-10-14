import { describe, expect, test } from "vitest";
import {
  createTestWindow,
  loadModules,
  menuModulePaths,
  requireElement,
  requireValue,
} from "../helpers/module-loader.js";

describe("sidebar state", () => {
  test("shares sidebar state across frame documents in the same top-level page", () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);
    const { getSidebarUiState } = requireValue(window.CCXP_LITE.sidebarState, "sidebarState");
    const frameDocument = {
      defaultView: {
        top: window,
      },
    } as unknown as Document;

    expect(getSidebarUiState(frameDocument)).toBe(getSidebarUiState(window.document));
  });

  test("persists normalized variants and falls back to classic on storage failure", () => {
    const { window } = createTestWindow();
    loadModules(window, menuModulePaths);
    const { getPersistedSidebarVariant, setPersistedSidebarVariant } = requireValue(
      window.CCXP_LITE.sidebarState,
      "sidebarState",
    );
    expect(setPersistedSidebarVariant("layered")).toBe("layered");
    expect(window.localStorage.getItem("ccxp-lite-sidebar-variant")).toBe("layered");
    expect(
      (setPersistedSidebarVariant as unknown as (value: string) => "classic" | "layered")(
        "unexpected",
      ),
    ).toBe("layered");
    expect(getPersistedSidebarVariant()).toBe("layered");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("storage blocked");
      },
    });
    expect(
      requireValue(window.CCXP_LITE.sidebarState, "sidebarState").getPersistedSidebarVariant(),
    ).toBe("layered");
    expect(
      requireValue(window.CCXP_LITE.sidebarState, "sidebarState").setPersistedSidebarVariant(
        "classic",
      ),
    ).toBe("classic");
  });
  test("restores collapsed preference without persisting hover preview", () => {
    const { window } = createTestWindow();
    window.localStorage.setItem("ccxp-lite-sidebar-collapsed", "true");
    loadModules(window, menuModulePaths);
    const api = requireValue(window.CCXP_LITE.sidebarState);
    const state = api.getSidebarUiState(window.document);
    expect(state.sidebarCollapsed).toBe(true);
    expect(state.sidebarPreview).toBe(false);
    api.setPersistedSidebarCollapsed(false);
    expect(window.localStorage.getItem("ccxp-lite-sidebar-collapsed")).toBe("false");
  });

  test("keeps collapse controls usable when preference storage is blocked", () => {
    const { window } = createTestWindow();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("storage blocked");
      },
    });
    loadModules(window, menuModulePaths);
    const api = requireValue(window.CCXP_LITE.sidebarState);
    expect(api.getSidebarUiState(window.document).sidebarCollapsed).toBe(false);
    expect(api.getSidebarUiState(window.document).sidebarWidth).toBe(324);
    expect(() => {
      api.setPersistedSidebarWidth(400);
      api.setPersistedSidebarCollapsed(true);
    }).not.toThrow();
  });

  test.each([
    ["420", 420],
    ["100", 240],
    ["900", 480],
    ["NaN", 324],
    ["", 324],
  ])("restores a bounded sidebar width from %s", (stored, expected) => {
    const { window } = createTestWindow();
    window.localStorage.setItem("ccxp-lite-sidebar-width", stored);
    loadModules(window, menuModulePaths);
    const api = requireValue(window.CCXP_LITE.sidebarState);
    expect(api.getSidebarUiState(window.document).sidebarWidth).toBe(expected);
    api.setPersistedSidebarWidth(400);
    expect(window.localStorage.getItem("ccxp-lite-sidebar-width")).toBe("400");
  });

  test("persists and restores scroll positions by view", () => {
    const { window } = createTestWindow(
      "<!doctype html><html><body><div class='ccxp-lite-sidebar-content'></div></body></html>",
    );
    const document = window.document as Document;
    loadModules(window, menuModulePaths);
    const content = requireElement(
      document.querySelector<HTMLElement>(".ccxp-lite-sidebar-content"),
      "sidebar content",
    );
    content.scrollTop = 48;
    const { getSidebarUiState, persistSidebarScroll, restoreSidebarScroll } = requireValue(
      window.CCXP_LITE.sidebarState,
      "sidebarState",
    );
    persistSidebarScroll(document, "category");
    expect(getSidebarUiState(document).scrollTopByView.category).toBe(48);
    restoreSidebarScroll(content, 96);
    expect(content.scrollTop).toBe(96);
  });
});
