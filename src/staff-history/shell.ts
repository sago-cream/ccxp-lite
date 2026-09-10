(function enhanceStaffHistoryShell() {
  const title = document.querySelector<HTMLElement>("h4.header");
  const headers = ["A_HEAD", "B_HEAD"].map((id) => document.querySelector<HTMLElement>(`#${id}`));
  if (
    !title ||
    headers.some((header) => !header) ||
    document.querySelector(".ccxp-staff-toolbar")
  ) {
    return;
  }
  const key = "ccxp-lite-staff-history-view";
  let english = false;
  let active = "A_HEAD";
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? "{}") as {
      english?: boolean;
      active?: string;
    };
    english = saved.english === true;
    if (saved.active === "B_HEAD") {
      active = "B_HEAD";
    }
  } catch {
    // The page remains usable when storage is disabled.
  }
  const labels = [
    ["\u751F\u6548\u5DE5\u4F5C\u9805\u76EE", "Effective work items"],
    ["\u7533\u8ACB\u55AE\u6B77\u53F2", "Application history"],
  ];
  document.documentElement.classList.add("ccxp-staff-shell");
  title.parentElement?.classList.add("ccxp-staff-page");
  const heading = document.createElement("span");
  title.replaceChildren(heading, ...title.querySelectorAll("input"));
  title.setAttribute("role", "heading");
  title.setAttribute("aria-level", "1");
  const toolbar = document.createElement("span");
  toolbar.className = "ccxp-staff-toolbar";
  const languageLabel = document.createElement("label");
  languageLabel.className = "ccxp-staff-language-label";
  languageLabel.append("English");
  const language = document.createElement("input");
  language.type = "checkbox";
  language.setAttribute("role", "switch");
  language.setAttribute("aria-label", "English");
  language.className = "ccxp-staff-language";
  languageLabel.append(language);
  toolbar.append(languageLabel);
  title.append(toolbar);
  const notices = document.createElement("details");
  notices.className = "ccxp-staff-notices";
  const noticeSummary = document.createElement("summary");
  const noticeContent = document.createElement("div");
  const announcement = document.createElement("p");
  const troubleshooting = document.createElement("p");
  noticeContent.append(announcement, troubleshooting);
  notices.append(noticeSummary, noticeContent);
  toolbar.prepend(notices);
  const removeDuplicateNotices = () => {
    for (const toast of document.querySelectorAll(".toast")) {
      if (
        /\u6700\u65B0\u516C\u544A\u8ACB\u53C3\u95B1|\u82E5\u767C\u751F\u5217\u8868\u7A7A\u767D/.test(
          toast.textContent,
        )
      ) {
        toast.remove();
      }
    }
  };
  const noticeObserver = new MutationObserver(removeDuplicateNotices);
  noticeObserver.observe(document.body, { childList: true, subtree: true });
  removeDuplicateNotices();
  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !notices.contains(event.target)) {
      notices.open = false;
    }
  });
  notices.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      notices.open = false;
      noticeSummary.focus();
    }
  });
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) {
      noticeObserver.disconnect();
    }
  });
  const navigation = document.querySelector<HTMLElement>(".fixed-action-btn");
  const trigger = navigation?.querySelector<HTMLElement>("a");
  const menu = navigation?.querySelector<HTMLElement>("ul");
  const links = [...(menu?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];
  const navLabels = [
    ["\u516C\u544A\u4E8B\u9805", "Notices"],
    ["\u52A9\u7406\u8EAB\u4EFD", "Staff identity"],
    ["\u52A9\u7406\u767B\u9304", "Staff registration"],
    ["\u52A9\u7406\u6B77\u53F2", "Staff history"],
  ];
  const linkLabels = links.map((link) => {
    link.removeAttribute("title");
    link.removeAttribute("data-tooltip");
    link.classList.remove("tooltipped");
    const tooltipId = link.getAttribute("data-tooltip-id");
    if (tooltipId) {
      document.getElementById(tooltipId)?.remove();
      link.removeAttribute("data-tooltip-id");
    }
    const label = document.createElement("span");
    label.className = "ccxp-staff-nav-label";
    link.append(label);
    link.querySelector("i")?.setAttribute("aria-hidden", "true");
    return label;
  });
  const activateByKey = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      (event.currentTarget as HTMLElement).click();
    }
  };
  if (navigation && menu) {
    navigation.classList.add("ccxp-staff-navigation");
    navigation.setAttribute("role", "navigation");
    trigger?.remove();
    title.after(navigation);
  }
  // Keep the original anchors in their host menu so delegated handlers still work.
  for (const link of links) {
    if (!link.hasAttribute("href")) {
      link.setAttribute("role", "button");
      link.tabIndex = 0;
      link.addEventListener("keydown", activateByKey);
    }
  }
  const save = () => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ english, active }));
    } catch {
      /* Optional preference. */
    }
  };
  const render = () => {
    heading.textContent = english ? "Staff history system" : "\u52A9\u7406\u6B77\u53F2\u7CFB\u7D71";
    navigation?.setAttribute(
      "aria-label",
      english ? "Staff systems navigation" : "\u52A9\u7406\u7CFB\u7D71\u5C0E\u89BD",
    );
    language.checked = english;
    noticeSummary.textContent = english ? "Notices & help" : "\u516C\u544A\u8207\u8AAA\u660E";
    announcement.textContent = english
      ? "For the latest notices, open Notices in the navigation above."
      : "\u6700\u65B0\u516C\u544A\u8ACB\u53C3\u95B1\u4E0A\u65B9\u5C0E\u89BD\u7684\u3010\u516C\u544A\u4E8B\u9805\u3011\u3002";
    troubleshooting.textContent = english
      ? "If the table appears blank, clear your browser cache and temporary files."
      : "\u82E5\u767C\u751F\u5217\u8868\u7A7A\u767D\uFF0C\u8ACB\u6E05\u9664\u700F\u89BD\u5668\u5FEB\u53D6\u53CA\u66AB\u5B58\u6A94\u6848\u3002";
    for (const [index, header] of headers.entries()) {
      if (header) {
        header.textContent = labels[index][english ? 1 : 0];
      }
    }
    for (const [index, link] of links.entries()) {
      const label = navLabels[index]?.[english ? 1 : 0];
      if (label !== "") {
        linkLabels[index].textContent = label;
        link.setAttribute("aria-label", label);
        delete link.dataset.tooltip;
      }
    }
    document.documentElement.dataset.ccxpStaffLanguage = english ? "en" : "zh";
  };
  const rememberSection = (event: Event) => {
    const target = event.currentTarget as HTMLElement;
    active = target.id;
    save();
  };
  for (const header of headers) {
    if (!header) {
      continue;
    }
    const panel = header.nextElementSibling;
    if (!panel) {
      continue;
    }
    panel.id ||= `ccxp-staff-panel-${header.id}`;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", header.id);
    header.setAttribute("role", "button");
    header.tabIndex = 0;
    header.setAttribute("aria-controls", panel.id);
    const sync = () => {
      header.setAttribute("aria-expanded", String(header.classList.contains("active")));
    };
    const observer = new MutationObserver(sync);
    observer.observe(header, { attributes: true, attributeFilter: ["class"] });
    sync();
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        header.click();
      }
    });
    header.addEventListener("click", rememberSection);
    window.addEventListener("pagehide", (event) => {
      if (!event.persisted) {
        observer.disconnect();
      }
    });
  }
  language.addEventListener("change", () => {
    english = language.checked;
    render();
    save();
  });
  render();
  const initial = headers.find((header) => header?.id === active);
  if (initial && !initial.classList.contains("active")) {
    initial.click();
  }
})();
