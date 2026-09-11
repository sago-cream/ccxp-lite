(function registerCcxpLiteLoginSupport(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const { shared } = namespace;
  if (!shared) {
    return;
  }
  const { removeNode } = shared;
  if (!namespace.loginLinks || !namespace.loginNotices) {
    return;
  }
  const { isCannotLoginLabel, buildLoginHelperLink, buildSupportLinks, buildHeaderUtilityLinks } =
    namespace.loginLinks;
  const { normalizeAnnouncementHeading, hasAnnouncementHeading, prepareAnnouncementTable } =
    namespace.loginNotices;

  function findLoginSourceCell(
    targetDocument: Document,
    loginForm: Element | undefined,
  ): HTMLElement | undefined {
    if (loginForm) {
      return loginForm.closest<HTMLElement>("td, table, section, article") ?? undefined;
    }
    return (
      [...targetDocument.querySelectorAll<HTMLElement>("td, table, div, section, article")].find(
        (cell) => cell.querySelector("form") !== null,
      ) ?? undefined
    );
  }

  function findCalendarTable(targetNode: ParentNode): HTMLTableElement | undefined {
    const calendarFrame = targetNode.querySelector<HTMLIFrameElement>(
      "iframe[src*='calendar/cal.php']",
    );
    if (!calendarFrame) {
      return undefined;
    }
    return (
      [...targetNode.querySelectorAll<HTMLTableElement>("table")].find(
        (table) =>
          table.contains(calendarFrame) &&
          ["\u6708\u66C6", "Calendar"].some((text) => table.textContent.includes(text)),
      ) ?? undefined
    );
  }

  function findAnnouncementTable(targetDocument: Document) {
    const rightPanel = [...targetDocument.querySelectorAll<HTMLTableCellElement>("td")].find(
      (cell) => {
        const widthText = normalizeLegacyWidth(cell.getAttribute("width") ?? cell.style.width);
        if (widthText !== "35%" && widthText !== "35") {
          return false;
        }
        return Boolean(cell.querySelector(".board_item, .board_subject"));
      },
    );
    const panelTables = rightPanel
      ? [...rightPanel.querySelectorAll<HTMLTableElement>("table")]
      : [];
    const fallbackTables = [...targetDocument.querySelectorAll<HTMLTableElement>("table")];
    const isAnnouncementTable = (table: HTMLTableElement) => {
      const rows = [...table.rows];
      if (rows.length === 0) {
        return false;
      }
      const headingCell = rows
        .flatMap((row) => [...row.cells])
        .find((cell) => cell.classList.contains("board_item"));
      const headingText = normalizeAnnouncementHeading(headingCell && headingCell.textContent);
      if (!hasAnnouncementHeading(headingText)) {
        return false;
      }
      const boardHeaderRow = rows.find((row) => {
        const cells = [...row.cells];
        return cells.filter((cell) => cell.classList.contains("board_subject")).length >= 2;
      });
      if (!boardHeaderRow) {
        return false;
      }
      const dateRows = rows.filter((row) => {
        const cells = [...row.cells];
        if (cells.length < 2) {
          return false;
        }
        const firstCell = cells[0];
        const secondCell = cells[1];
        const firstClass = firstCell.classList;
        const secondClass = secondCell.classList;
        const isBoardPair =
          (firstClass.contains("board_0") && secondClass.contains("board_0")) ||
          (firstClass.contains("board_1") && secondClass.contains("board_1"));
        if (!isBoardPair) {
          return false;
        }
        const rawDate = firstCell.textContent.replaceAll(/\s+/g, "").trim();
        if (!/^\d{4}(?:\/\d{2}){2}$/.test(rawDate)) {
          return false;
        }
        const topicText = secondCell.textContent.replaceAll(/\s+/g, " ").trim();
        return topicText.length > 8;
      });
      return dateRows.length >= 2;
    };
    const preferred = panelTables.find((table) => {
      if (table.closest(".tabcontent")) {
        return false;
      }
      return isAnnouncementTable(table);
    });
    if (preferred) {
      return preferred;
    }
    return fallbackTables.find((table) => isAnnouncementTable(table)) ?? undefined;
  }

  function findUtilityLinksTable(targetDocument: Document): HTMLTableElement | undefined {
    const anchor = targetDocument.querySelector(
      "a[href*='ccc.site.nthu.edu.tw'], a[href*='aisccc.site.nthu.edu.tw'], a[href*='nthu-en.site.nthu.edu.tw']",
    );
    return anchor?.closest<HTMLTableElement>("table") ?? undefined;
  }

  function findServiceLink(targetDocument: Document): HTMLElement | undefined {
    const anchor = targetDocument.querySelector<HTMLAnchorElement>(
      "a[href*='inquire_cpr.html'], a[href*='inquire_cpr_en.html']",
    );
    return anchor?.closest<HTMLElement>("div") ?? anchor ?? undefined;
  }

  function findCannotLoginLink(targetDocument: Document, utilityLinksTable: Element | undefined) {
    const isCannotLoginAnchor = (anchor: HTMLAnchorElement | undefined) => {
      if (!anchor) {
        return false;
      }
      const href = (anchor.getAttribute("href") ?? "").toLowerCase();
      if (href.includes("forget.php") || href.includes("forget_en.php")) {
        return true;
      }
      return isCannotLoginLabel(anchor.textContent);
    };
    if (!utilityLinksTable) {
      const fallbackAnchor = targetDocument.querySelector<HTMLAnchorElement>(
        "a[href*='forget.php'], a[href*='forget_en.php']",
      );
      return fallbackAnchor && isCannotLoginAnchor(fallbackAnchor) ? fallbackAnchor : undefined;
    }
    const anchors = [...utilityLinksTable.querySelectorAll<HTMLAnchorElement>("a[href]")];
    const fromUtility = anchors.find((anchor) => isCannotLoginAnchor(anchor));
    if (fromUtility) {
      return fromUtility;
    }
    const fallbackAnchor = targetDocument.querySelector<HTMLAnchorElement>(
      "a[href*='forget.php'], a[href*='forget_en.php']",
    );
    return fallbackAnchor && isCannotLoginAnchor(fallbackAnchor) ? fallbackAnchor : undefined;
  }

  function collapseLegacyServiceRow(serviceLinkNode: Element | undefined) {
    if (!serviceLinkNode) {
      return;
    }
    const sourceAnchor = serviceLinkNode.matches("a[href]")
      ? serviceLinkNode
      : serviceLinkNode.querySelector(
          "a[href*='inquire_cpr.html'], a[href*='inquire_cpr_en.html'], a[href]",
        );
    if (!sourceAnchor) {
      return;
    }
    const sourceRow = sourceAnchor.closest("tr");
    if (!sourceRow) {
      removeNode(sourceAnchor.closest("div") ?? sourceAnchor);
      return;
    }
    const previousRow = sourceRow.previousElementSibling;
    const nextRow = sourceRow.nextElementSibling;
    removeNode(sourceRow);
    if (isLikelySpacerRow(previousRow ?? undefined)) {
      removeNode(previousRow ?? undefined);
    }
    if (isLikelySpacerRow(nextRow ?? undefined)) {
      removeNode(nextRow ?? undefined);
    }
  }

  function collapseLegacyCannotLoginLink(cannotLoginAnchor: Element | undefined) {
    if (!cannotLoginAnchor) {
      return;
    }
    const sourceAnchor = cannotLoginAnchor.matches("a[href]")
      ? cannotLoginAnchor
      : cannotLoginAnchor.closest("a[href]");
    if (!sourceAnchor) {
      return;
    }
    removeAdjacentLegacyBreak(sourceAnchor, "previous");
    removeAdjacentLegacyBreak(sourceAnchor, "next");
    removeNode(sourceAnchor);
  }

  function removeAdjacentLegacyBreak(node: Node, direction: "previous" | "next") {
    const sibling = direction === "previous" ? node.previousSibling : node.nextSibling;
    if (!sibling) {
      return;
    }
    if (sibling.nodeType === Node.TEXT_NODE) {
      const normalizedText = (sibling.textContent ?? "").replaceAll("\u00A0", " ").trim();
      if (normalizedText === "") {
        removeNode(sibling);
      }
      return;
    }
    if (sibling.nodeType === Node.ELEMENT_NODE && (sibling as Element).tagName === "BR") {
      removeNode(sibling);
    }
  }

  function collapseLegacyUtilityRow(utilityLinksTable: Element | undefined) {
    if (!utilityLinksTable) {
      return;
    }
    const sourceCell = utilityLinksTable.closest("td");
    if (!sourceCell) {
      return;
    }
    const sourceRow = sourceCell.closest("tr");
    if (!sourceRow) {
      return;
    }
    removeNode(sourceCell);
    const rowCells = [...sourceRow.children].filter(
      (node): node is HTMLTableCellElement => node instanceof HTMLTableCellElement,
    );
    for (const cell of rowCells) {
      if (isLegacySpacerCell(cell)) {
        removeNode(cell);
      }
    }
    const remainingCells = [...sourceRow.children].filter(
      (node): node is HTMLTableCellElement => node instanceof HTMLTableCellElement,
    );
    if (remainingCells.length === 1) {
      remainingCells[0].setAttribute("width", "100%");
      remainingCells[0].style.width = "100%";
    }
  }

  function isLikelySpacerRow(row: Element | undefined) {
    if (!row || row.tagName !== "TR") {
      return false;
    }
    const cells = [...row.children].filter(
      (node): node is HTMLTableCellElement => node instanceof HTMLTableCellElement,
    );
    if (cells.length === 0) {
      return false;
    }
    const hasInteractiveContent = cells.some(
      (cell) => cell.querySelector("a, button, input, select, textarea, table, iframe") !== null,
    );
    if (hasInteractiveContent) {
      return false;
    }
    const text = cells
      .map((cell) => cell.textContent.replaceAll("\u00A0", " "))
      .join(" ")
      .replaceAll(/\s+/g, " ")
      .trim();
    if (text !== "") {
      return false;
    }
    const rowHeight = (row.getAttribute("height") ?? "").trim();
    const cellHasHeight = cells.some((cell) => (cell.getAttribute("height") ?? "").trim() !== "");
    return rowHeight !== "" || cellHasHeight;
  }

  function isLegacySpacerCell(cell: HTMLTableCellElement | undefined) {
    if (!cell) {
      return false;
    }
    const widthText = (cell.getAttribute("width") ?? "").trim().toLowerCase();
    const normalizedText = cell.textContent.replaceAll("\u00A0", " ").trim();
    if ((widthText === "3%" || widthText === "3") && normalizedText === "") {
      return true;
    }
    return (
      normalizedText === "" && cell.querySelector("table, iframe, form, input, button, a") === null
    );
  }

  function collapseLegacyThreeColumnRows(rootNode: ParentNode | undefined) {
    if (!rootNode) {
      return;
    }
    const rows = [...rootNode.querySelectorAll<HTMLTableRowElement>("tr")];
    for (const row of rows) {
      if (shouldSkipLegacyRowCollapse(row)) {
        continue;
      }
      const cells = [...row.children].filter(
        (node): node is HTMLTableCellElement => node instanceof HTMLTableCellElement,
      );
      if (cells.length < 2) {
        continue;
      }
      const leftCell = cells.find((cell) => isLegacyWideLeftCell(cell));
      const rightCell = cells.find((cell) => isLegacyRightPanelCell(cell));
      if (!leftCell || !rightCell) {
        continue;
      }
      if (!isLikelyEmptyCell(leftCell)) {
        continue;
      }
      const spacerCell = cells.find(
        (cell) =>
          isLegacySpacerCell(cell) ||
          normalizeLegacyWidth(cell.getAttribute("width") ?? cell.style.width) === "3%",
      );
      removeNode(leftCell);
      removeNode(spacerCell ?? undefined);
      rightCell.removeAttribute("width");
      rightCell.style.width = "100%";
      rightCell.style.minWidth = "0";
      rightCell.colSpan = Math.max(1, rightCell.colSpan);
      for (const cell of [...row.children].filter(
        (node): node is HTMLTableCellElement => node instanceof HTMLTableCellElement,
      )) {
        if (cell !== rightCell) {
          cell.removeAttribute("width");
        }
      }
    }
  }

  function isLegacyWideLeftCell(cell: HTMLTableCellElement | undefined) {
    if (!cell) {
      return false;
    }
    const widthText = normalizeLegacyWidth(cell.getAttribute("width") ?? cell.style.width);
    const styleText = (cell.getAttribute("style") ?? "").toLowerCase();
    return widthText === "60%" && styleText.includes("min-width") && styleText.includes("30em");
  }

  function isLegacyRightPanelCell(cell: HTMLTableCellElement | undefined) {
    if (!cell) {
      return false;
    }
    const widthText = normalizeLegacyWidth(cell.getAttribute("width") ?? cell.style.width);
    return widthText === "35%";
  }

  function isLikelyEmptyCell(cell: HTMLTableCellElement | undefined) {
    if (!cell) {
      return false;
    }
    const normalizedText = cell.textContent
      .replaceAll("\u00A0", " ")
      .replaceAll(/\s+/g, " ")
      .trim();
    if (normalizedText !== "") {
      return false;
    }
    return (
      cell.querySelector(
        "img, iframe, form, input, button, select, textarea, a, object, embed, video, audio, table, div, span, ul, ol, p",
      ) === null
    );
  }

  function shouldSkipLegacyRowCollapse(row: HTMLTableRowElement | undefined) {
    if (!row) {
      return true;
    }
    const table = row.closest("table");
    if (!table) {
      return false;
    }
    if (table.classList.contains("ccxp-lite-announcement-table")) {
      return true;
    }
    if (table.querySelector(".board_item, .board_subject, .board_0, .board_1")) {
      return true;
    }
    return false;
  }

  function normalizeLegacyWidth(rawValue: string | undefined) {
    return (rawValue ?? "").replaceAll(/\s+/g, "").toLowerCase();
  }
  namespace.loginSupport = {
    findLoginSourceCell,
    findAnnouncementTable,
    findUtilityLinksTable,
    findCannotLoginLink,
    findServiceLink,
    buildHeaderUtilityLinks,
    buildSupportLinks,
    buildLoginHelperLink,
    collapseLegacyServiceRow,
    collapseLegacyCannotLoginLink,
    collapseLegacyUtilityRow,
    collapseLegacyThreeColumnRows,
    findCalendarTable,
    prepareAnnouncementTable,
  };
})(globalThis);
