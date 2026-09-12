(function injectCcxpLitePe14dPageScript() {
  // Transport responses must remain raw until imported into the visible document.
  if (window.name.startsWith("ccxp-lite-pe14d-")) {
    return;
  }
  const sharedDom = globalThis.CCXP_LITE?.sharedDom;
  const pageScriptId = "ccxp-lite-pe14d-page-script";
  if (document.querySelector(`#${CSS.escape(pageScriptId)}`)) {
    return;
  }
  const getRuntimeApi = (): CcxpLiteRuntime | undefined => {
    if (sharedDom?.getRuntimeSafely) {
      return sharedDom.getRuntimeSafely();
    }
    if (typeof chrome !== "undefined" && chrome.runtime.id !== "") {
      return chrome.runtime as unknown as CcxpLiteRuntime;
    }
    return undefined;
  };
  const runtimeApi = getRuntimeApi();
  if (!runtimeApi) {
    return;
  }
  const script = document.createElement("script");
  script.id = pageScriptId;
  script.src = runtimeApi.getURL("work-log/page.js");
  script.async = false;
  script.addEventListener("load", () => {
    if (script.parentNode) {
      script.remove();
    }
  });
  script.addEventListener("error", () => {
    if (script.parentNode) {
      script.remove();
    }
  });
  document.documentElement.append(script);
  for (const path of [
    "shared/constants.js",
    "shared/ui/renderer.js",
    "shared/ui/buttons.js",
    "menu/ui/dialog-view.js",
    "work-log/batch.js",
  ]) {
    const dependency = document.createElement("script");
    dependency.src = runtimeApi.getURL(path);
    dependency.async = false;
    dependency.addEventListener("load", () => {
      dependency.remove();
    });
    document.documentElement.append(dependency);
  }
})();
