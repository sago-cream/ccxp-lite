(function registerLoginLinks(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace || !namespace.shared || !namespace.uiIcons) {
    return;
  }
  const { getLocalizedStrings } = namespace.shared;
  const { createLandingExternalLinkIcon } = namespace.uiIcons;

  function isCannotLoginLabel(label: string | undefined) {
    const normalized = (label ?? "").replaceAll(/\s+/g, "").toLowerCase();
    return (
      normalized.includes("\u7121\u6CD5\u767B\u5165") ||
      normalized.includes("\u65E0\u6CD5\u767B\u5165") ||
      normalized.includes("cannotlogin") ||
      normalized.includes("can'tlogin") ||
      normalized.includes("cantlogin")
    );
  }

  function buildServicePhoneLink(
    targetDocument: Document,
    serviceLinkNode: Element | undefined,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
  ) {
    if (!serviceLinkNode) {
      return undefined;
    }
    const sourceAnchor = serviceLinkNode.matches("a[href]")
      ? (serviceLinkNode as HTMLAnchorElement)
      : serviceLinkNode.querySelector<HTMLAnchorElement>("a[href]");
    const sourceLabel = normalizeSupportLabel(sourceAnchor?.textContent);
    return buildLandingSupportLink(
      targetDocument,
      sourceAnchor ?? undefined,
      sourceLabel === "" ? strings.servicePhone : sourceLabel,
    );
  }

  function buildCannotLoginLink(
    targetDocument: Document,
    sourceAnchor: HTMLAnchorElement | undefined,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
  ) {
    if (!sourceAnchor) {
      return undefined;
    }
    const sourceLabel = normalizeSupportLabel(sourceAnchor.textContent);
    let labelText = strings.cannotLogin;
    if (!isCannotLoginLabel(sourceLabel) && sourceLabel !== "") {
      labelText = sourceLabel;
    }
    return buildLandingSupportLink(targetDocument, sourceAnchor, labelText);
  }

  function buildLoginHelperLink(
    targetDocument: Document,
    sourceAnchor: HTMLAnchorElement | undefined,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
  ) {
    if (!sourceAnchor) {
      return undefined;
    }
    const anchor = targetDocument.createElement("a");
    anchor.className = "ccxp-lite-login-helper-link";
    anchor.href = sourceAnchor.href;
    anchor.target = sourceAnchor.target === "" ? "_blank" : sourceAnchor.target;
    anchor.rel = "noopener noreferrer";
    copyLegacyAnchorHandlers(sourceAnchor, anchor);
    const label = targetDocument.createElement("span");
    label.textContent = `${strings.loginRecoveryHelp}?`;
    anchor.append(label);
    anchor.append(createLandingExternalLinkIcon(targetDocument));
    return anchor;
  }

  function normalizeSupportLabel(label: string | undefined) {
    return (label ?? "")
      .replaceAll(/[<>\uFF1C\uFF1E]+/g, " ")
      .replaceAll(/\s+/g, " ")
      .trim();
  }

  function buildLandingSupportLink(
    targetDocument: Document,
    sourceAnchor: HTMLAnchorElement | undefined,
    labelText: string,
    variant: "primary" | "secondary" = "secondary",
  ) {
    if (!sourceAnchor) {
      return undefined;
    }
    const anchor = targetDocument.createElement("a");
    anchor.className =
      "ccxp-lite-landing-service-link ccxp-lite-action-control " +
      `ccxp-lite-action-control-${variant} ccxp-lite-landing-service-link-${variant}`;
    anchor.href = sourceAnchor.href;
    anchor.target = sourceAnchor.target === "" ? "_blank" : sourceAnchor.target;
    anchor.rel = "noopener noreferrer";
    copyLegacyAnchorHandlers(sourceAnchor, anchor);
    const label = targetDocument.createElement("span");
    label.textContent = labelText;
    anchor.append(label);
    anchor.append(createLandingExternalLinkIcon(targetDocument));
    return anchor;
  }

  function buildSupportLinks(
    targetDocument: Document,
    serviceLinkNode: Element | undefined,
    cannotLoginAnchor: HTMLAnchorElement | undefined,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
  ) {
    const servicePhoneLink = buildServicePhoneLink(targetDocument, serviceLinkNode, strings);
    const cannotLoginLink = buildCannotLoginLink(targetDocument, cannotLoginAnchor, strings);
    if (!servicePhoneLink && !cannotLoginLink) {
      return undefined;
    }
    if (servicePhoneLink) {
      servicePhoneLink.classList.remove("ccxp-lite-landing-service-link-secondary");
      servicePhoneLink.classList.add("ccxp-lite-landing-service-link-secondary");
    }
    if (cannotLoginLink) {
      cannotLoginLink.classList.remove("ccxp-lite-landing-service-link-secondary");
      cannotLoginLink.classList.add("ccxp-lite-landing-service-link-primary");
    }
    const wrap = targetDocument.createElement("div");
    wrap.className = "ccxp-lite-landing-support-links";
    if (cannotLoginLink) {
      wrap.append(cannotLoginLink);
    }
    if (servicePhoneLink) {
      wrap.append(servicePhoneLink);
    }
    return wrap;
  }

  function buildHeaderUtilityLinks(
    targetDocument: Document,
    utilityLinksTable: Element | undefined,
    excludedAnchor: HTMLAnchorElement | undefined,
    serviceLinkNode: Element | undefined,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
  ) {
    const excludedHref = excludedAnchor ? (excludedAnchor.getAttribute("href") ?? "") : "";
    const anchors = utilityLinksTable
      ? [...utilityLinksTable.querySelectorAll<HTMLAnchorElement>("a[href]")]
          .filter((anchor) => anchor !== excludedAnchor)
          .filter((anchor) => {
            const href = anchor.getAttribute("href") ?? "";
            return (
              href !== "" &&
              href !== excludedHref &&
              !href.toLowerCase().includes("inquire_cpr.html")
            );
          })
          .filter((anchor) => anchor.textContent.trim() !== "")
      : [];
    const serviceAnchorSource =
      serviceLinkNode && serviceLinkNode.matches("a[href]")
        ? (serviceLinkNode as HTMLAnchorElement)
        : serviceLinkNode?.querySelector<HTMLAnchorElement>("a[href]");
    if (
      serviceAnchorSource &&
      anchors.every((anchor) => anchor.href !== serviceAnchorSource.href)
    ) {
      anchors.push(serviceAnchorSource);
    }
    if (anchors.length === 0) {
      return undefined;
    }
    const nav = targetDocument.createElement("nav");
    nav.className = "ccxp-lite-landing-utility";
    nav.setAttribute("aria-label", strings.externalLinksLabel);
    for (const [_, sourceAnchor] of anchors.entries()) {
      const anchor = targetDocument.createElement("a");
      anchor.href = sourceAnchor.href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.className = "ccxp-lite-landing-utility-link";
      copyLegacyAnchorHandlers(sourceAnchor, anchor);
      anchor.textContent = normalizeSupportLabel(sourceAnchor.textContent);
      anchor.append(createLandingExternalLinkIcon(targetDocument));
      nav.append(anchor);
    }
    return nav;
  }

  function copyLegacyAnchorHandlers(
    sourceAnchor: HTMLAnchorElement | undefined,
    targetAnchor: HTMLAnchorElement | undefined,
  ) {
    if (!sourceAnchor || !targetAnchor) {
      return;
    }
    for (const name of [
      "onclick",
      "onmousedown",
      "onmouseup",
      "onmouseover",
      "onmouseout",
      "onmouseenter",
      "onmouseleave",
      "onkeydown",
      "onkeyup",
    ]) {
      const value = sourceAnchor.getAttribute(name);
      if (value !== null && value !== "") {
        targetAnchor.setAttribute(name, value);
      }
    }
  }
  namespace.loginLinks = {
    isCannotLoginLabel,
    buildLoginHelperLink,
    buildSupportLinks,
    buildHeaderUtilityLinks,
  };
})(globalThis);
