(function registerCcxpLiteSidebarBootstrap(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  if (!namespace.uiButtons || !namespace.uiRenderer) {
    return;
  }
  const { createButton } = namespace.uiButtons;
  const { createRenderer } = namespace.uiRenderer;
  const { shared, sidebarFavorites, sidebarData, sidebarState, sidebarUi, sidebarRuntime } =
    namespace;
  if (
    !shared ||
    !sidebarFavorites ||
    !sidebarData ||
    !sidebarState ||
    !sidebarUi ||
    !sidebarRuntime
  ) {
    return;
  }

  const {
    TOKENS,
    ASSETS,
    ensureThemeDocument,
    ensureDocumentBody,
    getLocalizedStrings,
    resolveLocaleFromDocument,
    createBrandImage,
    createBrandCopy,
    createBrandPartnerLink,
    createSupportMenu,
    isDocumentComplete,
    cleanLegacyAttributes,
  } = shared;
  const { initializeFavorites } = sidebarFavorites;
  const { buildSidebarModel } = sidebarData;
  const { getSidebarUiState } = sidebarState;
  const { renderSidebar, createSidebarSearch, syncTopLevelFramesetLayout } = sidebarUi;
  const { captureInitialMainFrameUrl } = sidebarRuntime;
  const rerenderBindingByDocument = new WeakMap<
    Document,
    {
      boundRerender: () => void;
      render: (() => void) | undefined;
      unsubscribeFavorites: (() => void) | undefined;
    }
  >();

  function simplifySidebar(
    navFrame: HTMLIFrameElement,
    retry: () => void,
    options: { hostDocument?: Document } = {},
  ) {
    const navDocument = navFrame.contentDocument;

    if (!navDocument) {
      retry();
      return;
    }

    const hostDocument = options.hostDocument ?? navDocument;
    const navBody = navDocument.querySelector("body");

    if (!navBody) {
      retry();
      return;
    }

    if (navBody.dataset.ccxpLiteSidebarApplied !== "true" && !isDocumentComplete(navDocument)) {
      retry();
      return;
    }

    ensureThemeDocument(navDocument, "nav");
    ensureThemeDocument(hostDocument, "nav");
    const strings = getLocalizedStrings(resolveLocaleFromDocument(navDocument));
    const model = buildSidebarModel(navDocument, strings);
    if (!model) {
      retry();
      return;
    }
    const state = getSidebarUiState(hostDocument);
    const rerenderBinding = getOrCreateRerenderBinding(hostDocument);
    captureInitialMainFrameUrl();
    syncTopLevelFramesetLayout(state.sidebarVariant);
    const hostBody = ensureDocumentBody(hostDocument);

    if (!hostBody) {
      retry();
      return;
    }

    if (hostBody.dataset.ccxpLiteSidebarApplied !== "true") {
      const helperFrame = navDocument.querySelector<HTMLIFrameElement>("iframe[name='frame_7472']");
      const dom = createRenderer(hostDocument);
      const brandGroup = dom.element("div", { className: "ccxp-lite-sidebar-brand-group" });

      const brand = createButton(hostDocument, {
        className: "ccxp-lite-sidebar-brand ccxp-lite-sidebar-brand-button",
      });
      brand.setAttribute("aria-label", strings.sidebarResetHome);
      brand.setAttribute("title", strings.sidebarResetHome);
      brand.append(
        createBrandImage(hostDocument, "ccxp-lite-sidebar-brand-logo", ASSETS.sidebarBrandLogoPath),
      );
      brand.append(
        createBrandCopy(
          hostDocument,
          "ccxp-lite-sidebar-brand-copy",
          "ccxp-lite-sidebar-brand-title",
          strings.sidebarTitle,
        ),
      );

      const { link: repoLink } = createBrandPartnerLink(hostDocument, {
        linkClassName: "ccxp-lite-sidebar-brand-partner-link",
        iconWrapClassName: "ccxp-lite-sidebar-brand-partner-mark",
        copyClassName: "ccxp-lite-sidebar-brand-partner-copy",
        labelClassName: "ccxp-lite-sidebar-brand-partner-label",
        label: strings.sidebarGitHubLink,
      });

      const search = createSidebarSearch(hostDocument, strings);

      const supportMenu = createSupportMenu(hostDocument, repoLink);
      dom.append(brandGroup, brand, repoLink);
      const shell = dom.element(
        "div",
        { className: `${TOKENS.sidebarClass} ccxp-lite-app-shell` },
        [
          dom.element("div", { className: "ccxp-lite-sidebar-header" }, [brandGroup, search]),
          dom.element("main", { className: "ccxp-lite-sidebar-content" }),
          supportMenu,
        ],
      );

      cleanLegacyAttributes(shell);
      hostBody.replaceChildren(shell);

      if (helperFrame) {
        helperFrame.style.display = "none";
        navBody.append(helperFrame);
      }

      brand.addEventListener("click", () => {
        const uiState = getSidebarUiState(hostDocument);
        uiState.currentCategoryId = "";
        uiState.activeLeaf = undefined;
        rerenderBinding.render?.();
      });

      hostBody.dataset.ccxpLiteSidebarApplied = "true";
    }

    rerenderBinding.render = () => {
      renderSidebar(
        hostDocument,
        navDocument,
        () => buildSidebarModel(navDocument, strings) ?? model,
        strings,
      );
    };
    rerenderBinding.unsubscribeFavorites?.();
    rerenderBinding.unsubscribeFavorites = initializeFavorites(rerenderBinding.boundRerender);
    rerenderBinding.boundRerender();
  }

  function getOrCreateRerenderBinding(targetDocument: Document) {
    const existingBinding = rerenderBindingByDocument.get(targetDocument);
    if (existingBinding) {
      return existingBinding;
    }
    const binding = {
      boundRerender: () => {
        binding.render?.();
      },
      render: undefined as (() => void) | undefined,
      unsubscribeFavorites: undefined as (() => void) | undefined,
    };
    rerenderBindingByDocument.set(targetDocument, binding);
    return binding;
  }

  namespace.sidebar = {
    simplifySidebar,
  };
})(globalThis);
