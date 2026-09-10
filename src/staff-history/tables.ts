(function enhanceStaffHistoryTables(globalScope: typeof globalThis) {
  if (!/^\/ccxp\/inquire\/pe\/3\/3000\/pe30003\.php$/i.test(globalScope.location.pathname)) {
    return;
  }
  interface Column {
    field?: string;
    title?: string;
    hidden?: boolean;
  }
  interface Grid {
    columns: Column[];
    ccxpLiteDetailColumns?: Column[];
    hideColumn: (column: Column) => void;
    reorderColumn: (index: number, column: Column) => void;
    resizeColumn: (column: Column, width: number) => void;
    resize: (force: boolean) => void;
    bind: (name: string, callback: () => void) => void;
    unbind: (name: string, callback: () => void) => void;
  }
  const page = globalScope as typeof globalThis & {
    jQuery?: (element: Element) => { data: (name: string) => Grid | undefined };
    __ccxpStaffTablesCleanup?: () => void;
  };
  page.__ccxpStaffTablesCleanup?.();
  const cleanups: Array<() => void> = [];
  const pending = new Set(["grid", "grid_pre"]);
  let timer: number | undefined;
  let attempts = 0;
  const pay = ["H_TIME", "H_HOUR", "H_NT", "AMT"];
  function enhance(element: HTMLElement, grid: Grid) {
    const root = element;
    const history = element.id === "grid_pre";
    const identity = history ? "APP_NO" : "SERIAL_NO";
    const secondary = history ? [...pay, "SERIAL_NO", "L_SYS", "ORGANIZE", "ADJ_REASON"] : pay;
    const widget = grid;
    const fields =
      widget.ccxpLiteDetailColumns ??
      grid.columns.filter(
        (column) =>
          column.field !== undefined && secondary.includes(column.field) && column.hidden !== true,
      );
    widget.ccxpLiteDetailColumns = fields;
    // Retain only fields that the host exposed; do not reveal permission-hidden columns.
    let configured = element.dataset.ccxpStaffTable === "true";
    const decorate = () => {
      const headerRow = element.querySelector<HTMLTableRowElement>(".k-grid-header tr");
      if (!headerRow) {
        return;
      }
      const headings = [...headerRow.cells];
      const identityIndex = headings.findIndex((cell) => cell.dataset.field === identity);
      headerRow.cells.item(identityIndex)?.classList.add("ccxp-staff-identity-heading");
      for (const row of element.querySelectorAll<HTMLTableRowElement>(
        `#${element.id} > .k-grid-content > table > tbody > tr.k-master-row`,
      )) {
        const cell = row.cells.item(identityIndex);
        if (!cell) {
          continue;
        }
        const record = cell.firstChild?.textContent?.trim() ?? "";
        if (!cell.querySelector(".ccxp-staff-record-details")) {
          const details = document.createElement("details");
          details.className = "ccxp-staff-record-details";
          const summary = document.createElement("summary");
          summary.textContent = history
            ? "\u7533\u8ACB\u8A73\u60C5"
            : "\u5DE5\u6642\u8207\u85AA\u8CC7";
          summary.setAttribute("aria-label", `${summary.textContent} ${record}`);
          const list = document.createElement("dl");
          for (const column of fields) {
            const index = headings.findIndex((heading) => heading.dataset.field === column.field);
            const source = row.cells.item(index);
            if (!source) {
              continue;
            }
            const label = document.createElement("dt");
            const value = document.createElement("dd");
            label.textContent = column.title ?? column.field ?? "";
            value.textContent = source.textContent;
            list.append(label, value);
          }
          details.append(summary, list);
          cell.append(details);
        }
        cell.classList.add("ccxp-staff-identity");
        const statusIndex = headings.findIndex((heading) => heading.dataset.field === "APROVED");
        row.cells.item(statusIndex)?.classList.add("ccxp-staff-status");
        for (const [index, heading] of headings.entries()) {
          const label = heading.textContent.trim();
          if (
            !["\u5217\u5370", "\u5B78\u7FD2\u8A08\u756B\u66F8/\u5951\u7D04\u66F8"].includes(label)
          ) {
            continue;
          }
          for (const action of row.cells.item(index)?.querySelectorAll<HTMLElement>("button,a") ??
            []) {
            const name = label === "\u5217\u5370" ? "\u5217\u5370" : "\u4E0B\u8F09\u6587\u4EF6";
            action.setAttribute("aria-label", `${name} ${record}`);
            action.setAttribute("title", name);
            action.classList.add("ccxp-staff-document-action");
            if (
              !action.querySelector(".ccxp-staff-action-label") &&
              action.textContent.trim() !== name
            ) {
              const text = document.createElement("span");
              text.className = "ccxp-staff-action-label";
              text.textContent = name;
              action.append(text);
            }
          }
        }
      }
      for (const detailCell of element.querySelectorAll<HTMLElement>(
        `#${element.id} > .k-grid-content > table > tbody > .k-detail-row > .k-detail-cell`,
      )) {
        if (!detailCell.querySelector(".ccxp-staff-detail-heading")) {
          const heading = document.createElement("h3");
          heading.className = "ccxp-staff-detail-heading";
          heading.textContent = "\u76F8\u95DC\u7533\u8ACB";
          detailCell.prepend(heading);
        }
      }
    };
    const configure = () => {
      if (configured || element.getBoundingClientRect().width === 0) {
        return;
      }
      configured = true;
      // Reorder existing column objects through Kendo, preserving templates and commands.
      const preferred = history
        ? ["APP_NO", "APROVED", "PJ_ID", "S_DATE", "E_DATE"]
        : ["SERIAL_NO", "PJ_ID", "L_SYS", "ORGANIZE", "S_DATE", "E_DATE"];
      for (const [index, field] of preferred.entries()) {
        const column = grid.columns.find((candidate) => candidate.field === field);
        if (column) {
          grid.reorderColumn(index, column);
        }
      }
      for (const column of fields) {
        grid.hideColumn(column);
      }
      root.dataset.ccxpStaffTable = "true";
      for (const column of grid.columns) {
        if (column.hidden === true) {
          continue;
        }
        const widths: Record<string, number> = { [identity]: 190, PJ_ID: 150, L_SYS: 170 };
        const width =
          column.title?.includes("\u5951\u7D04") === true
            ? 160
            : (widths[column.field ?? ""] ?? 120);
        grid.resizeColumn(column, width);
      }
      grid.resize(true);
      decorate();
    };
    for (const event of ["dataBound", "detailExpand", "columnReorder", "columnShow"]) {
      grid.bind(event, decorate);
      cleanups.push(() => {
        grid.unbind(event, decorate);
      });
    }
    const observer = new ResizeObserver(configure);
    observer.observe(element);
    cleanups.push(() => {
      observer.disconnect();
    });
    configure();
  }

  function attach() {
    attempts++;
    for (const id of pending) {
      const element = document.querySelector<HTMLElement>(`#${id}`);
      const grid = element && page.jQuery?.(element).data("kendoGrid");
      if (element && grid && typeof grid.resizeColumn === "function") {
        enhance(element, grid);
        pending.delete(id);
      }
    }
    if (pending.size > 0 && attempts < 40) {
      timer = globalScope.setTimeout(attach, 250, undefined);
    }
  }
  const cleanup = () => {
    globalScope.clearTimeout(timer);
    for (const callback of cleanups) {
      callback();
    }
    globalScope.removeEventListener("pagehide", onPageHide);
  };
  function onPageHide(event: PageTransitionEvent) {
    if (!event.persisted) {
      cleanup();
    }
  }
  page.__ccxpStaffTablesCleanup = cleanup;
  globalScope.addEventListener("pagehide", onPageHide);
  attach();
})(globalThis);
