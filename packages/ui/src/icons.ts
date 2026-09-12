export function createClassicChevronIcon(
  targetDocument: Document,
  isExpanded: boolean,
): SVGElement {
  const icon = createForwardIcon(targetDocument);
  icon.classList.add("ccxp-lite-chevron");
  if (isExpanded) {
    icon.classList.add("is-expanded");
  }
  return icon;
}

export function createSearchIcon(targetDocument: Document): SVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "ccxp-lite-sidebar-search-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "20");
  icon.setAttribute("height", "20");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  for (const pathData of ["M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16", "m21 21-4.3-4.3"]) {
    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    icon.append(path);
  }
  return icon;
}

export function createBreadcrumbChevronIcon(targetDocument: Document): SVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "ccxp-lite-breadcrumb-chevron");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m9 18 6-6-6-6");
  icon.append(path);
  return icon;
}

export function createExternalLinkIcon(targetDocument: Document): SVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "ccxp-lite-link-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "18");
  icon.setAttribute("height", "18");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  for (const pathData of [
    "M15 3h6v6",
    "M10 14 21 3",
    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  ]) {
    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    icon.append(path);
  }
  return icon;
}

export function createFavoriteStarIcon(targetDocument: Document, isFavorite: boolean): SVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", `ccxp-lite-favorite-star${isFavorite ? " is-active" : ""}`);
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "18");
  icon.setAttribute("height", "18");
  icon.setAttribute("fill", isFavorite ? "currentColor" : "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M11.525 2.295a.53.53 0 0 1 .95 0l2.262 4.584a.53.53 0 0 0 .399.29l5.06.735a.53.53 0 0 1 .294.904l-3.66 3.567a.53.53 0 0 0-.152.469l.864 5.039a.53.53 0 0 1-.768.559l-4.525-2.379a.53.53 0 0 0-.493 0l-4.525 2.38a.53.53 0 0 1-.768-.56l.864-5.039a.53.53 0 0 0-.152-.469L3.51 8.808a.53.53 0 0 1 .294-.904l5.06-.735a.53.53 0 0 0 .4-.29z",
  );
  icon.append(path);
  return icon;
}

export function createLabIcon(targetDocument: Document): SVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "ccxp-lite-inline-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "18");
  icon.setAttribute("height", "18");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  for (const pathData of [
    "M10 2v7.31",
    "M14 9.3V2",
    "M8.5 2h7",
    "M14 9.3 19.74 19a2 2 0 0 1-1.72 3H5.98a2 2 0 0 1-1.72-3L10 9.3",
    "M6 16h12",
  ]) {
    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    icon.append(path);
  }
  return icon;
}

export function createBackIcon(targetDocument: Document): SVGSVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "ccxp-lite-inline-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "18");
  icon.setAttribute("height", "18");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2.2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  for (const pathData of ["M19 12H5", "m12 7-7 5 7 5"]) {
    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    icon.append(path);
  }
  return icon;
}

export function createForwardIcon(targetDocument: Document): SVGSVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "ccxp-lite-inline-icon ccxp-lite-inline-icon-muted");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "18");
  icon.setAttribute("height", "18");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m9 6 6 6-6 6");
  icon.append(path);
  return icon;
}

export function createCategoryIcon(targetDocument: Document, iconName: string): SVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "ccxp-lite-category-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "18");
  icon.setAttribute("height", "18");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  for (const shape of getCategoryIconShapes(iconName)) {
    const tagName = typeof shape === "string" ? "path" : shape.tag;
    const attributes = typeof shape === "string" ? { d: shape } : shape.attributes;
    const element = targetDocument.createElementNS("http://www.w3.org/2000/svg", tagName);
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value);
    }
    icon.append(element);
  }
  return icon;
}

function getCategoryIconShapes(iconName: string): ReadonlyArray<
  | string
  | {
      tag: string;
      attributes: Record<string, string>;
    }
