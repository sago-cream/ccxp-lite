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
  const batchScript = document.createElement("script");
  batchScript.src = runtimeApi.getURL("work-log/batch.js");
  batchScript.addEventListener("load", () => {
    batchScript.remove();
  });
  document.documentElement.append(batchScript);
})();
