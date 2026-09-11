(function registerSidebarNavigation(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiButtons || !namespace.uiRenderer) {
    return;
  }
  const { createButton } = namespace.uiButtons;
  const { createRenderer } = namespace.uiRenderer;
  if (
    !namespace.sidebarFavorites ||
    !namespace.sidebarState ||
    !namespace.sidebarRuntime ||
    !namespace.shared ||
    !namespace.uiDisplay ||
    !namespace.uiIcons ||
    !namespace.sidebarFavoriteControls ||
    !namespace.sidebarNavigationAdapter
  ) {
    return;
  }
  const { areFavoritesLoaded } = namespace.sidebarFavorites;
  const { persistSidebarScroll } = namespace.sidebarState;
  const { isExternalLinkTarget, activateLegacyLink, openLeafDestination } =
    namespace.sidebarRuntime;
  const trackEvent = namespace.shared.trackEvent ?? (() => undefined);
  const { createEmptyState, createRowLabel, createSkeletonStack } = namespace.uiDisplay;
  const { createCategoryIcon, createClassicChevronIcon, createForwardIcon } = namespace.uiIcons;
  const { createFavoriteToggle, createBlockFavoriteToggle } = namespace.sidebarFavoriteControls;
  const { createClassicViewModel } = namespace.sidebarNavigationAdapter;

  function createClassicSidebarView(
    targetDocument: Document,
    navDocument: Document,
    model: CcxpLiteSidebarModel,
    state: CcxpLiteSidebarState,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ) {
    const sidebarList = createRenderer(targetDocument).element("aside", {
      className: "ccxp-lite-sidebar-list",
    });
    const { items, expandedItemIds } = createClassicViewModel(model, state, areFavoritesLoaded());
    if (items.length === 0) {
      sidebarList.append(
        createEmptyState(
          targetDocument,
          strings.sidebarSearchEmptyTitle,
          strings.sidebarSearchEmptyBody,
        ),
      );
      return sidebarList;
    }
    for (const item of items) {
      sidebarList.append(
        createClassicSidebarNode(
          targetDocument,
          navDocument,
          item,
          expandedItemIds,
          0,
          strings,
          state,
          rerender,
        ),
      );
    }
    const nextState = state;
    nextState.classicExpandedItemIds = [...expandedItemIds];
    return sidebarList;
  }

  function createClassicSidebarNode(
    targetDocument: Document,
    navDocument: Document,
    group: CcxpLiteSidebarCategoryNode | CcxpLiteSidebarBlock,
    expandedItemIds: ReadonlySet<string>,
    depth: number,
    strings: Readonly<Record<string, string>>,
    state: CcxpLiteSidebarState,
    rerender: () => void,
  ) {
    const isExpanded = expandedItemIds.has(group.id);
    const dom = createRenderer(targetDocument);
    const button = createClassicGroupButton(
      targetDocument,
      group,
      expandedItemIds,
      depth,
      isExpanded,
      strings,
      state,
      rerender,
    );
    const children = isExpanded
      ? createClassicGroupChildren(
          targetDocument,
          navDocument,
          group,
          expandedItemIds,
          depth,
          strings,
          state,
          rerender,
        )
      : undefined;
    return dom.element(
      "div",
      {
        className: `ccxp-lite-sidebar-group${group.kind === "category" ? " ccxp-lite-category" : ""}`,
      },
      [button, children],
    );
  }

  function createClassicGroupButton(
    targetDocument: Document,
    group: CcxpLiteSidebarCategoryNode | CcxpLiteSidebarBlock,
    expandedItemIds: ReadonlySet<string>,
    depth: number,
    isExpanded: boolean,
    strings: Readonly<Record<string, string>>,
    state: CcxpLiteSidebarState,
    rerender: () => void,
  ) {
    const dom = createRenderer(targetDocument);
    const button = createButton(targetDocument, {
      className: "ccxp-lite-row-button ccxp-lite-expandable",
    });
    button.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    button.setAttribute("title", group.label);
    button.style.setProperty(
      "--ccxp-lite-row-depth",
      String(getClassicSidebarIndentLevel(group.kind, depth)),
    );
    if (group.kind === "category") {
      button.append(
        dom.element("span", { className: "ccxp-lite-row-leading" }, [
          createCategoryIcon(targetDocument, group.icon ?? "folder"),
        ]),
      );
    } else if (depth > 0) {
      button.append(createClassicRowLeadingSpacer(targetDocument));
    }
    button.append(createRowLabel(targetDocument, group.label, false));
    button.append(
      createClassicTrailingActions(targetDocument, group, isExpanded, strings, rerender),
    );
    button.classList.add("ccxp-lite-row-button-has-dual-trailing");
    button.addEventListener("click", () => {
      persistSidebarScroll(targetDocument, "root");
      const nextExpandedItemIds = new Set(expandedItemIds);
      if (nextExpandedItemIds.has(group.id)) {
        nextExpandedItemIds.delete(group.id);
      } else {
        nextExpandedItemIds.add(group.id);
      }
      const nextState = state;
      nextState.classicExpandedItemIds = [...nextExpandedItemIds];
      rerender();
    });
    return button;
  }

  function createClassicGroupChildren(
    targetDocument: Document,
    navDocument: Document,
    group: CcxpLiteSidebarCategoryNode | CcxpLiteSidebarBlock,
    expandedItemIds: ReadonlySet<string>,
    depth: number,
    strings: Readonly<Record<string, string>>,
    state: CcxpLiteSidebarState,
    rerender: () => void,
  ) {
    const children = createRenderer(targetDocument).element("div", {
      className: "ccxp-lite-link-list ccxp-lite-link-list-layer",
      styleProperties: { "--ccxp-lite-tree-depth": String(depth + 1) },
    });
    if (!areFavoritesLoaded() && group.kind === "category" && group.id === "category-favorites") {
      children.append(
        createSkeletonStack(
          targetDocument,
          3,
          "ccxp-lite-row-button ccxp-lite-item ccxp-lite-skeleton-row",
        ),
      );
      return children;
    }
    if (group.kind === "category") {
      for (const linkItem of group.links ?? []) {
        children.append(
          createClassicLinkButton(
            targetDocument,
            navDocument,
            linkItem,
            depth + 1,
            strings,
            rerender,
          ),
        );
      }
      for (const block of group.blocks) {
        children.append(
          createClassicSidebarNode(
            targetDocument,
            navDocument,
            block,
            expandedItemIds,
            depth + 1,
            strings,
            state,
            rerender,
          ),
        );
      }
    } else {
      for (const linkItem of group.links) {
        children.append(
          createClassicLinkButton(
            targetDocument,
            navDocument,
            linkItem,
            depth + 1,
            strings,
            rerender,
          ),
        );
      }
    }
    if (children.childElementCount === 0) {
      const emptyText = getClassicEmptyText(group, strings);
      children.append(createClassicEmptyRow(targetDocument, emptyText, depth + 1));
    }
    return children;
  }

  function getClassicEmptyText(
    group: CcxpLiteSidebarCategoryNode | CcxpLiteSidebarBlock,
    strings: Readonly<Record<string, string>>,
  ) {
    if (group.kind === "category" && group.id === "category-favorites") {
      return strings.sidebarFavoritesEmpty;
    }
    return group.kind === "category"
      ? (group.emptyMessage ?? strings.emptyGroup)
      : strings.emptyGroup;
  }

  function createClassicLinkButton(
    targetDocument: Document,
    navDocument: Document,
    linkItem: CcxpLiteSidebarLinkItem,
    depth: number,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ): HTMLElement {
    const button = createButton(targetDocument, {
      className: "ccxp-lite-row-button ccxp-lite-item",
    });
    button.setAttribute("title", linkItem.label);
    button.style.setProperty(
      "--ccxp-lite-row-depth",
      String(getClassicSidebarIndentLevel("link", depth)),
    );
    if (depth > 0) {
      button.append(createClassicRowLeadingSpacer(targetDocument));
    }
    button.append(
      createRowLabel(targetDocument, linkItem.label, isExternalLinkTarget(linkItem, navDocument)),
    );
    if (depth > 0) {
      button.classList.add("ccxp-lite-row-button-has-dual-trailing");
      button.append(
        createClassicLinkTrailingActions(
          targetDocument,
          createFavoriteToggle(targetDocument, linkItem, strings, rerender),
        ),
      );
    } else {
      button.append(createFavoriteToggle(targetDocument, linkItem, strings, rerender));
    }
    button.addEventListener("click", () => {
      trackNavigationEvent(targetDocument, linkItem, {
        sidebarVariant: "classic",
        navigationMode: "legacy_frame",
      });
      activateLegacyLink(linkItem, navDocument);
    });
    return button;
  }

  function getClassicSidebarIndentLevel(kind: string, depth: number): number {
    if (kind === "category") {
      return 0;
    }
    return Math.max(0, depth - 1);
  }

  function createClassicRowLeadingSpacer(targetDocument: Document): HTMLElement {
    return createRenderer(targetDocument).element("span", {
      className: "ccxp-lite-row-leading",
      attributes: { "aria-hidden": "true" },
    });
  }

  function createClassicEmptyRow(
    targetDocument: Document,
    text: string,
    depth: number,
  ): HTMLElement {
    return createRenderer(targetDocument).element(
      "div",
      {
        className: "ccxp-lite-row-button ccxp-lite-item ccxp-lite-empty-row",
        styleProperties: {
          "--ccxp-lite-row-depth": String(getClassicSidebarIndentLevel("link", depth)),
        },
      },
      [
        depth > 0 ? createClassicRowLeadingSpacer(targetDocument) : undefined,
        createRowLabel(targetDocument, text, false),
      ],
    );
  }

  function createClassicTrailingActions(
    targetDocument: Document,
    group: CcxpLiteSidebarCategoryNode | CcxpLiteSidebarBlock,
    isExpanded: boolean,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ): HTMLElement {
    return createRenderer(targetDocument).element("span", { className: "ccxp-lite-row-trailing" }, [
      createClassicActionSlot(
        targetDocument,
        group.kind === "block"
          ? createBlockFavoriteToggle(targetDocument, group, strings, rerender)
          : undefined,
      ),
      createClassicChevronSlot(
        targetDocument,
        createClassicChevronIcon(targetDocument, isExpanded),
      ),
    ]);
  }

  function createClassicLinkTrailingActions(
    targetDocument: Document,
    action: HTMLElement,
  ): HTMLElement {
    return createRenderer(targetDocument).element("span", { className: "ccxp-lite-row-trailing" }, [
      createClassicActionSlot(targetDocument, action),
      createClassicChevronSlot(targetDocument),
    ]);
  }

  function createClassicActionSlot(targetDocument: Document, action?: HTMLElement): HTMLElement {
    return createRenderer(targetDocument).element(
      "span",
      {
        className: "ccxp-lite-row-action-slot",
        attributes: action ? undefined : { "aria-hidden": "true" },
      },
      [action],
    );
  }

  function createClassicChevronSlot(targetDocument: Document, chevron?: SVGElement): HTMLElement {
    return createRenderer(targetDocument).element(
      "span",
      {
        className: "ccxp-lite-row-chevron-slot",
        attributes: chevron ? undefined : { "aria-hidden": "true" },
      },
      [chevron],
    );
  }

  function createCategoryBlock(
    targetDocument: Document,
    navDocument: Document,
    blockItem: CcxpLiteSidebarBlock,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ): HTMLElement {
    const dom = createRenderer(targetDocument);
    return dom.element("div", { className: "ccxp-lite-category-block" }, [
      blockItem.label === ""
        ? undefined
        : dom.element("h3", {
            className: "ccxp-lite-category-block-title",
            text: blockItem.label,
          }),
      ...blockItem.links.map((linkItem) =>
        createDetailLinkCard(targetDocument, navDocument, linkItem, strings, rerender),
      ),
    ]);
  }

  function createCategoryCard(
    targetDocument: Document,
    category: CcxpLiteSidebarCategoryNode,
    strings: Readonly<Record<string, string>>,
    onOpen: () => void,
  ) {
    const dom = createRenderer(targetDocument);
    const button = createButton(targetDocument, { className: "ccxp-lite-category-card" });
    button.setAttribute("title", category.label);
    button.addEventListener("click", onOpen);
    dom.append(
      button,
      dom.element("span", { className: "ccxp-lite-category-card-media" }, [
        dom.element("span", { className: "ccxp-lite-category-card-icon" }, [
          createCategoryIcon(targetDocument, category.icon ?? "folder"),
        ]),
      ]),
      dom.element("span", { className: "ccxp-lite-category-card-body" }, [
        dom.element("span", { className: "ccxp-lite-category-card-title", text: category.label }),
        category.summary === undefined || category.summary === ""
          ? undefined
          : dom.element("span", {
              className: "ccxp-lite-category-card-summary",
              text: category.summary,
            }),
      ]),
      dom.element("span", { className: "ccxp-lite-category-card-footer" }, [
        dom.element("span", {
          className: "ccxp-lite-category-card-action",
          text: strings.sidebarOpenCategory,
        }),
        createForwardIcon(targetDocument),
      ]),
    );
    return button;
  }

  function createLinkCard(
    targetDocument: Document,
    navDocument: Document,
    linkItem: CcxpLiteSidebarLinkItem,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
    className: string,
  ) {
    const button = createButton(targetDocument, { className });
    button.setAttribute("title", linkItem.label);
    button.append(
      createRowLabel(targetDocument, linkItem.label, isExternalLinkTarget(linkItem, navDocument)),
    );
    button.append(createFavoriteToggle(targetDocument, linkItem, strings, rerender));
    button.addEventListener("click", () => {
      trackNavigationEvent(targetDocument, linkItem, {
        sidebarVariant: "layered",
        navigationMode: "embedded",
      });
      openLeafDestination(targetDocument, navDocument, linkItem, rerender);
    });
    return button;
  }

  function createPinnedLinkCard(
    targetDocument: Document,
    navDocument: Document,
    linkItem: CcxpLiteSidebarLinkItem,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ) {
    return createLinkCard(
      targetDocument,
      navDocument,
      linkItem,
      strings,
      rerender,
      "ccxp-lite-link-card ccxp-lite-pinned-card",
    );
  }

  function createPinnedBlockCard(
    targetDocument: Document,
    blockItem: CcxpLiteSidebarBlock,
    state: CcxpLiteSidebarState,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ) {
    const button = createButton(targetDocument, {
      className: "ccxp-lite-link-card ccxp-lite-pinned-card",
    });
    button.setAttribute("title", blockItem.label);
    button.append(createRowLabel(targetDocument, blockItem.label, false));
    button.append(createBlockFavoriteToggle(targetDocument, blockItem, strings, rerender));
    button.addEventListener("click", () => {
      persistSidebarScroll(targetDocument, "root");
      const nextState = state;
      nextState.currentCategoryId = blockItem.parentCategoryId ?? "";
      nextState.activeLeaf = undefined;
      rerender();
    });
    return button;
  }

  function createDetailLinkCard(
    targetDocument: Document,
    navDocument: Document,
    linkItem: CcxpLiteSidebarLinkItem,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ) {
    return createLinkCard(
      targetDocument,
      navDocument,
      linkItem,
      strings,
      rerender,
      "ccxp-lite-link-card ccxp-lite-detail-link-card",
    );
  }

  function trackNavigationEvent(
    targetDocument: Document,
    linkItem: CcxpLiteSidebarLinkItem,
    options: {
      sidebarVariant: "classic" | "layered";
      navigationMode: "embedded" | "legacy_frame" | "new_tab";
    },
  ) {
    trackEvent(targetDocument, {
      feature: "navigation",
      action: "open_link",
      surface: "sidebar",
      sidebar_variant: options.sidebarVariant,
      navigation_mode: options.navigationMode,
      link_id: linkItem.id,
      link_label: linkItem.label,
    });
  }
  namespace.sidebarNavigation = {
    createClassicSidebarView,
    createCategoryBlock,
    createCategoryCard,
    createPinnedLinkCard,
    createPinnedBlockCard,
    createDetailLinkCard,
    trackNavigationEvent,
  };
})(globalThis);
