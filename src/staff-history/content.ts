(function injectCcxpLiteStaffHistoryPageScript() {
  const sharedDom = globalThis.CCXP_LITE?.sharedDom;
  const pageScriptId = "ccxp-lite-staff-history-page-script";
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
  script.src = runtimeApi.getURL("staff-history/page.js");
  script.async = false;
  script.addEventListener("load", () => {
    const tables = document.createElement("script");
    tables.src = runtimeApi.getURL("staff-history/tables.js");
    tables.addEventListener("load", () => {
      tables.remove();
    });
    tables.addEventListener("error", () => {
      tables.remove();
    });
    document.documentElement.append(tables);
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
})();
