(function registerUiLanguage(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiDisplay) {
    return;
  }
  const { createSection } = namespace.uiDisplay;

  function findLanguageLinks(targetDocument: Document): HTMLElement | undefined {
    return targetDocument.querySelector<HTMLElement>("ul.links") ?? undefined;
  }

  function createLanguageSelector(
    targetDocument: Document,
    links: HTMLElement | undefined,
  ): HTMLElement {
    const section = createSection(targetDocument, "ccxp-lite-landing-lang");
    // Move the original nodes: href/target, inline handlers, and registered listeners survive.
    if (links) {
      section.append(links);
    }
    return section;
  }
  namespace.uiLanguage = { findLanguageLinks, createLanguageSelector };
})(globalThis);
