(function registerLoginNotices(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.shared || !namespace.loginNoticeView) {
    return;
  }
  const { getLocalizedStrings, removeNode, cleanLegacyAttributes } = namespace.shared;
  const { renderAnnouncementTable } = namespace.loginNoticeView;

  function normalizeAnnouncementHeading(rawText: string | undefined) {
    return (rawText ?? "").replaceAll(/\s+/g, " ").trim().toLowerCase();
  }

  function hasAnnouncementHeading(headingText: string) {
    return [
      "\u7CFB\u7D71\u516C\u544A",
      "notice",
      "system news",
      "academic system news",
      "system notice",
      "system announcement",
      "announcement",
    ].some((pattern) => headingText.includes(pattern));
  }

  function prepareAnnouncementTable(
    table: HTMLTableElement | undefined,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
  ) {
    if (!table || table.dataset.ccxpLiteAnnouncementPrepared === "true") {
      return undefined;
    }
    table.classList.add("ccxp-lite-announcement-table");
    const rows = [...table.rows];
    for (const row of rows) {
      const cells = [...row.cells];
      if (cells.length === 0) {
        continue;
      }
      const hasOnlyDecorativeCells = cells.every((cell) => {
        const hasBgColor = (cell.getAttribute("bgcolor") ?? "").trim() !== "";
        const text = cell.textContent.replaceAll(/\s+/g, "").trim();
        return hasBgColor && text === "";
      });
      const hasOnlyEmptySpacerCells = cells.every((cell) => {
        const text = cell.textContent.replaceAll(/\s+/g, "").trim();
        if (text !== "") {
          return false;
        }
        return !cell.querySelector("img, iframe, table, form, input, button, a, ul, ol, p");
      });
      const hasLegacySpacerHeight =
        (row.getAttribute("height") ?? "").trim() !== "" ||
        cells.some((cell) => (cell.getAttribute("height") ?? "").trim() !== "");
      if (hasOnlyDecorativeCells) {
        removeNode(row);
        continue;
      }
      if (hasOnlyEmptySpacerCells && hasLegacySpacerHeight) {
        removeNode(row);
      }
    }
    const headerCell = rows
      .flatMap((row) => [...row.cells])
      .find((cell) => cell.classList.contains("board_item"));
    const titleText = (headerCell ? headerCell.textContent : "").replaceAll(/\s+/g, " ").trim();
    const headerRow = rows.find((row) => {
      const cells = [...row.cells];
      return cells.filter((cell) => cell.classList.contains("board_subject")).length >= 2;
    });
    if (headerRow) {
      removeNode(headerRow);
    }
    const entries: CcxpLiteAnnouncementEntry[] = [];
    for (const row of rows) {
      const cells = [...row.cells];
      if (cells.length < 2) {
        continue;
      }
      const rawDate = cells[0].textContent.replaceAll(/\s+/g, "").trim();
      if (!/^\d{4}(?:\/\d{2}){2}$/.test(rawDate)) {
        continue;
      }
      const topicCell = cells[1];
      const topicContent = topicCell.cloneNode(true) as HTMLElement;
      if (typeof cleanLegacyAttributes === "function") {
        cleanLegacyAttributes(topicContent);
      }
      if (isPasswordHelpAnnouncement(topicContent, strings)) {
        continue;
      }
      entries.push({
        date: rawDate,
        topicContent,
        hasTokenizedHeader: tokenizeAnnouncementHeader(topicContent, rawDate),
      });
    }
    if (entries.length === 0) {
      const announcementTable = table;
      announcementTable.hidden = true;
      announcementTable.dataset.ccxpLiteAnnouncementPrepared = "true";
      return undefined;
    }
    const primaryActionAnchor = extractPrimaryAnnouncementAction(entries[0]?.topicContent);
    if (primaryActionAnchor) {
      entries.shift();
    }
    if (entries.length === 0) {
      const announcementTable = table;
      announcementTable.hidden = true;
      announcementTable.dataset.ccxpLiteAnnouncementPrepared = "true";
      return primaryActionAnchor;
    }
    renderAnnouncementTable(table, titleText, entries, strings);
    const announcementTable = table;
    announcementTable.dataset.ccxpLiteAnnouncementPrepared = "true";
    return primaryActionAnchor;
  }

  function extractPrimaryAnnouncementAction(topicContent: HTMLElement | undefined) {
    if (!topicContent) {
      return undefined;
    }
    const sourceAnchor = topicContent.querySelector<HTMLAnchorElement>("a[href]");
    if (!sourceAnchor) {
      return undefined;
    }
    return sourceAnchor.cloneNode(true) as HTMLAnchorElement;
  }

  function isPasswordHelpAnnouncement(
    topicContent: HTMLElement,
    strings: Readonly<Record<string, string>>,
  ) {
    const text = topicContent.textContent.replaceAll(/\s+/g, "").toLowerCase();
    const rawCannotLoginText = Reflect.get(strings, "cannotLogin");
    const cannotLoginText =
      typeof rawCannotLoginText === "string"
        ? rawCannotLoginText.replaceAll(/\s+/g, "").toLowerCase()
        : "";
    const anchors = [...topicContent.querySelectorAll<HTMLAnchorElement>("a[href]")];
    const hasRecoveryLink = anchors.some((anchor) => {
      const href = (anchor.getAttribute("href") ?? "").toLowerCase();
      return href.includes("forget.php") || href.includes("forget_en.php");
    });
    if (hasRecoveryLink) {
      return true;
    }
    const mentionsCannotLogin =
      (cannotLoginText !== "" && text.includes(cannotLoginText)) ||
      text.includes("\u7121\u6CD5\u767B\u5165") ||
      text.includes("\u65E0\u6CD5\u767B\u5165") ||
      text.includes("cannotlogin") ||
      text.includes("cantlogin") ||
      text.includes("can'tlogin".replaceAll("'", ""));
    const mentionsPassword =
      text.includes("\u5BC6\u78BC") || text.includes("\u5BC6\u7801") || text.includes("password");
    const mentionsRecovery =
      text.includes("\u5FD8\u8A18") ||
      text.includes("\u91CD\u8A2D") ||
      text.includes("\u91CD\u7F6E") ||
      text.includes("\u555F\u7528") ||
      text.includes("\u542F\u7528") ||
      text.includes("reset") ||
      text.includes("forgot") ||
      text.includes("forget") ||
      text.includes("activation") ||
      text.includes("first-time");
    return mentionsPassword && (mentionsCannotLogin || mentionsRecovery);
  }

  function tokenizeAnnouncementHeader(topicContent: HTMLElement, date: string): boolean {
    const topicText = topicContent.textContent;
    const leadingTitleMatch = topicText.match(
      /^\s*\u3010([^\u3011]+)\u3011(?=\s|$|[.\uFF0E:\uFF1A])/u,
    );
    if (!leadingTitleMatch) {
      return false;
    }
    const label = leadingTitleMatch[1].trim();
    if (label === "") {
      return false;
    }
    const walker = topicContent.ownerDocument.createTreeWalker(topicContent, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();
    while (textNode) {
      const text = textNode.textContent ?? "";
      const match = text.match(/^(\s*)\u3010([^\u3011]+)\u3011([\s.\uFF0E:\uFF1A]*)/u);
      if (match) {
        const topicDocument = topicContent.ownerDocument;
        const header = topicDocument.createElement("span");
        header.className = "ccxp-lite-announcement-topic-header";
        header.textContent = `${date} ${label}`;
        textNode.textContent = `${match[1]}${text.slice(match[0].length)}`;
        const insertionTarget = findAnnouncementHeaderInsertionTarget(topicContent, textNode);
        if (insertionTarget) {
          const insertionAnchor = insertionTarget as ChildNode & {
            before: (...nodes: readonly Node[]) => void;
          };
          insertionAnchor.before(header);
          if (textNode.textContent.trim() !== "") {
            insertionAnchor.before(topicDocument.createTextNode(" "));
          }
        } else {
          topicContent.prepend(header);
          if (textNode.textContent.trim() !== "") {
            topicContent.insertBefore(topicDocument.createTextNode(" "), header.nextSibling);
          }
        }
        return true;
      }
      if (text.trim() !== "") {
        return false;
      }
      textNode = walker.nextNode();
    }
    return false;
  }

  function findAnnouncementHeaderInsertionTarget(
    topicContent: HTMLElement,
    textNode: Node,
  ): Node | undefined {
    let currentNode: Node = textNode;
    while (currentNode.parentNode && currentNode.parentNode !== topicContent) {
      currentNode = currentNode.parentNode;
    }
    return currentNode.parentNode === topicContent ? currentNode : undefined;
  }
  namespace.loginNotices = {
    normalizeAnnouncementHeading,
    hasAnnouncementHeading,
    prepareAnnouncementTable,
  };
})(globalThis);
