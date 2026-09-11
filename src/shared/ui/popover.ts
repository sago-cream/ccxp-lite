(function registerUiPopover(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiIcons || !namespace.uiRenderer || !namespace.uiController) {
    return;
  }
  const app = namespace;
  const { createInfoMarker } = namespace.uiIcons;
  const { createRenderer } = namespace.uiRenderer;
  const { createController } = namespace.uiController;

  function mountInfoPopover(
    targetDocument: Document,
    popupText: string,
    labelText: string,
  ): CcxpLiteMounted<HTMLSpanElement> {
    const popupContent = createRenderer(targetDocument).element("span", { text: popupText });
    return mountInfoPopoverContent(targetDocument, popupContent, labelText);
  }

  function mountInfoPopoverContent(
    targetDocument: Document,
    popupContent: Node,
    labelText: string,
    popupClassName?: string,
  ): CcxpLiteMounted<HTMLSpanElement> {
    const dom = createRenderer(targetDocument);
    const controller = createController(targetDocument);
    const popupId = `ccxp-lite-info-popup-${Math.random().toString(36).slice(2, 10)}`;
    const button = dom.element(
      "button",
      {
        className: "ccxp-lite-account-guide-info-button",
        attributes: {
          type: "button",
          "aria-label": labelText,
          "aria-expanded": "false",
          "aria-controls": popupId,
        },
      },
      [createInfoMarker(targetDocument)],
    );
    const popup = dom.element(
      "span",
      {
        className: ["ccxp-lite-account-guide-info-popup", popupClassName]
          .filter((className) => className !== undefined && className !== "")
          .join(" "),
        attributes: { id: popupId, hidden: "" },
      },
      [popupContent],
    );
    const wrap = dom.element("span", { className: "ccxp-lite-account-guide-info" }, [
      button,
      popup,
    ]);

    let isPinnedOpen = false;
    let isPointerInside = false;
    let suppressHoverOpen = false;

    const syncPopupVisibility = () => {
      const isVisible = isPinnedOpen || (isPointerInside && !suppressHoverOpen);
      if (isVisible) {
        wrap.dataset.ccxpLitePopupOpen = "true";
      } else {
        delete wrap.dataset.ccxpLitePopupOpen;
      }
      popup.hidden = !isVisible;
      button.setAttribute("aria-expanded", isVisible ? "true" : "false");
    };
    const closePopup = (options?: { suppressHoverOpen?: boolean }) => {
      isPinnedOpen = false;
      suppressHoverOpen = options?.suppressHoverOpen === true;
      syncPopupVisibility();
    };

    controller.listen(wrap, "mouseenter", () => {
      isPointerInside = true;
      suppressHoverOpen = false;
      syncPopupVisibility();
    });
    controller.listen(wrap, "mouseleave", () => {
      isPointerInside = false;
      suppressHoverOpen = false;
      syncPopupVisibility();
    });
    controller.listen(button, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (isPinnedOpen) {
        closePopup({ suppressHoverOpen: true });
        return;
      }
      isPinnedOpen = true;
      suppressHoverOpen = false;
      syncPopupVisibility();
    });
    controller.listen(popup, "click", (event) => {
      event.stopPropagation();
    });
    controller.listen(targetDocument, "click", (event) => {
      if (!wrap.contains(event.target as Node | null)) {
        closePopup();
      }
    });
    controller.listen(button, "keydown", (event) => {
      if ((event as KeyboardEvent).key !== "Escape") {
        return;
      }
      event.preventDefault();
      closePopup({ suppressHoverOpen: true });
      button.blur();
    });
    controller.listen(popup, "keydown", (event) => {
      if ((event as KeyboardEvent).key !== "Escape") {
        return;
      }
      event.preventDefault();
      closePopup({ suppressHoverOpen: true });
      button.focus();
    });

    const mounted = { element: wrap, destroy: controller.destroy };
    app.sharedDom?.addCleanupTask(mounted.destroy);
    return mounted;
  }

  function buildInfoPopover(targetDocument: Document, popupText: string, labelText: string) {
    return mountInfoPopover(targetDocument, popupText, labelText).element;
  }

  function buildInfoPopoverContent(
    targetDocument: Document,
    popupContent: Node,
    labelText: string,
    popupClassName?: string,
  ) {
    return mountInfoPopoverContent(targetDocument, popupContent, labelText, popupClassName).element;
  }

  namespace.uiPopover = {
    mountInfoPopover,
    mountInfoPopoverContent,
    buildInfoPopover,
    buildInfoPopoverContent,
  };
})(globalThis);
