(function registerLoginNoticeView(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiRenderer || !namespace.uiIcons) {
    return;
  }
  const { createRenderer } = namespace.uiRenderer;
  const { createAnnouncementMegaphoneIcon } = namespace.uiIcons;

  function renderAnnouncementTable(
    table: HTMLTableElement,
    titleText: string,
    entries: readonly CcxpLiteAnnouncementEntry[],
    strings: Readonly<Record<string, string>>,
  ) {
    const targetDocument = table.ownerDocument;
    const dom = createRenderer(targetDocument);
    const tbody = table.tBodies[0];
    if (table.tBodies.length === 0) {
      table.append(tbody);
    }
    tbody.textContent = "";
    const titleRow = dom.element("tr", { className: "ccxp-lite-announcement-title-row" }, [
      dom.element("td", { className: "ccxp-lite-announcement-title" }, [
        dom.element(
          "h3",
          { className: "ccxp-lite-announcement-title-heading ccxp-lite-account-guide-title" },
          [
            dom.element("span", {
              className: "ccxp-lite-announcement-title-label",
              text: titleText === "" ? strings.sidebarCategoryAnnouncementsAndVoting : titleText,
            }),
            createAnnouncementMegaphoneIcon(targetDocument),
          ],
        ),
      ]),
    ]);
    const list = dom.element("div", { className: "ccxp-lite-announcement-list" });
    for (const entry of entries) {
      const body = dom.element("div", { className: "ccxp-lite-announcement-topic" });
      while (entry.topicContent.firstChild) {
        body.append(entry.topicContent.firstChild);
      }
      removeEmptyAnnouncementDecorators(body);
      const entryRow = dom.element(
        "div",
        {
          className: `ccxp-lite-announcement-entry${
            entry.hasTokenizedHeader ? " ccxp-lite-announcement-entry--merged-date" : ""
          }`,
        },
        [
          body,
          entry.hasTokenizedHeader
            ? undefined
            : dom.element("div", {
                className: "ccxp-lite-announcement-date",
                text: entry.date,
              }),
        ],
      );
      list.append(dom.element("article", { className: "ccxp-lite-announcement-row" }, [entryRow]));
    }
    const contentRow = dom.element("tr", { className: "ccxp-lite-announcement-scroll-row" }, [
      dom.element("td", { className: "ccxp-lite-announcement-content-cell" }, [list]),
    ]);
    dom.append(tbody, titleRow, contentRow);
  }

  function removeEmptyAnnouncementDecorators(topicContent: HTMLElement) {
    const decorativeSelector = "b, strong, font, span, i, em, u";
    let removedAny: boolean;
    do {
      removedAny = false;
      for (const node of topicContent.querySelectorAll<HTMLElement>(decorativeSelector)) {
        const normalizedText = node.textContent.replaceAll("\u00A0", " ").trim();
        if (
          normalizedText === "" &&
          !node.querySelector("a, button, input, select, textarea, img, svg, table, iframe")
        ) {
          node.remove();
          removedAny = true;
        }
      }
    } while (removedAny);
  }

  namespace.loginNoticeView = { renderAnnouncementTable };
})(globalThis);
