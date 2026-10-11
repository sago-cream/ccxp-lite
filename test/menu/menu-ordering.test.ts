import { describe, expect, test } from "vitest";
import { TestEvent } from "../helpers/dom-event.js";
import { createSidebarModel, createSidebarShellHtml } from "../helpers/menu-fixtures.js";
import {
  createTestWindow,
  loadModules,
  menuModulePaths,
  requireElement,
  requireValue,
} from "../helpers/module-loader.js";

const storageKey = "ccxp-lite-sidebar-order::/ccxp/INQUIRE/select_entry.php";

async function setup(stored?: string, model = createSidebarModel()) {
  const { window } = createTestWindow(createSidebarShellHtml());
  if (stored !== undefined) {
    window.localStorage.setItem(storageKey, stored);
  }
  loadModules(window, menuModulePaths);
  await new Promise<void>((resolve) => {
    requireValue(window.CCXP_LITE.sidebarFavorites).initializeFavorites(resolve);
  });
  const document = window.document as Document;
  const state = requireValue(window.CCXP_LITE.sidebarState).getSidebarUiState(document);
  state.classicExpandedItemIds = [
    "category-favorites",
    "category-courses",
    "section-academic",
    "category-campus",
    "campus-block",
  ];
  const render = () => {
    requireValue(window.CCXP_LITE.sidebarUi).renderSidebar(document, document, model);
  };
  render();
  const list = (group: string) =>
    requireElement(document.querySelector<HTMLElement>(`[data-ccxp-lite-order-group="${group}"]`));
  const ids = (group: string) =>
    [...(list(group).children as HTMLCollectionOf<HTMLElement>)]
      .map((child) => child.dataset.ccxpLiteOrderItem)
      .filter((id) => id !== undefined);
  const row = (title: string) =>
    requireElement(document.querySelector<HTMLElement>(`button[title="${title}"]`));
  return { window, document, state, render, list, ids, row };
}

function dragEvent(element: HTMLElement, type: string, clientY = -1) {
  const event = new TestEvent(type, { bubbles: true, cancelable: true });
  Object.assign(event, { clientX: -1, clientY });
  element.dispatchEvent(event);
  return event;
}

function moveKey(element: HTMLElement, key: string) {
  const event = new TestEvent("keydown", { bubbles: true, cancelable: true });
  Object.assign(event, { key, altKey: true, shiftKey: true });
  element.dispatchEvent(event);
}

