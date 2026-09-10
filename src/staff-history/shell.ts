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
  const language = document.createElement("button");
  language.type = "button";
  language.className = "ccxp-staff-language";
  toolbar.append(language);
  title.append(toolbar);
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
    const label = document.createElement("span");
    label.className = "ccxp-staff-nav-label";
    link.append(label);
    link.querySelector("i")?.setAttribute("aria-hidden", "true");
    return label;
  });
  const setMenuOpen = (open: boolean) => {
    if (navigation && trigger) {
      navigation.dataset.ccxpStaffMenuOpen = String(open);
      trigger.setAttribute("aria-expanded", String(open));
    }
  };
  const activateByKey = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      (event.currentTarget as HTMLElement).click();
    }
  };
  if (navigation && trigger && menu) {
    navigation.classList.add("ccxp-staff-navigation");
    menu.id ||= "ccxp-staff-navigation-links";
    trigger.setAttribute("role", "button");
    trigger.tabIndex = 0;
    trigger.setAttribute("aria-controls", menu.id);
    trigger.querySelector("i")?.setAttribute("aria-hidden", "true");
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      setMenuOpen(trigger.getAttribute("aria-expanded") !== "true");
    });
    trigger.addEventListener("keydown", activateByKey);
    navigation.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        trigger.focus();
      }
    });
    navigation.addEventListener("focusout", (event) => {
      if (!(event.relatedTarget instanceof Node) || !navigation.contains(event.relatedTarget)) {
        setMenuOpen(false);
      }
    });
    document.addEventListener("click", (event) => {
      if (event.target instanceof Node && !navigation.contains(event.target)) {
        setMenuOpen(false);
      }
    });
    setMenuOpen(false);
  }
  // Keep the original anchors in their host menu so delegated handlers still work.
  for (const link of links) {
    if (!link.hasAttribute("href")) {
      link.setAttribute("role", "button");
      link.tabIndex = 0;
      link.addEventListener("keydown", activateByKey);
    }
    link.addEventListener("click", () => {
      setMenuOpen(false);
    });
  }
  const save = () => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ english, active }));
    } catch {
      /* Optional preference. */
    }
  };
  const render = () => {
    heading.textContent = english ? "Staff history" : "\u52A9\u7406\u6B77\u53F2";
    trigger?.setAttribute(
      "aria-label",
      english ? "Staff systems navigation" : "\u52A9\u7406\u7CFB\u7D71\u5C0E\u89BD",
    );
    trigger?.setAttribute("title", english ? "Staff systems" : "\u7CFB\u7D71\u5C0E\u89BD");
    language.textContent = english ? "\u4E2D\u6587" : "English";
    language.setAttribute(
      "aria-label",
      english ? "Switch interface labels to Chinese" : "Switch interface labels to English",
    );
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
  language.addEventListener("click", () => {
    english = !english;
    render();
    save();
  });
  render();
  const initial = headers.find((header) => header?.id === active);
  if (initial && !initial.classList.contains("active")) {
    initial.click();
  }
})();
