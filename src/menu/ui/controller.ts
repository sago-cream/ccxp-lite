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
  const controllers = new WeakMap<Document, SidebarController>();

  class SidebarController {
    private readonly hostDocument: Document;
    private shellController: CcxpLiteUiController;
    private renderController: CcxpLiteUiController;
    private searchInput: HTMLInputElement | undefined;
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
      this.shellController.listen(this.searchInput, "input", () => {
        const state = getSidebarUiState(this.hostDocument);
        state.searchQuery = this.searchInput?.value ?? "";
        this.render();
      });
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
