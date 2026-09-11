(function registerLoginPassword(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiButtons) {
    return;
  }
  const { createButton } = namespace.uiButtons;
  if (!namespace.shared || !namespace.loginFields || !namespace.uiIcons) {
    return;
  }
  const trackEvent = namespace.shared.trackEvent ?? (() => undefined);
  const { getLandingStrings } = namespace.loginFields;
  const { createPasswordVisibilityIcon } = namespace.uiIcons;

  function enhancePasswordVisibilityToggle(targetDocument: Document, rootNode: ParentNode) {
    const passwordFields = [
      ...rootNode.querySelectorAll<HTMLInputElement>(
        "input[name='passwd'], input[type='password']:not([name='passwd2'])",
      ),
    ];
    const seen = new Set<HTMLInputElement>();
    const strings = getLandingStrings(targetDocument);
    for (const field of passwordFields) {
      if (seen.has(field) || field.dataset.ccxpLitePasswordToggle === "true") {
        continue;
      }
      seen.add(field);
      field.type = "password";
      removeRedundantPasswordLabelEyeIcon(field);
      const wrapper = targetDocument.createElement("span");
      wrapper.className = "ccxp-lite-password-field";
      if (!field.parentNode) {
        continue;
      }
      field.parentNode.insertBefore(wrapper, field);
      wrapper.append(field);
      const toggleButton = createButton(targetDocument, { className: "ccxp-lite-password-toggle" });
      toggleButton.setAttribute("aria-label", strings.showPassword);
      toggleButton.append(createPasswordVisibilityIcon(targetDocument, false));
      toggleButton.addEventListener("click", () => {
        const isHidden = field.type !== "text";
        field.type = isHidden ? "text" : "password";
        trackEvent(targetDocument, {
          feature: "login",
          action: "toggle_password_visibility",
          surface: "login",
          visible: isHidden,
        });
        toggleButton.setAttribute(
          "aria-label",
          isHidden ? strings.hidePassword : strings.showPassword,
        );
        toggleButton.replaceChildren(createPasswordVisibilityIcon(targetDocument, isHidden));
      });
      wrapper.append(toggleButton);
      field.dataset.ccxpLitePasswordToggle = "true";
    }
  }

  function removeRedundantPasswordLabelEyeIcon(passwordField: HTMLInputElement) {
    const inlineScope = passwordField.closest("form") ?? passwordField.parentElement;
    if (inlineScope) {
      const legacyInlineToggles = [
        ...inlineScope.querySelectorAll(
          "svg#showPassword, svg#hidePassword, svg[onclick*='togglePassword']",
        ),
      ];
      for (const node of legacyInlineToggles) {
        const relation = node.compareDocumentPosition(passwordField);
        const beforeFieldRelations = new Set([
          Node.DOCUMENT_POSITION_FOLLOWING,
          Node.DOCUMENT_POSITION_FOLLOWING + Node.DOCUMENT_POSITION_CONTAINED_BY,
        ]);
        const isBeforeField = beforeFieldRelations.has(relation);
        if (isBeforeField) {
          node.remove();
        }
      }
    }
    const row = passwordField.closest("tr");
    if (!row || row.dataset.ccxpLitePasswordLabelCleaned === "true") {
      return;
    }
    const labelCell = row.querySelector("th, td");
    if (!labelCell) {
      return;
    }
    const labelText = labelCell.textContent.replaceAll(/\s+/g, " ").trim();
    const isPasswordLabel = /(\u5BC6\u78BC|password)/i.test(labelText);
    if (isPasswordLabel) {
      for (const node of labelCell.querySelectorAll("svg")) {
        node.remove();
      }
      for (const node of labelCell.querySelectorAll("a, button, span, i")) {
        const text = node.textContent.replaceAll(/\s+/g, " ").trim();
        const hasOnlyIconChild = node.querySelector("svg, img, i") !== null;
        if (text === "" && hasOnlyIconChild) {
          node.remove();
        }
      }
    }
    const eyePattern =
      /(eye|show|hide|visible|visibility|view|\u986F\u793A|\u96B1\u85CF|\u5BC6\u78BC)/i;
    const candidates = [...labelCell.querySelectorAll("img, svg, i, span, a, button")];
    for (const node of candidates) {
      const hints = [
        node.getAttribute("alt"),
        node.getAttribute("title"),
        node.getAttribute("aria-label"),
        node.getAttribute("class"),
        node.getAttribute("src"),
        node.textContent,
      ]
        .map((value) => (value ?? "").toLowerCase())
        .join(" ");
      if (hints.includes("\uD83D\uDC41") || eyePattern.test(hints)) {
        node.remove();
      }
    }
    row.dataset.ccxpLitePasswordLabelCleaned = "true";
  }
  namespace.loginPassword = { enhancePasswordVisibilityToggle };
})(globalThis);
