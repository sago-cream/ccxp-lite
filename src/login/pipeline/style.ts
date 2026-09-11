(function registerCcxpLiteLoginStyle(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const { shared } = namespace;
  const { uiLegacyStyle } = namespace;
  if (!shared || !uiLegacyStyle) {
    return;
  }

  const { prepareLegacySurface } = uiLegacyStyle;

  function applyLoginTheme(
    targetDocument: Document,
    rewriteResult: {
      shell: HTMLElement;
    },
  ) {
    prepareLegacySurface(targetDocument, "landing", [rewriteResult.shell, targetDocument]);
    const targetBody = targetDocument.body;
    targetBody.replaceChildren(rewriteResult.shell);
    targetBody.style.setProperty("background-image", "none", "important");
    targetBody.style.setProperty("background-color", "var(--ccxp-lite-bg)", "important");
    targetBody.dataset.ccxpLiteLandingApplied = "true";
  }

  namespace.loginStyle = {
    applyLoginTheme,
  };
})(globalThis);
