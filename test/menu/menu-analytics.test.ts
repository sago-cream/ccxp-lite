import { describe, expect, test, vi } from "vitest";
import { TestEvent } from "../helpers/dom-event.js";
import { createSidebarModel, createSidebarShellHtml } from "../helpers/menu-fixtures.js";
import {
  createTestWindow,
  loadModules,
  menuModulePaths,
  requireElement,
  requireValue,
} from "../helpers/module-loader.js";

describe("menu analytics", () => {
  test.each(["classic", "layered"] as const)(
    "tracks the persisted %s mode, switches, and link usage without counting rerenders",
    (initialVariant) => {
      const { window } = createTestWindow(createSidebarShellHtml());
      window.localStorage.setItem("ccxp-lite-sidebar-variant", initialVariant);
      loadModules(window, menuModulePaths);
      const document = window.document as unknown as Document;
      const ui = requireValue(window.CCXP_LITE.sidebarUi);
      const strings = requireValue(window.CCXP_LITE.sharedConstants).LOCALIZED_STRINGS.en;
      const model = createSidebarModel();
      const sendMessage = vi.spyOn(window.chrome.runtime, "sendMessage");
      const messages = () =>
        sendMessage.mock.calls.map(([message]) => message as unknown as CcxpLiteAnalyticsMessage);
      const render = () => {
        ui.renderSidebar(document, document, model, strings);
      };
      render();
      render();
      expect(messages()).toHaveLength(1);
      expect(messages()[0]).toMatchObject({
        name: "ccxp_lite_menu_view",
        params: { menu_mode: initialVariant === "classic" ? "sidebar" : "fullscreen" },
      });

      const search = requireElement(
        document.querySelector<HTMLInputElement>("input[type='search']"),
      );
      search.value = "Grades";
      search.dispatchEvent(new TestEvent("input", { bubbles: true }));
      expect(messages()).toHaveLength(1);

      const nextVariant = initialVariant === "classic" ? "layered" : "classic";
      const modeButton = requireElement(
        document.querySelector<HTMLButtonElement>("#ccxp-lite-profile-mode"),
      );
      modeButton.click();
      render();
      expect(messages().map((message) => message.name)).toEqual([
        "ccxp_lite_menu_view",
        "ccxp_lite_menu_mode_change",
        "ccxp_lite_menu_view",
      ]);
      expect(messages()[1]?.params).toMatchObject({
        previous_menu_mode: initialVariant === "classic" ? "sidebar" : "fullscreen",
        menu_mode: nextVariant === "classic" ? "sidebar" : "fullscreen",
      });
      expect(window.localStorage.getItem("ccxp-lite-sidebar-variant")).toBe(nextVariant);

      // The external route exercises a real menu click without loading a destination frame.
      const state = requireValue(window.CCXP_LITE.sidebarState).getSidebarUiState(document);
      state.searchQuery = "";
      state.currentCategoryId = "category-campus";
      state.classicExpandedItemIds = ["category-campus", "campus-block"];
      render();
      vi.spyOn(window, "open").mockImplementation(
        (() => undefined) as unknown as typeof window.open,
      );
      const link = requireElement(
        document.querySelector<HTMLButtonElement>('button[title="External Inquiry"]'),
      );
      link.click();
      const navigationEvents = messages().filter(
        (message) => message.params.action === "open_link",
      );
      expect(navigationEvents).toHaveLength(1);
      expect(navigationEvents[0]?.params).toMatchObject({
        menu_mode: nextVariant === "classic" ? "sidebar" : "fullscreen",
        link_id: "external",
      });
      expect(messages().filter((message) => message.name === "ccxp_lite_menu_view")).toHaveLength(
        2,
      );
    },
  );
});
