(function registerLoginFields(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (
    !namespace?.shared ||
    !namespace.loginLocale ||
    !namespace.loginSupport ||
    !namespace.loginTabs ||
    !namespace.loginFormAdapter
  ) {
    return;
  }
  const { getLocalizedStrings } = namespace.shared;
  const { resolveLoginLocale, getLoginForm } = namespace.loginLocale;
  const { findLoginSourceCell } = namespace.loginSupport;
  const { normalizeFormLayout, attachAccessory } = namespace.loginFormAdapter;
  const { loginTabs } = namespace;

  function normalizeLoginFormLayout(rootNode: ParentNode) {
    normalizeFormLayout(rootNode, {
      resolveLabel: resolveLoginFieldLabel,
      createAccessory: (targetDocument, fieldNode) =>
        isAccountField(fieldNode)
          ? loginTabs.createAccountFormatPopover(targetDocument, getLandingStrings(targetDocument))
          : undefined,
    });
  }

  function attachAccountFormatInfo(targetDocument: Document, rootNode: ParentNode) {
    attachAccessory(targetDocument, rootNode, {
      fieldSelector: "input[name='account'], textarea[name='account'], select[name='account']",
      attachedDataKey: "ccxpLiteAccountInfoAttached",
      existingSelector: ".ccxp-lite-account-guide-info",
      createAccessory: () =>
        loginTabs.createAccountFormatPopover(targetDocument, getLandingStrings(targetDocument)),
    });
  }

  function attachPasswordInfoPopover(targetDocument: Document, rootNode: ParentNode) {
    attachAccessory(targetDocument, rootNode, {
      fieldSelector: "input[name='passwd'], input[name='password'], input[type='password']",
      attachedDataKey: "ccxpLitePasswordInfoAttached",
      existingSelector: ".ccxp-lite-password-help-trigger",
      markWhenUnavailable: true,
      skip: (fieldNode) => (fieldNode as HTMLInputElement).name === "passwd2",
      createAccessory: () =>
        loginTabs.createPasswordHelpActionButton(targetDocument, getLandingStrings(targetDocument)),
    });
  }

  function resolveLoginFieldLabel(field: CcxpLiteLegacyLoginField, targetDocument: Document) {
    const explicitLabel = field.labelText.trim();
    if (explicitLabel !== "") {
      return explicitLabel;
    }
    const fieldName = (field.fieldNode.getAttribute("name") ?? "").trim().toLowerCase();
    const strings = getLandingStrings(targetDocument);
    if (fieldName === "account") {
      return strings.fieldAccount;
    }
    if (fieldName === "id") {
      return strings.fieldStudentId;
    }
    if (fieldName === "passwd" || fieldName === "password") {
      return strings.fieldPassword;
    }
    if (fieldName === "passwd2" || fieldName === "captcha" || fieldName === "code") {
      return strings.fieldVerificationCode;
    }
    return fieldName === "" ? strings.fieldGeneric : fieldName;
  }

  function isAccountField(fieldNode: Element) {
    return (fieldNode.getAttribute("name") ?? "").trim().toLowerCase() === "account";
  }

  function getLandingStrings(targetDocument: Document): Readonly<Record<string, string>> {
    const form = getLoginForm(targetDocument);
    return getLocalizedStrings(
      resolveLoginLocale(
        targetDocument,
        targetDocument.querySelector("ul.links") ?? undefined,
        findLoginSourceCell(targetDocument, form) as ParentNode | undefined,
        form ?? undefined,
      ),
    );
  }

  function cssEscape(value: unknown) {
    const normalizedValue =
      typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : "";
    return normalizedValue.replaceAll("\\", "\\\\").replaceAll("'", String.raw`\'`);
  }

  namespace.loginFields = {
    normalizeLoginFormLayout,
    attachAccountFormatInfo,
    attachPasswordInfoPopover,
    getLandingStrings,
    cssEscape,
  };
})(globalThis);
