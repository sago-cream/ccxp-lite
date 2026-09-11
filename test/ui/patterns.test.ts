import { describe, expect, test } from "vitest";
import * as fixtures from "../helpers/login-fixtures.js";
import { createSidebarModel, createSidebarShellHtml } from "../helpers/menu-fixtures.js";
import {
  createTestWindow,
  loadModules,
  loginModulePaths,
  menuModulePaths,
  requireValue,
  requireElement,
} from "../helpers/module-loader.js";

function stableMarkup(node: Element): string {
  return node.outerHTML
    .replaceAll(/ccxp-lite-info-popup-[\da-z]+/g, "ccxp-lite-info-popup-ID")
    .replaceAll(/[\t ]+\n/g, "\n");
}

describe("UI behavior before extraction", () => {
  for (const [name, fixture] of Object.entries(fixtures)) {
    if (name.includes("Oauth") || name.includes("Captcha")) {
      continue;
    }
    test(`preserves ${name} markup and original inputs`, () => {
      const { window } = createTestWindow(fixture());
      loadModules(window, loginModulePaths);
      const document = window.document as Document;
      if (name.includes("Announcement")) {
        const support = requireValue(window.CCXP_LITE.loginSupport);
        support.prepareAnnouncementTable(support.findAnnouncementTable(document));
        expect(stableMarkup(document.body)).toMatchSnapshot();
        return;
      }
      const inputs = [...document.querySelectorAll("input")];
      const identified = requireValue(
        requireValue(window.CCXP_LITE.loginIdentify).identifyLoginSurface(document),
      );
      const result = requireValue(window.CCXP_LITE.loginRewrite).rewriteLoginSurface(
        document,
        identified,
      );
      expect(stableMarkup(result.shell)).toMatchSnapshot();
      for (const input of inputs) {
        expect(result.shell.contains(input)).toBe(true);
      }
    });
  }

  test("preserves language links and listeners when moving them", () => {
    const { window } = createTestWindow(fixtures.createLoginHtml());
    loadModules(window, loginModulePaths);
    const document = window.document as Document;
    const links = requireElement(document.querySelector("ul.links"));
    links.innerHTML =
      '<li><strong>\u4E2D\u6587</strong></li><li><a href="index.php?lang=en" target="_self">English</a></li>';
    const link = requireElement(links.querySelector("a"));
    let clicks = 0;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      clicks++;
    });
    const identified = requireValue(
      requireValue(window.CCXP_LITE.loginIdentify).identifyLoginSurface(document),
    );
    const result = requireValue(window.CCXP_LITE.loginRewrite).rewriteLoginSurface(
      document,
      identified,
    );
    expect(result.shell.querySelector(".ccxp-lite-landing-lang ul")).toBe(links);
    expect(link.getAttribute("href")).toBe("index.php?lang=en");
    link.click();
    expect(clicks).toBe(1);
  });

  test("password enhancement is idempotent and toggles only the password", () => {
    const { window } = createTestWindow(fixtures.createLoginHtml());
    loadModules(window, loginModulePaths);
    const document = window.document as Document;
    const ui = requireValue(window.CCXP_LITE.loginUi);
    const password = requireElement(
      document.querySelector<HTMLInputElement>("input[name='passwd']"),
    );
    password.value = "secret";
    ui.enhancePasswordVisibilityToggle(document, document);
    ui.enhancePasswordVisibilityToggle(document, document);
    expect(document.querySelectorAll(".ccxp-lite-password-toggle")).toHaveLength(1);
    const button = requireElement(
      document.querySelector<HTMLButtonElement>(".ccxp-lite-password-toggle"),
    );
    expect(stableMarkup(requireValue(button.parentElement ?? undefined))).toMatchSnapshot();
    button.click();
    expect(password.type).toBe("text");
    expect(password.value).toBe("secret");
    expect(stableMarkup(requireValue(button.parentElement ?? undefined))).toMatchSnapshot();
    button.click();
    expect(password.type).toBe("password");
  });

  for (const variant of ["classic", "layered"] as const) {
    for (const view of ["root", "expanded", "empty", "loading", "category"] as const) {
      test(`preserves ${variant} ${view} markup`, async () => {
        const { window } = createTestWindow(createSidebarShellHtml());
        loadModules(window, menuModulePaths);
        const document = window.document as Document;
        const state = requireValue(window.CCXP_LITE.sidebarState).getSidebarUiState(document);
        const favorites = requireValue(window.CCXP_LITE.sidebarFavorites);
        const model = createSidebarModel();
        state.sidebarVariant = variant;
        if (view !== "loading") {
          await new Promise<void>((resolve) => {
            favorites.initializeFavorites(resolve);
          });
        }
        if (view === "expanded") {
          state.classicExpandedItemIds = model.categories.flatMap((category) => [
            category.id,
            ...category.blocks.map((block) => block.id),
          ]);
        }
        if (view === "empty") {
          state.searchQuery = "not-a-real-course";
        }
        if (view === "category") {
          state.currentCategoryId = model.categories[0].id;
        }
        requireValue(window.CCXP_LITE.sidebarUi).renderSidebar(document, document, model);
        expect(stableMarkup(document.body)).toMatchSnapshot();
      });
    }
  }
});
