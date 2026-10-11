(function registerSidebarDialogController(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (
    !namespace?.shared ||
    !namespace.sidebarRuntime ||
    !namespace.sidebarDialogView ||
    !namespace.uiController
  ) {
    return;
  }
  const { ensureThemeDocument } = namespace.shared;
  const { getLegacyMainFrame } = namespace.sidebarRuntime;
  const { createRemovePinnedDialog } = namespace.sidebarDialogView;
  const { createController } = namespace.uiController;

  async function showRestoreOrderDialog(
    targetDocument: Document,
    strings: Readonly<Record<string, string>>,
    signal?: AbortSignal,
  ): Promise<boolean> {
    return await showConfirmationDialog(
      targetDocument,
      "",
      {
        sidebarRemovePinnedDialogTitlePrefix: strings.sidebarRestoreOrderDialogTitle,
        sidebarRemovePinnedDialogTitleSuffix: "",
        sidebarRemovePinnedDialogDescription: strings.sidebarRestoreOrderDialogDescription,
        sidebarRemovePinnedDialogCancel: strings.sidebarRestoreOrderDialogCancel,
        sidebarRemovePinnedDialogConfirm: strings.sidebarRestoreOrder,
      },
      "primary",
      signal,
    );
  }

  async function showConfirmationDialog(
    targetDocument: Document,
    itemName: string,
    strings: Readonly<Record<string, string>>,
    variant: "danger" | "primary" = "danger",
    signal?: AbortSignal,
  ): Promise<boolean> {
    return await new Promise((resolve) => {
      const overlayDocument = resolveOverlayDocument(targetDocument);
      ensureThemeDocument(
        overlayDocument,
        overlayDocument.documentElement.dataset.ccxpLiteScope ?? "nav",
      );
      if (
        signal?.aborted === true ||
        overlayDocument.querySelector("[data-ccxp-lite-remove-pinned-dialog]")
      ) {
        resolve(false);
        return;
      }
      const controller = createController(overlayDocument);
      const view = createRemovePinnedDialog(overlayDocument, itemName, strings, variant);
      view.dialog.style.whiteSpace = "normal";
      if (view.confirmButton.parentElement) {
        view.confirmButton.parentElement.style.flexWrap = "wrap";
      }
      view.keepButton.style.flexShrink = "0";
      view.confirmButton.style.flexShrink = "0";
      const previousActiveElement = targetDocument.activeElement as HTMLElement | null;
      let settled = false;
      const finish = (confirmed: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        controller.destroy();
        view.overlay.remove();
        if (
          previousActiveElement &&
          typeof previousActiveElement.focus === "function" &&
          targetDocument.contains(previousActiveElement)
        ) {
          previousActiveElement.focus();
        }
        resolve(confirmed);
      };
      if (signal) {
        controller.listen(signal, "abort", () => {
          finish(false);
        });
      }
      controller.listen(view.keepButton, "click", () => {
        finish(false);
      });
      controller.listen(view.confirmButton, "click", () => {
        finish(true);
      });
      controller.listen(view.overlay, "click", (event) => {
        if (event.target === view.overlay) {
          finish(false);
        }
      });
      controller.listen(view.dialog, "click", (event) => {
        event.stopPropagation();
      });
      const handleKeydown = (event: Event) => {
        const keyEvent = event as KeyboardEvent;
        if (keyEvent.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          finish(false);
        } else if (keyEvent.key === "Tab") {
          event.preventDefault();
          event.stopPropagation();
          const next =
            overlayDocument.activeElement === view.keepButton
              ? view.confirmButton
              : view.keepButton;
          next.focus();
        }
      };
      for (const document of new Set([overlayDocument, targetDocument])) {
        controller.listen(document, "keydown", handleKeydown, true);
        controller.listen(document, "focusin", (event) => {
          if (!view.dialog.contains(event.target as Node)) {
            view.keepButton.focus();
          }
        });
      }
      getOverlayMountNode(overlayDocument).append(view.overlay);
      view.keepButton.focus();
    });
  }

  function resolveOverlayDocument(targetDocument: Document) {
    try {
      const mainDocument = getLegacyMainFrame()?.contentDocument;
      if (mainDocument?.body && mainDocument.body.clientWidth > 100) {
        return mainDocument;
      }
    } catch {
      // The navigation document remains the safe fallback across frame origins.
    }
    return targetDocument;
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
      anchor = targetDocument.createElement("div");
      anchor.dataset.ccxpLiteFloatingAnchor = "true";
      anchorHost.append(anchor);
    }
    return anchor;
  }

  namespace.sidebarDialogController = {
    showRemovePinnedDialog: showConfirmationDialog,
    showRestoreOrderDialog,
  };
})(globalThis);
