(function registerSidebarController(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (
    !namespace?.uiController ||
    !namespace.uiDisplay ||
    !namespace.sidebarState ||
    !namespace.sidebarData ||
    !namespace.sidebarRuntime ||
    !namespace.sidebarOverlays ||
    !namespace.sidebarNavigation ||
    !namespace.sidebarDestination ||
    !namespace.sidebarViews ||
    !namespace.sidebarOrdering ||
    !namespace.shared
  ) {
    return;
  }
  const app = namespace;
  const { TOKENS, STRINGS } = namespace.shared;
  const { createController } = namespace.uiController;
  const { createSidebarSearch } = namespace.uiDisplay;
  const { getSidebarUiState, restoreSidebarScroll } = namespace.sidebarState;
  const { filterCategories, filterCategoryTree } = namespace.sidebarData;
  const { disposeDestination } = namespace.sidebarRuntime;
  const { syncTopLevelFramesetLayout, mountSidebarVariantSwitch } = namespace.sidebarOverlays;
  const { createClassicSidebarView } = namespace.sidebarNavigation;
  const { createDestinationView } = namespace.sidebarDestination;
  const { createDashboardView, createCategoryDetailView } = namespace.sidebarViews;
  const { mountSidebarOrdering } = namespace.sidebarOrdering;
  const controllers = new WeakMap<Document, SidebarController>();

  class SidebarController {
    private readonly hostDocument: Document;
    private shellController: CcxpLiteUiController;
    private renderController: CcxpLiteUiController;
    private searchInput: HTMLInputElement | undefined;
    private collapseButton: HTMLButtonElement | undefined;
    private resizeHandle: HTMLElement | undefined;
    private resizing = false;
    private hovered = false;
    private focused = false;
    private collapsing = false;
    private navDocument: Document;
    private modelInput: CcxpLiteSidebarModel | (() => CcxpLiteSidebarModel);
    private strings: Readonly<Record<string, string>>;

    constructor(
      hostDocument: Document,
      navDocument: Document,
      modelInput: CcxpLiteSidebarModel | (() => CcxpLiteSidebarModel),
      strings: Readonly<Record<string, string>>,
    ) {
      this.hostDocument = hostDocument;
      this.navDocument = navDocument;
      this.modelInput = modelInput;
      this.strings = strings;
      this.shellController = createController(hostDocument);
      this.renderController = createController(hostDocument);
      app.sharedDom?.addCleanupTask(() => {
        this.destroy();
      });
    }

    update(
      navDocument: Document,
      modelInput: CcxpLiteSidebarModel | (() => CcxpLiteSidebarModel),
      strings: Readonly<Record<string, string>>,
    ) {
      this.navDocument = navDocument;
      this.modelInput = modelInput;
      this.strings = strings;
      this.render();
    }

    destroy() {
      this.shellController.destroy();
      this.renderController.destroy();
      controllers.delete(this.hostDocument);
    }

    private render() {
      const shell = this.hostDocument.querySelector<HTMLElement>(`.${TOKENS.sidebarClass}`);
      const content = shell?.querySelector<HTMLElement>(".ccxp-lite-sidebar-content");
      if (!shell || !content) {
        return;
      }
      this.bindSearch(shell);
      const state = getSidebarUiState(this.hostDocument);
      if (this.searchInput && this.searchInput.value !== state.searchQuery) {
        this.searchInput.value = state.searchQuery;
      }
      const model = typeof this.modelInput === "function" ? this.modelInput() : this.modelInput;
      const filteredCategories = filterCategories(model.categories, state.searchQuery);
      const activeCategory = resolveActiveCategory(model, filteredCategories, state);
      if (state.currentCategoryId !== "" && activeCategory === undefined) {
        state.currentCategoryId = "";
      }

      this.renderController.destroy();
      this.renderController = createController(this.hostDocument);
      disposeDestination(this.hostDocument);
      content.textContent = "";
      this.hostDocument.body.dataset.ccxpLiteSidebarVariant = state.sidebarVariant;
      shell.dataset.ccxpLiteSidebarVariant = state.sidebarVariant;
      this.syncCollapse(shell);
      const rerender = () => {
        this.render();
      };
      mountSidebarVariantSwitch(this.hostDocument, state, this.strings, rerender);

      if (state.sidebarVariant === "classic") {
        content.append(
          createClassicSidebarView(
            this.hostDocument,
            this.navDocument,
            model,
            state,
            this.strings,
            rerender,
          ),
        );
        mountSidebarOrdering(content, model, this.strings, rerender, this.renderController);
        this.syncCollapse(shell);
        restoreSidebarScroll(content, state.scrollTopByView.root);
        return;
      }
      if (state.activeLeaf) {
        content.append(
          createDestinationView(
            this.hostDocument,
            this.navDocument,
            activeCategory ?? findCategoryContainingLeaf(model.categories, state.activeLeaf),
            state.activeLeaf,
            this.strings,
            rerender,
          ),
        );
        restoreSidebarScroll(content, state.scrollTopByView.destination);
        return;
      }
      if (state.currentCategoryId !== "" && activeCategory) {
        content.append(
          createCategoryDetailView(
            this.hostDocument,
            this.navDocument,
            activeCategory,
            state,
            this.strings,
            rerender,
            this.renderController,
          ),
        );
        mountSidebarOrdering(content, model, this.strings, rerender, this.renderController);
        restoreSidebarScroll(content, state.scrollTopByView.category);
        return;
      }
      content.append(
        createDashboardView(
          this.hostDocument,
          this.navDocument,
          filterCategoryTree(model.favorites, state.searchQuery),
          filteredCategories,
          state,
          this.strings,
          rerender,
        ),
      );
      mountSidebarOrdering(content, model, this.strings, rerender, this.renderController);
      restoreSidebarScroll(content, state.scrollTopByView.root);
    }

    private bindSearch(shell: HTMLElement) {
      const nextSearchInput = shell.querySelector<HTMLInputElement>(
        ".ccxp-lite-sidebar-search-input",
      );
      if (nextSearchInput === this.searchInput) {
        return;
      }
      this.shellController.destroy();
      this.shellController = createController(this.hostDocument);
      this.searchInput = nextSearchInput ?? undefined;
      if (!this.searchInput) {
        return;
      }
      this.searchInput.dataset.ccxpLiteSearchBound = "true";
      this.bindCollapse(shell);
      this.bindResize(shell);
      this.shellController.listen(this.searchInput, "input", () => {
        const state = getSidebarUiState(this.hostDocument);
        state.searchQuery = this.searchInput?.value ?? "";
        this.render();
      });
    }

    private bindCollapse(shell: HTMLElement) {
      const header = shell.querySelector(".ccxp-lite-sidebar-brand-group");
      const icon = app.uiIcons?.createCategoryIcon(this.hostDocument, "panel-left-close");
      const button = app.uiButtons?.createButton(this.hostDocument, {
        className: "ccxp-lite-sidebar-collapse",
        icon,
      });
      if (!header || !button) {
        return;
      }
      this.collapseButton = button;
      header.append(button);
      this.shellController.addCleanup(() => {
        button.remove();
      });
      const view = this.hostDocument.defaultView;
      if (view) {
        const observer = new view.MutationObserver(() => {
          this.previewCollapse(shell);
        });
        observer.observe(shell, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
        this.shellController.addCleanup(() => {
          observer.disconnect();
        });
      }
      this.shellController.listen(button, "click", () => {
        const state = getSidebarUiState(this.hostDocument);
        state.sidebarCollapsed = !state.sidebarCollapsed;
        state.sidebarPreview = false;
        this.hovered = false;
        this.focused = false;
        app.sidebarState?.setPersistedSidebarCollapsed(state.sidebarCollapsed);
        if (state.sidebarCollapsed) {
          this.collapsing = true;
          shell.querySelector<HTMLButtonElement>(".ccxp-lite-sidebar-brand-button")?.focus();
          this.collapsing = false;
        }
        this.syncCollapse(shell, true);
      });
      const previewOnPointer = (event: Event) => {
        if (this.hovered || (event as PointerEvent).pointerType === "touch") {
          return;
        }
        if (
          this.resizing ||
          (event as PointerEvent).clientX >=
            shell.clientWidth - Number.parseFloat(TOKENS.sizeSidebarResizeHandle)
        ) {
          return;
        }
        this.hovered = true;
        this.previewCollapse(shell);
      };
      this.shellController.listen(shell, "pointerenter", previewOnPointer);
      this.shellController.listen(shell, "pointermove", previewOnPointer);
      this.shellController.listen(shell, "pointerleave", () => {
        this.hovered = false;
        this.previewCollapse(shell);
      });
      this.shellController.listen(shell, "focusin", (event) => {
        if (this.collapsing || this.resizing || event.target === this.resizeHandle) {
          return;
        }
        this.focused = true;
        this.previewCollapse(shell);
      });
      this.shellController.listen(shell, "focusout", (event) => {
        if (shell.contains((event as FocusEvent).relatedTarget as Node | null)) {
          return;
        }
        this.focused = false;
        this.previewCollapse(shell);
      });
    }

    private bindResize(shell: HTMLElement) {
      const shellNode = shell;
      const minimum = Number.parseFloat(TOKENS.sizeSidebarMin);
      const maximum = Number.parseFloat(TOKENS.sizeSidebarMax);
      const threshold = Number.parseFloat(TOKENS.sizeSidebarCollapseThreshold);
      const reopening = Number.parseFloat(TOKENS.sizeSidebarReopenThreshold);
      const collapsedWidth = Number.parseFloat(TOKENS.sizeSidebarCollapsed);
      const handle = this.hostDocument.createElement("div");
      handle.className = "ccxp-lite-sidebar-resize";
      handle.tabIndex = 0;
      handle.setAttribute("role", "separator");
      handle.setAttribute("aria-orientation", "vertical");
      handle.setAttribute("aria-label", this.strings.sidebarResize);
      handle.title = this.strings.sidebarResize;
      handle.setAttribute("aria-valuemin", String(collapsedWidth));
      handle.setAttribute("aria-valuemax", String(maximum));
      shell.append(handle);
      this.resizeHandle = handle;
      let drag:
        | {
            pointerId: number;
            startX: number;
            startWidth: number;
            width: number;
            collapsed: boolean;
          }
        | undefined;
      const persist = () => {
        const state = getSidebarUiState(this.hostDocument);
        app.sidebarState?.setPersistedSidebarCollapsed(state.sidebarCollapsed);
        app.sidebarState?.setPersistedSidebarWidth(state.sidebarWidth);
      };
      const apply = (rawWidth: number) => {
        const state = getSidebarUiState(this.hostDocument);
        // Separate close and reopen thresholds keep a captured drag stable around the snap point.
        if (state.sidebarCollapsed ? rawWidth >= reopening : rawWidth < threshold) {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        }
        if (!state.sidebarCollapsed) {
          state.sidebarWidth = Math.round(Math.min(maximum, Math.max(minimum, rawWidth)));
        }
        state.sidebarPreview = false;
        this.hovered = false;
        this.focused = false;
        this.syncCollapse(shell);
      };
      const finish = (cancel = false) => {
        if (!drag) {
          return;
        }
        const { pointerId } = drag;
        if (cancel) {
          const state = getSidebarUiState(this.hostDocument);
          state.sidebarWidth = drag.width;
          state.sidebarCollapsed = drag.collapsed;
          state.sidebarPreview = false;
          this.syncCollapse(shell);
        } else {
          persist();
        }
        drag = undefined;
        this.resizing = false;
        delete shellNode.dataset.ccxpLiteSidebarResizing;
        if (handle.hasPointerCapture(pointerId)) {
          handle.releasePointerCapture(pointerId);
        }
      };
      this.shellController.listen(handle, "pointerdown", (event) => {
        const pointer = event as PointerEvent;
        if (pointer.button !== 0 || !pointer.isPrimary) {
          return;
        }
        event.preventDefault();
        const state = getSidebarUiState(this.hostDocument);
        drag = {
          pointerId: pointer.pointerId,
          startX: pointer.clientX,
          startWidth: shell.getBoundingClientRect().width,
          width: state.sidebarWidth,
          collapsed: state.sidebarCollapsed,
        };
        this.resizing = true;
        shellNode.dataset.ccxpLiteSidebarResizing = "true";
        handle.setPointerCapture(pointer.pointerId);
        handle.focus({ preventScroll: true });
        // Cancel any hover/collapse animation before the first movement.
        this.syncCollapse(shell);
      });
      this.shellController.listen(handle, "pointermove", (event) => {
        const pointer = event as PointerEvent;
        if (drag?.pointerId === pointer.pointerId) {
          apply(drag.startWidth + pointer.clientX - drag.startX);
        }
      });
      this.shellController.listen(handle, "pointerup", (event) => {
        if (drag?.pointerId === (event as PointerEvent).pointerId) {
          finish();
        }
      });
      this.shellController.listen(handle, "pointercancel", () => {
        finish(true);
      });
      this.shellController.listen(handle, "lostpointercapture", () => {
        finish(true);
      });
      this.shellController.listen(handle, "keydown", (event) => {
        const keyboard = event as KeyboardEvent;
        if (keyboard.key === "Escape" && drag) {
          keyboard.preventDefault();
          finish(true);
          return;
        }
        const state = getSidebarUiState(this.hostDocument);
        const width = state.sidebarCollapsed ? collapsedWidth : state.sidebarWidth;
        let next: number | undefined;
        if (keyboard.key === "ArrowLeft") {
          next = width <= minimum ? threshold - 1 : width - 16;
        }
        if (keyboard.key === "ArrowRight") {
          next = state.sidebarCollapsed ? minimum : width + 16;
        }
        if (keyboard.key === "Home") {
          next = collapsedWidth;
        }
        if (keyboard.key === "End") {
          next = maximum;
        }
        if (next !== undefined && !drag) {
          keyboard.preventDefault();
          apply(next);
          persist();
        }
      });
      this.shellController.addCleanup(() => {
        finish(true);
        handle.remove();
      });
    }

    private previewCollapse(shell: HTMLElement) {
      if (this.resizing) {
        return;
      }
      const state = getSidebarUiState(this.hostDocument);
      const preview =
        state.sidebarCollapsed &&
        (this.hovered ||
          this.focused ||
          shell.querySelector(
            ".ccxp-lite-session-warning:not([hidden]), .ccxp-lite-profile-popover:not([hidden])",
          ) !== null);
      if (state.sidebarPreview === preview) {
        return;
      }
      state.sidebarPreview = preview;
      this.syncCollapse(shell, true);
    }

    private syncCollapse(shell: HTMLElement, animate = false) {
      const state = getSidebarUiState(this.hostDocument);
      const classic = state.sidebarVariant === "classic";
      if (
        classic &&
        state.sidebarCollapsed &&
        shell.querySelector(".ccxp-lite-session-warning:not([hidden])")
      ) {
        state.sidebarPreview = true;
      }
      const compact = classic && state.sidebarCollapsed && !state.sidebarPreview;
      const shellNode = shell;
      shellNode.dataset.ccxpLiteSidebarCompact = String(compact);
      shellNode.dataset.ccxpLiteSidebarCollapsed = String(classic && state.sidebarCollapsed);
      if (this.collapseButton) {
        const label = state.sidebarCollapsed
          ? this.strings.sidebarKeepExpanded
          : this.strings.sidebarCollapse;
        this.collapseButton.hidden = !classic;
        this.collapseButton.setAttribute("aria-label", label);
        this.collapseButton.title = label;
        this.collapseButton.setAttribute("aria-expanded", String(!compact));
      }
      for (const list of shell.querySelectorAll<HTMLElement>(".ccxp-lite-sidebar-children")) {
        list.inert = compact;
      }
      if (this.resizeHandle) {
        this.resizeHandle.setAttribute("aria-label", this.strings.sidebarResize);
        this.resizeHandle.title = this.strings.sidebarResize;
        this.resizeHandle.hidden = !classic;
        this.resizeHandle.setAttribute(
          "aria-valuenow",
          String(compact ? Number.parseFloat(TOKENS.sizeSidebarCollapsed) : state.sidebarWidth),
        );
        this.resizeHandle.setAttribute(
          "aria-valuetext",
          compact ? this.strings.sidebarCollapse : `${state.sidebarWidth}px`,
        );
      }
      syncTopLevelFramesetLayout(state.sidebarVariant, compact, animate);
    }
  }

  function renderSidebar(
    hostDocument: Document,
    navDocument: Document,
    modelInput: CcxpLiteSidebarModel | (() => CcxpLiteSidebarModel),
    strings: Readonly<Record<string, string>> = STRINGS,
  ) {
    const existingController = controllers.get(hostDocument);
    if (existingController) {
      existingController.update(navDocument, modelInput, strings);
      return;
    }
    const controller = new SidebarController(hostDocument, navDocument, modelInput, strings);
    controllers.set(hostDocument, controller);
    controller.update(navDocument, modelInput, strings);
  }

  function resolveActiveCategory(
    model: CcxpLiteSidebarModel,
    filteredCategories: readonly CcxpLiteSidebarCategoryNode[],
    state: CcxpLiteSidebarState,
  ) {
    return (
      filteredCategories.find((category) => category.id === state.currentCategoryId) ??
      (state.searchQuery === ""
        ? model.categories.find((category) => category.id === state.currentCategoryId)
        : undefined)
    );
  }

  function findCategoryContainingLeaf(
    categories: readonly CcxpLiteSidebarCategoryNode[],
    activeLeaf: CcxpLiteSidebarLinkItem,
  ) {
    return categories.find((category) =>
      [...(category.links ?? []), ...category.blocks.flatMap((block) => block.links)].some(
        (linkItem) =>
          linkItem.id === activeLeaf.id ||
          linkItem.legacyId === activeLeaf.legacyId ||
          (linkItem.href === activeLeaf.href &&
            linkItem.target === activeLeaf.target &&
            linkItem.label === activeLeaf.label),
      ),
    );
  }

  namespace.sidebarUi = {
    renderSidebar,
    createSidebarSearch,
    mountSidebarVariantSwitch,
    syncTopLevelFramesetLayout,
  };
})(globalThis);
