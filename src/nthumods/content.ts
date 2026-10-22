(function enhanceCcxpLiteCourseResult(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  const parser = namespace?.nthuModsParser;
  const urlBuilder = namespace?.nthuModsUrl;
  const sharedLocale = namespace?.sharedLocale;
  const uiButtons = namespace?.uiButtons;
  if (!parser || !urlBuilder || !sharedLocale || !uiButtons) {
    return;
  }
  if (document.documentElement.dataset.ccxpLiteNthuModsReady === "true") {
    return;
  }

  const locale = sharedLocale.resolveLocaleFromDocument(document);
  const strings = sharedLocale.getLocalizedStrings(locale);
  const parsed = parser.parseCourseResult(document);
  const resultTable = document
    .querySelectorAll<HTMLTableElement>("table")
    .item(1) as HTMLTableElement | null;
  if (resultTable === null) {
    return;
  }

  const actionGroup = document.createElement("div");
  actionGroup.className = "ccxp-lite-nthumods-actions";
  const button = uiButtons.createButton(document, {
    className: "ccxp-lite-nthumods-button",
    label: strings.nthumodsExport,
    ariaLabel: strings.nthumodsExport,
    onClick: () => {
      const current = parser.parseCourseResult(document);
      const url = urlBuilder.buildNthuModsUrl(locale, current.semester, current.courseIds);
      if (url !== undefined) {
        globalScope.open(url, "_blank", "noopener,noreferrer");
      }
    },
  });
  button.id = "ccxp-lite-nthumods-export";
  const reason = document.createElement("span");
  reason.className = "ccxp-lite-nthumods-reason";
  reason.id = "ccxp-lite-nthumods-reason";
  if (parsed.courseIds.length === 0) {
    button.disabled = true;
    button.title = strings.nthumodsNoCourses;
    button.setAttribute("aria-describedby", reason.id);
    reason.textContent = strings.nthumodsNoCourses;
  } else {
    reason.hidden = true;
  }
  actionGroup.append(button, reason);
  resultTable.before(actionGroup);
  document.documentElement.dataset.ccxpLiteNthuModsReady = "true";
})(globalThis);