describe("sidebar ordering", () => {
  test("drags categories, restores them on reload, and shares ordering with the layered layout", async () => {
    const ui = await setup();
    dragEvent(ui.row("Campus Systems"), "dragstart");
    expect(dragEvent(ui.row("Courses & Grades"), "dragover").defaultPrevented).toBe(true);
    dragEvent(ui.row("Courses & Grades"), "drop");
    expect(ui.ids("root")).toEqual([
      "category:category-favorites",
      "category:category-campus",
      "category:category-courses",
    ]);
    const stored = requireValue(ui.window.localStorage.getItem(storageKey) ?? undefined);
    const reload = await setup(stored);
    expect(reload.ids("root")).toEqual(ui.ids("root"));
    reload.state.sidebarVariant = "layered";
    reload.render();
    expect(reload.ids("root")).toEqual(["category:category-campus", "category:category-courses"]);
    expect(reload.state.currentCategoryId).toBe("");
  });

  test("reorders nested links without expanding or navigating and retains keyboard focus", async () => {
    const ui = await setup();
    moveKey(ui.row("Course Schedule"), "ArrowUp");
    expect(ui.ids("block:section-academic")).toEqual(["link:schedule", "link:grades"]);
    expect(ui.document.activeElement).toBe(ui.row("Course Schedule"));
    moveKey(ui.row("Course Schedule"), "ArrowUp");
    expect(ui.ids("block:section-academic")).toEqual(["link:schedule", "link:grades"]);
    expect(ui.state.classicExpandedItemIds).toContain("section-academic");
    expect(ui.state.activeLeaf).toBeUndefined();
    ui.state.sidebarVariant = "layered";
    ui.state.currentCategoryId = "category-courses";
    ui.render();
    expect(ui.ids("block:section-academic")).toEqual(["link:schedule", "link:grades"]);
  });

  test("rejects cross-group drops and canceled drags without writing storage", async () => {
    const ui = await setup();
    dragEvent(ui.row("Course Schedule"), "dragstart");
    expect(dragEvent(ui.row("External Inquiry"), "dragover").defaultPrevented).toBe(false);
    dragEvent(ui.row("External Inquiry"), "drop");
    expect(ui.window.localStorage.getItem(storageKey)).toBeNull();
    dragEvent(ui.row("Campus Systems"), "dragstart");
    dragEvent(ui.row("Courses & Grades"), "dragover");
    dragEvent(ui.row("Campus Systems"), "dragend");
    expect(
      ui.document.querySelector("[data-ccxp-lite-order-drop], .ccxp-lite-order-dragging"),
    ).toBeNull();
    expect(ui.window.localStorage.getItem(storageKey)).toBeNull();
  });

  test("drags layered groups through their nested list containers", async () => {
    const model = createSidebarModel();
    const category = requireValue(model.categories[0]);
    category.blocks = [
      ...category.blocks,
      { id: "second", label: "Second group", links: [], kind: "block" },
    ];
    const ui = await setup(undefined, model);
    ui.state.sidebarVariant = "layered";
    ui.state.currentCategoryId = category.id;
    ui.render();
    const source = requireElement(
      ui.document.querySelector<HTMLElement>('[data-ccxp-lite-order-item="block:second"] > h3'),
    );
    const target = requireElement(
      ui.document.querySelector<HTMLElement>(
        '[data-ccxp-lite-order-item="block:section-academic"] > h3',
      ),
    );
    dragEvent(source, "dragstart");
    expect(dragEvent(target, "dragover").defaultPrevented).toBe(true);
    dragEvent(target, "drop");
    expect(ui.ids("category:category-courses")).toEqual(["block:second", "block:section-academic"]);
  });

  test("keeps hidden siblings when reordering filtered results and appends newly available items", async () => {
    const model = createSidebarModel();
    const block = requireValue(model.categories[0]?.blocks[0]);
    block.links = [
      ...block.links.map((link) =>
        link.id === "grades" ? { ...link, label: "Semester Result" } : link,
      ),
      { id: "final", label: "Final Result", href: "/final", target: "main" },
    ];
    const ui = await setup(undefined, model);
    ui.state.searchQuery = "Result";
    ui.render();
    moveKey(ui.row("Final Result"), "ArrowUp");
    ui.state.searchQuery = "";
    ui.render();
    expect(ui.ids("block:section-academic")).toEqual([
      "link:final",
      "link:grades",
      "link:schedule",
    ]);
    block.links = [...block.links, { id: "new", label: "New page" }];
    ui.render();
    expect(ui.ids("block:section-academic")).toEqual([
      "link:final",
      "link:grades",
      "link:schedule",
      "link:new",
    ]);
  });

  test("reorders mixed pinned blocks and links independently of their source lists", async () => {
    const model = createSidebarModel();
    model.favorites.blocks = [requireValue(model.categories[0]?.blocks[0])];
    const ui = await setup(undefined, model);
    ui.state.sidebarVariant = "layered";
    ui.render();
    const pinned = ui.list("category:category-favorites");
    const link = requireElement(
      pinned.querySelector<HTMLElement>("[data-ccxp-lite-order-item='link:grades']"),
    );
    moveKey(link, "ArrowUp");
    expect(ui.ids("category:category-favorites")).toEqual([
      "link:grades",
      "block:section-academic",
    ]);
    ui.state.sidebarVariant = "classic";
    ui.render();
    expect(ui.ids("category:category-favorites")).toEqual([
      "link:grades",
      "block:section-academic",
    ]);
    expect(ui.ids("category:category-courses")).toEqual(["block:section-academic"]);
  });

  test.each([
    "broken JSON",
    "null",
    '{"root":[3]}',
    '{"root":["category:category-campus","category:category-campus","removed"]}',
  ])("handles stored value %s", async (stored) => {
    const ui = await setup(stored);
    expect(ui.ids("root")).toHaveLength(3);
    expect(new Set(ui.ids("root")).size).toBe(3);
    moveKey(ui.row("Courses & Grades"), "ArrowUp");
    moveKey(ui.row("Courses & Grades"), "ArrowUp");
    expect(ui.ids("root")[0]).toBe("category:category-courses");
  });

  test("retains session ordering when local storage is blocked", async () => {
    const ui = await setup();
    Object.defineProperty(ui.window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    moveKey(ui.row("Campus Systems"), "ArrowUp");
    ui.render();
    expect(ui.ids("root")).toEqual([
      "category:category-favorites",
      "category:category-campus",
      "category:category-courses",
    ]);
  });
});
