const normalize = (text: string) => text.normalize("NFKC").trim().toLocaleLowerCase();
const label = (option: HTMLOptionElement) => option.textContent.trim();
const pointerDown = (event: PointerEvent) => {
  event.preventDefault();
};
/** Searchable combobox that preserves the host select's form value and handlers. */
export function mountSearchSelect(
  searchInput: HTMLInputElement,
  nativeSelect: HTMLSelectElement,
  searchText: (option: HTMLOptionElement) => string = (option) => option.textContent,
  emptyLabel: () => string = () => "No results",
): { destroy: () => void; refresh: () => void } {
  const input = searchInput;
  const select = nativeSelect;
  const doc = input.ownerDocument;
  const originalHidden = select.hidden;
  const attributes = [
    "list",
    "role",
    "aria-controls",
    "aria-expanded",
    "aria-autocomplete",
    "aria-activedescendant",
    "autocomplete",
    "style",
  ];
  const originals = attributes.map((name) => [name, input.getAttribute(name)] as const);
  const wrapper = doc.createElement("div");
  wrapper.className = "ccxp-lite-search-select";
  Object.assign(wrapper.style, {
    position: "relative",
    minWidth: "0",
    gridColumn: "1 / -1",
  });
  input.before(wrapper);
  wrapper.append(input);
  input.style.width = "100%";
  input.style.margin = "0";
  const list = doc.createElement("div");
  list.id = `${input.id}-suggestions`;
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", select.getAttribute("aria-label") ?? "Search results");
  Object.assign(list.style, {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: "0",
    right: "0",
    zIndex: "1000",
    maxHeight: "240px",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "4px",
    boxSizing: "border-box",
    background: "var(--ccxp-lite-surface, #fff)",
    color: "var(--ccxp-lite-text, #111827)",
    border: "1px solid var(--ccxp-lite-sidebar-search-border, #e5e7eb)",
    borderRadius: "var(--ccxp-lite-radius-sm, 6px)",
    boxShadow: "0 8px 24px rgb(0 0 0 / 12%)",
  });
  wrapper.append(list);
  const options = [...select.options]
    .filter((option) => !option.hidden && !option.disabled && option.value !== "")
    .map((option) => ({ option, text: searchText(option) }));
  let matches = options;
  let active = -1;
  let open = false;
  let destroyed = false;
  const close = () => {
    open = false;
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  };
  let displayedValue = "";
  const syncInput = () => {
    const selected = options.find(({ option }) => option.value === select.value);
    displayedValue = selected ? label(selected.option) : "";
    input.value = displayedValue;
  };
  const highlight = () => {
    for (const [index, row] of [...list.children].entries()) {
      const element = row as HTMLElement;
      element.setAttribute("aria-selected", String(index === active));
      element.style.background =
        index === active ? "var(--ccxp-lite-primary-focus-ring, #f4edf6)" : "transparent";
    }
    const row = list.children[active] as HTMLElement | undefined;
    if (row) {
      input.setAttribute("aria-activedescendant", row.id);
      row.scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  };
  const refresh = () => {
    if (!open) {
      syncInput();
      return;
    }
    const selected = options.find(({ option }) => option.value === select.value);
    const query = selected && input.value === displayedValue ? "" : normalize(input.value);
    matches = options.filter(({ option, text }) =>
      normalize(`${option.value} ${text}`).includes(query),
    );
    active = -1;
    input.removeAttribute("aria-activedescendant");
    list.replaceChildren(
      ...matches.map(({ option }, index) => {
        const row = doc.createElement("div");
        row.id = `${list.id}-${index}`;
        row.dataset.index = String(index);
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", "false");
        row.textContent = label(option);
        row.addEventListener("pointerenter", () => {
          active = index;
          highlight();
        });
        Object.assign(row.style, {
          padding: "10px 12px",
          minHeight: "40px",
          boxSizing: "border-box",
          borderRadius: "4px",
          cursor: "pointer",
          font: "var(--ccxp-lite-type-body, 16px Arial)",
          overflowWrap: "anywhere",
        });
        return row;
      }),
    );
    if (matches.length === 0) {
      const empty = doc.createElement("div");
      empty.setAttribute("role", "status");
      empty.textContent = emptyLabel();
      Object.assign(empty.style, {
        padding: "12px",
        color: "var(--ccxp-lite-text-muted, #6b7280)",
        font: "var(--ccxp-lite-type-caption, 14px Arial)",
      });
      list.append(empty);
    }
    list.scrollTop = 0;
  };
  const show = () => {
    open = true;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    refresh();
  };
  const choose = (index: number) => {
    if (index < 0 || index >= matches.length) {
      return;
    }
    const match = matches[index];
    const changed = select.value !== match.option.value;
    select.value = match.option.value;
    syncInput();
    close();
    if (changed) {
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };
  const onInput = () => {
    if (input.value === "" && select.value !== "") {
      select.value = "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    show();
  };
  const blur = () => {
    close();
    syncInput();
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.isComposing) {
      return;
    }
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) {
          show();
        }
        if (event.key === "ArrowDown") {
          active = Math.min(active + 1, matches.length - 1);
        } else {
          active = active < 0 ? matches.length - 1 : Math.max(0, active - 1);
        }
        highlight();
        break;
      }

      case "Enter": {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (open) {
          choose(Math.max(0, active));
        }
        break;
      }

      case "Escape": {
        event.preventDefault();
        blur();
        break;
      }

      default: {
        break;
      }
    }
  };
  const click = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>("[data-index]");
    if (row) {
      choose(Number(row.dataset.index));
    }
  };
  const reset = () => {
    queueMicrotask(() => {
      if (!destroyed) {
        blur();
      }
    });
  };
  select.hidden = true;
  input.removeAttribute("list");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", list.id);
  close();
  syncInput();
  input.addEventListener("focus", show);
  input.addEventListener("click", show);
  input.addEventListener("input", onInput);
  input.addEventListener("blur", blur);
  input.addEventListener("keydown", keydown);
  list.addEventListener("pointerdown", pointerDown);
  list.addEventListener("click", click);
  select.addEventListener("change", syncInput);
  input.form?.addEventListener("reset", reset);
  return {
    refresh,
    destroy: () => {
      destroyed = true;
      input.removeEventListener("focus", show);
      input.removeEventListener("click", show);
      input.removeEventListener("input", onInput);
      input.removeEventListener("blur", blur);
      input.removeEventListener("keydown", keydown);
      list.removeEventListener("pointerdown", pointerDown);
      list.removeEventListener("click", click);
      select.removeEventListener("change", syncInput);
      input.form?.removeEventListener("reset", reset);
      select.hidden = originalHidden;
      for (const [name, value] of originals) {
        if (value === null) {
          input.removeAttribute(name);
        } else {
          input.setAttribute(name, value);
        }
      }
      wrapper.before(input);
      wrapper.remove();
    },
  };
}
