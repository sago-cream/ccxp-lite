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
  const toolbar = document.createElement("nav");
  toolbar.className = "ccxp-staff-toolbar";
  const language = document.createElement("button");
  language.type = "button";
  language.className = "ccxp-staff-language";
  toolbar.append(language);
  title.after(toolbar);
  const navigation = document.querySelector(".fixed-action-btn");
  const links = [...(navigation?.querySelectorAll<HTMLAnchorElement>("ul a") ?? [])];
  const navLabels = [
    ["\u516C\u544A\u4E8B\u9805", "Notices"],
    ["\u52A9\u7406\u8EAB\u4EFD", "Staff identity"],
    ["\u52A9\u7406\u767B\u9304", "Staff registration"],
    ["\u52A9\u7406\u6B77\u53F2", "Staff history"],
  ];
  // Move the original anchors: their URLs and registered host handlers remain intact.
  for (const link of links) {
    link.classList.add("ccxp-staff-nav-link");
    if (!link.hasAttribute("href")) {
      link.setAttribute("role", "button");
      link.tabIndex = 0;
      link.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          link.click();
        }
      });
    }
    language.before(link);
  }
  navigation?.classList.add("ccxp-staff-old-navigation");
  const save = () => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ english, active }));
    } catch {
      /* Optional preference. */
    }
  };
  const render = () => {
    heading.textContent = english ? "Staff history" : "\u52A9\u7406\u6B77\u53F2";
    toolbar.setAttribute("aria-label", english ? "Staff systems" : "\u52A9\u7406\u7CFB\u7D71");
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
        link.textContent = label;
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
