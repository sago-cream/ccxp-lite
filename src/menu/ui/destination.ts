(function registerSidebarDestination(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiButtons || !namespace.uiRenderer) {
    return;
  }
  const { createButton } = namespace.uiButtons;
  const { createRenderer } = namespace.uiRenderer;
  if (
    !namespace.sidebarState ||
    !namespace.sidebarRuntime ||
    !namespace.uiIcons ||
    !namespace.uiDisplay ||
    !namespace.sidebarNavigation
  ) {
    return;
  }
  const { getSidebarUiState } = namespace.sidebarState;
  const { openLeafDestination, openLeafInNewTab, createDestinationFrame } =
    namespace.sidebarRuntime;
  const { createBackIcon } = namespace.uiIcons;
  const { createBreadcrumbHeading, createSkeletonStack, createEmptyState } = namespace.uiDisplay;
  const { trackNavigationEvent } = namespace.sidebarNavigation;

  function createDestinationView(
    targetDocument: Document,
    navDocument: Document,
    activeCategory: CcxpLiteSidebarCategoryNode | undefined,
    activeLeaf: CcxpLiteSidebarLinkItem,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ): HTMLElement {
    const dom = createRenderer(targetDocument);
    const backButton = createButton(targetDocument, {
      className: "ccxp-lite-back-button",
      ariaLabel: strings.sidebarBack,
      title: strings.sidebarBack,
      icon: createBackIcon(targetDocument),
    });
    backButton.addEventListener("click", () => {
      const state = getSidebarUiState(targetDocument);
      state.activeLeaf = undefined;
      rerender();
    });
    const loading = dom.element("div", { className: "ccxp-lite-destination-loading" }, [
      createSkeletonStack(targetDocument, 1, "ccxp-lite-skeleton-progress"),
      dom.element("div", {
        className: "ccxp-lite-destination-loading-label",
        text: strings.sidebarDestinationLoading,
      }),
      createSkeletonStack(targetDocument, 3, "ccxp-lite-skeleton-frame-line"),
    ]);
    const error = dom.element("div", { className: "ccxp-lite-destination-error" });
    error.hidden = true;
    const retryButton = createButton(targetDocument, {
      className: "ccxp-lite-destination-action",
      label: strings.sidebarRetry,
    });
    retryButton.addEventListener("click", () => {
      openLeafDestination(targetDocument, navDocument, activeLeaf, rerender);
    });
    const openButton = createButton(targetDocument, {
      className: "ccxp-lite-destination-action",
      label: strings.sidebarOpenInNewTab,
    });
    openButton.addEventListener("click", () => {
      trackNavigationEvent(targetDocument, activeLeaf, {
        sidebarVariant: "layered",
        navigationMode: "new_tab",
      });
      openLeafInNewTab(activeLeaf, navDocument);
    });
    dom.append(
      error,
      createEmptyState(
        targetDocument,
        strings.sidebarDestinationErrorTitle,
        strings.sidebarDestinationErrorBody,
      ),
      dom.element("div", { className: "ccxp-lite-destination-actions" }, [retryButton, openButton]),
    );
    const frame = createDestinationFrame(targetDocument, navDocument, activeLeaf, (status) => {
      loading.hidden = status !== "loading";
      error.hidden = status !== "error";
    });
    return dom.element("section", { className: "ccxp-lite-pane ccxp-lite-pane-detail" }, [
      dom.element("div", { className: "ccxp-lite-pane-header ccxp-lite-pane-header-detail" }, [
        backButton,
        createBreadcrumbHeading(targetDocument, activeCategory, activeLeaf),
      ]),
      dom.element("div", { className: "ccxp-lite-destination-wrap" }, [loading, error, frame]),
    ]);
  }
  namespace.sidebarDestination = { createDestinationView };
})(globalThis);
