import { TestEvent } from "../helpers/dom-event.js";
import { describe, expect, test, vi } from "vitest";
import { createLoginHtml } from "../helpers/login-fixtures.js";
import { createSidebarModel, createSidebarShellHtml } from "../helpers/menu-fixtures.js";
import {
  createTestWindow,
  loadModules,
  loginModulePaths,
  menuModulePaths,
  requireElement,
  requireValue,
} from "../helpers/module-loader.js";

async function setupMenu() {
  const { window } = createTestWindow(createSidebarShellHtml());
  loadModules(window, menuModulePaths);
  const document = window.document as Document;
  const ui = requireValue(window.CCXP_LITE.sidebarUi);
  const state = requireValue(window.CCXP_LITE.sidebarState).getSidebarUiState(document);
  const favorites = requireValue(window.CCXP_LITE.sidebarFavorites);
  await new Promise<void>((resolve) => {
    favorites.initializeFavorites(resolve);
  });
  const strings = requireValue(window.CCXP_LITE.sharedConstants).LOCALIZED_STRINGS.en;
  const model = createSidebarModel();
  for (const category of model.categories) {
    for (const block of category.blocks) {
      block.favoriteId = favorites.createBlockId(block);
    }
  }
  const render = () => {
    ui.renderSidebar(document, document, model, strings);
  };
  return { window, document, ui, state, favorites, strings, model, render };
}

function setupLogin() {
  const { window } = createTestWindow(createLoginHtml());
  loadModules(window, loginModulePaths);
  return { window, document: window.document as Document };
}

