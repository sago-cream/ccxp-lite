(function registerUiButtons(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiRenderer) {
    return;
  }
  const { createRenderer } = namespace.uiRenderer;

  function createButton(
    targetDocument: Document,
    options: {
      type?: "button" | "submit";
      className?: string;
      label?: string;
      ariaLabel?: string;
      title?: string;
      icon?: Node;
      onClick?: (event: MouseEvent) => void;
    } = {},
  ): HTMLButtonElement {
    const dom = createRenderer(targetDocument);
    const button = dom.element("button");
    button.type = options.type ?? "button";
    if (options.className !== undefined) {
      button.className = options.className;
    }
    if (options.label !== undefined) {
      button.textContent = options.label;
    }
    if (options.ariaLabel !== undefined) {
      button.setAttribute("aria-label", options.ariaLabel);
    }
    if (options.title !== undefined) {
      button.setAttribute("title", options.title);
    }
    dom.append(button, options.icon);
    if (options.onClick) {
      button.addEventListener("click", options.onClick);
    }
    return button;
  }

  function createDialogActionButton(
    targetDocument: Document,
    label: string,
    variant: "secondary" | "danger" | "primary",
  ): HTMLElement {
    const button = createButton(targetDocument);
    button.textContent = label;
    const baseStyles = {
      minWidth: "112px",
      height: "40px",
      padding: "0 16px",
      borderRadius: "var(--ccxp-lite-radius-sm)",
      border: "1px solid var(--ccxp-lite-border)",
      font: "var(--ccxp-lite-type-utility)",
      cursor: "pointer",
      transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease",
      outline: "none",
    };
    if (variant === "danger" || variant === "primary") {
      const color =
        variant === "danger" ? "var(--ccxp-lite-type-danger-color)" : "var(--ccxp-lite-primary)";
      Object.assign(button.style, baseStyles, {
        borderColor: color,
        backgroundColor: color,
        color: "var(--ccxp-lite-surface)",
      });
      button.addEventListener("mouseenter", () => {
        button.style.filter = "brightness(0.96)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.filter = "";
      });
    } else {
      Object.assign(button.style, baseStyles, {
        backgroundColor: "var(--ccxp-lite-surface)",
        color: "var(--ccxp-lite-text)",
      });
      button.addEventListener("mouseenter", () => {
        button.style.backgroundColor = "var(--ccxp-lite-primary-hover-surface)";
        button.style.borderColor = "var(--ccxp-lite-primary-focus-border)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.backgroundColor = "var(--ccxp-lite-surface)";
        button.style.borderColor = "var(--ccxp-lite-border)";
      });
    }
    button.addEventListener("focus", () => {
      if (!button.matches(":focus-visible")) {
        return;
      }
      button.style.outline = "2px solid var(--ccxp-lite-primary-focus-border)";
      button.style.outlineOffset = "2px";
    });
    button.addEventListener("blur", () => {
      button.style.outline = "none";
      button.style.outlineOffset = "0";
    });
    return button;
  }

  namespace.uiButtons = { createButton, createDialogActionButton };
})(globalThis);
