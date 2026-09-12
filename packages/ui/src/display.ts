import { createRenderer } from "./renderer.js";
import { createSearchIcon, createExternalLinkIcon, createBreadcrumbChevronIcon } from "./icons.js";

export function createSection(targetDocument: Document, className: string): HTMLElement {
  return createRenderer(targetDocument).element("section", {
    className: `ccxp-lite-landing-section ${className}`,
  });
}

export function createSectionHeading(targetDocument: Document, text: string): HTMLElement {
  return createRenderer(targetDocument).element("h2", {
    className: "ccxp-lite-section-heading",
    text,
  });
}

export function createEmptyState(
  targetDocument: Document,
  title: string,
  body?: string,
): HTMLElement {
  const dom = createRenderer(targetDocument);
  return dom.element("div", { className: "ccxp-lite-empty" }, [
    dom.element("div", { className: "ccxp-lite-empty-title", text: title }),
    body === undefined || body === ""
      ? undefined
      : dom.element("div", { className: "ccxp-lite-empty-body", text: body }),
  ]);
}

export function createSkeletonStack(
  targetDocument: Document,
  count: number,
  itemClassName: string,
): HTMLElement {
  const dom = createRenderer(targetDocument);
  return dom.element(
    "div",
    { className: "ccxp-lite-skeleton-stack" },
    Array.from({ length: count }, () => dom.element("div", { className: itemClassName })),
  );
}

export function createRowLabel(
  targetDocument: Document,
  text: string,
  withExternalLinkIcon: boolean,
): HTMLElement {
  const dom = createRenderer(targetDocument);
  return dom.element("span", { className: "ccxp-lite-row-label-wrap" }, [
    dom.element("span", { className: "ccxp-lite-row-label", text }),
    withExternalLinkIcon ? createExternalLinkIcon(targetDocument) : undefined,
  ]);
}

export function createBreadcrumbHeading(
  targetDocument: Document,
  activeCategory: { label: string } | undefined,
  activeLeaf: { label: string },
): HTMLElement {
  const dom = createRenderer(targetDocument);
  return dom.element("h2", { className: "ccxp-lite-breadcrumb-heading" }, [
    activeCategory
      ? dom.fragment(
          dom.element("span", {
            className: "ccxp-lite-breadcrumb-parent",
            text: activeCategory.label,
          }),
          createBreadcrumbChevronIcon(targetDocument),
        )
      : undefined,
    dom.element("span", {
      className: "ccxp-lite-breadcrumb-current",
      text: activeLeaf.label,
    }),
  ]);
}

export function createSidebarSearch(
  targetDocument: Document,
  strings: Readonly<Record<string, string>>,
): HTMLElement {
  const dom = createRenderer(targetDocument);
  return dom.element("label", { className: "ccxp-lite-sidebar-search" }, [
    createSearchIcon(targetDocument),
    dom.element("input", {
      className: "ccxp-lite-sidebar-search-input",
      attributes: {
        type: "search",
        autocomplete: "off",
        spellcheck: "false",
        placeholder: strings.sidebarSearchPlaceholder,
        "aria-label": strings.sidebarSearchPlaceholder,
      },
    }),
  ]);
}
