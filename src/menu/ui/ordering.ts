(function registerSidebarOrdering(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.sidebarState) {
    return;
  }
  const { getSidebarUiState, persistSidebarScroll } = namespace.sidebarState;
  const STORAGE_KEY = "ccxp-lite-sidebar-order::/ccxp/INQUIRE/select_entry.php";
  const itemAttribute = "data-ccxp-lite-order-item";
  const groupAttribute = "data-ccxp-lite-order-group";
  let savedOrders: Map<string, string[]> | undefined;

  function isStringArray(value: unknown): value is string[] {
    const prototype =
      value !== null && typeof value === "object"
        ? (Reflect.getPrototypeOf(value) as { constructor?: { name?: string } } | null)
        : undefined;
    return (
      prototype?.constructor?.name === "Array" &&
      (value as readonly unknown[]).every((id) => typeof id === "string")
    );
  }

  function getSavedOrders(): ReadonlyMap<string, readonly string[]> {
    if (savedOrders) {
      return savedOrders;
    }
    savedOrders = new Map();
    try {
      const stored: unknown = JSON.parse(globalScope.localStorage.getItem(STORAGE_KEY) ?? "null");
      if (stored !== null && typeof stored === "object") {
        for (const [key, value] of Object.entries(stored as Readonly<Record<string, unknown>>)) {
          if (isStringArray(value)) {
            savedOrders.set(key, [...new Set(value)]);
          }
        }
      }
    } catch {
      // Keep the session usable when storage is unavailable or invalid.
    }
    return savedOrders;
  }

  function orderedIds(group: string, ids: readonly string[]): readonly string[] {
    const currentIds = new Set(ids);
    const saved = (getSavedOrders().get(group) ?? []).filter((id) => currentIds.has(id));
    const savedIds = new Set(saved);
    return [...saved, ...ids.filter((id) => !savedIds.has(id))];
  }

  function restoreOriginalOrder() {
    savedOrders = new Map();
    try {
      globalScope.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Restore the default order for this session when storage is unavailable.
    }
  }

  function getSiblingIds(
    model: CcxpLiteSidebarModel,
    layered: boolean,
  ): ReadonlyMap<string, readonly string[]> {
    const categories = [model.favorites, ...model.categories];
    const siblings = new Map([["root", categories.map((category) => `category:${category.id}`)]]);
    for (const category of categories) {
      const links = (category.links ?? []).map((link) => `link:${link.id}`);
      const blocks = category.blocks.map((block) => `block:${block.id}`);
      siblings.set(
        `category:${category.id}`,
        layered && category === model.favorites ? [...blocks, ...links] : [...links, ...blocks],
      );
      for (const block of category.blocks) {
        siblings.set(
          `block:${block.id}`,
          block.links.map((link) => `link:${link.id}`),
        );
      }
    }
    return siblings;
  }

  function getItems(list: HTMLElement): readonly HTMLElement[] {
    return [...list.children].filter((child): child is HTMLElement =>
      child.hasAttribute(itemAttribute),
    );
  }

  function getHandle(item: HTMLElement): HTMLElement {
    return item.matches("button")
      ? item
      : (item.querySelector<HTMLElement>(":scope > button, :scope > h3") ?? item);
  }

  function mountSidebarOrdering(
    content: HTMLElement,
    model: CcxpLiteSidebarModel,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
    controller: CcxpLiteUiController,
  ) {
    const document = content.ownerDocument;
    const siblings = getSiblingIds(model, getSidebarUiState(document).sidebarVariant === "layered");
    const dragState: {
      dragged?: { item: HTMLElement; list: HTMLElement };
      dropTarget?: HTMLElement;
    } = {};

    function clearDrag() {
      dragState.dragged?.item.classList.remove("ccxp-lite-order-dragging");
      dragState.dropTarget?.removeAttribute("data-ccxp-lite-order-drop");
      dragState.dragged = undefined;
      dragState.dropTarget = undefined;
    }
    controller.addCleanup(clearDrag);

    function move(list: HTMLElement, source: HTMLElement, target: HTMLElement, after: boolean) {
      const group = list.getAttribute(groupAttribute) ?? "";
      const sourceId = source.getAttribute(itemAttribute) ?? "";
      const targetId = target.getAttribute(itemAttribute) ?? "";
      const ids = orderedIds(group, siblings.get(group) ?? []);
      if (sourceId === targetId || !ids.includes(sourceId) || !ids.includes(targetId)) {
        return;
      }
      const nextIds = ids.filter((id) => id !== sourceId);
      nextIds.splice(nextIds.indexOf(targetId) + (after ? 1 : 0), 0, sourceId);
      if (nextIds.every((id, index) => id === ids[index])) {
        return;
      }
      getSavedOrders();
      savedOrders?.set(group, nextIds);
      try {
        globalScope.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(Object.fromEntries(getSavedOrders())),
        );
      } catch {
        // Retain the new order for this session if storage writes fail.
      }
      const state = getSidebarUiState(document);
      persistSidebarScroll(document, state.currentCategoryId === "" ? "root" : "category");
      clearDrag();
      rerender();
      const nextList = [...content.querySelectorAll<HTMLElement>(`[${groupAttribute}]`)].find(
        (candidate) => candidate.getAttribute(groupAttribute) === group,
      );
      const nextItem =
        nextList &&
        getItems(nextList).find((item) => item.getAttribute(itemAttribute) === sourceId);
      if (nextItem) {
        getHandle(nextItem).focus({ preventScroll: true });
      }
    }

    for (const list of content.querySelectorAll<HTMLElement>(`[${groupAttribute}]`)) {
      const group = list.getAttribute(groupAttribute) ?? "";
      const items = getItems(list);
      const ids = items.map((item) => item.getAttribute(itemAttribute) ?? "");
      const order = orderedIds(group, ids);
      // Preserve each layout's default order until this list has been customized.
      if (getSavedOrders().has(group)) {
        const itemById = new Map(items.map((item) => [item.getAttribute(itemAttribute), item]));
        for (const id of order) {
          const item = itemById.get(id);
          if (item) {
            list.append(item);
          }
        }
      }
      for (const item of items) {
        const handle = getHandle(item);
        handle.draggable = true;
        if (!handle.matches("button")) {
          handle.tabIndex = 0;
        }
        handle.classList.add("ccxp-lite-order-handle");
        handle.setAttribute("aria-description", strings.sidebarReorderHint);
        handle.setAttribute(
          "aria-keyshortcuts",
          "Alt+Shift+ArrowUp Alt+Shift+ArrowDown Alt+Shift+ArrowLeft Alt+Shift+ArrowRight",
        );
        controller.listen(handle, "dragstart", (event) => {
          const dragEvent = event as DragEvent;
          const target = dragEvent.target as Element;
          if (target.closest(".ccxp-lite-favorite-toggle")) {
            event.preventDefault();
            return;
          }
          event.stopPropagation();
          clearDrag();
          dragState.dragged = { item, list };
          item.classList.add("ccxp-lite-order-dragging");
          if (dragEvent.dataTransfer) {
            dragEvent.dataTransfer.effectAllowed = "move";
            dragEvent.dataTransfer.setData("text/plain", item.getAttribute(itemAttribute) ?? "");
          }
        });
        controller.listen(handle, "dragend", clearDrag);
        controller.listen(handle, "keydown", (event) => {
          const keyEvent = event as KeyboardEvent;
          if (keyEvent.target !== handle || !keyEvent.altKey || !keyEvent.shiftKey) {
            return;
          }
          const directions: Readonly<Partial<Record<string, number>>> = {
            ArrowUp: -1,
            ArrowLeft: -1,
            ArrowDown: 1,
            ArrowRight: 1,
          };
          const direction = directions[keyEvent.key];
          if (direction === undefined) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          const visible = getItems(list);
          const nextIndex = visible.indexOf(item) + direction;
          const target = nextIndex < 0 ? undefined : visible.at(nextIndex);
          if (target !== undefined) {
            move(list, item, target, direction > 0);
          }
        });
      }

      function resolveDrop(event: DragEvent) {
        const target = (event.target as Element).closest<HTMLElement>(`[${itemAttribute}]`);
        if (
          !dragState.dragged ||
          dragState.dragged.list !== list ||
          !target ||
          target.parentElement !== list ||
          target === dragState.dragged.item
        ) {
          return undefined;
        }
        const rect = getHandle(target).getBoundingClientRect();
        const isGrid = list.classList.contains("ccxp-lite-category-browser");
        const after = isGrid
          ? event.clientX > rect.left + rect.width / 2
          : event.clientY > rect.top + rect.height / 2;
        return { target, after };
      }
      controller.listen(list, "dragover", (event) => {
        const drop = resolveDrop(event as DragEvent);
        if (!drop) {
          dragState.dropTarget?.removeAttribute("data-ccxp-lite-order-drop");
          dragState.dropTarget = undefined;
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const transfer = (event as DragEvent).dataTransfer;
        if (transfer) {
          transfer.dropEffect = "move";
        }
        dragState.dropTarget?.removeAttribute("data-ccxp-lite-order-drop");
        dragState.dropTarget = drop.target;
        dragState.dropTarget.dataset.ccxpLiteOrderDrop = drop.after ? "after" : "before";
      });
      controller.listen(list, "dragleave", (event) => {
        const nextTarget = (event as DragEvent).relatedTarget as Node | null;
        if (!nextTarget || !list.contains(nextTarget)) {
          dragState.dropTarget?.removeAttribute("data-ccxp-lite-order-drop");
          dragState.dropTarget = undefined;
        }
      });
      controller.listen(list, "drop", (event) => {
        const drop = resolveDrop(event as DragEvent);
        if (!drop || !dragState.dragged) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        move(list, dragState.dragged.item, drop.target, drop.after);
        clearDrag();
      });
    }
  }

  namespace.sidebarOrdering = { mountSidebarOrdering, restoreOriginalOrder };
})(globalThis);
