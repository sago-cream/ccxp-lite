(function installWorkLogLanguage() {
  // Transport responses must remain raw until imported into the visible document.
  if (window.name.startsWith("ccxp-lite-pe14d-")) {
    return;
  }
  let english = false;
  let activeSection = "add";
  const navigationKey = `ccxp-lite-work-log-view:${globalThis.location.pathname}`;
  let searching = false;
  try {
    const saved = sessionStorage.getItem(navigationKey);
    sessionStorage.removeItem(navigationKey);
    if (saved !== null && saved !== "") {
      const state = JSON.parse(saved) as { section?: string; english?: boolean; time?: number };
      if (Date.now() - (state.time ?? 0) < 60_000) {
        if (["add", "records", "search"].includes(state.section ?? "")) {
          activeSection = state.section === "records" ? "search" : (state.section ?? "add");
        }
        english = state.english === true;
      }
    }
  } catch {
    // Storage can be unavailable in embedded legacy pages.
  }
  window.addEventListener("pagehide", () => {
    try {
      sessionStorage.setItem(
        navigationKey,
        JSON.stringify({
          section: searching ? "search" : activeSection,
          english,
          time: Date.now(),
        }),
      );
    } catch {
      // Keep native navigation working when storage is unavailable.
    }
  });
  const originals = new WeakMap<Text, string>();
  const rendered = new WeakMap<Text, string>();
  const buttonLabels = new WeakMap<HTMLInputElement, string>();
  const translations: Record<string, string> = {
    "\u672C\u6B21\u6539\u7248\u914D\u5408\u300C\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u300D\u9032\u884C\u8ABF\u6574\uFF0C\u5167\u5BB9\u5982\u4E0B\uFF1A":
      "This update integrates the Assistant Registration System:",
    // eslint-disable-next-line no-useless-computed-key -- Keep localized keys escaped for the ASCII source policy.
    ["\u517C\u4EFB\u52A9\u7406\u8655\u7406\u8868\u5C07\u958B\u59CB\u9700\u8981\u586B\u5831\u6642\u6578"]:
      "Part-time assistants must report their working hours.",
    "\u5DE5\u6642\u7CFB\u7D71\u6642\u6578\u5360\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u6642\u6578\u4E94\u6210?\u77F7A\u6838\u767C\u5168\u6578\u85AA\u8CC7":
      "Full salary is paid when reported hours reach half the hours in the Assistant Registration System.",
    "\u5982\u672A\u586B\u6EFF\uFF0C\u7531\u7CFB\u7D71\u767C\u4FE1\u901A\u77E5\u88DC\u586B\u6642\u6578\u5F8C\uFF0C\u5C07\u65BC\u88DC\u767C\u85AA\u8CC7\u7A0B\u5E8F\u4E2D\u6838\u767C\uFF0C\u66AB\u4E0D\u6838\u767C\u5176\u85AA\u8CC7\u3002":
      "If hours are incomplete, the system will email a reminder. Salary is withheld until hours are completed and will then be paid through the supplemental payroll process.",

    "\u300C\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u300D\u4EFB\u52D9\u8CC7\u8A0A": "Task information",
    "\u300C\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u300D\u5E8F\u865F":
      "Assistant Registration System serial number",
    "\u986F\u793A\u300C104/9/24\u6539\u7248\u63D0\u9192\u300D\uFF08\u7B2C\u4E00\u6B21\u64CD\u4F5C\u524D\u8ACB\u52D9\u5FC5\u8A73\u95B1\uFF09":
      "Show September 24, 2015 update notice (please read before first use)",
    "\u96B1\u85CF\u300C104/9/24\u6539\u7248\u63D0\u9192\u300D\uFF08\u7B2C\u4E00\u6B21\u64CD\u4F5C\u524D\u8ACB\u52D9\u5FC5\u8A73\u95B1\uFF09":
      "Hide September 24, 2015 update notice",
    // eslint-disable-next-line no-useless-computed-key -- Keep localized keys escaped for the ASCII source policy.
    ["\u63D0\u9192"]: "Reminder",
  };
  function splitLabel(text: string): [string, string] | undefined {
    const department = /^([A-Z0-9]+\s*-\s*)(.*?)\s+\/\s*(.*)$/u.exec(text);
    if (department) {
      return [
        `${department[1]}${department[2]}`,
        `${department[1]}${department[3] === "" ? "English name unavailable" : department[3]}`,
      ];
    }
    const slash = /^(.*[\u3400-\u9FFF].*?)\s*\/\s*([A-Za-z].*)$/u.exec(text);
    if (slash) {
      return [slash[1], slash[2]];
    }
    const parenthesis = /^(.*[\u3400-\u9FFF].*?)\s*\(([A-Za-z][\s\S]*)\)[\uFF0D\s]*$/u.exec(text);
    if (parenthesis) {
      return [parenthesis[1], parenthesis[2]];
    }
    if (text.includes("Necessary Column") && text.startsWith("*\u5FC5\u9078")) {
      return ["*\u5FC5\u9078", "*Required"];
    }
    if (text.includes("Manual(Chinese only)")) {
      return ["\u4E2D\u6587\u7248\u64CD\u4F5C\u8AAA\u660E", "Manual (Chinese only)"];
    }
    return undefined;
  }

  // Match the login page's info popover interaction and shared CSS classes.
  function createUpdateNotice(content: HTMLElement) {
    const wrap = document.createElement("span");
    wrap.className = "ccxp-lite-account-guide-info ccxp-lite-work-log-notice";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ccxp-lite-account-guide-info-button";
    button.setAttribute("aria-controls", content.id);
    button.setAttribute("aria-expanded", "false");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "1em");
    icon.setAttribute("height", "1em");
    icon.setAttribute("aria-hidden", "true");
    icon.classList.add("ccxp-lite-account-guide-info-marker");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M12 8h.01M11 12h1v5h1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    icon.append(path);
    const caption = document.createElement("span");
    caption.className = "ccxp-lite-work-log-notice-label";
    button.append(icon, caption);
    content.classList.add("ccxp-lite-account-guide-info-popup");
    content.style.removeProperty("display");
    content.setAttribute("hidden", "");
    wrap.append(button, content);
    let pinned = false;
    let hovered = false;
    let suppressHover = false;
    const sync = () => {
      const open = pinned || (hovered && !suppressHover);
      content.toggleAttribute("hidden", !open);
      wrap.dataset.ccxpLitePopupOpen = String(open);
      button.setAttribute("aria-expanded", String(open));
    };
    wrap.addEventListener("mouseenter", () => {
      hovered = true;
      suppressHover = false;
      sync();
    });
    wrap.addEventListener("mouseleave", () => {
      hovered = false;
      suppressHover = false;
      sync();
    });
    button.addEventListener("click", () => {
      pinned = !pinned;
      suppressHover = !pinned;
      sync();
    });
    wrap.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        pinned = false;
        suppressHover = true;
        sync();
        button.focus();
      }
    });
    const outsideClick = (event: MouseEvent) => {
      if (!wrap.isConnected) {
        document.removeEventListener("click", outsideClick);
        return;
      }
      if (!wrap.contains(event.target as Node | null)) {
        pinned = false;
        suppressHover = true;
        sync();
      }
    };
    document.addEventListener("click", outsideClick);
    return wrap;
  }

  function selectSection(event: Event) {
    const input = event.currentTarget;
    if (input instanceof HTMLInputElement && input.checked) {
      activeSection = input.value;
      render();
    }
  }

  function renderSectionSwitch() {
    const addPanel = document.querySelector<HTMLElement>("#insTask");
    const searchPanel = document.querySelector<HTMLElement>("#queTask");
    if (!addPanel || !searchPanel) {
      return;
    }
    const records = document.querySelector<HTMLElement>("#listForm");
    if (records && !searchPanel.contains(records)) {
      searchPanel.append(records);
    }
    let group = document.querySelector<HTMLElement>("#ccxp-lite-work-log-sections");
    if (!group) {
      group = document.createElement("div");
      group.id = "ccxp-lite-work-log-sections";
      group.setAttribute("role", "radiogroup");
      for (const [value, panelId] of [
        ["add", "insTask"],
        ["search", "queTask"],
      ]) {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "ccxp-lite-work-log-section";
        input.value = value;
        input.setAttribute("aria-controls", panelId);
        input.addEventListener("change", selectSection);
        label.append(input, document.createElement("span"));
        group.append(label);
      }
      addPanel.before(group);
    }
    group.setAttribute("aria-label", english ? "Working hours" : "\u5DE5\u6642");
    for (const input of group.querySelectorAll<HTMLInputElement>("input")) {
      input.checked = input.value === activeSection;
      const caption = input.nextElementSibling;
      if (caption) {
        const labels: Record<string, string> = english
          ? { add: "Add hours", search: "Search hours" }
          : {
              add: "\u65B0\u589E\u5DE5\u6642",
              search: "\u67E5\u8A62\u5DE5\u6642",
            };
        caption.textContent = labels[input.value];
      }
    }
    document.documentElement.dataset.ccxpLiteWorkLogSection = activeSection;
  }

  function recordLabel(zh: string, en: string) {
    const label = document.createElement("span");
    label.dataset.recordZh = zh;
    label.dataset.recordEn = en;
    return label;
  }

  function simplifyRecords() {
    const table = document.querySelector<HTMLTableElement>("#listForm table");
    if (!table || table.dataset.ccxpLiteRecords === "true") {
      return;
    }
    const header = table.rows.item(0);
    // Leave unfamiliar legacy table variants intact.
    if (
      !header ||
      header.cells.length !== 15 ||
      !header.textContent.includes("\u5DE5\u4F5C\u65E5\u671F")
    ) {
      return;
    }
    if (
      [...table.rows]
        .slice(1)
        .some(
          (row) =>
            row.cells.length !== 1 &&
            !row.textContent.includes("\u7D2F\u8A08") &&
            (row.cells.length !== 15 || [...row.cells].some((cell) => cell.colSpan !== 1)),
        )
    ) {
      return;
    }
    table.dataset.ccxpLiteRecords = "true";
    table.removeAttribute("width");
    const headings = [
      ["\u5DE5\u4F5C\u65E5\u671F", "Working date"],
      ["\u5DE5\u4F5C\u6642\u9593\uFF0F\u6642\u6578", "Time / hours"],
      ["\u5DE5\u4F5C\u55AE\u4F4D\uFF0F\u5167\u5BB9", "Department / work"],
      ["\u5BE9\u6838\u72C0\u614B\uFF0F\u6838\u5B9A\u6642\u6578", "Approval / approved hours"],
      ["\u64CD\u4F5C", "Actions"],
    ];
    const detailFields: Array<[number, string, string]> = [
      [0, "\u5E8F\u865F", "Record number"],
      [4, "\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u5E8F\u865F", "Assistant registration number"],
      [7, "\u5DE5\u4F5C\u8005\u767B\u9304\uFF0F\u4FEE\u6539\u6642\u9593", "Registered / modified"],
      [
        10,
        "\u5BE9\u6838\uFF0F\u53D6\u6D88\u5BE9\u6838\u6642\u9593\u53CA\u4EBA\u54E1",
        "Approval / cancellation history",
      ],
      [11, "\u99C1\u56DE\u539F\u56E0", "Rejection reason"],
      [12, "\u99C1\u56DE\u6642\u9593\u53CA\u4EBA\u54E1", "Rejection history"],
    ];
    const rows = [...table.rows].slice(1);
    for (const row of rows) {
      const cells = [...row.cells];
      if (cells.length === 1) {
        cells[0].colSpan = headings.length;
        continue;
      }
      if (cells.length !== 15 || cells.some((cell) => cell.colSpan !== 1)) {
        const summary = document.createElement("div");
        summary.className = "ccxp-lite-record-totals";
        for (const cell of cells) {
          const part = document.createElement("span");
          part.append(...cell.childNodes);
          summary.append(part);
        }
        row.textContent = "";
        const cell = row.insertCell();
        cell.colSpan = headings.length;
        cell.append(summary);
        continue;
      }
      const detailRow = document.createElement("tr");
      detailRow.className = "ccxp-lite-record-detail";
      detailRow.id = `ccxp-lite-record-detail-${row.rowIndex}`;
      detailRow.hidden = true;
      const detailCell = detailRow.insertCell();
      detailCell.colSpan = headings.length;
      const details = document.createElement("dl");
      for (const [index, zh, en] of detailFields) {
        const field = document.createElement("div");
        const term = document.createElement("dt");
        term.append(recordLabel(zh, en));
        const value = document.createElement("dd");
        value.append(...cells[index].childNodes);
        field.append(term, value);
        details.append(field);
      }
      detailCell.append(details);
      row.textContent = "";
      for (const indices of [[1], [2, 3], [5, 6], [9, 8], [13, 14]]) {
        const cell = row.insertCell();
        for (const index of indices) {
          const part = document.createElement("div");
          if (index === 3 || index === 8) {
            part.className = "ccxp-lite-record-secondary";
            part.append(
              recordLabel(
                index === 3 ? "\u6642\u6578\uFF1A" : "\u6838\u5B9A\u6642\u6578\uFF1A",
                index === 3 ? "Hours: " : "Approved hours: ",
              ),
            );
          }
          part.append(...cells[index].childNodes);
          cell.append(part);
        }
      }
      const actions = row.cells[4];
      actions.classList.add("ccxp-lite-record-actions");
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "ccxp-lite-record-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", detailRow.id);
      toggle.append(recordLabel("\u8A73\u7D30\u8CC7\u6599", "Details"));
      toggle.addEventListener("click", () => {
        detailRow.hidden = !detailRow.hidden;
        toggle.setAttribute("aria-expanded", String(!detailRow.hidden));
      });
      actions.append(toggle);
      row.after(detailRow);
    }
    header.textContent = "";
    for (const [zh, en] of headings) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.append(recordLabel(zh, en));
      header.append(cell);
    }
  }

  function render() {
    observer.disconnect();
    if (!document.querySelector("#divTitle, #listForm table")) {
      observe();
      return;
    }
    let nav = document.querySelector<HTMLElement>("#ccxp-lite-work-log-nav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "ccxp-lite-work-log-nav";
      const label = document.createElement("label");
      label.className = "ccxp-lite-work-log-language";
      const caption = document.createElement("span");
      caption.textContent = "English";
      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.className = "ccxp-lite-work-log-switch";
      toggle.setAttribute("role", "switch");
      toggle.setAttribute("aria-label", "English");
      toggle.addEventListener("change", () => {
        english = toggle.checked;
        render();
      });
      label.append(caption, toggle);
      nav.append(label);
      const manual = document.querySelector<HTMLAnchorElement>('a[href*="20141023_Manual.pdf"]');
      if (manual) {
        nav.prepend(manual);
      }
      document.body.prepend(nav);
      const notice = document.querySelector<HTMLElement>("#noticeDiv2");
      if (notice) {
        nav.prepend(createUpdateNotice(notice));
        document.querySelector("#noticeDiv")?.remove();
      }
    }
    const manual = nav.querySelector<HTMLAnchorElement>('a[href*="20141023_Manual.pdf"]');
    if (manual) {
      manual.textContent = english ? "Manual" : "\u64CD\u4F5C\u8AAA\u660E";
      nav.prepend(manual);
    }
    for (const reminder of document.querySelectorAll<HTMLElement>("td > span")) {
      const text = reminder.textContent;
      if (
        text.includes("\u63D0\u9192\uFF1A\u70BA\u65B9\u4FBF\u65B0\u589E\u8CC7\u6599") ||
        text.includes("\u63D0\u9192\uFF1A\u8ACB\u76E1\u91CF\u586B\u9078\u641C\u5C0B\u689D\u4EF6")
      ) {
        if (reminder.nextElementSibling?.tagName === "BR") {
          reminder.nextElementSibling.remove();
        }
        reminder.remove();
      } else if (
        text.includes("\u70BA\u514D\u8207\u5831\u5E33\u8CC7\u6599\u4E0D\u4E00") ||
        reminder.dataset.ccxpLiteReminder === "approval"
      ) {
        reminder.dataset.ccxpLiteReminder = "approval";
        reminder.textContent = english
          ? "To keep reimbursement records consistent, ask your working department to cancel approval before changing approved records."
          : "\u70BA\u514D\u8207\u5831\u5E33\u8CC7\u6599\u4E0D\u4E00\uFF0C\u5982\u9808\u7570\u52D5\u5DF2\u5BE9\u6838\u8CC7\u6599\uFF0C\u8ACB\u5148\u8ACB\u5DE5\u4F5C\u55AE\u4F4D\u53D6\u6D88\u5BE9\u6838";
      }
    }
    const noticeLabel = nav.querySelector(".ccxp-lite-work-log-notice-label");
    if (noticeLabel) {
      noticeLabel.textContent = english
        ? "2015 update notice"
        : "104 \u5E74\u6539\u7248\u63D0\u9192";
    }
    nav.setAttribute("aria-label", english ? "Page navigation" : "\u9801\u9762\u5C0E\u89BD");
    const toggle = nav.querySelector<HTMLInputElement>("input");
    if (toggle) {
      toggle.checked = english;
      toggle.setAttribute("aria-checked", String(english));
    }
    document.documentElement.lang = english ? "en" : "zh-Hant";
    document.documentElement.dataset.ccxpLiteWorkLogLanguage = english ? "en" : "zh";
    if (!document.querySelector("#insTask") && document.querySelector("#listForm")) {
      activeSection = "search";
      document.documentElement.dataset.ccxpLiteWorkLogSection = activeSection;
    }
    renderSectionSwitch();
    for (const primary of document.querySelectorAll<HTMLInputElement>(
      '#insTask input[type="submit"][onclick*="\'ins\'"], #queForm input[type="submit"][onclick*="\'que\'"]',
    )) {
      if (primary.closest(".ccxp-lite-work-log-actions")) {
        continue;
      }
      const cell = primary.closest("td");
      if (!cell) {
        continue;
      }
      const actions = document.createElement("div");
      actions.className = "ccxp-lite-work-log-actions";
      const reset = cell.querySelector<HTMLInputElement>('input[type="reset"]');
      primary.classList.add("ccxp-lite-action-control-primary");
      cell.append(actions);
      if (reset) {
        actions.append(reset);
      }
      actions.append(primary);
      const table = cell.closest("table");
      const row = cell.closest("tr");
      if (table && row && row.cells.length === 1 && primary.form?.contains(table) === true) {
        table.after(actions);
        // Preserve any remaining host controls while removing the decorative action row.
        for (const control of row.querySelectorAll("input, select, textarea, button")) {
          actions.prepend(control);
        }
        row.remove();
      }
    }
    for (const table of document.querySelectorAll<HTMLTableElement>(
      "#insTask table, #queForm table",
    )) {
      if (table.closest("#listForm")) {
        continue;
      }
      table.classList.add("ccxp-lite-work-log-form-fields");
      table.setAttribute("role", "presentation");
    }
    simplifyRecords();
    for (const label of document.querySelectorAll<HTMLElement>("[data-record-zh]")) {
      label.textContent = (english ? label.dataset.recordEn : label.dataset.recordZh) ?? "";
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode as Text);
    }
    for (const node of nodes) {
      const parent = node.parentElement;
      if (
        !parent ||
        parent.closest(
          "script, style, noscript, textarea, [contenteditable], [data-ccxp-lite-reminder], [data-record-zh], a[href*='20141023_Manual.pdf'], .ccxp-lite-work-log-language, .ccxp-lite-work-log-notice-label, #ccxp-lite-work-log-sections",
        )
      ) {
        continue;
      }
      let original = originals.get(node);
      if (original === undefined || node.data !== rendered.get(node)) {
        original = node.data;
        originals.set(node, original);
      }
      const text = original.trim();
      if (text === "") {
        continue;
      }
      const pair = splitLabel(text);
      let next = original;
      if (parent.closest("#divTitle")) {
        const isEnglishTitle = /[A-Za-z]/u.test(text);
        next =
          isEnglishTitle === english
            ? original
                .replace("\u570B\u7ACB\u6E05\u83EF\u5927\u5B78", "")
                .replace("National Tsing Hua University", "")
                .trim()
            : "";
      } else if (parent.closest("#divContact")) {
        const isEnglishContact = parent.closest(".engContent") !== null;
        const contact = english
          ? "For assistance, contact your working department first, then the Personnel Office."
          : "\u64CD\u4F5C\u554F\u984C\u8ACB\u5148\u6D3D\u5DE5\u4F5C\u55AE\u4F4D\u5F8C\u6D3D\u4EBA\u4E8B\u5BA4";
        next = isEnglishContact === english ? contact : "";
      } else if (pair) {
        next = pair[english ? 1 : 0];
      } else if (
        parent.closest(".engContent") ||
        (parent.closest("#divTitle") && text.includes("National Tsing"))
      ) {
        next = english ? original : "";
      } else if (Object.hasOwn(translations, text)) {
        next = english ? translations[text] : original;
      } else if (
        text.startsWith(
          "\u63D0\u9192\u60A8\uFF01\u76EE\u524D\u6240\u9078\u4E4B\u5DE5\u4F5C\u65E5\u671F",
        )
      ) {
        next = english
          ? "No tasks were found for this date. Please register in the Assistant Registration System first."
          : "\u67E5\u7121\u6B64\u65E5\u671F\u5167\u4E4B\u4EFB\u52D9\uFF0C\u8ACB\u5148\u81F3\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u767B\u9304\u8CC7\u6599\u3002";
      } else if (parent.id === "noticeDiv2" && text.startsWith("1.")) {
        next = english
          ? "1. For work from October 1, 2015 onward, part-time assistants must first register their task in the Assistant Registration System."
          : original;
      } else if (parent.id === "noticeDiv2" && text.startsWith("2.")) {
        next = english
          ? "2. Task information is retrieved for the selected working date. Without a registered task, hours cannot be recorded and salary cannot be claimed."
          : original;
      } else if (parent.id === "noticeDiv2" && text.startsWith("3.")) {
        next = english
          ? "3. Update any hours entered before this release for work from October 1, 2015 onward to match the Assistant Registration System, so your department can claim salary."
          : original;
      } else if (parent.querySelector(".engContent") && /[\u3400-\u9FFF]/u.test(text)) {
        next = english ? "" : original;
      } else if (
        parent.matches("a") &&
        parent.parentElement?.querySelector(".engContent") &&
        !parent.closest(".engContent")
      ) {
        next = english ? "" : original;
      }
      if (parent.closest("#insTask td > span, #queForm td > span")) {
        next = next
          .replace(/^\s*[*\uFF0A]?\s*(?:\u5FC5\u9078|\u5FC5\u586B)\s*/u, "")
          .replace(/^\s*[*\uFF0A]?\s*(?:Necessary Column|Required)\s*/iu, "");
        if (/^\s*[*\uFF0A]\s*$/u.test(next)) {
          next = "";
        }
      }
      next = next.replace(
        "\uFF08\u6700\u591A15\u500B\u4E2D\u82F1\u6587\u6578\u5B57\uFF0C\u8ACB\u52FF\u8F38\u5165\u9664\u7A7A\u683C\u6216\u5E95\u7DDA\u7684\u534A\u5F62\u7279\u6B8A\u7B26\u865F\uFF09",
        "\u6700\u591A15\u500B\u5B57\u5143\uFF0C\u50C5\u9650\u4E2D\u82F1\u6587\u3001\u6578\u5B57\u3001\u7A7A\u683C\u6216\u5E95\u7DDA",
      );
      next = next.replaceAll(/\u63D0\u9192[\uFF1A:]\s*/gu, "");
      next = next.replace(
        "\u300C\u52A9\u7406\u767B\u9304\u7CFB\u7D71\u300D\u4EFB\u52D9\u8CC7\u8A0A",
        "\u4EFB\u52D9\u8CC7\u8A0A",
      );
      // Labels are changed in place; controls, values, and host event handlers stay intact.
      node.data = next;
      rendered.set(node, next);
      if (parent instanceof HTMLOptionElement && parent.hasAttribute("label")) {
        parent.label = next;
      }
    }
    for (const button of document.querySelectorAll<HTMLInputElement>(
      'input[type="submit"], input[type="reset"], input[type="button"]',
    )) {
      const original = buttonLabels.get(button) ?? button.value;
      buttonLabels.set(button, original);
      const pair = splitLabel(original);
      if (pair) {
        button.value = pair[english ? 1 : 0];
      }
    }
    observe();
  }

  // Restore canonical values before legacy inline handlers call form.submit(). That native method
  // bypasses the submit event, so capture clicks as well.
  function prepareSubmission(event: Event) {
    const { target } = event;
    if (!(target instanceof Element)) {
      return;
    }
    const form = target.closest("form");
    if (
      !form ||
      (event.type === "click" &&
        !target.matches('input[type="submit"], input[type="button"], button[type="submit"]'))
    ) {
      return;
    }
    for (const button of form.querySelectorAll<HTMLInputElement>("input")) {
      const original = buttonLabels.get(button);
      if (original !== undefined) {
        button.value = original;
      }
    }
    searching = form.id === "queForm";
    queueMicrotask(() => {
      if (event.defaultPrevented) {
        searching = false;
      }
      render();
    });
  }
  document.addEventListener("click", prepareSubmission, true);
  document.addEventListener("submit", prepareSubmission, true);
  const observer = new MutationObserver(render);
  function observe() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  observe();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