> {
  const iconShapeMap: Record<
    string,
    Array<
      | string
      | {
          tag: string;
          attributes: Record<string, string>;
        }
    >
  > = {
    "circle-user-round": [
      "M17.925 20.056a6 6 0 0 0-11.851.001",
      { tag: "circle", attributes: { cx: "12", cy: "11", r: "4" } },
      { tag: "circle", attributes: { cx: "12", cy: "12", r: "10" } },
    ],
    "calendar-range": [
      "M8 2v4",
      "M16 2v4",
      "M3 10h18",
      "M7 14h5",
      "M16 14h1",
      "M16 18h1",
      "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    ],
    "notepad-text": [
      "M8 2v4",
      "M12 2v4",
      "M16 2v4",
      "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z",
      "M8 10h6",
      "M8 14h8",
      "M8 18h5",
    ],
    "message-square-more": [
      "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
      "M8 10h.01",
      "M12 10h.01",
      "M16 10h.01",
    ],
    "refresh-cw": [
      "M21 2v6h-6",
      "M3 22v-6h6",
      "M20.49 9A9 9 0 0 0 5.64 5.64L3 8",
      "M3.51 15A9 9 0 0 0 18.36 18.36L21 16",
    ],
    "graduation-cap": ["m22 10-10-5L2 10l10 5z", "M6 12v5c3 2 9 2 12 0v-5", "M19 13v6"],
    "dollar-sign": ["M12 2v20", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
    house: [
      "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
      "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    ],
    "notebook-pen": [
      "M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4",
      "M2 6h4",
      "M2 10h4",
      "M2 14h4",
      "M2 18h4",
      "M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z",
    ],
    school: [
      "M14 21v-3a2 2 0 0 0-4 0v3",
      "M18 4.933V21",
      "m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6",
      "m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11",
      "M6 4.933V21",
      "M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
    ],
    megaphone: ["M3 11v2", "M11 5 18 3v18l-7-2-5-4V9z", "M11 19v3", "M7 15v5"],
    star: [
      "M11.525 2.295a.53.53 0 0 1 .95 0l2.262 4.584a.53.53 0 0 0 .399.29l5.06.735a.53.53 0 0 1 .294.904l-3.66 3.567a.53.53 0 0 0-.152.469l.864 5.039a.53.53 0 0 1-.768.559l-4.525-2.379a.53.53 0 0 0-.493 0l-4.525 2.38a.53.53 0 0 1-.768-.56l.864-5.039a.53.53 0 0 0-.152-.469L3.51 8.808a.53.53 0 0 1 .294-.904l5.06-.735a.53.53 0 0 0 .4-.29z",
    ],
    folders: [
      "M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z",
      "M2 10h20",
    ],
  };
  return iconShapeMap[iconName] ?? iconShapeMap.folders;
}

export function createAudioIcon(targetDocument: Document): SVGSVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  for (const pathData of [
    "M11 5 6 9H2v6h4l5 4z",
    "M15.5 8.5a5 5 0 0 1 0 7",
    "M18.5 5.5a9 9 0 0 1 0 13",
  ]) {
    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    icon.append(path);
  }
  return icon;
}

export function createPasswordVisibilityIcon(
  targetDocument: Document,
  visible: boolean,
): SVGSVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "14");
  icon.setAttribute("height", "14");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  if (visible) {
    for (const pathData of [
      "M10.733 5.076A10.744 10.744 0 0 1 12 5c4.596 0 8.51 2.934 9.938 7a10.454 10.454 0 0 1-1.077 2.167",
      "M14.084 14.158a3 3 0 0 1-4.242-4.242",
      "M17.479 17.499A10.75 10.75 0 0 1 12 19c-4.596 0-8.51-2.934-9.938-7a10.525 10.525 0 0 1 4.423-5.29",
      "M2 2l20 20",
    ]) {
      const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      icon.append(path);
    }
  } else {
    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
    );
    icon.append(path);
    const circle = targetDocument.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "12");
    circle.setAttribute("cy", "12");
    circle.setAttribute("r", "3");
    icon.append(circle);
  }
  return icon;
}

export function createLandingExternalLinkIcon(targetDocument: Document): SVGSVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "ccxp-lite-landing-link-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "1em");
  icon.setAttribute("height", "1em");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  for (const pathData of [
    "M15 3h6v6",
    "M10 14 21 3",
    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  ]) {
    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    icon.append(path);
  }
  return icon;
}

export function createAnnouncementMegaphoneIcon(targetDocument: Document): SVGSVGElement {
  const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "ccxp-lite-announcement-title-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "1em");
  icon.setAttribute("height", "1em");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  for (const pathData of [
    "M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
    "M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14",
    "M8 6v8",
  ]) {
    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    icon.append(path);
  }
  return icon;
}

export function createInfoMarker(targetDocument: Document): SVGSVGElement {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const marker = targetDocument.createElementNS(svgNamespace, "svg");
  marker.classList.add("ccxp-lite-account-guide-info-marker");
  marker.setAttribute("aria-hidden", "true");
  marker.setAttribute("xmlns", svgNamespace);
  marker.setAttribute("viewBox", "0 0 24 24");
  marker.setAttribute("width", "1em");
  marker.setAttribute("height", "1em");
  marker.setAttribute("fill", "none");
  marker.setAttribute("stroke", "currentColor");
  marker.setAttribute("stroke-width", "2");
  marker.setAttribute("stroke-linecap", "round");
  marker.setAttribute("stroke-linejoin", "round");

  const circle = targetDocument.createElementNS(svgNamespace, "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");
  marker.append(circle);

  const questionStem = targetDocument.createElementNS(svgNamespace, "path");
  questionStem.setAttribute("d", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3");
  marker.append(questionStem);

  const questionDot = targetDocument.createElementNS(svgNamespace, "path");
  questionDot.setAttribute("d", "M12 17h.01");
  marker.append(questionDot);

  return marker;
}
