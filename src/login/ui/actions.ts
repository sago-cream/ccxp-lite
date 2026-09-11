(function registerLoginActions(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiButtons) {
    return;
  }
  const { createButton } = namespace.uiButtons;
  if (!namespace.shared || !namespace.loginFields || !namespace.uiIcons) {
    return;
  }
  const { removeNode } = namespace.shared;
  const { getLandingStrings, cssEscape } = namespace.loginFields;
  const { createAudioIcon } = namespace.uiIcons;

  function replaceLoginFormImageButtons(targetDocument: Document, rootNode: ParentNode) {
    const imageSubmitInputs = [
      ...rootNode.querySelectorAll<HTMLInputElement>("form input[type='image']"),
    ];
    for (const inputNode of imageSubmitInputs) {
      if (inputNode.dataset.ccxpLiteImageButtonReplaced === "true") {
        continue;
      }
      if (shouldKeepLegacyLoginImageSubmit(inputNode)) {
        continue;
      }
      if (isVerificationAudioControl(inputNode)) {
        const audioButton = createAudioIconButtonFromImageInput(targetDocument, inputNode);
        inputNode.replaceWith(audioButton);
        audioButton.dataset.ccxpLiteImageButtonReplaced = "true";
        continue;
      }
      if (isAdjacentLoginClearControl(inputNode)) {
        removeNode(inputNode);
        continue;
      }
      const label = resolveLegacyImageButtonLabel(inputNode);
      if (label === "") {
        continue;
      }
      if (isClearActionLabel(label)) {
        removeNode(inputNode);
        continue;
      }
      const button = createButton(targetDocument, {
        type: "submit",
        className: "button ccxp-lite-image-action-button",
      });
      button.textContent = label;
      if (inputNode.id !== "") {
        button.id = inputNode.id;
      }
      if (inputNode.name !== "") {
        button.name = inputNode.name;
      }
      if (inputNode.title !== "") {
        button.title = inputNode.title;
      }
      if (inputNode.className !== "") {
        button.className = `${button.className} ${inputNode.className}`.trim();
      }
      if (inputNode.disabled) {
        button.disabled = true;
      }
      for (const attributeName of [
        "onclick",
        "formaction",
        "formmethod",
        "formenctype",
        "formtarget",
        "tabindex",
      ]) {
        const value = inputNode.getAttribute(attributeName);
        if (value !== null && value !== "") {
          button.setAttribute(attributeName, value);
        }
      }
      if (inputNode.hasAttribute("formnovalidate")) {
        button.setAttribute("formnovalidate", "");
      }
      inputNode.replaceWith(button);
      button.dataset.ccxpLiteImageButtonReplaced = "true";
    }
    const imageAnchors = [...rootNode.querySelectorAll<HTMLImageElement>("form a > img[alt]")];
    for (const imageNode of imageAnchors) {
      const anchor = imageNode.closest("a");
      if (!anchor || anchor.dataset.ccxpLiteImageButtonReplaced === "true") {
        continue;
      }
      if (isVerificationAudioControl(imageNode)) {
        anchor.classList.add("ccxp-lite-audio-icon-link");
        const imageLabel = resolveLegacyImageButtonLabel(imageNode);
        anchor.setAttribute(
          "aria-label",
          imageLabel === "" ? getLandingStrings(targetDocument).playVerificationAudio : imageLabel,
        );
        anchor.replaceChildren(createAudioIcon(targetDocument));
        anchor.dataset.ccxpLiteImageButtonReplaced = "true";
        continue;
      }
      if (isAdjacentLoginClearControl(imageNode)) {
        removeNode(anchor);
        continue;
      }
      const label = resolveLegacyImageButtonLabel(imageNode);
      if (label === "") {
        continue;
      }
      if (isClearActionLabel(label)) {
        removeNode(anchor);
        continue;
      }
      anchor.classList.add("ccxp-lite-image-link-button");
      anchor.replaceChildren(targetDocument.createTextNode(label));
      anchor.dataset.ccxpLiteImageButtonReplaced = "true";
    }
  }

  function wrapPrimaryLoginButtons(targetDocument: Document, rootNode: ParentNode) {
    const forms = [...rootNode.querySelectorAll<HTMLFormElement>("form")];
    for (const formNode of forms) {
      normalizeNativeLoginSubmitControls(targetDocument, formNode);
      const allActionButtons = [
        ...formNode.querySelectorAll<HTMLElement>(
          ".ccxp-lite-image-action-button, .ccxp-lite-image-link-button",
        ),
      ];
      if (allActionButtons.length === 0) {
        continue;
      }
      let actionGroup = formNode.querySelector<HTMLElement>(".ccxp-lite-login-action-group");
      if (!actionGroup) {
        actionGroup = targetDocument.createElement("div");
        actionGroup.className = "ccxp-lite-login-action-group";
        allActionButtons[0].parentNode?.insertBefore(actionGroup, allActionButtons[0]);
      }
      const primaryCandidate = allActionButtons.find((buttonNode) =>
        isPrimaryLoginActionLabel(buttonNode.textContent),
      );
      const primaryButton = primaryCandidate ?? allActionButtons[0];
      const orderedButtons = [
        primaryButton,
        ...allActionButtons.filter((buttonNode) => buttonNode !== primaryButton),
      ];
      for (const buttonNode of orderedButtons) {
        buttonNode.classList.remove(
          "ccxp-lite-login-primary-button",
          "ccxp-lite-login-secondary-button",
        );
        if (buttonNode === primaryButton) {
          buttonNode.classList.add("ccxp-lite-login-primary-button");
        } else {
          buttonNode.classList.add("ccxp-lite-login-secondary-button");
        }
        actionGroup.append(buttonNode);
      }
    }
  }

  function normalizeNativeLoginSubmitControls(targetDocument: Document, formNode: HTMLFormElement) {
    const nativeSubmitInputs = [
      ...formNode.querySelectorAll<HTMLInputElement>("input[type='submit']"),
    ];
    for (const inputNode of nativeSubmitInputs) {
      if (inputNode.dataset.ccxpLiteSubmitRebuilt === "true") {
        continue;
      }
      const label = inputNode.value.replaceAll(/\s+/g, " ").trim();
      if (label === "") {
        continue;
      }
      const button = createButton(targetDocument, {
        type: "submit",
        className: "ccxp-lite-image-action-button",
      });
      button.textContent = label;
      button.value = label;
      button.setAttribute("value", label);
      for (const attribute of inputNode.attributes) {
        const attributeName = attribute.name.toLowerCase();
        if (attributeName === "type" || attributeName === "class") {
          continue;
        }
        button.setAttribute(attribute.name, attribute.value);
      }
      if (inputNode.className !== "") {
        button.className = `${button.className} ${inputNode.className}`.trim();
      }
      if (inputNode.disabled) {
        button.disabled = true;
      }
      inputNode.replaceWith(button);
      button.dataset.ccxpLiteSubmitRebuilt = "true";
    }
    const nativeSubmitButtons = [
      ...formNode.querySelectorAll<HTMLButtonElement>("button[type='submit'], button:not([type])"),
    ];
    for (const buttonNode of nativeSubmitButtons) {
      if (
        buttonNode.classList.contains("ccxp-lite-audio-icon-button") ||
        buttonNode.classList.contains("ccxp-lite-image-action-button")
      ) {
        continue;
      }
      buttonNode.classList.add("ccxp-lite-image-action-button");
    }
  }

  function isPrimaryLoginActionLabel(rawLabel: string | undefined) {
    const normalizedLabel = (rawLabel ?? "").replaceAll(/\s+/g, "").trim().toLowerCase();
    if (normalizedLabel === "") {
      return false;
    }
    return /(\u767B\u5165|\u767B\u5F55|login|signin|logon|\u9001\u51FA|\u78BA\u5B9A|\u786E\u5B9A|submit)/i.test(
      normalizedLabel,
    );
  }

  function resolveLegacyImageButtonLabel(node: Element | HTMLInputElement | undefined) {
    if (!node) {
      return "";
    }
    const explicitAlt = normalizeLegacyButtonLabel(node.getAttribute("alt") ?? undefined);
    if (explicitAlt !== "") {
      return explicitAlt;
    }
    if (node instanceof HTMLInputElement && node.tagName.toLowerCase() === "input") {
      const parentForm = node.form;
      const pairedImage = parentForm
        ? parentForm.querySelector(`img[alt][src='${cssEscape(node.getAttribute("src") ?? "")}]`)
        : undefined;
      const pairedAlt = normalizeLegacyButtonLabel(pairedImage?.getAttribute("alt") ?? undefined);
      if (pairedAlt !== "") {
        return pairedAlt;
      }
    }
    const titleLabel = normalizeLegacyButtonLabel(node.getAttribute("title") ?? undefined);
    if (titleLabel !== "") {
      return titleLabel;
    }
    return "";
  }

  function normalizeLegacyButtonLabel(rawLabel: string | undefined) {
    return (rawLabel ?? "").replaceAll(/\s+/g, " ").trim();
  }

  function shouldKeepLegacyLoginImageSubmit(inputNode: HTMLInputElement) {
    if (!inputNode.form) {
      return false;
    }
    const action = (inputNode.form.getAttribute("action") ?? "").toLowerCase();
    const isLoginFlowForm =
      action.includes("pre_select_entry.php") || action.includes("select_entry.php");
    if (!isLoginFlowForm) {
      return false;
    }
    if (isVerificationAudioControl(inputNode) || isAdjacentLoginClearControl(inputNode)) {
      return false;
    }
    const label = resolveLegacyImageButtonLabel(inputNode);
    if (isClearActionLabel(label)) {
      return false;
    }
    return true;
  }

  function isClearActionLabel(label: string | undefined) {
    const normalized = (label ?? "").replaceAll(/\s+/g, "").toLowerCase();
    return (
      normalized.includes("\u6E05\u9664") ||
      normalized.includes("clear") ||
      normalized.includes("\u91CD\u586B") ||
      normalized.includes("reset")
    );
  }

  function isVerificationAudioControl(node: Element | undefined) {
    if (!node) {
      return false;
    }
    const row = node.closest("tr");
    if (row && row.querySelector("input[name='passwd2']")) {
      return true;
    }
    const hintText = [
      node.getAttribute("alt"),
      node.getAttribute("title"),
      node.getAttribute("src"),
      node.getAttribute("onclick"),
    ]
      .map((value) => (value ?? "").toLowerCase())
      .join(" ");
    return /(voice|audio|sound|speak|listen|\u8A9E\u97F3|\u6717\u8B80|\u64AD\u653E)/.test(hintText);
  }

  function isAdjacentLoginClearControl(node: Element | undefined) {
    if (!node) {
      return false;
    }
    const row = node.closest("tr");
    if (!row || row.querySelector("input[name='passwd2']")) {
      return false;
    }
    if (isClearLikeControl(node)) {
      return true;
    }
    const controls = collectLegacyActionControls(row);
    if (controls.length < 2) {
      return false;
    }
    const loginIndex = controls.findIndex((controlNode) => isLoginLikeControl(controlNode));
    const currentIndex = controls.findIndex(
      (controlNode) => controlNode === node || controlNode.contains(node),
    );
    if (loginIndex === -1 || currentIndex === -1 || currentIndex <= loginIndex) {
      return false;
    }
    const isTwoImagePair =
      controls.length === 2 && controls.every((controlNode) => isImageActionControl(controlNode));
    return isTwoImagePair;
  }

  function collectLegacyActionControls(row: Element): readonly Element[] {
    return [
      ...row.querySelectorAll(
        "input[type='image'], input[type='submit'], input[type='reset'], button, a > img",
      ),
    ].filter((node) => {
      if (node.matches("a > img")) {
        return true;
      }
      const type = (node.getAttribute("type") ?? "").toLowerCase();
      if (node.tagName === "BUTTON" && type === "") {
        return true;
      }
      return ["button", "image", "reset", "submit"].includes(type);
    });
  }

  function isImageActionControl(node: Element | undefined) {
    if (!node) {
      return false;
    }
    if (node.matches("a > img")) {
      return true;
    }
    return (node.getAttribute("type") ?? "").toLowerCase() === "image";
  }

  function isLoginLikeControl(node: Element) {
    const hints = extractControlHints(node);
    return /(\u767B\u5165|login|sign\s*-?\s*in|submit)/i.test(hints);
  }

  function isClearLikeControl(node: Element) {
    const type = (node.getAttribute("type") ?? "").toLowerCase();
    if (type === "reset") {
      return true;
    }
    const hints = extractControlHints(node);
    return /(\u6E05\u9664|\u91CD\u586B|clear|reset)/i.test(hints);
  }

  function extractControlHints(node: Element) {
    const anchor = node.matches("a > img") ? node.closest("a") : undefined;
    return [
      node.getAttribute("alt"),
      node.getAttribute("title"),
      node.getAttribute("name"),
      node.getAttribute("id"),
      node.getAttribute("value"),
      node.getAttribute("src"),
      node.getAttribute("onclick"),
      node.textContent,
      anchor && anchor.getAttribute("href"),
      anchor && anchor.getAttribute("onclick"),
      anchor && anchor.textContent,
    ]
      .map((value) => value ?? "")
      .join(" ")
      .toLowerCase();
  }

  function createAudioIconButtonFromImageInput(
    targetDocument: Document,
    inputNode: HTMLInputElement,
  ) {
    const button = createButton(targetDocument, { className: "ccxp-lite-audio-icon-button" });
    button.append(createAudioIcon(targetDocument));
    const resolvedLabel = resolveLegacyImageButtonLabel(inputNode);
    const label =
      resolvedLabel === ""
        ? getLandingStrings(targetDocument).playVerificationAudio
        : resolvedLabel;
    button.setAttribute("aria-label", label);
    button.title = label;
    if (inputNode.id !== "") {
      button.id = inputNode.id;
    }
    if (inputNode.className !== "") {
      button.className = `${button.className} ${inputNode.className}`.trim();
    }
    if (inputNode.disabled) {
      button.disabled = true;
    }
    for (const attributeName of ["onclick", "tabindex"]) {
      const value = inputNode.getAttribute(attributeName);
      if (value !== null && value !== "") {
        button.setAttribute(attributeName, value);
      }
    }
    return button;
  }
  namespace.loginActions = { replaceLoginFormImageButtons, wrapPrimaryLoginButtons };
})(globalThis);
