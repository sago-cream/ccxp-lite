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
    // The host loads Turnstile from a body script. Retain that script as well as the connected
    // shell: detaching either can invalidate an active challenge.
    for (const script of targetBody.querySelectorAll<HTMLScriptElement>("script[src]")) {
      if (script.src === "https://challenges.cloudflare.com/turnstile/v0/api.js") {
        // eslint-disable-next-line unicorn/no-null -- The DOM API requires null to append.
        targetDocument.head.moveBefore(script, null);
      }
    }
    if (rewriteResult.shell.parentNode !== targetBody) {
      targetBody.append(rewriteResult.shell);
    }
    // eslint-disable-next-line unicorn/no-useless-spread -- Snapshot the live list before removing nodes.
    for (const child of [...targetBody.childNodes]) {
      if (child !== rewriteResult.shell) {
        child.remove();
      }
    }
    targetBody.style.setProperty("background-image", "none", "important");
    targetBody.style.setProperty("background-color", "var(--ccxp-lite-bg)", "important");
    targetBody.dataset.ccxpLiteLandingApplied = "true";
  }

  namespace.loginStyle = {
    applyLoginTheme,
  };
})(globalThis);
