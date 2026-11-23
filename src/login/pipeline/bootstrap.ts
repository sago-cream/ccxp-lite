(function registerCcxpLiteLoginBootstrap(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const { shared } = namespace;
  const { loginIdentify, loginRewrite, loginStyle, loginLocale, loginValidation, loginCaptcha } =
    namespace;
  if (
    !shared ||
    !loginIdentify ||
    !loginRewrite ||
    !loginStyle ||
    !loginLocale ||
    !loginValidation ||
    !loginCaptcha
  ) {
    return;
  }
  const identifyLib = loginIdentify;
  const rewriteLib = loginRewrite;
  const styleLib = loginStyle;
  const { ensureDocumentBody, isDocumentComplete } = shared;
  const { isSupportedInquirePath, isLoginPage } = loginLocale;
  const { restoreValidationGuards } = loginValidation;
  const { enableCaptchaAutofill, getOrCreateCaptchaState } = loginCaptcha;
  // Configure implicit rendering before the host API initializes its closed-shadow widget.
  if (isSupportedInquirePath(document)) {
    const prepareTurnstile = () => {
      const widget = document.querySelector<HTMLElement>(".cf-turnstile[data-sitekey]");
      if (!widget) {
        return false;
      }
      if (widget.childElementCount === 0) {
        // The narrow login layout reserves 16px per side. Flexible needs at least 300px, so use the
        // native 150px compact widget below a 332px viewport. Ignore a 0px pre-layout viewport
        // (such as a newly opened window or background tab) so desktop windows do not lock into
        // compact mode.
        widget.dataset.size = globalScope.matchMedia("(min-width: 1px) and (max-width: 331px)")
          .matches
          ? "compact"
          : "flexible";
        widget.dataset.theme = "light";
      }
      return true;
    };
    if (!prepareTurnstile() && document.readyState === "loading") {
      const observer = new MutationObserver(() => {
        if (prepareTurnstile()) {
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          prepareTurnstile();
          observer.disconnect();
        },
        { once: true },
      );
      shared.addCleanupTask(() => {
        observer.disconnect();
      });
    }
  }

  function preloadCaptcha(targetDocument: Document) {
    if (!isLoginPage(targetDocument)) {
      return;
    }
    getOrCreateCaptchaState(targetDocument, targetDocument);
  }

  function simplifyLoginPage(
    targetDocument: Document,
    options: {
      retry?: () => void;
      onReady?: () => void;
    } = {},
  ) {
    const retryFn = typeof options.retry === "function" ? options.retry : () => undefined;
    const onReady = typeof options.onReady === "function" ? options.onReady : () => undefined;
    const targetBody = ensureDocumentBody(targetDocument);

    if (!targetBody) {
      retryFn();
      return;
    }

    if (targetBody.dataset.ccxpLiteLandingApplied === "true") {
      onReady();
      return;
    }
    if (!isDocumentComplete(targetDocument)) {
      retryFn();
      return;
    }
    const identifiedSurface = identifyLib.identifyLoginSurface(targetDocument);
    if (!identifiedSurface) {
      retryFn();
      return;
    }

    const rewriteResult = rewriteLib.rewriteLoginSurface(targetDocument, identifiedSurface);
    styleLib.applyLoginTheme(targetDocument, rewriteResult);
    enableCaptchaAutofill(
      targetDocument,
      rewriteResult.loginSection as ParentNode,
      rewriteResult.captchaAutofillState,
    );
    restoreValidationGuards(targetDocument, rewriteResult.loginValidationState);
    onReady();
  }
  namespace.login = {
    isSupportedInquirePath,
    isLoginPage,
    preloadCaptcha,
    simplifyLoginPage,
  };
})(globalThis);
