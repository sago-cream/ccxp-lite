(function registerSidebarOverlays(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (
    !namespace?.shared ||
    !namespace.sidebarState ||
    !namespace.uiSwitch ||
    !namespace.uiIcons ||
    !namespace.uiRenderer ||
    !namespace.sidebarDialogController
  ) {
    return;
  }
  const { ensureThemeDocument } = namespace.shared;
  const { setPersistedSidebarVariant, persistSidebarScroll } = namespace.sidebarState;
  const { createStatusSwitch } = namespace.uiSwitch;
  const { createLabIcon } = namespace.uiIcons;
  const { createRenderer } = namespace.uiRenderer;
  const { showRemovePinnedDialog } = namespace.sidebarDialogController;

  function createSidebarVariantSwitch(
    targetDocument: Document,
    state: CcxpLiteSidebarState,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
  ): HTMLElement {
    const isLayered = state.sidebarVariant === "layered";
    const button = createStatusSwitch(targetDocument, {
      mode: state.sidebarVariant,
      actionLabel: isLayered ? strings.sidebarSwitchToClassic : strings.sidebarSwitchToLayered,
      label: strings.sidebarExperimentPersistentLabel,
      status: isLayered ? strings.sidebarExperimentOn : strings.sidebarExperimentOff,
      icon: createLabIcon(targetDocument),
    });
    button.addEventListener("click", () => {
      const nextState = state;
      nextState.sidebarVariant = setPersistedSidebarVariant(
        nextState.sidebarVariant === "classic" ? "layered" : "classic",
      );
      syncTopLevelFramesetLayout(nextState.sidebarVariant);
      nextState.activeLeaf = undefined;
      nextState.currentCategoryId = "";
      persistSidebarScroll(targetDocument, "root");
      rerender();
    });
    return button;
  }

  function syncTopLevelFramesetLayout(variant: "classic" | "layered") {
    try {
      const scopeDocument = window.top ? window.top.document : document;
      scopeDocument
        .querySelector("frameset[cols]")
        ?.setAttribute("cols", variant === "classic" ? "324,*" : "*,0");
    } catch {
      // Ignore cross-frame layout sync failures.
    }
  }

  function mountSidebarVariantSwitch(
    targetDocument: Document,
    state: CcxpLiteSidebarState,
    strings: Readonly<Record<string, string>>,
    rerender: () => void,
    _footer?: HTMLElement,
  ) {
    const isClassic = state.sidebarVariant === "classic";
    const scopeDocument = resolveClassicOverlayScopeDocument(targetDocument, isClassic);
    const topDocument = resolveTopLevelDocument();
    const button = createSidebarVariantSwitch(scopeDocument, state, strings, rerender);
    button.dataset.ccxpLiteSidebarLabSwitch = "true";
    removeExistingSidebarVariantSwitches([targetDocument, scopeDocument, topDocument]);
    Object.assign(button.style, { position: "relative", pointerEvents: "auto" });
    if (isClassic && scopeDocument !== targetDocument) {
      getClassicMainFrameOverlayMountNode(scopeDocument).append(button);
      return;
    }
    getOverlayMountNode(targetDocument).append(button);
  }

  function resolveClassicOverlayScopeDocument(
    targetDocument: Document,
    isClassic: boolean,
  ): Document {
    if (!isClassic) {
      return targetDocument;
    }
    try {
      const scopeDocument = resolveTopLevelDocument();
      if (!scopeDocument) {
        return targetDocument;
      }
      ensureThemeDocument(scopeDocument, "nav");
      return scopeDocument;
    } catch {
      return targetDocument;
    }
  }

  function resolveTopLevelDocument(): Document | undefined {
    try {
      return window.top?.document ?? undefined;
    } catch {
      return undefined;
    }
  }

  function getClassicMainFrameOverlayMountNode(targetDocument: Document): HTMLElement {
    let anchor = targetDocument.querySelector<HTMLElement>(
      "[data-ccxp-lite-main-frame-overlay-anchor='true']",
    );
    if (!anchor) {
      anchor = createRenderer(targetDocument).element("div", {
        data: { ccxpLiteMainFrameOverlayAnchor: "true" },
      });
      targetDocument.documentElement.append(anchor);
    }
    syncClassicMainFrameOverlayPosition(targetDocument, anchor);
    return anchor;
  }

  function syncClassicMainFrameOverlayPosition(targetDocument: Document, anchor: HTMLElement) {
    const mainFrame = targetDocument.querySelector<HTMLElement>("frame[name='main']");
    const view = targetDocument.defaultView;
    if (!mainFrame || !view) {
      Object.assign(anchor.style, {
        position: "fixed",
        insetInlineEnd: "var(--ccxp-lite-spacing-lg)",
        insetBlockEnd: "var(--ccxp-lite-spacing-lg)",
      });
      return;
    }
    const rect = mainFrame.getBoundingClientRect();
    const inlineOffset = Math.max(0, view.innerWidth - rect.right);
    const blockOffset = Math.max(0, view.innerHeight - rect.bottom);
    Object.assign(anchor.style, {
      position: "fixed",
      insetInlineEnd: `calc(var(--ccxp-lite-spacing-lg) + ${inlineOffset}px)`,
      insetBlockEnd: `calc(var(--ccxp-lite-spacing-lg) + ${blockOffset}px)`,
      zIndex: "2147483646",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "flex-end",
      pointerEvents: "none",
    });
  }

  function removeExistingSidebarVariantSwitches(documents: ReadonlyArray<Document | undefined>) {
    const selectors = [
      "[data-ccxp-lite-sidebar-lab-switch]",
      ".ccxp-lite-sidebar-experiment-copy",
      "[data-ccxp-lite-floating-anchor='true']",
      "[data-ccxp-lite-main-frame-overlay-anchor='true']",
    ];
    for (const scopeDocument of documents) {
      if (!scopeDocument) {
        continue;
      }
      for (const selector of selectors) {
        for (const node of scopeDocument.querySelectorAll(selector)) {
          node.remove();
        }
      }
      for (const node of scopeDocument.querySelectorAll<HTMLElement>(
        "[data-ccxp-lite-floating-anchor-host='true']",
      )) {
        delete node.dataset.ccxpLiteFloatingAnchorHost;
      }
    }
  }

  function getOverlayMountNode(targetDocument: Document): HTMLElement {
    const anchorHost =
      targetDocument.querySelector<HTMLElement>(
        ".ccxp-lite-sidebar-content .ccxp-lite-dashboard-shell",
      ) ??
      targetDocument.querySelector<HTMLElement>(".ccxp-lite-sidebar-content .ccxp-lite-pane") ??
      targetDocument.body;
    anchorHost.dataset.ccxpLiteFloatingAnchorHost = "true";
    let anchor = anchorHost.querySelector<HTMLElement>("[data-ccxp-lite-floating-anchor='true']");
    if (!anchor) {
      anchor = createRenderer(targetDocument).element("div", {
        data: { ccxpLiteFloatingAnchor: "true" },
      });
      anchorHost.append(anchor);
    }
    return anchor;
  }

  namespace.sidebarOverlays = {
    showRemovePinnedDialog,
    syncTopLevelFramesetLayout,
    mountSidebarVariantSwitch,
  };
})(globalThis);
