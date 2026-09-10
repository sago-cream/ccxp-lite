(function enhanceStaffRegistration() {
  const form = document.querySelector<HTMLFormElement>("#smart-form");
  const title = form?.querySelector<HTMLElement>("h5.NORMAL_BLK");
  const navigation = document.querySelector<HTMLElement>("#float_menu");
  if (!form || !title || !navigation || document.querySelector(".ccxp-registration-header")) {
    return;
  }
  document.documentElement.classList.add("ccxp-registration");
  const key = "ccxp-lite-staff-registration-english";
  let english = false;
  try {
    english = sessionStorage.getItem(key) === "true";
  } catch {
    // Optional preference only.
  }
  const header = document.createElement("header");
  header.className = "ccxp-registration-header";
  const heading = document.createElement("h1");
  const languageLabel = document.createElement("label");
  languageLabel.className = "ccxp-registration-language";
  const language = document.createElement("input");
  language.type = "checkbox";
  language.setAttribute("role", "switch");
  language.setAttribute("aria-label", "English");
  languageLabel.append("English", language);
  const trigger = navigation.querySelector("a");
  trigger?.remove();
  navigation.setAttribute("role", "navigation");
  const links = [...navigation.querySelectorAll<HTMLAnchorElement>("ul a")];
  const navLabels = [
    ["\u516C\u544A\u4E8B\u9805", "Notices"],
    ["\u52A9\u7406\u8EAB\u4EFD", "Staff identity"],
    ["\u52A9\u7406\u767B\u9304", "Staff registration"],
    ["\u52A9\u7406\u6B77\u53F2", "Staff history"],
  ];
  const captions = links.map((link) => {
    link.removeAttribute("title");
    link.classList.remove("tooltipped");
    const { dataset } = link;
    const { tooltipId } = dataset;
    if (tooltipId !== undefined && tooltipId !== "") {
      document.querySelector(`[id="${CSS.escape(tooltipId)}"]`)?.remove();
    }
    delete dataset.tooltip;
    delete dataset.tooltipId;
    link.querySelector("i")?.setAttribute("aria-hidden", "true");
    if (!link.hasAttribute("href")) {
      link.setAttribute("role", "button");
      link.setAttribute("tabindex", "0");
      link.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          link.click();
        }
      });
    }
    const caption = document.createElement("span");
    link.append(caption);
    return caption;
  });
  const info = document.createElement("li");
  info.className = "ccxp-registration-info";
  const infoButton = document.createElement("button");
  infoButton.type = "button";
  infoButton.setAttribute("aria-controls", "ccxp-registration-reminders");
  infoButton.setAttribute("aria-expanded", "false");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M12 8h.01M11 12h1v5h1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  icon.append(path);
  const infoCaption = document.createElement("span");
  infoButton.append(icon, infoCaption);
  const reminders = document.createElement("div");
  reminders.id = "ccxp-registration-reminders";
  reminders.hidden = true;
  info.append(infoButton, reminders);
  navigation.querySelector("ul")?.append(info);
  let pinned = false;
  let hovered = false;
  let suppressHover = false;
  const syncInfo = () => {
    const open = pinned || (hovered && !suppressHover);
    reminders.hidden = !open;
    infoButton.setAttribute("aria-expanded", String(open));
  };
  info.addEventListener("mouseenter", () => {
    hovered = true;
    suppressHover = false;
    syncInfo();
  });
  info.addEventListener("mouseleave", () => {
    hovered = false;
    suppressHover = false;
    syncInfo();
  });
  infoButton.addEventListener("click", () => {
    pinned = !pinned;
    suppressHover = !pinned;
    syncInfo();
  });
  info.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      pinned = false;
      suppressHover = true;
      syncInfo();
      infoButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !info.contains(event.target)) {
      pinned = false;
      suppressHover = true;
      syncInfo();
    }
  });
  const captured = new Set<string>();
  const collectReminders = () => {
    for (const toast of document.querySelectorAll<HTMLElement>(".toast, .ns-box")) {
      const text = toast.textContent.trim();
      if (
        !/\u57FA\u672C\u5DE5\u8CC7|\u6700\u65B0\u516C\u544A\u8ACB\u53C3\u95B1|\u5982\u6709\u7279\u6B8A\u8EAB\u4EFD/.test(
          text,
        )
      ) {
        continue;
      }
      if (!captured.has(text)) {
        const item = document.createElement("div");
        item.className = "ccxp-registration-reminder";
        const content = toast.querySelector(".ns-content > div") ?? toast;
        item.append(...content.childNodes);
        for (const decoration of item.querySelectorAll("i, img")) {
          decoration.remove();
        }
        if (text.includes("\u6700\u65B0\u516C\u544A\u8ACB\u53C3\u95B1")) {
          item.textContent =
            "\u6700\u65B0\u516C\u544A\u8ACB\u53C3\u95B1\u4E0A\u65B9\u5C0E\u89BD\u7684\u3010\u516C\u544A\u4E8B\u9805\u3011\u3002";
        }
        reminders.append(item);
        captured.add(text);
      }
      toast.remove();
    }
    info.hidden = captured.size === 0;
  };
  const reminderObserver = new MutationObserver(collectReminders);
  reminderObserver.observe(document.body, { childList: true, subtree: true });
  collectReminders();
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) {
      reminderObserver.disconnect();
    }
  });
  header.append(heading, navigation, languageLabel);
  form.before(header);
  title.classList.add("ccxp-registration-original-title");

  // Change only known presentation text nodes, never values or host controls.
  const phrases = new Map<string, readonly [string, string]>([
    [
      "\u4E3B\u8A08\u5BA4\u9818\u64DA",
      ["\u4E3B\u8A08\u5BA4\u9818\u64DA", "Accounting office receipt of payment"],
    ],
    [
      "\u4EBA\u4E8B\u5BA4\u4EBA\u54E1\u8655\u7406\u8868",
      ["\u4EBA\u4E8B\u5BA4\u4EBA\u54E1\u8655\u7406\u8868", "Personnel office payment system"],
    ],
    [
      "\u4EBA\u54E1\u8CC7\u8A0A Personal information",
      ["\u4EBA\u54E1\u8CC7\u8A0A", "Personal information"],
    ],
    [
      "\u4EFB\u52D9\u55AE\u4F4D Mission Department",
      ["\u4EFB\u52D9\u55AE\u4F4D", "Mission department"],
    ],
    [
      "\u4EFB\u52D9\u8CC7\u8A0A Mission Information",
      ["\u8A08\u756B\u8207\u5BE9\u6838", "Project and approval"],
    ],
    ["\u4FDD\u96AA\u4EBA Insurant/Staff", ["\u4FDD\u96AA\u4EBA", "Insurant / staff"]],
    [
      "\u57F7\u884C\u4EFB\u52D9\u8A08\u756B\u7DE8\u865F Mission Program Number",
      ["\u57F7\u884C\u4EFB\u52D9\u8A08\u756B\u7DE8\u865F", "Mission program number"],
    ],
    ["\u5831\u652F\u7CFB\u7D71 Payment system", ["\u5831\u652F\u7CFB\u7D71", "Payment system"]],
    ["\u5BE9\u6838\u4EBA Approval / Assessor", ["\u5BE9\u6838\u4EBA", "Approver"]],
    ["\u5DE5\u4F5C\u5167\u5BB9 Mission Content", ["\u5DE5\u4F5C\u5167\u5BB9", "Mission content"]],
    [
      "\u6295\u4FDD\u91D1\u984D\u8A08\u7B97 Payment type",
      ["\u6295\u4FDD\u91D1\u984D\u8A08\u7B97", "Insured amount calculation"],
    ],
    [
      "\u6559\u52D9\u8655\u7814\u7A76\u751F\u734E\u52A9\u5B78\u91D1",
      [
        "\u6559\u52D9\u8655\u7814\u7A76\u751F\u734E\u52A9\u5B78\u91D1",
        "Academic Affairs scholarship and grants",
      ],
    ],
    [
      "\u79D8\u66F8\u8655\u5B78\u751F\u5DE5\u8B80\u52A9\u5B78\u91D1",
      [
        "\u79D8\u66F8\u8655\u5B78\u751F\u5DE5\u8B80\u52A9\u5B78\u91D1",
        "Secretary office work-study payment",
      ],
    ],
    [
      "\u8A08\u756B\u4E3B\u6301\u4EBA Program Host",
      ["\u8A08\u756B\u4E3B\u6301\u4EBA", "Program host"],
    ],
    [
      "\u8ACB\u4F9D\u5BE6\u969B\u5831\u652F\u60C5\u5F62\u52FE\u9078\uFF0C\u4EE5\u514D\u7CFB\u7D71\u52FE\u7A3D\u932F\u8AA4\u5F71\u97FF\u5831\u652F",
      [
        "\u8ACB\u4F9D\u5BE6\u969B\u5831\u652F\u60C5\u5F62\u52FE\u9078\uFF0C\u4EE5\u514D\u7CFB\u7D71\u52FE\u7A3D\u932F\u8AA4\u5F71\u97FF\u5831\u652F",
        "Choose the correct payment system to avoid inconsistencies affecting reimbursement.",
      ],
    ],
    ["\u8D77 Contract begin", ["\u8D77\u59CB\u65E5\u671F", "Contract begin"]],
    [
      "\u8EAB\u4EFD\u8B49\u865F Identity Number/ARC Number",
      ["\u8EAB\u4EFD\u8B49\u865F", "Identity / ARC number"],
    ],
    ["\u8FC4 Contract end", ["\u7D50\u675F\u65E5\u671F", "Contract end"]],
    ["\u9001\u51FA Send", ["\u9001\u51FA", "Send"]],
    ["\u985E\u578B\u5C6C\u6027 Mission Type", ["\u985E\u578B\u5C6C\u6027", "Mission type"]],
  ]);
  for (const text of [
    "student assistants (the rules in Ministry of Education)",
    "employed assistants (the rules in Ministry of Labor)",
    "I have read all the rules",
  ]) {
    phrases.set(text, ["", text]);
  }
  const detail = form.querySelector<HTMLInputElement>("#I_DETAIL");
  const detailPlaceholder = detail?.getAttribute("placeholder");
  const duplicateEnglish = new Set([
    "payment system (Receipt of Payment) in Accounting Office",
    "payment system in Personnel office",
    "Please choose the correct payment system to avoid the inconsistency between the Staff Entrance System and the payment system",
    "scholarship and grants in Academic Affairs Office",
    "Work-study Student payment system in Secretary office",
  ]);
  const translations: Array<{ node: Text; labels: readonly [string, string] }> = [];
  const walker = document.createTreeWalker(form, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    if (
      !node.parentElement?.closest(
        "script, style, select, textarea, .k-grid, .k-animation-container",
      )
    ) {
      const text = node.textContent.trim().replaceAll(/\s+/g, " ");
      const labels = phrases.get(text);
      if (labels) {
        translations.push({ node, labels });
      } else if (duplicateEnglish.has(text)) {
        node.textContent = "";
      }
    }
    current = walker.nextNode();
  }
  // Mark only empty layout spacer columns. Host conditional controls keep their visibility.
  for (const row of form.querySelectorAll<HTMLElement>(":scope > .row")) {
    row.classList.add("ccxp-registration-row");
    for (const column of row.querySelectorAll<HTMLElement>(":scope > .col")) {
      if (
        column.textContent.trim() === "" &&
        !column.querySelector("input, select, textarea, button, a, [id]")
      ) {
        column.classList.add("ccxp-registration-spacer");
      } else {
        column.classList.add("ccxp-registration-field");
        if (column.classList.contains("s8") || column.classList.contains("s12")) {
          column.classList.add("ccxp-registration-wide");
        }
      }
    }
  }
  // Add landmarks without replacing host rows or changing control order.
  for (const tagline of form.querySelectorAll<HTMLElement>(":scope > .tagline")) {
    tagline.setAttribute("role", "heading");
    tagline.setAttribute("aria-level", "2");
  }
  for (const [selector, zh, en] of [
    ["#I_SYS_2", "\u5831\u652F\u8207\u8EAB\u5206", "Payment and employment type"],
    ["#A_DATE", "\u4EFB\u52D9\u5B89\u6392", "Assignment details"],
    ["#grid", "\u767B\u9304\u8CC7\u6599", "Registration records"],
  ]) {
    const row: HTMLElement | null | undefined = form
      .querySelector(selector)
      ?.closest<HTMLElement>(".row");
    if (!row || row.parentElement !== form) {
      continue;
    }
    const sectionTitle = document.createElement("h2");
    sectionTitle.className = "ccxp-registration-section-title";
    if (selector === "#grid") {
      sectionTitle.classList.add("ccxp-registration-records-title");
    }
    const node = document.createTextNode(zh);
    sectionTitle.append(node);
    translations.push({ node, labels: [zh, en] });
    row.before(sectionTitle);
  }
  const choices = form.querySelector("#I_SYS_2")?.closest<HTMLElement>(".row");
  if (choices) {
    choices.classList.add("ccxp-registration-choices");
    const hint = choices.querySelector<HTMLAnchorElement>('a[href="#!"]');
    if (hint) {
      const help = document.createElement("div");
      help.className = "ccxp-registration-choice-help";
      help.append(hint);
      choices.before(help);
    }
    for (const spacer of choices.querySelectorAll<HTMLElement>(".col > div")) {
      if (spacer.textContent.trim() === "" && spacer.children.length === 0) {
        spacer.classList.add("ccxp-registration-spacer");
      }
    }
  }
  // Give generated Kendo inputs the same accessible name as their original selects.
  for (const id of ["PJ_LEADER", "I_SRV"]) {
    const label = form.querySelector<HTMLLabelElement>(`label[for="${id}"]`);
    const input = form.querySelector<HTMLInputElement>(`input[name="${id}_input"]`);
    if (label && input) {
      label.id ||= `ccxp-registration-label-${id}`;
      input.setAttribute("aria-labelledby", label.id);
    }
  }
  const render = () => {
    heading.textContent = english
      ? "Staff registration system"
      : "\u52A9\u7406\u767B\u9304\u7CFB\u7D71";
    navigation.setAttribute(
      "aria-label",
      english ? "Staff systems navigation" : "\u52A9\u7406\u7CFB\u7D71\u5C0E\u89BD",
    );
    language.checked = english;
    if (detail && detailPlaceholder !== null && detailPlaceholder !== undefined) {
      detail.placeholder = english
        ? detailPlaceholder
        : detailPlaceholder.replace(/\s*\(limit 100 words\)/i, "");
    }
    infoCaption.textContent = english ? "Reminders" : "\u63D0\u9192";
    infoButton.setAttribute(
      "aria-label",
      english ? "Registration reminders" : "\u767B\u9304\u63D0\u9192",
    );
    for (const { node, labels } of translations) {
      node.textContent = labels[english ? 1 : 0];
    }
    for (const [index, caption] of captions.entries()) {
      if (index < navLabels.length) {
        const label = navLabels[index][english ? 1 : 0];
        caption.textContent = label;
        links[index].setAttribute("aria-label", label);
      }
    }
    document.documentElement.dataset.ccxpRegistrationLanguage = english ? "en" : "zh";
  };
  language.addEventListener("change", () => {
    english = language.checked;
    render();
    try {
      sessionStorage.setItem(key, String(english));
    } catch {
      // Optional preference only.
    }
  });
  render();
})();
