(function registerCcxpLiteLoginRewrite(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  if (!namespace.uiLanguage) {
    return;
  }
  const { createLanguageSelector } = namespace.uiLanguage;
  const { shared } = namespace;
  const { loginValidation, loginCaptcha, loginTabs, loginSupport, loginUi } = namespace;
  if (!shared || !loginValidation || !loginCaptcha || !loginTabs || !loginSupport || !loginUi) {
    return;
  }

  const {
    createSupportLinks,
    TOKENS,
    ASSETS,
    createBrandImage,
    createBrandCopy,
    moveChildNodes,
    removeNode,
  } = shared;
  const { captureValidationState } = loginValidation;
  const { getOrCreateCaptchaState } = loginCaptcha;
  const { createSection } = loginTabs;
  const {
    buildHeaderUtilityLinks,
    buildLoginHelperLink,
    collapseLegacyServiceRow,
    collapseLegacyCannotLoginLink,
    collapseLegacyUtilityRow,
    collapseLegacyThreeColumnRows,
    findCalendarTable,
    prepareAnnouncementTable,
  } = loginSupport;
  const {
    attachAccountFormatInfo,
    attachPasswordInfoPopover,
    normalizeLoginFormLayout,
    removeLoginResetControls,
    forceCaptchaLabelDisplay,
    replaceLoginFormImageButtons,
    wrapPrimaryLoginButtons,
    removeLoginSpacingArtifacts,
    alignCaptchaMediaRow,
    enhancePasswordVisibilityToggle,
  } = loginUi;

  function rewriteLoginSurface(
    targetDocument: Document,
    identifiedSurface: CcxpLiteLoginIdentifyResult,
  ) {
    const {
      loginForm,
      loginSourceCell,
      languageLinks,
      announcementTable,
      utilityLinks,
      cannotLoginLink,
      serviceLink,
      strings,
    } = identifiedSurface;
    const loginValidationState = captureValidationState(targetDocument);
    const shell = targetDocument.createElement("main");
    shell.className = TOKENS.landingClass;
    const topSection = createSection(targetDocument, "ccxp-lite-landing-top");
    const headerSection = createSection(targetDocument, "ccxp-lite-landing-header");
    const bodySection = createSection(targetDocument, "ccxp-lite-landing-body");
    const brandSection = createSection(
      targetDocument,
      "ccxp-lite-landing-brand ccxp-lite-sidebar-brand-group",
    );
    const loginSection = createSection(targetDocument, "ccxp-lite-landing-login");
    const noticesSection = createSection(targetDocument, "ccxp-lite-landing-notices");

    const brandLockup = targetDocument.createElement("div");
    brandLockup.className = "ccxp-lite-landing-brand-lockup ccxp-lite-sidebar-brand";
    brandLockup.append(
      createBrandImage(
        targetDocument,
        "ccxp-lite-landing-brand-logo ccxp-lite-sidebar-brand-logo",
        ASSETS.sidebarBrandLogoPath,
      ),
    );
    brandLockup.append(
      createBrandCopy(
        targetDocument,
        "ccxp-lite-landing-brand-copy ccxp-lite-sidebar-brand-copy",
        "ccxp-lite-sidebar-brand-title",
        strings.sidebarTitle,
      ),
    );
    brandSection.append(brandLockup);

    const langSection = createLanguageSelector(targetDocument, languageLinks);

    const loginHeaderLabel = targetDocument.createElement("h1");
    loginHeaderLabel.className = "ccxp-lite-landing-login-label";
    loginHeaderLabel.textContent = strings.loginTitle;
    loginSection.append(loginHeaderLabel);

    if (loginForm) {
      loginSection.append(loginForm);
    } else {
      moveChildNodes(loginSourceCell, loginSection);
    }

    prepareAnnouncementTable(announcementTable, strings);
    const loginHelperLink = buildLoginHelperLink(targetDocument, cannotLoginLink, strings);

    normalizeLoginFormLayout(loginSection);
    attachAccountFormatInfo(targetDocument, loginSection);
    removeLoginResetControls(loginSection);
    forceCaptchaLabelDisplay(loginSection);
    replaceLoginFormImageButtons(targetDocument, loginSection);
    wrapPrimaryLoginButtons(targetDocument, loginSection);
    removeLoginSpacingArtifacts(targetDocument, loginSection);
    alignCaptchaMediaRow(targetDocument, loginSection);
    enhancePasswordVisibilityToggle(targetDocument, loginSection);
    attachPasswordInfoPopover(targetDocument, loginSection);
    if (loginHelperLink) {
      loginSection.append(loginHelperLink);
    }

    const captchaAutofillState = getOrCreateCaptchaState(
      targetDocument,
      loginSection as ParentNode,
    );

    removeNode(findCalendarTable(loginSection));
    removeNode(loginSection.querySelector("#twcaseal")?.closest("table") ?? undefined);
    collapseLegacyThreeColumnRows(targetDocument.body);

    headerSection.append(brandSection);
    if (languageLinks) {
      headerSection.append(langSection);
    }

    const utilityHeaderLinks = buildHeaderUtilityLinks(
      targetDocument,
      utilityLinks,
      cannotLoginLink,
      serviceLink,
      strings,
    );
    if (utilityHeaderLinks) {
      if (languageLinks) {
        langSection.before(utilityHeaderLinks);
      } else {
        headerSection.append(utilityHeaderLinks);
      }
    }

    cleanLegacySupport(identifiedSurface);
    topSection.append(headerSection);

    if (announcementTable && !announcementTable.hidden) {
      bodySection.append(loginSection);
      noticesSection.append(announcementTable);
      bodySection.append(noticesSection);
      topSection.append(bodySection);
    } else {
      topSection.append(loginSection);
    }
    const footer = targetDocument.createElement("footer");
    footer.className = "ccxp-lite-landing-footer";
    for (const link of createSupportLinks(targetDocument)) {
      if (link.textContent !== "ccxpLite") {
        link.textContent = `ccxpLite ${link.textContent}`;
      }
      footer.append(link);
    }
    shell.append(topSection, footer);

    return {
      shell,
      loginSection,
      loginValidationState,
      captchaAutofillState,
    };
  }

  function cleanLegacySupport(identifiedSurface: CcxpLiteLoginIdentifyResult) {
    const { utilityLinks, serviceLink, cannotLoginLink, tabNavigation, tabContents } =
      identifiedSurface;
    if (utilityLinks) {
      collapseLegacyUtilityRow(utilityLinks);
      removeNode(utilityLinks);
    }

    if (serviceLink) {
      collapseLegacyServiceRow(serviceLink);
    }
    if (cannotLoginLink) {
      collapseLegacyCannotLoginLink(cannotLoginLink);
    }

    if (tabNavigation && tabContents.length > 0) {
      for (const tabContent of tabContents) {
        collapseLegacyThreeColumnRows(tabContent);
      }
    }
  }

  namespace.loginRewrite = {
    rewriteLoginSurface,
  };
})(globalThis);
