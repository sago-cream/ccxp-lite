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
    simplifyServiceNotices(mainDocument);
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

  function simplifyServiceNotices(targetDocument: Document) {
    if (
      !/\/ccxp\/inquire\/xp03_m\.htm$/i.test(targetDocument.location.pathname) ||
      targetDocument.querySelector(".ccxp-home-header") ||
      !namespace.uiPopover ||
      !namespace.uiDisplay
    ) {
      return;
    }
    const english = sharedLib.resolveLocaleFromDocument(targetDocument) === "en";
    const header = namespace.uiDisplay.createPageHeader(targetDocument);
    header.classList.add("ccxp-home-header");
    const points = english
      ? [
          "Use your university email address when sending mail through this system to ensure delivery.",
          "Do not perform the same operation in multiple windows, to avoid data problems.",
          "If attendance or Computer and Communication Center systems log you out automatically, right-click the link and open it in a new window.",
          "If security warnings persist, turn off your Proxy setting.",
        ]
      : [
          "\u900F\u904E\u6B64\u7CFB\u7D71\u5BC4\u4FE1\u6642\u8ACB\u4F7F\u7528\u672C\u6821\u4FE1\u7BB1\uFF0C\u4EE5\u78BA\u4FDD\u6B63\u5E38\u5BC4\u9001\u3002",
          "\u8ACB\u52FF\u540C\u6642\u958B\u555F\u591A\u500B\u8996\u7A97\u57F7\u884C\u76F8\u540C\u4F5C\u696D\uFF0C\u4EE5\u514D\u8CC7\u6599\u767C\u751F\u554F\u984C\u3002",
          "\u5982\u9047\u5DEE\u52E4\u7CFB\u7D71\u53CA\u8A08\u901A\u4E2D\u5FC3\u76F8\u95DC\u7CFB\u7D71\u81EA\u52D5\u767B\u51FA\u6642\uFF0C\u8ACB\u6539\u4EE5\u53F3\u9375->\u4EE5\u65B0\u8996\u7A97\u958B\u555F\u9023\u7D50\u958B\u555F\u7CFB\u7D71\u3002",
          "\u82E5\u6301\u7E8C\u51FA\u73FE\u5B89\u5168\u6027\u8B66\u8A0A\uFF0C\u8ACB\u95DC\u9589 Proxy \u8A2D\u5B9A\u3002",
        ];
    const list = targetDocument.createElement("ul");
    for (const point of points) {
      const item = targetDocument.createElement("li");
      item.textContent = point;
      list.append(item);
    }
    const label = english ? "System usage guide" : "\u7CFB\u7D71\u4F7F\u7528\u8AAA\u660E";
    const info = namespace.uiPopover.mountInfoPopoverContent(targetDocument, list, label);
    info.element.classList.add("ccxp-home-info");
    info.element.querySelector("button")?.append(label);
    sharedLib.addCleanupTask(info.destroy);
    header.append(info.element);
    const contact = targetDocument.querySelector('a[href="/ccxp/INQUIRE/inquire_cpr.html"]');
    const content = targetDocument.createElement("main");
    content.className = "ccxp-home-content";
    mountHomeSearch(targetDocument, content, english);
    if (contact) {
      contact.textContent = english
        ? "Contact campus offices"
        : "\u806F\u7D61\u6821\u5712\u55AE\u4F4D";
      contact.classList.remove("td15");
      contact.classList.add("ccxp-home-contact");
      header.insertBefore(contact, info.element);
    }
    // Remove only recognized legacy notices; keep future announcements visible.
    const prefixes = [
      "\u4F7F\u7528\u6821\u52D9\u7CFB\u7D71\u5BC4\u767C\u9001\u4FE1\u4EF6\u6642",
      "\u70BA\u907F\u514D\u8CC7\u6599\u767C\u751F\u554F\u984C",
      "\u5DEE\u52E4\u7CFB\u7D71\u3001\u63A1\u8CFC\u7CFB\u7D71\u3001\u8A08\u901A\u4E2D\u5FC3\u76F8\u95DC\u670D\u52D9",
      "\u82E5\u6301\u7E8C\u51FA\u73FE\u5B89\u5168\u6027\u8B66\u8A0A\u8996\u7A97",
      "\u82E5\u60A8\u5728\u64CD\u4F5C\u4E0A\u7CFB\u7D71\u6642\u767C\u751F\u4EFB\u4F55\u554F\u984C\u6642",
      "\u56E0Google\u4FEE\u6539\u7528\u6236\u4FE1\u4EF6\u898F\u7BC4",
      "\u82E5\u60A8\u5728\u4F7F\u7528\u6821\u52D9\u8CC7\u8A0A\u7CFB\u7D71\u6642\uFF0C\u4F7F\u7528\u4E0B\u5217\u4E4B\u5B50\u9805\u76EE\u7CFB\u7D71\u6642",
      "\u3010\u6821\u52D9\u8CC7\u8A0A\u7CFB\u7D71\u670D\u52D9\u516C\u544A\u3011",
    ];
    const table = targetDocument.querySelector("body > table");
    for (const row of table?.querySelectorAll("tr") ?? []) {
      const text = row.textContent.trim();
      if (text === "" || prefixes.some((prefix) => text.startsWith(prefix))) {
        row.remove();
      }
    }
    if (table?.textContent.trim() === "") {
      table.remove();
    }
    targetDocument.body.prepend(header, content);
  }

  function flattenHomeCategory(
    category: Readonly<CcxpLiteSidebarCategoryNode>,
  ): readonly CcxpLiteSidebarLinkItem[] {
    return [...(category.links ?? []), ...category.blocks.flatMap((block) => block.links)];
  }

  function mountHomeSearch(targetDocument: Document, content: HTMLElement, english: boolean) {
    const { uiIcons, uiButtons, sidebarData, sidebarFavorites, sidebarRuntime } = namespace;
    if (!uiIcons || !uiButtons || !sidebarData || !sidebarFavorites || !sidebarRuntime) {
      return;
    }
    const wordmark = targetDocument.createElement("div");
    wordmark.className = "ccxp-home-wordmark";
    const logo = sharedLib.createBrandImage(
      targetDocument,
      "ccxp-home-brand-logo",
      sharedLib.ASSETS.sidebarBrandLogoPath,
    );
    logo.alt = "";
    wordmark.append(logo, "NTHU");
    const search = targetDocument.createElement("form");
    search.className = "ccxp-home-search";
    search.setAttribute("role", "search");
    const input = targetDocument.createElement("input");
    input.type = "search";
    input.placeholder = english
      ? "Search system functions"
      : "\u641C\u5C0B\u7CFB\u7D71\u529F\u80FD";
    input.setAttribute("aria-label", input.placeholder);
    input.setAttribute("aria-controls", "ccxp-home-search-results");
    const clear = uiButtons.createButton(targetDocument, {
      className: "ccxp-home-search-clear",
      ariaLabel: english ? "Clear search" : "\u6E05\u9664\u641C\u5C0B",
      icon: uiIcons.createCategoryIcon(targetDocument, "x"),
      onClick: () => {
        input.value = "";
        renderSearch();
        input.focus();
      },
    });
    clear.hidden = true;
    search.append(uiIcons.createSearchIcon(targetDocument), input, clear);
    const results = targetDocument.createElement("div");
    results.id = "ccxp-home-search-results";
    results.className = "ccxp-home-search-results";
    results.setAttribute("aria-label", english ? "Search results" : "\u641C\u5C0B\u7D50\u679C");
    results.hidden = true;
    search.append(results);
    const closeResults = () => {
      results.hidden = true;
    };
    const renderSearch = () => {
      const navDocument = findFrames().nav?.contentDocument;
      const model = navDocument ? sidebarData.buildSidebarModel(navDocument, strings) : undefined;
      const query = input.value.trim();
      clear.hidden = input.value === "";
      results.textContent = "";
      results.hidden = query === "" || !model;
      if (query === "" || !model || !navDocument) {
        return;
      }
      const seen = new Set<string>();
      for (const category of sidebarData.filterCategories(model.categories, query)) {
        for (const link of flattenHomeCategory(category)) {
          const id = sidebarFavorites.createLinkId(link);
          if (seen.has(id)) {
            continue;
          }
          seen.add(id);
          const row = uiButtons.createButton(targetDocument, {
            className: "ccxp-home-search-result",
            label: link.label,
            title: `${link.label} \u00B7 ${category.label}`,
            onClick: () => {
              closeResults();
              sidebarRuntime.activateLegacyLink(link, navDocument);
            },
          });
          results.append(row);
        }
      }
      if (seen.size === 0) {
        const empty = targetDocument.createElement("p");
        empty.setAttribute("role", "status");
        empty.textContent = english
          ? "No matching functions."
          : "\u627E\u4E0D\u5230\u7B26\u5408\u7684\u529F\u80FD\u3002";
        results.append(empty);
      }
    };

    const section = targetDocument.createElement("section");
    section.className = "ccxp-home-shortcuts";
    const caption = targetDocument.createElement("h2");
    caption.id = "ccxp-home-shortcuts-title";
    section.setAttribute("aria-labelledby", caption.id);
    const cards = targetDocument.createElement("div");
    cards.className = "ccxp-home-cards";
    cards.id = "ccxp-home-cards";
    const status = targetDocument.createElement("p");
    status.className = "ccxp-home-status";
    status.setAttribute("role", "status");
    let expanded = false;
    const showAll = uiButtons.createButton(targetDocument, {
      className: "ccxp-home-show-all",
      label: english ? "Show all" : "\u986F\u793A\u5168\u90E8",
    });
    showAll.append(" \u2192");
    showAll.hidden = true;
    showAll.setAttribute("aria-controls", cards.id);
    showAll.setAttribute("aria-expanded", "false");
    section.append(caption, cards, status, showAll);
    const recentSection = targetDocument.createElement("section");
    recentSection.className = "ccxp-home-shortcuts ccxp-home-recents";
    recentSection.hidden = true;
    const recentHeading = targetDocument.createElement("h2");
    recentHeading.id = "ccxp-home-recents-title";
    recentHeading.textContent = english ? "Recently used" : "\u6700\u8FD1\u4F7F\u7528";
    recentSection.setAttribute("aria-labelledby", recentHeading.id);
    const recentCards = targetDocument.createElement("div");
    recentCards.className = "ccxp-home-cards";
    recentSection.append(recentHeading, recentCards);
    const searchSlot = targetDocument.createElement("div");
    searchSlot.className = "ccxp-home-search-slot";
    searchSlot.append(search);
    content.append(wordmark, searchSlot, section, recentSection);
    const strings = sharedLib.getLocalizedStrings(english ? "en" : "zh");
    const render = () => {
      const navDocument = findFrames().nav?.contentDocument;
      const model = navDocument ? sidebarData.buildSidebarModel(navDocument, strings) : undefined;
      const favoriteTitle = english ? "Favorites" : "\u5E38\u7528\u529F\u80FD";
      caption.textContent = favoriteTitle;
      cards.textContent = "";
      showAll.hidden = true;
      recentSection.hidden = true;
      recentCards.textContent = "";
      if (!model || !navDocument) {
        input.disabled = true;
        status.textContent = english
          ? "Open the homepage from the signed-in system to search your functions."
          : "\u8ACB\u5F9E\u767B\u5165\u5F8C\u7684\u6821\u52D9\u7CFB\u7D71\u958B\u555F\u9996\u9801\uFF0C\u4EE5\u641C\u5C0B\u529F\u80FD\u53CA\u67E5\u770B\u5E38\u7528\u529F\u80FD\u3002";
        return;
      }
      input.disabled = false;
      const favorites = new Set(
        flattenHomeCategory(model.favorites).map((link) => sidebarFavorites.createLinkId(link)),
      );
      const { categories } = model;
      const seen = new Set<string>();
      const matches = categories
        .flatMap((category) => flattenHomeCategory(category).map((link) => ({ category, link })))
        .filter(({ link }) => {
          const id = sidebarFavorites.createLinkId(link);
          if (seen.has(id) || !favorites.has(id)) {
            return false;
          }
          seen.add(id);
          return true;
        });
      const visible = expanded ? matches : matches.slice(0, 8);
      showAll.hidden = expanded || matches.length <= 8;
      showAll.setAttribute("aria-expanded", String(expanded));
      const allLinks = categories.flatMap((category) =>
        flattenHomeCategory(category).map((link) => ({ category, link })),
      );
      const recent = sidebarRuntime
        .getRecentFunctionIds()
        .flatMap((id) => {
          const entry = allLinks.find(({ link }) => sidebarFavorites.createLinkId(link) === id);
          return entry ? [entry] : [];
        })
        .slice(0, 8);
      recentSection.hidden = recent.every(({ link }) =>
        favorites.has(sidebarFavorites.createLinkId(link)),
      );
      const entries = [
        ...visible.map((entry) => ({ ...entry, container: cards })),
        ...recent.map((entry) => ({ ...entry, container: recentCards })),
      ];
      for (const { category, link, container } of entries) {
        const wrapper = targetDocument.createElement("div");
        wrapper.className = "ccxp-home-card-wrap";
        const card = uiButtons.createButton(targetDocument, {
          className: "ccxp-home-card",
          ariaLabel: `${link.label} (${category.label})`,
          title: `${link.label} \u00B7 ${category.label}`,
          onClick: () => {
            sidebarRuntime.activateLegacyLink(link, navDocument);
          },
        });
        const icon = targetDocument.createElement("span");
        icon.className = "ccxp-home-card-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.append(uiIcons.createCategoryIcon(targetDocument, category.icon ?? "folder"));
        const name = targetDocument.createElement("span");
        name.className = "ccxp-home-card-name";
        name.textContent = link.label;
        card.append(icon, name);
        wrapper.append(card);
        const controls = namespace.sidebarFavoriteControls;
        if (controls) {
          const pinnedBlock = category.blocks.find(
            (block) =>
              sidebarFavorites.isFavoriteBlock(block) &&
              block.links.some(
                (item) =>
                  sidebarFavorites.createLinkId(item) === sidebarFavorites.createLinkId(link),
              ),
          );
          const star =
            pinnedBlock && !sidebarFavorites.isFavoriteLink(link)
              ? controls.createBlockFavoriteToggle(targetDocument, pinnedBlock, strings, render)
              : controls.createFavoriteToggle(targetDocument, link, strings, render);
          wrapper.append(star);
        }
        container.append(wrapper);
      }
      const emptyFavorites = english
        ? "Star a function in the menu to keep it here."
        : "\u5728\u9078\u55AE\u4E2D\u9EDE\u9078\u661F\u865F\uFF0C\u5373\u53EF\u5C07\u529F\u80FD\u52A0\u5165\u9019\u88E1\u3002";
      status.textContent = visible.length === 0 ? emptyFavorites : "";
      status.hidden = status.textContent === "";
    };
    showAll.addEventListener("click", () => {
      expanded = true;
      render();
      cards
        .querySelector<HTMLButtonElement>(".ccxp-home-card-wrap:nth-child(9) > .ccxp-home-card")
        ?.focus();
    });
    input.addEventListener("input", renderSearch);
    input.addEventListener("focus", renderSearch);
    search.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeResults();
        input.focus();
        closeResults();
        event.preventDefault();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const buttons = [...results.querySelectorAll<HTMLButtonElement>("button")];
        if (buttons.length === 0 || results.hidden) {
          return;
        }
        const current = buttons.findIndex((button) => button.matches(":focus"));
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const next = (current + direction + buttons.length) % buttons.length;
        buttons[next].focus();
        event.preventDefault();
      }
    });
    search.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!results.hidden) {
        results.querySelector<HTMLButtonElement>("button")?.click();
      }
    });
    const outsideClick = (event: MouseEvent) => {
      if (!search.contains(event.target as Node | null)) {
        closeResults();
      }
    };
    targetDocument.addEventListener("click", outsideClick);
    search.addEventListener("focusout", (event) => {
      if (!search.contains(event.relatedTarget as Node | null)) {
        closeResults();
      }
    });
    const unsubscribe = sidebarFavorites.initializeFavorites(render);
    const unsubscribeRecent = sidebarRuntime.subscribeRecentFunctions(render);
    const navFrame = findFrames().nav;
    navFrame?.addEventListener("load", render);
    const cleanup = () => {
      unsubscribe();
      unsubscribeRecent();
      targetDocument.removeEventListener("click", outsideClick);
      navFrame?.removeEventListener("load", render);
    };
    targetDocument.defaultView?.addEventListener("pagehide", cleanup, { once: true });
    sharedLib.addCleanupTask(cleanup);
    render();
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
