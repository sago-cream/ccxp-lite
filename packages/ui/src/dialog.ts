import { createRenderer } from "./renderer.js";
import { createDialogActionButton } from "./buttons.js";
import type { CcxpLiteRemovePinnedDialogView } from "../types.js";

export function createRemovePinnedDialog(
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
        gap: "var(--ccxp-lite-spacing-inset-sm)",
        "margin-top": "var(--ccxp-lite-spacing-inset-sm)",
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
        width: "min(100%, var(--ccxp-lite-dialog-width))",
        display: "flex",
        "flex-direction": "column",
        gap: "var(--ccxp-lite-spacing-lg)",
        padding: "var(--ccxp-lite-dialog-padding)",
        border: "1px solid var(--ccxp-lite-border)",
        "border-radius": "var(--ccxp-lite-radius-md)",
        "background-color": "var(--ccxp-lite-surface)",
        "box-shadow": "var(--ccxp-lite-dialog-shadow)",
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
        padding: "var(--ccxp-lite-spacing-lg)",
        "background-color": "var(--ccxp-lite-dialog-backdrop)",
      },
    },
    [dialog],
  );
  return { overlay, dialog, keepButton, confirmButton };
}
