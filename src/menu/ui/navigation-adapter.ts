(function registerSidebarNavigationAdapter(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace) {
    return;
  }

  function createClassicViewModel(
    model: CcxpLiteSidebarModel,
    state: CcxpLiteSidebarState,
    favoritesLoaded: boolean,
  ): CcxpLiteClassicSidebarViewModel {
    const items = filterClassicItems(model, state.searchQuery);
    const expandedItemIds = new Set(state.classicExpandedItemIds);
    if (
      !favoritesLoaded &&
      state.searchQuery === "" &&
      !expandedItemIds.has("category-favorites")
    ) {
      expandedItemIds.add("category-favorites");
    }
    const normalizedQuery = normalizeSearchText(state.searchQuery);
    if (normalizedQuery !== "") {
      for (const item of items) {
        for (const itemId of collectExpansionState(item, normalizedQuery).expandedItemIds) {
          expandedItemIds.add(itemId);
        }
      }
    }
    return { items, expandedItemIds };
  }

  function filterClassicItems(
    model: CcxpLiteSidebarModel,
    query: string,
  ): readonly CcxpLiteSidebarCategoryNode[] {
    const items = [model.favorites, ...model.categories];
    if (query === "") {
      return items;
    }
    return items
      .map((item) => filterCategory(item, normalizeSearchText(query)))
      .filter((item): item is CcxpLiteSidebarCategoryNode => item !== undefined);
  }

  function filterCategory(
    item: CcxpLiteSidebarCategoryNode,
    query: string,
  ): CcxpLiteSidebarCategoryNode | undefined {
    const itemMatches = matches(item.label, query);
    const links = (item.links ?? []).filter((linkItem) => matches(linkItem.label, query));
    const blocks = item.blocks
      .map((block) => filterBlock(block, query))
      .filter((block): block is CcxpLiteSidebarBlock => block !== undefined);
    if (!itemMatches && links.length === 0 && blocks.length === 0) {
      return undefined;
    }
    return {
      ...item,
      links: itemMatches ? item.links : links,
      blocks: itemMatches ? item.blocks : blocks,
    };
  }

  function filterBlock(block: CcxpLiteSidebarBlock, query: string) {
    if (matches(block.label, query)) {
      return block;
    }
    const links = block.links.filter((linkItem) => matches(linkItem.label, query));
    return links.length === 0 ? undefined : { ...block, links };
  }

  function collectExpansionState(
    item: CcxpLiteSidebarCategoryNode | CcxpLiteSidebarBlock,
    query: string,
  ): { hasMatch: boolean; expandedItemIds: readonly string[] } {
    let hasMatch = matches(item.label, query);
    const expandedItemIds: string[] = [];
    if (item.kind === "category") {
      hasMatch ||= (item.links ?? []).some((linkItem) => matches(linkItem.label, query));
      for (const block of item.blocks) {
        const childState = collectExpansionState(block, query);
        expandedItemIds.push(...childState.expandedItemIds);
        hasMatch ||= childState.hasMatch;
      }
      if (hasMatch && ((item.links ?? []).length > 0 || item.blocks.length > 0)) {
        expandedItemIds.push(item.id);
      }
    } else {
      hasMatch ||= item.links.some((linkItem) => matches(linkItem.label, query));
      if (hasMatch && item.links.length > 0) {
        expandedItemIds.push(item.id);
      }
    }
    return { hasMatch, expandedItemIds };
  }

  function matches(text: string, query: string) {
    return normalizeSearchText(text).includes(query);
  }

  function normalizeSearchText(text: string | undefined) {
    return (text ?? "").toLowerCase().replaceAll(/\s+/g, " ").trim();
  }

  namespace.sidebarNavigationAdapter = { createClassicViewModel };
})(globalThis);
