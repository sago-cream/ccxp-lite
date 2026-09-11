(function registerCcxpLiteLoginUi(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const { shared } = namespace;
  const { loginLocale, loginSupport } = namespace;
  const { loginTabs } = namespace;
  if (!shared || !loginLocale || !loginSupport || !loginTabs) {
    return;
  }
  const { removeNode } = shared;
  if (!namespace.loginFields || !namespace.loginPassword || !namespace.loginActions) {
    return;
  }
  const { normalizeLoginFormLayout, attachAccountFormatInfo, attachPasswordInfoPopover } =
    namespace.loginFields;
  const { enhancePasswordVisibilityToggle } = namespace.loginPassword;
  const { replaceLoginFormImageButtons, wrapPrimaryLoginButtons } = namespace.loginActions;

  function removeLoginResetControls(rootNode: ParentNode) {
    const resetControls = [
      ...rootNode.querySelectorAll("form input[type='reset'], form button[type='reset']"),
    ];
    for (const controlNode of resetControls) {
      removeNode(controlNode);
    }
  }

  function forceCaptchaLabelDisplay(rootNode: ParentNode) {
    const captchaLabelPattern = /(\u9A57\u8B49\u78BC|captcha)/i;
    const spans = [...rootNode.querySelectorAll<HTMLSpanElement>("span")];
    for (const spanNode of spans) {
      const labelText = spanNode.textContent.replaceAll(/\s+/g, " ").trim();
      if (labelText === "" || !captchaLabelPattern.test(labelText)) {
        continue;
      }
      spanNode.style.display = "block";
    }
  }

  function removeLoginSpacingArtifacts(targetDocument: Document, rootNode: ParentNode & Node) {
    for (const node of rootNode.querySelectorAll("br")) {
      removeNode(node);
    }
    const textNodes: Node[] = [];
    const walker = targetDocument.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }
    for (const textNode of textNodes) {
      const normalized = (textNode.textContent ?? "").replaceAll(/\u00A0|&nbsp;|&npsp;/gi, " ");
      if (normalized.trim() !== "") {
        textNode.textContent = normalized;
        continue;
      }
      if (textNode.parentNode) {
        removeNode(textNode as ChildNode);
      }
    }
  }

  function alignCaptchaMediaRow(targetDocument: Document, rootNode: ParentNode) {
    const captchaImages = [
      ...rootNode.querySelectorAll<HTMLImageElement>("img[src*='auth_img.php']"),
    ];
    for (const captchaImage of captchaImages) {
      const host = captchaImage.parentElement;
      if (!host) {
        continue;
      }
      const audioControl = host.querySelector(
        ".ccxp-lite-audio-icon-button, .ccxp-lite-audio-icon-link",
      );
      if (!audioControl) {
        continue;
      }
      const rowNode = captchaImage.closest("tr");
      if (rowNode) {
        rowNode.classList.add("ccxp-lite-captcha-row");
      }
      let mediaRow = host.querySelector(":scope > .ccxp-lite-captcha-media-row");
      if (!mediaRow) {
        mediaRow = targetDocument.createElement("span");
        mediaRow.className = "ccxp-lite-captcha-media-row";
        captchaImage.before(mediaRow);
      }
      if (captchaImage.parentNode !== mediaRow) {
        mediaRow.append(captchaImage);
      }
      if (audioControl.parentNode !== mediaRow) {
        mediaRow.append(audioControl);
      }
    }
  }
  namespace.loginUi = {
    attachAccountFormatInfo,
    attachPasswordInfoPopover,
    enhancePasswordVisibilityToggle,
    normalizeLoginFormLayout,
    removeLoginResetControls,
    forceCaptchaLabelDisplay,
    replaceLoginFormImageButtons,
    wrapPrimaryLoginButtons,
    removeLoginSpacingArtifacts,
    alignCaptchaMediaRow,
  };
})(globalThis);
