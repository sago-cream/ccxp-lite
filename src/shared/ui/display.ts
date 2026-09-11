(function registerUiDisplay(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiIcons || !namespace.uiRenderer) {
    return;
  }
  const { createRenderer } = namespace.uiRenderer;
  const { createSearchIcon, createExternalLinkIcon, createBreadcrumbChevronIcon } =
    namespace.uiIcons;

  function createSection(targetDocument: Document, className: string) {
    return createRenderer(targetDocument).element("section", {
      className: `ccxp-lite-landing-section ${className}`,
    });
  }

  function createSectionHeading(targetDocument: Document, text: string): HTMLElement {
    return createRenderer(targetDocument).element("h2", {
      className: "ccxp-lite-section-heading",
      text,
    });
  }

  function createEmptyState(targetDocument: Document, title: string, body?: string): HTMLElement {
    const dom = createRenderer(targetDocument);
    return dom.element("div", { className: "ccxp-lite-empty" }, [
      dom.element("div", { className: "ccxp-lite-empty-title", text: title }),
      body === undefined || body === ""
        ? undefined
        : dom.element("div", { className: "ccxp-lite-empty-body", text: body }),
    ]);
  }

  function createSkeletonStack(
    targetDocument: Document,
    count: number,
    itemClassName: string,
  ): HTMLElement {
    const dom = createRenderer(targetDocument);
    return dom.element(
      "div",
      { className: "ccxp-lite-skeleton-stack" },
      Array.from({ length: count }, () => dom.element("div", { className: itemClassName })),
    );
  }

  function createRowLabel(
    targetDocument: Document,
    text: string,
    withExternalLinkIcon: boolean,
  ): HTMLElement {
    const dom = createRenderer(targetDocument);
    return dom.element("span", { className: "ccxp-lite-row-label-wrap" }, [
      dom.element("span", { className: "ccxp-lite-row-label", text }),
      withExternalLinkIcon ? createExternalLinkIcon(targetDocument) : undefined,
    ]);
  }

  function createBreadcrumbHeading(
    targetDocument: Document,
    activeCategory: CcxpLiteSidebarCategoryNode | undefined,
    activeLeaf: CcxpLiteSidebarLinkItem,
  ): HTMLElement {
    const dom = createRenderer(targetDocument);
    return dom.element("h2", { className: "ccxp-lite-breadcrumb-heading" }, [
      activeCategory
        ? dom.fragment(
            dom.element("span", {
              className: "ccxp-lite-breadcrumb-parent",
              text: activeCategory.label,
            }),
            createBreadcrumbChevronIcon(targetDocument),
          )
        : undefined,
      dom.element("span", {
        className: "ccxp-lite-breadcrumb-current",
        text: activeLeaf.label,
      }),
    ]);
  }

  function createSidebarSearch(
    targetDocument: Document,
    strings: Readonly<Record<string, string>>,
  ): HTMLElement {
    const dom = createRenderer(targetDocument);
    return dom.element("label", { className: "ccxp-lite-sidebar-search" }, [
      createSearchIcon(targetDocument),
      dom.element("input", {
        className: "ccxp-lite-sidebar-search-input",
        attributes: {
          type: "search",
          autocomplete: "off",
          spellcheck: "false",
          placeholder: strings.sidebarSearchPlaceholder,
          "aria-label": strings.sidebarSearchPlaceholder,
        },
      }),
    ]);
  }
  namespace.uiDisplay = {
    createSidebarSearch,
    createSection,
    createSectionHeading,
    createEmptyState,
    createSkeletonStack,
    createRowLabel,
    createBreadcrumbHeading,
  };
})(globalThis);
