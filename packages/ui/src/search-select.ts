/** Filter an existing select without replacing its form value or host handlers. */
export function mountSearchSelect(
  searchInput: HTMLInputElement,
  nativeSelect: HTMLSelectElement,
  resultStatus: HTMLElement,
  resultLabel: (count: number) => string,
  searchText: (option: HTMLOptionElement) => string = (option) => option.textContent,
): { destroy: () => void; refresh: () => void } {
  const input = searchInput;
  const select = nativeSelect;
  const status = resultStatus;
  const options = [...select.options].map((option) => ({
    option,
    text: `${option.value} ${searchText(option)}`.normalize("NFKC").toLocaleLowerCase(),
    hidden: option.hidden,
  }));
  const originalSize = select.size;
  let matchCount: number | undefined;
  const refresh = () => {
    status.textContent = matchCount === undefined ? "" : resultLabel(matchCount);
  };
  const filter = () => {
    const query = input.value.normalize("NFKC").trim().toLocaleLowerCase();
    let count = 0;
    for (const { option, text, hidden } of options) {
      const matches = query === "" || text.includes(query);
      option.hidden = hidden || !matches;
      if (!option.hidden && !option.disabled && option.value !== "") {
        count++;
      }
    }
    // Expand the native list while typing so results appear without Enter or an extra click.
    select.size = query === "" ? originalSize : Math.max(2, Math.min(6, count));
    matchCount = query === "" ? undefined : count;
    refresh();
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.isComposing) {
      return;
    }
    switch (event.key) {
      case "Enter": {
        event.preventDefault();
        event.stopImmediatePropagation();
        filter();
        if (input.value.trim() !== "") {
          const matching = options.filter(
            (item) => !item.option.hidden && !item.option.disabled && item.option.value !== "",
          );
          if (matching.length > 0) {
            const currentMatch = matching.find((item) => item.option.value === select.value);
            if (!currentMatch) {
              select.value = matching[0].option.value;
              select.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        }
        break;
      }

      case "ArrowDown": {
        event.preventDefault();
        select.focus();
        break;
      }

      case "Escape": {
        input.value = "";
        filter();
        break;
      }

      default: {
        break;
      }
    }
  };
  const reset = () => {
    // The native reset restores the form's default values after this event.
    queueMicrotask(filter);
  };
  input.addEventListener("input", filter);
  input.addEventListener("keydown", keydown);
  input.form?.addEventListener("reset", reset);
  return {
    refresh,
    destroy: () => {
      input.removeEventListener("input", filter);
      input.removeEventListener("keydown", keydown);
      input.form?.removeEventListener("reset", reset);
      for (const { option, hidden } of options) {
        option.hidden = hidden;
      }
      select.size = originalSize;
      status.textContent = "";
    },
  };
}
