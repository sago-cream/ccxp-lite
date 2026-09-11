(function registerUiLegacyStyle(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.shared) {
    return;
  }

  const { ensureThemeDocument, cleanLegacyAttributes } = namespace.shared;
  const ownedPropertyNames = [
    "accent-color",
    "appearance",
    "background",
    "background-color",
    "background-image",
    "background-position",
    "background-repeat",
    "background-size",
    "border",
    "border-block",
    "border-block-end",
    "border-block-start",
    "border-bottom",
    "border-color",
    "border-inline",
    "border-inline-end",
    "border-inline-start",
    "border-left",
    "border-radius",
    "border-right",
    "border-style",
    "border-top",
    "border-width",
    "box-shadow",
    "color",
    "cursor",
    "filter",
    "font",
    "font-family",
    "font-size",
    "font-style",
    "font-variant",
    "font-weight",
    "height",
    "letter-spacing",
    "line-height",
    "margin",
    "margin-block",
    "margin-block-end",
    "margin-block-start",
    "margin-bottom",
    "margin-inline",
    "margin-inline-end",
    "margin-inline-start",
    "margin-left",
    "margin-right",
    "margin-top",
    "max-height",
    "max-width",
    "min-height",
    "min-width",
    "opacity",
    "outline",
    "outline-color",
    "outline-offset",
    "outline-style",
    "outline-width",
    "padding",
    "padding-block",
    "padding-block-end",
    "padding-block-start",
    "padding-bottom",
    "padding-inline",
    "padding-inline-end",
    "padding-inline-start",
    "padding-left",
    "padding-right",
    "padding-top",
    "text-align",
    "text-decoration",
    "text-decoration-color",
    "text-decoration-line",
    "text-decoration-style",
    "text-transform",
    "transform",
    "transition",
    "vertical-align",
    "white-space",
    "width",
  ] as const;

  function adaptLegacyStyles(rootNode: Node | undefined) {
    if (!rootNode) {
      return;
    }
    for (const element of collectStyledElements(rootNode)) {
      downgradeOwnedImportantDeclarations(element.style);
    }
    cleanLegacyAttributes(rootNode);
  }

  function prepareLegacySurface(
    targetDocument: Document,
    scope: string,
    roots: readonly Node[] = [targetDocument],
  ) {
    ensureThemeDocument(targetDocument, scope);
    for (const root of roots) {
      adaptLegacyStyles(root);
    }
  }

  function collectStyledElements(rootNode: Node): readonly HTMLElement[] {
    const elements: HTMLElement[] = [];
    if (rootNode.nodeType === 1) {
      const rootElement = rootNode as HTMLElement;
      if (rootElement.style.cssText.toLowerCase().includes("!important")) {
        elements.push(rootElement);
      }
    }
    if (rootNode.nodeType === 1 || rootNode.nodeType === 9) {
      elements.push(
        ...[...(rootNode as ParentNode).querySelectorAll<HTMLElement>("[style]")].filter(
          (element) => element.style.cssText.toLowerCase().includes("!important"),
        ),
      );
    }
    return elements;
  }

  function downgradeOwnedImportantDeclarations(style: CSSStyleDeclaration) {
    for (const propertyName of ownedPropertyNames) {
      if (style.getPropertyPriority(propertyName) === "important") {
        style.setProperty(propertyName, style.getPropertyValue(propertyName), "");
      }
    }
  }

  namespace.uiLegacyStyle = { adaptLegacyStyles, prepareLegacySurface };
})(globalThis);
