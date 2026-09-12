import { createRenderer } from "./renderer.js";
import { createButton } from "./buttons.js";

export function createStatusSwitch(
  targetDocument: Document,
  options: {
    mode: string;
    actionLabel: string;
    label: string;
    status: string;
    icon: Node;
  },
): HTMLButtonElement {
  const dom = createRenderer(targetDocument);
  const button = createButton(targetDocument, {
    className: "ccxp-lite-sidebar-experiment-switch",
  });
  button.dataset.ccxpLiteSidebarVariantMode = options.mode;
  button.setAttribute("aria-label", options.actionLabel);
  button.setAttribute("title", options.actionLabel);
  dom.append(
    button,
    dom.element(
      "span",
      {
        className: "ccxp-lite-sidebar-experiment-icon",
        styleProperties: {
          display: "inline-flex",
          "align-items": "center",
          "justify-content": "center",
          width: "20px",
          height: "20px",
        },
      },
      [options.icon],
    ),
    dom.element("span", {
      className: "ccxp-lite-sidebar-experiment-label",
      text: options.label,
    }),
    dom.element("span", {
      className: "ccxp-lite-sidebar-experiment-state",
      text: options.status,
      attributes: { "aria-hidden": true },
    }),
  );
  return button;
}
