(function registerCcxpLiteSharedBrand(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const { sharedConstants, sharedLocale } = namespace;
  if (!sharedConstants || !sharedLocale) {
    return;
  }

  const { ASSETS } = sharedConstants;
  const { getLocalizedStrings, resolveLocaleFromDocument } = sharedLocale;

  function createSupportMenu(targetDocument: Document, repoLink: HTMLButtonElement) {
    const supportMenu = targetDocument.createElement("div");
    supportMenu.id = "ccxp-lite-support-menu";
    supportMenu.className = "ccxp-lite-support-menu";
    supportMenu.setAttribute("popover", "auto");
    supportMenu.setAttribute("aria-label", "ccxpLite");
    const reportLink = targetDocument.createElement("a");
    reportLink.textContent = "\u554F\u984C\u56DE\u5831";
    reportLink.href =
      "https://docs.google.com/forms/d/e/1FAIpQLSeVG1MazLdDLtuTnYjWoathrmsERmYPgiPrUNgLyBMJ3vvrxA/viewform";
    const githubLink = targetDocument.createElement("a");
    githubLink.textContent = "GitHub";
    githubLink.href = "https://github.com/sago-cream/ccxp-lite";
    for (const link of [reportLink, githubLink]) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      supportMenu.append(link);
    }
    repoLink.setAttribute("aria-expanded", "false");
    repoLink.setAttribute("aria-controls", supportMenu.id);

    repoLink.addEventListener("click", () => {
      const bounds = repoLink.getBoundingClientRect();
      supportMenu.style.left = `${Math.max(8, Math.min(bounds.left, targetDocument.documentElement.clientWidth - 168))}px`;
      supportMenu.style.top = `${bounds.bottom + 8}px`;
      supportMenu.togglePopover();
    });

    const dismissSupportMenu = () => {
      if (supportMenu.matches(":popover-open")) {
        supportMenu.hidePopover();
      }
    };
    supportMenu.addEventListener("toggle", () => {
      const isOpen = supportMenu.matches(":popover-open");
      repoLink.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        reportLink.focus();
        // Pointer events in sibling frames do not reach this document.
        targetDocument.defaultView?.addEventListener("blur", dismissSupportMenu);
      } else {
        targetDocument.defaultView?.removeEventListener("blur", dismissSupportMenu);
      }
    });
    supportMenu.addEventListener("click", (event) => {
      if ((event.target as Element).closest("a")) {
        supportMenu.hidePopover();
      }
    });

    return supportMenu;
  }

  function createBrandImage(
    targetDocument: Document,
    className: string,
    assetPath = ASSETS.brandLogoPath,
  ) {
    const runtime = namespace.sharedDom?.getRuntimeSafely();
    const image = targetDocument.createElement("img");
    image.className = className;
    image.alt = getLocalizedStrings(resolveLocaleFromDocument(targetDocument)).sidebarTitle;

    if (runtime) {
      image.src = runtime.getURL(assetPath);
    }

    return image;
  }

  function createBrandCopy(
    targetDocument: Document,
    containerClassName: string,
    titleClassName: string,
    title: string,
  ) {
    const copy = targetDocument.createElement("div");
    copy.className = containerClassName;

    const titleNode = targetDocument.createElement("div");
    titleNode.className = titleClassName;

    if (titleClassName === "ccxp-lite-sidebar-brand-title" && title.includes(" ")) {
      for (const word of title.split(" ")) {
        const wordNode = targetDocument.createElement("span");
        wordNode.textContent = word;
        titleNode.append(wordNode);
      }
    } else {
      titleNode.textContent = title;
    }

    copy.append(titleNode);
    return copy;
  }

  function createBrandPartnerIcon(targetDocument: Document) {
    const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "ccxp-lite-sidebar-brand-partner-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "16");
    icon.setAttribute("height", "16");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");

    for (const pathData of ["M18 6 6 18", "M6 6l12 12"]) {
      const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      icon.append(path);
    }

    return icon;
  }

  function createBrandPartnerLink(
    targetDocument: Document,
    options: {
      linkClassName?: string;
      iconWrapClassName?: string;
      copyClassName?: string;
      labelClassName?: string;
      label?: string;
    } = {},
  ) {
    const link = targetDocument.createElement("button");
    link.type = "button";
    link.className = options.linkClassName ?? "";
    link.setAttribute("aria-label", options.label ?? "");
    link.setAttribute("title", options.label ?? "");

    const iconWrap = targetDocument.createElement("span");
    iconWrap.className = options.iconWrapClassName ?? "";
    iconWrap.append(createBrandPartnerIcon(targetDocument));

    const copy = targetDocument.createElement("span");
    copy.className = options.copyClassName ?? "";

    const label = targetDocument.createElement("span");
    label.className = options.labelClassName ?? "";
    label.textContent = options.label ?? "";
    copy.append(label);
    link.append(iconWrap);
    link.append(copy);

    return { link };
  }

  namespace.sharedBrand = {
    createSupportMenu,
    createBrandImage,
    createBrandCopy,
    createBrandPartnerIcon,
    createBrandPartnerLink,
  };
})(globalThis);
