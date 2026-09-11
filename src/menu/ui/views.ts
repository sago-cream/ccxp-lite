(function registerSidebarViews(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (
    !namespace?.uiRenderer ||
    !namespace.uiButtons ||
    !namespace.uiIcons ||
    !namespace.uiDisplay ||
    !namespace.sidebarFavorites ||
    !namespace.sidebarState ||
    !namespace.sidebarData ||
    !namespace.sidebarNavigation
  ) {
    return;
  }
  const app = namespace;
  const { createRenderer } = namespace.uiRenderer;
  const { createButton } = namespace.uiButtons;
  const { createBackIcon } = namespace.uiIcons;
  const { createSectionHeading, createEmptyState, createSkeletonStack } = namespace.uiDisplay;
  const { areFavoritesLoaded } = namespace.sidebarFavorites;
  const { persistSidebarScroll } = namespace.sidebarState;
  const { filterCategoryTree } = namespace.sidebarData;
  const {
    createCategoryBlock,
    createCategoryCard,
    createPinnedLinkCard,
    createPinnedBlockCard,
    createDetailLinkCard,
  } = namespace.sidebarNavigation;

  function createDashboardView(
    targetDocument: Document,
    navDocument: Document,
    favorites: CcxpLiteSidebarCategoryNode | undefined,
    categories: readonly CcxpLiteSidebarCategoryNode[],
    state: CcxpLiteSidebarState,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ): HTMLElement {
    const dom = createRenderer(targetDocument);
    return dom.element("div", { className: "ccxp-lite-dashboard" }, [
      dom.element("section", { className: "ccxp-lite-dashboard-shell" }, [
        createPinnedSection(targetDocument, navDocument, favorites, state, strings, rerender),
        createAllSection(targetDocument, categories, state, strings, rerender),
      ]),
    ]);
  }

  function createPinnedSection(
    targetDocument: Document,
    navDocument: Document,
    favorites: CcxpLiteSidebarCategoryNode | undefined,
    state: CcxpLiteSidebarState,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ): HTMLElement {
    const dom = createRenderer(targetDocument);
    const body = dom.element("div", {
      className: "ccxp-lite-pane-body ccxp-lite-pinned-list",
    });
    const pinnedBlocks = favorites?.blocks ?? [];
    const pinnedLinks = favorites?.links ?? [];
    if (!areFavoritesLoaded()) {
      body.append(createSkeletonStack(targetDocument, 3, "ccxp-lite-skeleton-card"));
    } else if (pinnedBlocks.length === 0 && pinnedLinks.length === 0) {
      body.append(createEmptyState(targetDocument, strings.sidebarFavoritesEmpty));
    } else {
      for (const blockItem of pinnedBlocks) {
        body.append(createPinnedBlockCard(targetDocument, blockItem, state, strings, rerender));
      }
      for (const linkItem of pinnedLinks) {
        body.append(createPinnedLinkCard(targetDocument, navDocument, linkItem, strings, rerender));
      }
    }
    return dom.element(
      "section",
      { className: "ccxp-lite-pane ccxp-lite-dashboard-group ccxp-lite-pane-pinned" },
      [
        dom.element("div", { className: "ccxp-lite-pane-header" }, [
          createSectionHeading(targetDocument, strings.sidebarPinned),
        ]),
        body,
      ],
    );
  }

  function createAllSection(
    targetDocument: Document,
    categories: readonly CcxpLiteSidebarCategoryNode[],
    state: CcxpLiteSidebarState,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ): HTMLElement {
    const dom = createRenderer(targetDocument);
    const body = dom.element("div", {
      className: "ccxp-lite-pane-body ccxp-lite-category-browser",
    });
    if (categories.length === 0) {
      body.append(
        createEmptyState(
          targetDocument,
          strings.sidebarSearchEmptyTitle,
          strings.sidebarSearchEmptyBody,
        ),
      );
    } else {
      for (const category of categories) {
        body.append(
          createCategoryCard(targetDocument, category, strings, () => {
            persistSidebarScroll(targetDocument, "root");
            const nextState = state;
            nextState.currentCategoryId = category.id;
            nextState.activeLeaf = undefined;
            rerender();
          }),
        );
      }
    }
    return dom.element(
      "section",
      { className: "ccxp-lite-pane ccxp-lite-dashboard-group ccxp-lite-pane-all" },
      [
        dom.element("div", { className: "ccxp-lite-pane-header" }, [
          createSectionHeading(targetDocument, strings.sidebarAll),
        ]),
        body,
      ],
    );
  }

  function createCategoryDetailView(
    targetDocument: Document,
    navDocument: Document,
    category: CcxpLiteSidebarCategoryNode,
    state: CcxpLiteSidebarState,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
    controller: CcxpLiteUiController,
  ): HTMLElement {
    const dom = createRenderer(targetDocument);
    const filteredCategory =
      state.searchQuery === "" ? category : filterCategoryTree(category, state.searchQuery);
    const backButton = createButton(targetDocument, {
      className: "ccxp-lite-back-button",
      ariaLabel: strings.sidebarBack,
      title: strings.sidebarBack,
      icon: createBackIcon(targetDocument),
    });
    controller.listen(backButton, "click", () => {
      if (state.activeLeaf) {
        persistSidebarScroll(targetDocument, "destination");
        const nextState = state;
        nextState.activeLeaf = undefined;
      } else {
        persistSidebarScroll(targetDocument, "category");
        const nextState = state;
        nextState.currentCategoryId = "";
      }
      rerender();
    });
    const body = createCategoryDetailBody(
      targetDocument,
      navDocument,
      filteredCategory,
      strings,
      rerender,
    );
    const section = dom.element("section", { className: "ccxp-lite-pane ccxp-lite-pane-detail" }, [
      dom.element("div", { className: "ccxp-lite-pane-header ccxp-lite-pane-header-detail" }, [
        backButton,
        createSectionHeading(targetDocument, category.label),
      ]),
      body,
    ]);
    mountCategoryDetailWaterfall(targetDocument, body, controller);
    return section;
  }

  function createCategoryDetailBody(
    targetDocument: Document,
    navDocument: Document,
    category: CcxpLiteSidebarCategoryNode | undefined,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ) {
    const dom = createRenderer(targetDocument);
    const body = dom.element("div", { className: "ccxp-lite-category-detail" });
    if (!category) {
      body.append(
        createEmptyState(
          targetDocument,
          strings.sidebarSearchEmptyTitle,
          strings.sidebarSearchEmptyBody,
        ),
      );
      return body;
    }
    for (const linkItem of category.links ?? []) {
      body.append(createDetailLinkCard(targetDocument, navDocument, linkItem, strings, rerender));
    }
    for (const block of category.blocks) {
      body.append(createCategoryBlock(targetDocument, navDocument, block, strings, rerender));
    }
    if (body.childElementCount === 0) {
      body.append(
        createEmptyState(
          targetDocument,
          strings.sidebarSectionEmptyTitle,
          strings.sidebarSectionEmptyBody,
        ),
      );
    }
    return body;
  }

  function mountCategoryDetailWaterfall(
    targetDocument: Document,
    body: HTMLElement,
    controller: CcxpLiteUiController,
  ) {
    const view = targetDocument.defaultView;
    if (!view) {
      return;
    }
    const supportsNativeWaterfall =
      view.CSS.supports("display", "grid-lanes") ||
      view.CSS.supports("grid-template-rows", "masonry");
    const detailItems = [...(body.children as HTMLCollectionOf<HTMLElement>)].filter(
      (child) => !child.classList.contains("ccxp-lite-empty"),
    );
    if (supportsNativeWaterfall || detailItems.length === 0) {
      return;
    }
    let frameId = 0;
    let settleFrameId = 0;
    const scheduleLayout = () => {
      if (frameId > 0) {
        view.cancelAnimationFrame(frameId);
      }
      frameId = view.requestAnimationFrame(() => {
        frameId = 0;
        layoutCategoryDetailWaterfall(view, body, detailItems);
      });
    };
    controller.addCleanup(() => {
      if (frameId > 0) {
        view.cancelAnimationFrame(frameId);
      }
      if (settleFrameId > 0) {
        view.cancelAnimationFrame(settleFrameId);
      }
      resetCategoryDetailWaterfall(body, detailItems);
    });
    scheduleLayout();
    settleFrameId = view.requestAnimationFrame(() => {
      settleFrameId = 0;
      scheduleLayout();
    });
    if (typeof view.ResizeObserver !== "function") {
      controller.listen(view, "resize", scheduleLayout, { once: true });
      return;
    }
    const observer = new view.ResizeObserver(() => {
      if (!body.isConnected || app.sharedDom?.ensureContextValid() === false) {
        observer.disconnect();
        return;
      }
      scheduleLayout();
    });
    observer.observe(body.parentElement ?? body);
    for (const item of detailItems) {
      observer.observe(item);
    }
    controller.addCleanup(() => {
      observer.disconnect();
    });
  }

  function layoutCategoryDetailWaterfall(
    view: Window,
    body: HTMLElement,
    detailItems: readonly HTMLElement[],
  ) {
    resetCategoryDetailWaterfall(body, detailItems);
    if (view.matchMedia("(max-width: 900px)").matches || body.clientWidth <= 0) {
      return;
    }
    const columnCount = 3;
    const styles = view.getComputedStyle(body);
    const configuredGap = styles.getPropertyValue("--ccxp-lite-spacing-md");
    const fallbackGap = Number.parseFloat(configuredGap === "" ? "16" : configuredGap);
    const computedGap = styles.columnGap === "" ? styles.gap : styles.columnGap;
    const parsedGap = Number.parseFloat(computedGap);
    const gap = Number.isFinite(parsedGap) && parsedGap > 0 ? parsedGap : fallbackGap;
    const columnWidth = (body.clientWidth - gap * (columnCount - 1)) / columnCount;
    const columnHeights = Array.from({ length: columnCount }, () => 0);
    body.classList.add("is-waterfall-ready");
    for (const item of detailItems) {
      item.style.width = `${columnWidth}px`;
      const columnIndex = getShortestColumnIndex(columnHeights);
      item.style.transform = `translate(${columnIndex * (columnWidth + gap)}px, ${columnHeights[columnIndex]}px)`;
      columnHeights[columnIndex] += item.offsetHeight + gap;
    }
    const detailBody = body;
    detailBody.style.height = `${Math.max(...columnHeights) - gap}px`;
  }

  function resetCategoryDetailWaterfall(body: HTMLElement, detailItems: readonly HTMLElement[]) {
    body.classList.remove("is-waterfall-ready");
    const detailBody = body;
    detailBody.style.height = "";
    for (const item of detailItems) {
      item.style.width = "";
      item.style.transform = "";
    }
  }

  function getShortestColumnIndex(columnHeights: readonly number[]): number {
    let shortestIndex = 0;
    for (const [index, height] of columnHeights.entries()) {
      if (height < columnHeights[shortestIndex]) {
        shortestIndex = index;
      }
    }
    return shortestIndex;
  }

  namespace.sidebarViews = { createDashboardView, createCategoryDetailView };
})(globalThis);
