(function registerSidebarDialogView(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiRenderer || !namespace.uiButtons) {
    return;
  }
  const { createRenderer } = namespace.uiRenderer;
  const { createDialogActionButton } = namespace.uiButtons;

  function createRemovePinnedDialog(
    targetDocument: Document,
    itemName: string,
    strings: Readonly<Record<string, string>>,
    variant: "secondary" | "danger" | "primary" = "danger",
  ): CcxpLiteRemovePinnedDialogView {
    const dom = createRenderer(targetDocument);
    const titleId = `ccxp-lite-remove-pinned-title-${Date.now()}`;
    const descriptionId = `ccxp-lite-remove-pinned-description-${Date.now()}`;
    const keepButton = createDialogActionButton(
      targetDocument,
      strings.sidebarRemovePinnedDialogCancel,
      "secondary",
    );
    const confirmButton = createDialogActionButton(
      targetDocument,
      strings.sidebarRemovePinnedDialogConfirm,
      variant,
    );
    const actions = dom.element(
      "div",
      {
        styleProperties: {
          display: "flex",
          "justify-content": "flex-end",
          gap: "12px",
          "margin-top": "12px",
        },
      },
      [keepButton, confirmButton],
    );
    const dialog = dom.element(
      "div",
      {
        attributes: {
          role: "dialog",
          "aria-modal": "true",
          tabindex: "-1",
          "aria-labelledby": titleId,
          "aria-describedby": descriptionId,
        },
        styleProperties: {
          width: "min(100%, 540px)",
          display: "flex",
          "flex-direction": "column",
          gap: "24px",
          padding: "36px",
          border: "1px solid var(--ccxp-lite-border)",
          "border-radius": "var(--ccxp-lite-radius-md)",
          "background-color": "var(--ccxp-lite-surface)",
          "box-shadow": "0 20px 48px rgba(17, 24, 39, 0.2)",
        },
      },
      [
        dom.element("h3", {
          text: `${strings.sidebarRemovePinnedDialogTitlePrefix}${itemName}${strings.sidebarRemovePinnedDialogTitleSuffix}`,
          attributes: { id: titleId },
          styleProperties: {
            margin: "0",
            color: "var(--ccxp-lite-text)",
            font: "var(--ccxp-lite-type-body-strong)",
          },
        }),
        dom.element("p", {
          text: strings.sidebarRemovePinnedDialogDescription,
          attributes: { id: descriptionId },
          styleProperties: {
            margin: "0",
            color: "var(--ccxp-lite-text-muted)",
            font: "var(--ccxp-lite-type-body)",
          },
        }),
        actions,
      ],
    );
    const overlay = dom.element(
      "div",
      {
        attributes: { role: "presentation" },
        data: { ccxpLiteRemovePinnedDialog: "true" },
        styleProperties: {
          position: "fixed",
          inset: "0",
          "z-index": "2147483647",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          padding: "24px",
          "background-color": "rgba(17, 24, 39, 0.36)",
        },
      },
      [dialog],
    );
    return { overlay, dialog, keepButton, confirmButton };
  }

  namespace.sidebarDialogView = { createRemovePinnedDialog };
})(globalThis);
