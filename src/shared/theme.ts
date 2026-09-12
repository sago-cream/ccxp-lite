(function registerCcxpLiteSharedTheme(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const { sharedConstants } = namespace;
  if (!sharedConstants) {
    return;
  }
  const { ASSETS } = sharedConstants;
  const tokenVariables = namespace.designTokens?.cssVariables;
  if (!tokenVariables) {
    return;
  }
  const themeVariables = tokenVariables;
  function ensureThemeDocument(targetDocument: Document, scope: string) {
    const { documentElement } = targetDocument;
    documentElement.dataset.ccxpLiteScope = scope;
    const { sharedDom } = namespace;
    const head = sharedDom?.ensureDocumentHead(targetDocument);
    if (!head) {
      return false;
    }
    const isContextReady = (() => {
      try {
        return !sharedDom || sharedDom.ensureContextValid();
      } catch {
        return false;
      }
    })();
    if (!isContextReady) {
      return false;
    }
    if (!head.querySelector("[data-ccxp-lite-stylesheet='true']")) {
      const runtime = (() => {
        try {
          return sharedDom?.getRuntimeSafely() ?? undefined;
        } catch {
          return undefined;
        }
      })();
      if (!runtime) {
        return false;
      }
      const link = targetDocument.createElement("link");
      link.rel = "stylesheet";
      link.href = runtime.getURL(ASSETS.stylesheetPath);
      link.dataset.ccxpLiteStylesheet = "true";
      head.append(link);
    }
    applyCssVariables(targetDocument.documentElement, themeVariables);
    return true;
  }

  function applyCssVariables(
    targetElement: HTMLElement,
    variables: Readonly<Record<string, string>>,
  ) {
    for (const [name, value] of Object.entries(variables)) {
      targetElement.style.setProperty(name, value);
    }
  }
  namespace.sharedTheme = {
    ensureThemeDocument,
  };
})(globalThis);
