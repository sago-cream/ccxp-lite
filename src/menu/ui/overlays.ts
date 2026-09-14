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

  const app = namespace;
  const { setPersistedSidebarVariant, persistSidebarScroll } = namespace.sidebarState;
  const { createRenderer } = namespace.uiRenderer;
  const { showRemovePinnedDialog } = namespace.sidebarDialogController;

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

  const profileRequests = new WeakMap<
    Document,
    Promise<{ name: string; account: string; initials: string } | undefined>
  >();
  const profileCleanups = new WeakMap<Document, () => void>();
  const registeredDocuments = new WeakSet<Document>();

  async function loadProfile(targetDocument: Document) {
    const cached = profileRequests.get(targetDocument);
    if (cached) {
      return await cached;
    }
    const request = (async () => {
      try {
        const topDocument = targetDocument.defaultView?.top?.document;
        const topUrl = new URL(topDocument?.URL ?? targetDocument.URL);
        const session = topUrl.searchParams.get("ACIXSTORE");
        if (session === null || session === "") {
          return undefined;
        }
        const url = new URL("/ccxp/INQUIRE/JH/4/4.19/JH4j002.php", targetDocument.URL);
        url.searchParams.set("ACIXSTORE", session);
        const response = await fetch(url, {
          credentials: "same-origin",
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) {
          return undefined;
        }
        const bytes = await response.arrayBuffer();
        const preview = new TextDecoder().decode(bytes);
        const charset =
          response.headers.get("content-type")?.match(/charset\s*=\s*["']?([\w-]+)/iu)?.[1] ??
          preview.match(/<meta[^>]+charset\s*=\s*["']?([\w-]+)/iu)?.[1] ??
          "utf8";
        const page = new DOMParser().parseFromString(
          new TextDecoder(charset).decode(bytes),
          "text/html",
        );
        const read = (label: string) => {
          const cell = [...page.querySelectorAll("td")].find(
            (item) => item.textContent.trim() === label,
          );
          return cell?.nextElementSibling?.textContent.trim() ?? "";
        };
        const account = read("\u5B78\u865F\uFF1A");
        const name = read("\u59D3\u540D\uFF1A");
        const englishName = read("\u8B77\u7167\u82F1\u6587\u59D3\u540D\uFF1A");
        const parts = englishName.split(/[\s,-]+/u).filter(Boolean);
        const initials =
          parts.length > 1
            ? `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
            : name.charAt(0);
        const expected = topUrl.searchParams.get("hint");
        if (name === "" || account === "" || (expected !== null && account !== expected)) {
          return undefined;
        }
        return { name, account, initials };
      } catch {
        return undefined;
      }
    })();
    profileRequests.set(targetDocument, request);
    return await request;
  }

  function mountSidebarVariantSwitch(
    targetDocument: Document,
    state: CcxpLiteSidebarState,
    _strings: Readonly<Record<string, string>>,
    rerender: () => void,
    _footer?: HTMLElement,
  ) {
    profileCleanups.get(targetDocument)?.();
    targetDocument.querySelector(".ccxp-lite-sidebar-profile")?.remove();
    const topDocument = targetDocument.defaultView?.top?.document;
    removeExistingSidebarVariantSwitches([targetDocument, topDocument]);
    const dom = createRenderer(targetDocument);
    const english = app.shared?.resolveLocaleFromDocument(targetDocument) === "en";
    const name = dom.element("strong", {
      text: english ? "University account" : "\u6821\u52D9\u7CFB\u7D71\u5E33\u865F",
    });
    const avatar = dom.element("span", {
      className: "ccxp-lite-profile-avatar",
      text: "?",
      attributes: { "aria-hidden": "true" },
    });
    const settings = dom.element(
      "button",
      {
        className: "ccxp-lite-profile-trigger",
        attributes: {
          type: "button",
          "aria-label": english ? "Settings" : "\u8A2D\u5B9A",
          "aria-expanded": "false",
          "aria-controls": "ccxp-lite-profile-popover",
        },
      },
      [avatar, name],
    );
    const popup = dom.element("div", {
      className: "ccxp-lite-profile-popover",
      attributes: { id: "ccxp-lite-profile-popover", hidden: "" },
    });
    const mode = targetDocument.createElement("select");
    mode.id = "ccxp-lite-profile-mode";
    for (const [value, label] of [
      ["classic", english ? "Sidebar" : "\u5074\u908A\u6B04\u6A21\u5F0F"],
      ["layered", english ? "Full-screen menu" : "\u5168\u87A2\u5E55\u9078\u55AE"],
    ]) {
      const option = targetDocument.createElement("option");
      option.value = value;
      option.textContent = label;
      mode.append(option);
    }
    mode.value = state.sidebarVariant;
    mode.addEventListener("change", () => {
      const nextState = state;
      nextState.sidebarVariant = setPersistedSidebarVariant(
        mode.value === "layered" ? "layered" : "classic",
      );
      syncTopLevelFramesetLayout(state.sidebarVariant);
      nextState.activeLeaf = undefined;
      nextState.currentCategoryId = "";
      persistSidebarScroll(targetDocument, "root");
      rerender();
      targetDocument.querySelector<HTMLButtonElement>(".ccxp-lite-profile-trigger")?.focus();
    });
    popup.append(
      dom.element(
        "label",
        {
          className: "ccxp-lite-profile-mode",
          text: english ? "Menu mode" : "\u9078\u55AE\u6A21\u5F0F",
          attributes: { for: mode.id },
        },
        [mode],
      ),
    );
    const shell = targetDocument.querySelector<HTMLElement>(".ccxp-lite-sidebar-shell");
    const logoutUrl = shell?.dataset.ccxpLiteLogoutUrl;
    if (logoutUrl !== undefined && logoutUrl !== "") {
      popup.append(
        dom.element(
          "a",
          {
            className: "ccxp-lite-profile-logout",
            attributes: { href: logoutUrl, target: "_top" },
          },
          [
            app.uiIcons?.createCategoryIcon(targetDocument, "log-out"),
            dom.element("span", { text: english ? "Log out" : "\u767B\u51FA" }),
          ],
        ),
      );
    }
    const card = dom.element(
      "section",
      {
        className: "ccxp-lite-sidebar-profile",
        attributes: { "aria-label": english ? "Profile" : "\u500B\u4EBA\u8CC7\u6599" },
      },
      [settings, popup],
    );
    const controller = app.uiController?.createController(targetDocument);
    const setOpen = (open: boolean) => {
      popup.hidden = !open;
      settings.setAttribute("aria-expanded", String(open));
    };
    controller?.listen(settings, "click", () => {
      setOpen(popup.hidden);
    });
    controller?.listen(card, "keydown", (event) => {
      if ((event as KeyboardEvent).key === "Escape") {
        setOpen(false);
        settings.focus();
      }
    });
    controller?.listen(targetDocument, "click", (event) => {
      if (!card.contains(event.target as Node | null)) {
        setOpen(false);
      }
    });
    controller?.listen(targetDocument, "focusin", (event) => {
      if (!card.contains(event.target as Node | null)) {
        setOpen(false);
      }
    });
    const mainFrame = topDocument?.querySelector<HTMLIFrameElement>('frame[name="main"]');
    let contentController:
      | ReturnType<NonNullable<typeof app.uiController>["createController"]>
      | undefined;
    const bindContentDismissal = () => {
      contentController?.destroy();
      contentController = undefined;
      try {
        const contentDocument = mainFrame?.contentDocument;
        if (contentDocument && contentDocument !== targetDocument) {
          contentController = app.uiController?.createController(contentDocument);
          contentController?.listen(
            contentDocument,
            "pointerdown",
            () => {
              setOpen(false);
            },
            true,
          );
          contentController?.listen(
            contentDocument,
            "focusin",
            () => {
              setOpen(false);
            },
            true,
          );
        }
      } catch {
        // The content frame may navigate to another origin.
      }
    };
    if (mainFrame) {
      controller?.listen(mainFrame, "load", () => {
        setOpen(false);
        bindContentDismissal();
      });
      bindContentDismissal();
    }
    const cleanup = () => {
      controller?.destroy();
      contentController?.destroy();
    };
    profileCleanups.set(targetDocument, cleanup);
    if (!registeredDocuments.has(targetDocument)) {
      registeredDocuments.add(targetDocument);
      app.shared?.addCleanupTask(() => {
        profileCleanups.get(targetDocument)?.();
        profileCleanups.delete(targetDocument);
        registeredDocuments.delete(targetDocument);
      });
    }
    const mount =
      state.sidebarVariant === "layered"
        ? shell?.querySelector(".ccxp-lite-sidebar-header")
        : shell;
    mount?.append(card);
    loadProfile(targetDocument)
      .then((profile) => {
        if (!profile || !card.isConnected) {
          return;
        }
        name.textContent = profile.name;
        avatar.textContent = profile.initials;
      })
      .catch(() => undefined);
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

  namespace.sidebarOverlays = {
    showRemovePinnedDialog,
    syncTopLevelFramesetLayout,
    mountSidebarVariantSwitch,
  };
})(globalThis);
