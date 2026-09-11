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

  async function showRemovePinnedDialog(
    targetDocument: Document,
    itemName: string,
    strings: Readonly<Record<string, string>>,
  ): Promise<boolean> {
    return await new Promise((resolve) => {
      const overlayDocument = resolveOverlayDocument(targetDocument);
      ensureThemeDocument(overlayDocument, "nav");
      if (overlayDocument.querySelector("[data-ccxp-lite-remove-pinned-dialog]")) {
        resolve(false);
        return;
      }
      const controller = createController(overlayDocument);
      const view = createRemovePinnedDialog(overlayDocument, itemName, strings);
      const previousActiveElement = targetDocument.activeElement;
      let settled = false;
      const finish = (confirmed: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        controller.destroy();
        view.overlay.remove();
        if (
          previousActiveElement instanceof HTMLElement &&
          targetDocument.contains(previousActiveElement)
        ) {
          previousActiveElement.focus();
        }
        resolve(confirmed);
      };
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
      controller.listen(view.overlay, "keydown", (event) => {
        if ((event as KeyboardEvent).key === "Escape") {
          event.preventDefault();
          finish(false);
        }
      });
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

  namespace.sidebarDialogController = { showRemovePinnedDialog };
})(globalThis);
