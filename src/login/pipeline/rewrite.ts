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

  const TURNSTILE_API_SCRIPT_PREFIX = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  const INPLACE_LEGACY_ATTRIBUTES = [
    "width",
    "height",
    "align",
    "valign",
    "border",
    "cellpadding",
    "cellspacing",
    "colspan",
    "rowspan",
    "bgcolor",
    "background",
    "style",
  ] as const;

  function isTurnstileApiScript(node: ChildNode) {
    return node instanceof HTMLScriptElement && node.src.startsWith(TURNSTILE_API_SCRIPT_PREFIX);
  }

  function cleanInplaceHostElement(element: HTMLElement) {
    for (const attributeName of INPLACE_LEGACY_ATTRIBUTES) {
      element.removeAttribute(attributeName);
    }
  }

  function getBodyAncestorChain(
    targetDocument: Document,
    targetElement: HTMLElement,
  ): readonly HTMLElement[] {
    const ancestors: HTMLElement[] = [];
    let current = targetElement.parentElement;
    while (current && current !== targetDocument.body) {
      ancestors.unshift(current);
      current = current.parentElement;
    }
    return ancestors;
  }

  function buildLandingHeader(
    targetDocument: Document,
    identifiedSurface: CcxpLiteLoginIdentifyResult,
  ) {
    const { languageLinks, utilityLinks, cannotLoginLink, serviceLink, strings } =
      identifiedSurface;
    const headerSection = createSection(targetDocument, "ccxp-lite-landing-header");
    const brandSection = createSection(
      targetDocument,
      "ccxp-lite-landing-brand ccxp-lite-sidebar-brand-group",
    );
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
    headerSection.append(brandSection);

    const langSection = createLanguageSelector(targetDocument, languageLinks);
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

    return headerSection;
  }

  function buildLandingFooter(targetDocument: Document) {
    const footer = targetDocument.createElement("footer");
    footer.className = "ccxp-lite-landing-footer";
    for (const link of createSupportLinks(targetDocument)) {
      if (link.textContent !== "ccxpLite") {
        link.textContent = `ccxpLite ${link.textContent}`;
      }
      footer.append(link);
    }
    return footer;
  }

  function buildLoginHeaderLabel(targetDocument: Document, loginTitle: string) {
    const loginHeaderLabel = targetDocument.createElement("h1");
    loginHeaderLabel.className = "ccxp-lite-landing-login-label";
    loginHeaderLabel.textContent = loginTitle;
    return loginHeaderLabel;
  }

  function applyLoginFormTransforms(
    targetDocument: Document,
    layoutRoot: ParentNode,
    transformScope: ParentNode & Node,
    loginForm: HTMLFormElement | undefined,
  ) {
    normalizeLoginFormLayout(layoutRoot);
    attachAccountFormatInfo(targetDocument, transformScope);
    removeLoginResetControls(transformScope);
    forceCaptchaLabelDisplay(transformScope);
    replaceLoginFormImageButtons(targetDocument, transformScope);
    wrapPrimaryLoginButtons(targetDocument, transformScope);
    const turnstile = loginForm?.querySelector<HTMLElement>(".cf-turnstile");
    const actionGroup = loginForm?.querySelector(".ccxp-lite-login-action-group");
    if (loginForm && turnstile && actionGroup) {
      turnstile.classList.add("ccxp-lite-login-turnstile");
      let turnstileSlot: HTMLElement = turnstile;
      while (turnstileSlot.parentElement && turnstileSlot.parentElement !== loginForm) {
        turnstileSlot = turnstileSlot.parentElement;
      }
      if (turnstileSlot.parentNode === loginForm && actionGroup.parentNode === loginForm) {
        // Move only the button container after Turnstile; Gecko resets Shadow-DOM iframes when
        // their host or ancestor is relocated via moveBefore().
        turnstileSlot.after(actionGroup);
      }
    }
    removeLoginSpacingArtifacts(targetDocument, transformScope);
    alignCaptchaMediaRow(targetDocument, transformScope);
    enhancePasswordVisibilityToggle(targetDocument, transformScope);
    attachPasswordInfoPopover(targetDocument, transformScope);
  }

  function rewriteTurnstileLoginInPlace(
    targetDocument: Document,
    identifiedSurface: CcxpLiteLoginIdentifyResult,
    loginForm: HTMLFormElement,
    loginValidationState: CcxpLiteLoginValidationState,
  ): CcxpLiteLoginRewriteResult {
    const { announcementTable, cannotLoginLink, strings } = identifiedSurface;
    // Snapshot native form owners before pruning legacy wrappers can remove external controls.
    const externalControls = [...loginForm.elements].filter(
      (control) => !loginForm.contains(control) && !control.contains(loginForm),
    );

    const headerSection = buildLandingHeader(targetDocument, identifiedSurface);
    const separateAnnouncementTable =
      announcementTable && !announcementTable.contains(loginForm) ? announcementTable : undefined;
    prepareAnnouncementTable(separateAnnouncementTable, strings);
    const loginHelperLink = buildLoginHelperLink(targetDocument, cannotLoginLink, strings);
    const hasNotices = Boolean(separateAnnouncementTable && !separateAnnouncementTable.hidden);
    const noticesSection = createSection(targetDocument, "ccxp-lite-landing-notices");
    if (hasNotices && separateAnnouncementTable) {
      noticesSection.append(separateAnnouncementTable);
    }
    const footer = buildLandingFooter(targetDocument);
    const loginHeaderLabel = buildLoginHeaderLabel(targetDocument, strings.loginTitle);

    for (const control of externalControls) {
      loginForm.append(control);
    }

    const ancestors = getBodyAncestorChain(targetDocument, loginForm);
    for (const [index, ancestor] of ancestors.entries()) {
      const retainedChild = index + 1 < ancestors.length ? ancestors[index + 1] : loginForm;
      // eslint-disable-next-line unicorn/no-useless-spread -- Snapshot live childNodes before removal.
      for (const child of [...ancestor.childNodes]) {
        if (child !== retainedChild && !isTurnstileApiScript(child)) {
          child.remove();
        }
      }
      cleanInplaceHostElement(ancestor);
    }

    const topHost = ancestors[0] ?? loginForm;
    // eslint-disable-next-line unicorn/no-useless-spread -- Snapshot live childNodes before removal.
    for (const child of [...targetDocument.body.childNodes]) {
      if (child !== topHost && !isTurnstileApiScript(child)) {
        child.remove();
      }
    }

    targetDocument.body.classList.add(TOKENS.landingClass, "ccxp-lite-landing-inplace-shell");

    let loginSection: HTMLElement;
    const lastAncestor = ancestors.at(-1);
    if (ancestors.length >= 2 && lastAncestor) {
      loginSection = lastAncestor;
      for (const intermediate of ancestors.slice(1, -1)) {
        intermediate.className = "ccxp-lite-landing-inplace-pass";
      }
      loginSection.className =
        "ccxp-lite-landing-section ccxp-lite-landing-login ccxp-lite-landing-inplace-login";
      topHost.className = hasNotices
        ? "ccxp-lite-landing-section ccxp-lite-landing-body ccxp-lite-landing-inplace-body"
        : "ccxp-lite-landing-section ccxp-lite-landing-inplace-solo";
      topHost.before(headerSection);
      loginForm.before(loginHeaderLabel);
      if (hasNotices) {
        topHost.append(noticesSection);
      }
      topHost.after(footer);
    } else if (ancestors.length === 1) {
      loginSection = ancestors[0];
      loginSection.className =
        "ccxp-lite-landing-section ccxp-lite-landing-login ccxp-lite-landing-inplace-login ccxp-lite-landing-inplace-solo-login";
      loginSection.before(headerSection);
      loginForm.before(loginHeaderLabel);
      if (hasNotices) {
        loginSection.after(noticesSection);
        noticesSection.after(footer);
      } else {
        loginSection.after(footer);
      }
    } else {
      loginSection = targetDocument.body;
      targetDocument.body.classList.add("ccxp-lite-landing-inplace-direct");
      loginForm.before(headerSection, loginHeaderLabel);
      if (hasNotices) {
        loginForm.after(noticesSection);
        noticesSection.after(footer);
      } else {
        loginForm.after(footer);
      }
    }

    collapseLegacyCannotLoginLink(cannotLoginLink);
    const layoutRoot: ParentNode = ancestors.length > 0 ? loginSection : targetDocument.body;
    const transformScope: ParentNode & Node = ancestors.length > 0 ? loginSection : loginForm;
    applyLoginFormTransforms(targetDocument, layoutRoot, transformScope, loginForm);
    if (loginHelperLink) {
      loginForm.after(loginHelperLink);
    }

    const captchaAutofillState = getOrCreateCaptchaState(
      targetDocument,
      loginSection as ParentNode,
    );

    return {
      shell: targetDocument.body,
      loginSection,
      loginValidationState,
      captchaAutofillState,
      inPlace: true,
    };
  }

  function rewriteLoginSurface(
    targetDocument: Document,
    identifiedSurface: CcxpLiteLoginIdentifyResult,
  ): CcxpLiteLoginRewriteResult {
    const { loginForm, loginSourceCell, announcementTable, cannotLoginLink, strings } =
      identifiedSurface;
    const loginValidationState = captureValidationState(targetDocument);
    const hasTurnstile = Boolean(loginForm?.querySelector(".cf-turnstile"));
    if (hasTurnstile && loginForm && targetDocument.body.contains(loginForm)) {
      return rewriteTurnstileLoginInPlace(
        targetDocument,
        identifiedSurface,
        loginForm,
        loginValidationState,
      );
    }

    const shell = targetDocument.createElement("main");
    shell.className = TOKENS.landingClass;
    const topSection = createSection(targetDocument, "ccxp-lite-landing-top");
    const bodySection = createSection(targetDocument, "ccxp-lite-landing-body");
    const loginSection = createSection(targetDocument, "ccxp-lite-landing-login");
    const noticesSection = createSection(targetDocument, "ccxp-lite-landing-notices");

    const loginHeaderLabel = buildLoginHeaderLabel(targetDocument, strings.loginTitle);
    loginSection.append(loginHeaderLabel);

    // Snapshot native form owners before moving nodes can reset parser-associated controls.
    const externalControls = loginForm
      ? [...loginForm.elements].filter((control) => !loginForm.contains(control))
      : [];
    if (loginForm) {
      loginSection.append(loginForm);
      // The host can associate hidden session/challenge controls from outside the form. Keep those
      // native nodes before the old layout is removed by the theme stage.
      for (const control of externalControls) {
        loginForm.append(control);
      }
    } else {
      moveChildNodes(loginSourceCell, loginSection);
    }

    prepareAnnouncementTable(announcementTable, strings);
    const loginHelperLink = buildLoginHelperLink(targetDocument, cannotLoginLink, strings);

    applyLoginFormTransforms(targetDocument, loginSection, loginSection, loginForm);
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

    const headerSection = buildLandingHeader(targetDocument, identifiedSurface);

    cleanLegacySupport(identifiedSurface);
    topSection.prepend(headerSection);

    if (announcementTable && !announcementTable.hidden) {
      if (loginSection.parentNode !== bodySection) {
        bodySection.append(loginSection);
      }
      noticesSection.append(announcementTable);
      bodySection.append(noticesSection);
      if (bodySection.parentNode !== topSection) {
        topSection.append(bodySection);
      }
    } else {
      topSection.append(loginSection);
    }
    const footer = buildLandingFooter(targetDocument);
    if (topSection.parentNode !== shell) {
      shell.append(topSection);
    }
    shell.append(footer);

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
