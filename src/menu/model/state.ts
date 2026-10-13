(function registerCcxpLiteSidebarState(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const SIDEBAR_VARIANT_STORAGE_KEY = "ccxp-lite-sidebar-variant";
  const SIDEBAR_COLLAPSED_STORAGE_KEY = "ccxp-lite-sidebar-collapsed";
  const sidebarUiStateByDocument = new WeakMap<Document, CcxpLiteSidebarState>();
  let persistedSidebarVariant: "classic" | "layered" | undefined;

  function resolveSidebarStateScopeDocument(targetDocument: Document): Document {
    try {
      const scopeWindow = targetDocument.defaultView ?? runtimeScope;
      const topDocument = scopeWindow.top?.document;
      if (topDocument) {
        return topDocument;
      }
    } catch {
      // Fall through to the document that initiated the request.
    }
    return targetDocument;
  }

  function getSidebarUiState(navDocument: Document): CcxpLiteSidebarState {
    const scopeDocument = resolveSidebarStateScopeDocument(navDocument);
    if (sidebarUiStateByDocument.has(scopeDocument)) {
      const existingState = sidebarUiStateByDocument.get(scopeDocument);
      if (existingState) {
        return existingState;
      }
    }
    const state: CcxpLiteSidebarState = {
      hasLoaded: true,
      currentCategoryId: "",
      searchQuery: "",
      activeLeaf: undefined,
      sidebarVariant: getPersistedSidebarVariant(),
      sidebarCollapsed: getPersistedSidebarCollapsed(),
      sidebarPreview: false,
      sidebarWidth: getPersistedSidebarWidth(),
      classicExpandedItemIds: ["category-favorites"],
      scrollTopByView: {
        root: 0,
        category: 0,
        destination: 0,
      },
    };
    sidebarUiStateByDocument.set(scopeDocument, state);
    return state;
  }

  function persistSidebarScroll(targetDocument: Document, viewKey: string) {
    const content = targetDocument.querySelector(".ccxp-lite-sidebar-content");
    if (!content) {
      return;
    }
    const state = getSidebarUiState(targetDocument);
    state.scrollTopByView[viewKey] = content.scrollTop;
  }

  function restoreSidebarScroll(contentNode: Element, scrollTop: number) {
    const resolvedScrollTop = Number.isFinite(scrollTop) ? scrollTop : 0;
    const contentElement = contentNode;
    globalThis.requestAnimationFrame(() => {
      contentElement.scrollTop = resolvedScrollTop;
    });
  }

  function getPersistedSidebarVariant() {
    if (persistedSidebarVariant === "classic" || persistedSidebarVariant === "layered") {
      return persistedSidebarVariant;
    }
    try {
      const storedValue = globalThis.localStorage.getItem(SIDEBAR_VARIANT_STORAGE_KEY);
      persistedSidebarVariant = storedValue === "layered" ? "layered" : "classic";
      return persistedSidebarVariant;
    } catch {
      persistedSidebarVariant = "classic";
      return persistedSidebarVariant;
    }
  }

  function setPersistedSidebarVariant(variant: "classic" | "layered"): "classic" | "layered" {
    persistedSidebarVariant = variant === "classic" ? "classic" : "layered";
    try {
      globalThis.localStorage.setItem(SIDEBAR_VARIANT_STORAGE_KEY, persistedSidebarVariant);
    } catch {
      // Ignore storage write failures and keep the in-memory variant.
    }
    return persistedSidebarVariant;
  }

  function getPersistedSidebarCollapsed(): boolean {
    try {
      return globalThis.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }

  function setPersistedSidebarCollapsed(collapsed: boolean) {
    try {
      globalThis.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
    } catch {
      // The current page keeps the preference when storage is unavailable.
    }
  }

  function getPersistedSidebarWidth() {
    const tokens = namespace.shared?.TOKENS;
    const minimum = Number.parseFloat(tokens?.sizeSidebarMin ?? "280");
    const maximum = Number.parseFloat(tokens?.sizeSidebarMax ?? "480");
    const fallback = Number.parseFloat(tokens?.sizeSidebarExpanded ?? "324");
    try {
      const stored = Number(globalThis.localStorage.getItem("ccxp-lite-sidebar-width"));
      return stored > 0 && Number.isFinite(stored)
        ? Math.min(maximum, Math.max(minimum, stored))
        : fallback;
    } catch {
      return fallback;
    }
  }

  function setPersistedSidebarWidth(width: number) {
    try {
      globalThis.localStorage.setItem("ccxp-lite-sidebar-width", String(width));
    } catch {
      // Keep the current width in memory when storage is unavailable.
    }
  }

  namespace.sidebarState = {
    getSidebarUiState,
    setPersistedSidebarCollapsed,
    setPersistedSidebarWidth,
    persistSidebarScroll,
    restoreSidebarScroll,
    getPersistedSidebarVariant,
    setPersistedSidebarVariant,
  };
})(globalThis);