describe("extracted UI interactions", () => {
  test("help popovers retain hover, pin, outside-click, Escape, and focus behavior", () => {
    const { window, document } = setupLogin();
    const tabs = requireValue(window.CCXP_LITE.loginTabs);
    const strings = requireValue(window.CCXP_LITE.sharedConstants).LOCALIZED_STRINGS.en;
    const wrap = tabs.createPasswordHelpPopover(document, strings);
    document.body.append(wrap);
    const button = requireElement(wrap.querySelector<HTMLButtonElement>("button"));
    const popup = requireElement(
      wrap.querySelector<HTMLElement>(".ccxp-lite-account-guide-info-popup"),
    );
    expect(button.getAttribute("aria-controls")).toBe(popup.id);
    expect(popup.hidden).toBe(true);
    wrap.dispatchEvent(new TestEvent("mouseenter"));
    expect(popup.hidden).toBe(false);
    wrap.dispatchEvent(new TestEvent("mouseleave"));
    expect(popup.hidden).toBe(true);
    button.click();
    wrap.dispatchEvent(new TestEvent("mouseleave"));
    expect(popup.hidden).toBe(false);
    popup.click();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    popup.dispatchEvent(
      new (window.KeyboardEvent as unknown as typeof KeyboardEvent)("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(popup.hidden).toBe(true);
    expect(document.activeElement).toBe(button);
    button.click();
    document.body.click();
    expect(popup.hidden).toBe(true);
    button.click();
    button.focus();
    button.dispatchEvent(
      new (window.KeyboardEvent as unknown as typeof KeyboardEvent)("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );
    expect(popup.hidden).toBe(true);
    expect(document.activeElement).not.toBe(button);
  });

  test("switch rerenders once, persists mode, resets navigation, and mounts only once", async () => {
    const { document, window, state, ui, strings } = await setupMenu();
    state.sidebarVariant = "classic";
    state.currentCategoryId = "category-courses";
    state.activeLeaf = { id: "grades", label: "Grades" };
    const rerender = vi.fn<() => void>();
    ui.mountSidebarVariantSwitch(document, state, strings, rerender);
    ui.mountSidebarVariantSwitch(document, state, strings, rerender);
    expect(document.querySelectorAll(".ccxp-lite-sidebar-experiment-switch")).toHaveLength(1);
    requireElement(
      document.querySelector<HTMLButtonElement>(".ccxp-lite-sidebar-experiment-switch"),
    ).click();
    expect(state.sidebarVariant).toBe("layered");
    expect(state.currentCategoryId).toBe("");
    expect(state.activeLeaf).toBeUndefined();
    expect(window.localStorage.getItem("ccxp-lite-sidebar-variant")).toBe("layered");
    expect(rerender).toHaveBeenCalledTimes(1);
    ui.mountSidebarVariantSwitch(document, state, strings, rerender);
    const button = requireElement(
      document.querySelector<HTMLButtonElement>(".ccxp-lite-sidebar-experiment-switch"),
    );
    expect(button.getAttribute("aria-label")).toBe(strings.sidebarSwitchToClassic);
    button.click();
    expect(state.sidebarVariant).toBe("classic");
    expect(rerender).toHaveBeenCalledTimes(2);
  });

  test("disclosure clicks expand and collapse without changing navigation", async () => {
    const { document, state, render } = await setupMenu();
    state.sidebarVariant = "classic";
    render();
    const row = () =>
      requireElement(document.querySelector<HTMLButtonElement>('button[title="Courses & Grades"]'));
    expect(row().getAttribute("aria-expanded")).toBe("false");
    row().click();
    expect(row().getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector('button[title="Academic"]')).not.toBeNull();
    row().click();
    expect(row().getAttribute("aria-expanded")).toBe("false");
    expect(state.activeLeaf).toBeUndefined();
  });

  test("search remains bound once across renders and restores the results when cleared", async () => {
    const { document, state, render } = await setupMenu();
    render();
    render();
    const input = requireElement(
      document.querySelector<HTMLInputElement>(".ccxp-lite-sidebar-search-input"),
    );
    input.value = "nothing-matches";
    input.dispatchEvent(new TestEvent("input", { bubbles: true }));
    expect(state.searchQuery).toBe("nothing-matches");
    expect(document.querySelector(".ccxp-lite-empty")).not.toBeNull();
    input.value = "";
    input.dispatchEvent(new TestEvent("input", { bubbles: true }));
    expect(document.querySelector('button[title="Courses & Grades"]')).not.toBeNull();
    expect(input.dataset.ccxpLiteSearchBound).toBe("true");
  });

  for (const kind of ["link", "block"] as const) {
    test(`${kind} favorite blocks parent navigation and confirms removal`, async () => {
      const { document, state, favorites, model, render } = await setupMenu();
      const block = requireValue(model.categories[0]?.blocks[0]);
      const link = requireValue(block.links[0]);
      state.sidebarVariant = "classic";
      state.classicExpandedItemIds = ["category-courses", "section-academic"];
      render();
      const title = kind === "link" ? "Semester Grades" : "Academic";
      const toggle = () =>
        requireElement(
          document.querySelector<HTMLButtonElement>(
            `button[title="${title}"] .ccxp-lite-favorite-toggle`,
          ),
        );
      const expanded = [...state.classicExpandedItemIds];
      toggle().click();
      expect(
        kind === "link" ? favorites.isFavoriteLink(link) : favorites.isFavoriteBlock(block),
      ).toBe(true);
      expect(state.activeLeaf).toBeUndefined();
      expect(state.classicExpandedItemIds).toEqual(expanded);
      expect(toggle().getAttribute("aria-pressed")).toBe("true");
      toggle().click();
      expect(
        kind === "link" ? favorites.isFavoriteLink(link) : favorites.isFavoriteBlock(block),
      ).toBe(true);
      const dialog = requireElement(document.querySelector('[role="dialog"]'));
      const buttons = dialog.querySelectorAll<HTMLButtonElement>("button");
      expect(document.activeElement).toBe(buttons[0]);
      buttons[1].click();
      await Promise.resolve();
      await Promise.resolve();
      expect(
        kind === "link" ? favorites.isFavoriteLink(link) : favorites.isFavoriteBlock(block),
      ).toBe(false);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(state.activeLeaf).toBeUndefined();
    });
  }

  for (const dismiss of ["keep", "escape", "backdrop"] as const) {
    test(`dialog ${dismiss} keeps the favorite`, async () => {
      const { window, document, state, favorites, model, render } = await setupMenu();
      state.sidebarVariant = "classic";
      state.classicExpandedItemIds = ["category-courses", "section-academic"];
      const link = requireValue(model.categories[0]?.blocks[0]?.links[0]);
      favorites.toggleFavoriteLink(link);
      render();
      requireElement(
        document.querySelector<HTMLButtonElement>(
          'button[title="Semester Grades"] .ccxp-lite-favorite-toggle',
        ),
      ).click();
      const overlay = requireElement(
        document.querySelector<HTMLElement>("[data-ccxp-lite-remove-pinned-dialog]"),
      );
      if (dismiss === "keep") {
        requireElement(overlay.querySelector<HTMLButtonElement>("button")).click();
      } else if (dismiss === "escape") {
        overlay.dispatchEvent(
          new (window.KeyboardEvent as unknown as typeof KeyboardEvent)("keydown", {
            key: "Escape",
            bubbles: true,
          }),
        );
      } else {
        overlay.click();
      }
      await Promise.resolve();
      await Promise.resolve();
      expect(favorites.isFavoriteLink(link)).toBe(true);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
  }

  test("category cards and back navigation keep the selected category state", async () => {
    const { document, state, render } = await setupMenu();
    state.sidebarVariant = "layered";
    render();
    requireElement(
      document.querySelector<HTMLButtonElement>('button[title="Courses & Grades"]'),
    ).click();
    expect(state.currentCategoryId).toBe("category-courses");
    expect(document.querySelector(".ccxp-lite-category-detail")).not.toBeNull();
    requireElement(document.querySelector<HTMLButtonElement>(".ccxp-lite-back-button")).click();
    expect(state.currentCategoryId).toBe("");
    expect(document.querySelector(".ccxp-lite-category-card")).not.toBeNull();
  });

  test("legacy support links preserve URLs, targets, inline handlers, and exclusion rules", () => {
    const { window, document } = setupLogin();
    const support = requireValue(window.CCXP_LITE.loginSupport);
    const source = document.createElement("a");
    source.setAttribute("href", "/help");
    source.setAttribute("target", "help-window");
    source.setAttribute("onclick", "return false");
    source.setAttribute("onkeydown", "return false");
    source.textContent = "< Help >";
    const link = requireValue(support.buildLoginHelperLink(document, source));
    expect(link.href).toBe(source.href);
    expect(link.target).toBe("help-window");
    expect(link.rel).toBe("noopener noreferrer");
    expect(link.getAttribute("onclick")).toBe("return false");
    expect(link.getAttribute("onkeydown")).toBe("return false");
    const utility = document.createElement("div");
    utility.innerHTML =
      '<a href="/help">Help</a><a href="inquire_cpr.html">Copyright</a><a href="/useful">Useful</a>';
    const nav = requireValue(support.buildHeaderUtilityLinks(document, utility, source, undefined));
    expect(nav.querySelectorAll("a")).toHaveLength(1);
    expect(requireElement(nav.querySelector("a")).getAttribute("target")).toBe("_blank");
  });

  test("legacy submit replacement keeps form overrides, disabled state, and inline handler", () => {
    const { window, document } = setupLogin();
    const form = requireElement(document.querySelector("form"));
    document.body.append(form);
    form.setAttribute("action", "/login");
    const image = document.createElement("input");
    image.type = "image";
    image.alt = "Continue";
    image.id = "continue-action";
    image.name = "continue";
    image.disabled = true;
    image.setAttribute("formaction", "/continue");
    image.setAttribute("formmethod", "post");
    image.setAttribute("formtarget", "main");
    image.setAttribute("formnovalidate", "");
    image.setAttribute("onclick", "return false");
    form.append(image);
    const ui = requireValue(window.CCXP_LITE.loginUi);
    ui.replaceLoginFormImageButtons(document, document);
    ui.replaceLoginFormImageButtons(document, document);
    const button = requireElement(form.querySelector<HTMLButtonElement>("#continue-action"));
    expect(button.tagName).toBe("BUTTON");
    expect(button.type).toBe("submit");
    expect(button.name).toBe("continue");
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("formaction")).toBe("/continue");
    expect(button.getAttribute("formmethod")).toBe("post");
    expect(button.getAttribute("formtarget")).toBe("main");
    expect(button.hasAttribute("formnovalidate")).toBe(true);
    expect(button.getAttribute("onclick")).toBe("return false");
    expect(form.querySelectorAll("#continue-action")).toHaveLength(1);
  });

  test("classic switch mounts in the top document and moves back for layered mode", async () => {
    const { document, ui, state, strings } = await setupMenu();
    const { window: child } = createTestWindow();
    const childDocument = child.document as Document;
    state.sidebarVariant = "classic";
    ui.mountSidebarVariantSwitch(childDocument, state, strings, () => undefined);
    expect(document.querySelector(".ccxp-lite-sidebar-experiment-switch")?.ownerDocument).toBe(
      document,
    );
    expect(childDocument.querySelector(".ccxp-lite-sidebar-experiment-switch")).toBeNull();
    state.sidebarVariant = "layered";
    ui.mountSidebarVariantSwitch(childDocument, state, strings, () => undefined);
    expect(document.querySelector(".ccxp-lite-sidebar-experiment-switch")).toBeNull();
    expect(childDocument.querySelector(".ccxp-lite-sidebar-experiment-switch")?.ownerDocument).toBe(
      childDocument,
    );
  });

  test("confirmation uses the wider main frame and rejects a duplicate dialog", async () => {
    const { window, document, strings } = await setupMenu();
    const { window: main } = createTestWindow();
    const mainDocument = main.document as Document;
    Object.defineProperty(mainDocument.body, "clientWidth", { value: 800 });
    document.body.insertAdjacentHTML("beforeend", '<frame name="main">');
    const frame = requireElement(document.querySelector('frame[name="main"]'));
    Object.defineProperty(frame, "contentDocument", { value: mainDocument });
    document.body.append(frame);
    const overlays = requireValue(window.CCXP_LITE.sidebarOverlays);
    const result = overlays.showRemovePinnedDialog(document, "Grades", strings);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    const dialog = requireElement(mainDocument.querySelector('[role="dialog"]'));
    expect(await overlays.showRemovePinnedDialog(document, "Schedule", strings)).toBe(false);
    requireElement(dialog.querySelector<HTMLButtonElement>("button")).click();
    expect(await result).toBe(false);
  });

  for (const outcome of ["success", "timeout"] as const) {
    test(`destination ${outcome} preserves loading, retry, external-open, and back behavior`, async () => {
      const { window, document, state, render, strings } = await setupMenu();
      const timers: Array<() => void> = [];
      vi.spyOn(window, "setTimeout").mockImplementation(((callback: () => void) => {
        timers.push(callback);
        return 1;
      }) as typeof window.setTimeout);
      const open = vi
        .spyOn(window, "open")
        .mockImplementation((() => undefined) as unknown as typeof window.open);
      state.sidebarVariant = "layered";
      state.currentCategoryId = "category-courses";
      state.activeLeaf = { id: "grades", label: "Grades", href: "/grades", target: "main" };
      render();
      const frame = requireElement(
        document.querySelector<HTMLIFrameElement>(".ccxp-lite-destination-frame"),
      );
      const loading = requireElement(
        document.querySelector<HTMLElement>(".ccxp-lite-destination-loading"),
      );
      const error = requireElement(
        document.querySelector<HTMLElement>(".ccxp-lite-destination-error"),
      );
      expect(loading.hidden).toBe(false);
      expect(frame.hidden).toBe(true);
      expect(error.hidden).toBe(true);
      if (outcome === "success") {
        frame.dispatchEvent(new TestEvent("load"));
        expect(frame.hidden).toBe(false);
        expect(loading.hidden).toBe(true);
        requireValue(timers[0])();
        expect(error.hidden).toBe(true);
      } else {
        requireValue(timers[0])();
        expect(error.hidden).toBe(false);
        expect(loading.hidden).toBe(true);
        const actions = [...error.querySelectorAll<HTMLButtonElement>("button")];
        requireValue(
          actions.find((button) => button.textContent === strings.sidebarOpenInNewTab),
        ).click();
        expect(open).toHaveBeenCalledWith(
          "https://www.ccxp.nthu.edu.tw/grades",
          "_blank",
          "noopener",
        );
        requireValue(actions.find((button) => button.textContent === strings.sidebarRetry)).click();
        expect(state.activeLeaf.nonce).toEqual(expect.any(Number));
        expect(document.querySelector<HTMLElement>(".ccxp-lite-destination-error")?.hidden).toBe(
          true,
        );
      }
      requireElement(document.querySelector<HTMLButtonElement>(".ccxp-lite-back-button")).click();
      expect(state.activeLeaf).toBeUndefined();
      expect(state.currentCategoryId).toBe("category-courses");
    });
  }

  test("login-flow image submits retain their original node and listener", () => {
    const { window, document } = setupLogin();
    const form = requireElement(document.querySelector("form"));
    document.body.append(form);
    const image = document.createElement("input");
    image.type = "image";
    image.alt = "Login";
    const clicked = vi.fn<(event: Event) => void>();
    image.addEventListener("click", (event) => {
      event.preventDefault();
      clicked(event);
    });
    form.append(image);
    requireValue(window.CCXP_LITE.loginUi).replaceLoginFormImageButtons(document, document);
    expect(form.querySelector('input[type="image"]')).toBe(image);
    image.click();
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  test("all shared controls create nodes in the supplied document", () => {
    const { window } = setupLogin();
    const { window: other } = createTestWindow();
    const document = other.document as Document;
    const buttons = requireValue(window.CCXP_LITE.uiButtons);
    const onClick = vi.fn<() => void>();
    const button = buttons.createButton(document, {
      label: "Save",
      ariaLabel: "Save changes",
      onClick,
    });
    document.body.append(button);
    expect(button.ownerDocument).toBe(document);
    expect(button.type).toBe("button");
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(
      requireValue(window.CCXP_LITE.uiPopover).buildInfoPopover(document, "Help", "More")
        .ownerDocument,
    ).toBe(document);
    expect(
      requireValue(window.CCXP_LITE.uiDisplay).createEmptyState(document, "Empty").ownerDocument,
    ).toBe(document);
  });
});
