(function bootstrapCcxpLite() {
  const namespace = globalThis.CCXP_LITE ?? {};
  if (!namespace.uiLoading || !namespace.uiLegacyStyle) {
    return;
  }
  const { ensureLoadingSprite, releaseLoadingSprite } = namespace.uiLoading;
  const { prepareLegacySurface } = namespace.uiLegacyStyle;
  const { shared } = namespace;
  const { sidebar } = namespace;
  const { login } = namespace;
  if (!shared || !login) {
    return;
  }
  const sharedLib = shared;
  const loginLib = login;
  const { TOKENS, ensureDocumentBody, isDocumentComplete, trackPageView } = sharedLib;
  const { isSupportedInquirePath, isLoginPage, simplifyLoginPage } = loginLib;
  const RETRY_LIMIT = 40;
  const RETRY_DELAY_MS = 250;
  const LAYERED_FRAMESET_COLUMNS = "*,0";
  const CLASSIC_FRAMESET_COLUMNS = "324,*";
  const FRAMESET_ROWS = "0,*";
  const LOADING_SPRITE_TIMEOUT_MS = 8000;
  const SIDEBAR_VARIANT_STORAGE_KEY = "ccxp-lite-sidebar-variant";
  const SIDEBAR_VARIANT_DATASET_KEY = "ccxpLiteSidebarVariant";
  const LAB_SCROLLBAR_INLINE_COMPENSATION_CSS_VAR = "--ccxp-lite-lab-scrollbar-inline-compensation";
  let attempts = 0;
  trackPageView?.(document, {
    page_surface: isLoginPage(document) ? "login" : "inquire",
    sidebar_variant: isLoginPage(document) ? undefined : readSidebarVariant(),
  });
  const loadingState = initializeLoadingSprite(document);
  sharedLib.addCleanupTask(() => {
    if (loadingState) {
      loadingState.released = true;
      releaseLoadingSprite(document);
    }
    // Clear frame markers so the new version can re-attach.
    const frames = findFrames();
    for (const frame of [frames.nav, frames.main, frames.top]) {
      if (frame) {
        delete frame.dataset.ccxpLiteListenerAttached;
      }
    }
  });
  function attachAndApply() {
    const loginSurface = isLoginPage(document);
    if (loginSurface) {
      loginLib.preloadCaptcha(document);
      simplifyLoginPage(document, {
        retry,
        onReady: markLoginReady,
      });
      return;
    }
    const frames = findFrames();
    if (!frames.nav || !frames.main) {
      if (document.body instanceof HTMLBodyElement) {
        if (!isDocumentComplete(document)) {
          retry();
          return;
        }
        simplifyMainDocument(document);
        markStandaloneMainReady();
        return;
      }
      if (!sidebar) {
        retry();
        return;
      }
      retry();
      return;
    }
    if (!sidebar) {
      retry();
      return;
    }
    const sidebarLib = sidebar;
    const navFrame = frames.nav;
    const mainFrame = frames.main;
    applyFramesetLayout();
    attachFrameListener(navFrame, () => {
      sidebarLib.simplifySidebar(navFrame, retry);
      updateLoadingStateForNav(navFrame);
      markMainReady();
    });
    attachFrameListener(mainFrame, () => {
      simplifyMainFrame(mainFrame);
      sidebarLib.simplifySidebar(navFrame, retry);
    });
    if (frames.top) {
      removeHeader(frames.top);
    }
    sidebarLib.simplifySidebar(navFrame, retry);
    simplifyMainFrame(mainFrame);
    updateLoadingStateForNav(navFrame);
    markMainReady();
  }

  function initializeLoadingSprite(targetDocument: Document) {
    const isFramesetPage = /\/ccxp\/inquire\/select_entry\.php\/?$/i.test(
      targetDocument.location.pathname,
    );
    if (!isSupportedInquirePath(targetDocument) && !isFramesetPage) {
      return undefined;
    }
    ensureLoadingSprite(targetDocument);
    const state: {
      navReady: boolean;
      mainReady: boolean;
      timerId: number | undefined;
      released: boolean;
    } = {
      navReady: false,
      mainReady: false,
      timerId: undefined,
      released: false,
    };
    state.timerId = globalThis.setTimeout(
      () => {
        releaseLoadingSprite(targetDocument);
        state.released = true;
      },
      LOADING_SPRITE_TIMEOUT_MS,
      undefined,
    );
    return state;
  }

  function updateLoadingStateForNav(navFrame: HTMLIFrameElement | undefined) {
    if (!loadingState || loadingState.released) {
      return;
    }
    const navDocument = navFrame && navFrame.contentDocument;
    const navBody = navDocument?.querySelector("body");
    if (navBody?.dataset.ccxpLiteSidebarApplied === "true") {
      loadingState.navReady = true;
    }
    tryReleaseLoadingSprite();
  }

  function markMainReady() {
    if (!loadingState || loadingState.released) {
      return;
    }
    loadingState.mainReady = true;
    tryReleaseLoadingSprite();
  }

  function markLoginReady() {
    if (!loadingState || loadingState.released) {
      return;
    }
    loadingState.navReady = true;
    loadingState.mainReady = true;
    tryReleaseLoadingSprite();
  }

  function markStandaloneMainReady() {
    if (!loadingState || loadingState.released) {
      return;
    }
    loadingState.navReady = true;
    loadingState.mainReady = true;
    tryReleaseLoadingSprite();
  }

  function tryReleaseLoadingSprite() {
    if (!loadingState || loadingState.released) {
      return;
    }
    if (!loadingState.navReady || !loadingState.mainReady) {
      return;
    }
    if (loadingState.timerId !== undefined) {
      globalThis.clearTimeout(loadingState.timerId);
    }
    loadingState.released = true;
    releaseLoadingSprite(document);
  }

  function findFrames() {
    const frameCandidates = [...document.querySelectorAll<HTMLIFrameElement>("frame")];
    const top = frameCandidates.find((frame) => {
      const src = (frame.getAttribute("src") ?? "").toLowerCase();
      const name = (frame.getAttribute("name") ?? "").toLowerCase();
      return src.includes("top.php") || src.includes("top.html") || name === "top";
    });
    const navBySource = frameCandidates.find((frame) => {
      const src = (frame.getAttribute("src") ?? "").toLowerCase();
      return src.includes("in_inq_stu.php") || src.includes("in_inq_stu.html");
    });
    const main = frameCandidates.find((frame) => {
      const name = (frame.getAttribute("name") ?? "").toLowerCase();
      return name === "main";
    });
    const navByName = frameCandidates.find((frame) => {
      const name = (frame.getAttribute("name") ?? "").toLowerCase();
      return name === "nav" || name === "menu" || name === "left" || name === "list";
    });
    const navFallback = frameCandidates.find((frame) => frame !== top && frame !== main);
    const nav = navBySource ?? navByName ?? navFallback;
    return { top, nav, main };
  }

  function attachFrameListener(frame: HTMLIFrameElement, callback: () => void) {
    if (frame.dataset.ccxpLiteListenerAttached === "true") {
      return;
    }
    frame.addEventListener("load", callback);
    const targetFrame = frame;
    targetFrame.dataset.ccxpLiteListenerAttached = "true";
    const poll = () => {
      if (!sharedLib.ensureContextValid()) {
        return;
      }
      try {
        const doc = frame.contentDocument;
        if (doc && doc.readyState !== "loading") {
          const isMain = (frame.getAttribute("name") ?? "").toLowerCase() === "main";
          const expectedScope = isMain ? "main" : "nav";
          if (doc.documentElement.dataset.ccxpLiteScope !== expectedScope) {
            callback();
          }
        }
      } catch {
        // Ignore cross-origin frame access errors.
      }
      globalThis.requestAnimationFrame(poll);
    };
    globalThis.requestAnimationFrame(poll);
  }

  function retry() {
    if (attempts >= RETRY_LIMIT || !sharedLib.ensureContextValid()) {
      return;
    }
    attempts++;
    globalThis.setTimeout(attachAndApply, RETRY_DELAY_MS, undefined);
  }

  function applyFramesetLayout() {
    const topFrameset = document.querySelector("frameset[rows]");
    const innerFrameset = document.querySelector("frameset[cols]");
    if (topFrameset) {
      topFrameset.setAttribute("rows", FRAMESET_ROWS);
    }
    if (innerFrameset) {
      innerFrameset.setAttribute("cols", getFramesetColumnsForVariant(readSidebarVariant()));
    }
  }

  function readSidebarVariant() {
    try {
      const storedValue = globalThis.localStorage.getItem(SIDEBAR_VARIANT_STORAGE_KEY);
      return storedValue === "layered" ? "layered" : "classic";
    } catch {
      return "classic";
    }
  }

  function getFramesetColumnsForVariant(variant: string) {
    return variant === "classic" ? CLASSIC_FRAMESET_COLUMNS : LAYERED_FRAMESET_COLUMNS;
  }

  function removeHeader(topFrame: HTMLIFrameElement) {
    const topDocument = topFrame.contentDocument;
    if (!topDocument) {
      retry();
      return;
    }
    const topBody = ensureDocumentBody(topDocument);
    if (!topBody) {
      retry();
      return;
    }
    if (topBody.dataset.ccxpLiteHeaderRemoved === "true") {
      return;
    }
    topDocument.documentElement.style.display = "none";
    topBody.textContent = "";
    topBody.dataset.ccxpLiteHeaderRemoved = "true";
    topFrame.setAttribute("scrolling", "no");
  }

  function simplifyMainFrame(mainFrame: HTMLIFrameElement | undefined) {
    const mainDocument = mainFrame && mainFrame.contentDocument;
    if (!mainDocument) {
      return;
    }
    simplifyMainDocument(mainDocument);
  }

  function simplifyMainDocument(mainDocument: Document) {
    prepareLegacySurface(mainDocument, "main");
    const mainBody = mainDocument.body;
    const mainDocumentElement = mainDocument.documentElement;
    mainBody.classList.add(TOKENS.mainClass);
    mainBody.style.setProperty("background-image", "none", "important");
    mainBody.style.setProperty("background-color", "var(--ccxp-lite-bg)", "important");
    const { sidebarState } = globalThis.CCXP_LITE ?? {};
    if (sidebarState) {
      const state = sidebarState.getSidebarUiState(mainDocument);
      mainDocumentElement.dataset[SIDEBAR_VARIANT_DATASET_KEY] = state.sidebarVariant;
      mainBody.dataset[SIDEBAR_VARIANT_DATASET_KEY] = state.sidebarVariant;
      syncMainFrameLabScrollbarCompensation(mainDocument, state.sidebarVariant);
    }
  }

  function syncMainFrameLabScrollbarCompensation(mainDocument: Document, sidebarVariant: string) {
    if (sidebarVariant !== "classic") {
      mainDocument.body.style.setProperty(LAB_SCROLLBAR_INLINE_COMPENSATION_CSS_VAR, "0px");
      return;
    }
    const view = mainDocument.defaultView;
    if (!view) {
      mainDocument.body.style.setProperty(LAB_SCROLLBAR_INLINE_COMPENSATION_CSS_VAR, "0px");
      return;
    }
    const scrollbarWidth = Math.max(0, view.innerWidth - mainDocument.documentElement.clientWidth);
    mainDocument.body.style.setProperty(
      LAB_SCROLLBAR_INLINE_COMPENSATION_CSS_VAR,
      `${-scrollbarWidth}px`,
    );
  }
  attachAndApply();
})();
