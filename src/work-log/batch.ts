/* eslint-disable no-await-in-loop -- Each native navigation must finish before the next date is submitted. */
(function installBatchWorkLog() {
  if (
    window.name.startsWith("ccxp-lite-pe14d-") ||
    !/\/PE14D1\.php$/iu.test(globalThis.location.pathname)
  ) {
    return;
  }
  const id = "ccxp-lite-batch";
  const journalKey = "ccxp-lite-work-log-batch-journal";
  interface Entry {
    date: string;
    start: string;
    end: string;
  }
  interface Plan {
    entries: Entry[];
    task: string;
    department: string;
    note: string;
  }
  type HostWindow = Window & {
    toSubmit?: CcxpLiteWrappedSubmit;
    setDay?: (form: string, prefix: string, condition: string) => void;
  };
  let running = false;
  let stopped = false;
  let plan: Plan | undefined;
  let built = false;
  let panel: HTMLDetailsElement;
  let settings: HTMLFieldSetElement;
  let preview: HTMLDivElement;
  let status: HTMLParagraphElement;
  let startButton: HTMLButtonElement;
  let stopButton: HTMLButtonElement;
  let from: HTMLInputElement;
  let until: HTMLInputElement;
  let extra: HTMLInputElement;
  let slots: HTMLDivElement;
  let weekdays: HTMLDivElement;
  let stale = true;

  let big5Characters: Set<string> | undefined;
  function supportsBig5(text: string) {
    if (!big5Characters) {
      big5Characters = new Set(
        Array.from({ length: 128 }, (_item, index) => String.fromCodePoint(index)),
      );
      const decoder = new TextDecoder("big5");
      for (let lead = 0x81; lead <= 0xfe; lead++) {
        for (let trail = 0x40; trail <= 0xfe; trail++) {
          const decoded = decoder.decode(new Uint8Array([lead, trail]));
          if (!decoded.includes("\uFFFD")) {
            big5Characters.add(decoded);
          }
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-spread -- Big5 support is checked per Unicode code point; emoji sequences are rejected.
    return [...text].every((character) => big5Characters?.has(character) === true);
  }

  function entryKey(task: string, entry: Entry) {
    return JSON.stringify([task, entry.date, entry.start, entry.end]);
  }

  function readJournal() {
    const stored: unknown = JSON.parse(sessionStorage.getItem(journalKey) ?? "{}");
    if (
      stored === null ||
      typeof stored !== "object" ||
      Object.getPrototypeOf(stored) !== Object.prototype
    ) {
      throw new Error("Invalid journal");
    }
    return stored as Record<string, string | undefined>;
  }

  function updateSummary() {
    if (!plan || stale || running) {
      return;
    }
    const checks = [...preview.querySelectorAll<HTMLInputElement>("input")];
    const selected = plan.entries.filter((_entry, index) => checks[index].checked);
    const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    const hours =
      selected.reduce((sum, entry) => sum + minutes(entry.end) - minutes(entry.start), 0) / 60;
    status.textContent = `\u5DF2\u9078 ${selected.length} \u7B46\uFF0C\u5171 ${Number(hours.toFixed(2))} \u5C0F\u6642\u3002\u8ACB\u6838\u5C0D\u6E05\u55AE\u5F8C\u958B\u59CB\u767B\u9304\u3002`;
    startButton.disabled = selected.length === 0;
  }

  function isStopped() {
    return stopped;
  }

  function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = "") {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  }

  function button(text: string, action: () => void) {
    const node = element("button", text);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  }

  function field(parent: HTMLElement, title: string, type: string, initialValue = "") {
    const label = element("label", title);
    const input = element("input");
    input.type = type;
    input.value = initialValue;
    label.append(input);
    parent.append(label);
    return input;
  }

  function value(form: HTMLFormElement, name: string) {
    const data = new FormData(form).get(name);
    return typeof data === "string" ? data : "";
  }

  function hostForm(doc = document) {
    const form = doc.querySelector<HTMLFormElement>("#insForm");
    if (!form) {
      throw new Error(
        "\u627E\u4E0D\u5230\u65B0\u589E\u8868\u55AE\uFF0C\u8ACB\u78BA\u8A8D\u767B\u5165\u72C0\u614B\u5F8C\u91CD\u65B0\u958B\u555F\u5DE5\u6642\u9801\u9762\u3002",
      );
    }
    return form;
  }

  function invalidate() {
    stale = true;
    startButton.disabled = true;
    if (preview.childElementCount > 0 && !running) {
      status.textContent =
        "\u8A2D\u5B9A\u5DF2\u8B8A\u66F4\uFF0C\u8ACB\u91CD\u65B0\u9810\u89BD\u3002";
    }
  }

  function addSlot(start = "08:00", end = "10:00") {
    const row = element("div");
    row.className = "ccxp-lite-batch-slot";
    field(row, "\u958B\u59CB", "time", start);
    field(row, "\u7D50\u675F", "time", end);
    row.append(
      button("\u79FB\u9664\u6B64\u6642\u6BB5", () => {
        row.remove();
        invalidate();
      }),
    );
    slots.append(row);
    invalidate();
  }

  function build() {
    if (document.querySelector(`#${id}`) || !document.querySelector("#insForm")) {
      return;
    }
    // Keep the panel and its event handlers when the existing transport replaces the body.
    if (built) {
      hostForm().before(panel);
      invalidate();
      return;
    }
    built = true;
    panel = element("details");
    panel.id = id;
    panel.append(element("summary", "\u6279\u6B21\u767B\u9304 \u00B7 \u6BCF\u9031\u91CD\u8907"));
    panel.append(
      element(
        "p",
        "\u5148\u5728\u4E0B\u65B9\u65B0\u589E\u8868\u55AE\u9078\u597D\u4EFB\u52D9\u3001\u5DE5\u4F5C\u55AE\u4F4D\u8207\u5DE5\u4F5C\u5167\u5BB9\uFF0C\u518D\u8A2D\u5B9A\u65E5\u671F\u548C\u6642\u6BB5\u3002\u6BCF\u9031\u91CD\u8907\u6703\u5C55\u958B\u70BA\u672C\u6B21\u767B\u9304\u6E05\u55AE\uFF0C\u4E0D\u6703\u5728\u80CC\u666F\u5B9A\u6642\u9001\u51FA\u3002",
      ),
    );
    settings = element("fieldset");
    panel.append(settings);
    const dates = element("div");
    dates.className = "ccxp-lite-batch-fields";
    const form = hostForm();
    const initialDate = ["Year", "Month", "Day"]
      .map((part) => value(form, `I_TASK_DT_${part}`))
      .join("-");
    from = field(dates, "\u958B\u59CB\u65E5\u671F", "date", initialDate);
    until = field(dates, "\u7D50\u675F\u65E5\u671F", "date", initialDate);
    settings.append(dates);
    weekdays = element("div");
    weekdays.className = "ccxp-lite-batch-weekdays";
    for (const [index, day] of [
      "\u65E5",
      "\u4E00",
      "\u4E8C",
      "\u4E09",
      "\u56DB",
      "\u4E94",
      "\u516D",
    ].entries()) {
      const input = field(weekdays, `\u9031${day}`, "checkbox");
      input.value = String(index);
      input.checked = index > 0 && index < 6;
    }
    settings.append(element("p", "\u5340\u9593\u5167\u6BCF\u9031\u91CD\u8907"), weekdays);
    extra = field(
      settings,
      "\u984D\u5916\u65E5\u671F\uFF08\u4EE5\u9017\u865F\u5206\u9694\uFF0C\u4F8B\u5982 2026-09-12, 2026-09-19\uFF09",
      "text",
    );
    slots = element("div");
    settings.append(slots);
    settings.append(
      button("\uFF0B \u589E\u52A0\u6642\u6BB5", () => {
        addSlot("13:00", "17:00");
      }),
    );
    settings.append(button("\u9810\u89BD\u767B\u9304\u6E05\u55AE", makePreview));
    preview = element("div");
    preview.className = "ccxp-lite-batch-preview";
    preview.addEventListener("change", updateSummary);
    status = element("p");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    startButton = button("\u958B\u59CB\u6279\u6B21\u767B\u9304", () => {
      run().catch((error: unknown) => {
        status.textContent = String(error);
      });
    });
    startButton.disabled = true;
    stopButton = button("\u5B8C\u6210\u76EE\u524D\u4E00\u7B46\u5F8C\u505C\u6B62", () => {
      stopped = true;
      stopButton.disabled = true;
    });
    stopButton.hidden = true;
    panel.append(preview, status, startButton, stopButton);
    settings.addEventListener("input", invalidate);
    document.addEventListener("input", (event) => {
      if (event.target instanceof Element && event.target.closest("#insForm")) {
        invalidate();
      }
    });
    hostForm().before(panel);
    addSlot();
  }

  function dateValue(raw: string) {
    const date = new Date(`${raw}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/u.test(raw) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== raw
    ) {
      throw new Error("\u8ACB\u8F38\u5165\u6709\u6548\u65E5\u671F\uFF08YYYY-MM-DD\uFF09\u3002");
    }
    return date;
  }

  function makePreview() {
    try {
      const first = dateValue(from.value);
      const last = dateValue(until.value);
      const days = (last.getTime() - first.getTime()) / 86_400_000;
      if (days < 0 || days > 366) {
        throw new Error(
          "\u7D50\u675F\u65E5\u671F\u4E0D\u53EF\u65E9\u65BC\u958B\u59CB\u65E5\u671F\uFF0C\u65E5\u671F\u5340\u9593\u6700\u591A\u4E00\u5E74\u3002",
        );
      }
      const selected = new Set(
        [...weekdays.querySelectorAll<HTMLInputElement>("input:checked")].map((input) =>
          Number(input.value),
        ),
      );
      const dates = new Set<string>();
      for (let day = first.getTime(); day <= last.getTime(); day += 86_400_000) {
        const date = new Date(day);
        if (selected.has(date.getUTCDay())) {
          dates.add(date.toISOString().slice(0, 10));
        }
      }
      for (const raw of extra.value.split(/[,\uFF0C\s]+/u).filter(Boolean)) {
        dates.add(dateValue(raw).toISOString().slice(0, 10));
      }
      const times = [...slots.children]
        .map((row) => {
          const inputs = row.querySelectorAll("input");
          const start = inputs[0].value;
          const end = inputs[1].value;
          if (!/^\d{2}:\d{2}$/u.test(start) || !/^\d{2}:\d{2}$/u.test(end) || start >= end) {
            throw new Error(
              "\u6BCF\u6BB5\u7D50\u675F\u6642\u9593\u5FC5\u9808\u665A\u65BC\u958B\u59CB\u6642\u9593\uFF1B\u8DE8\u5348\u591C\u8ACB\u5206\u65E5\u767B\u9304\u3002",
            );
          }
          return { start, end };
        })
        .toSorted((a, b) => a.start.localeCompare(b.start));
      if (times.some((time, index) => index > 0 && time.start < times[index - 1].end)) {
        throw new Error(
          "\u6642\u6BB5\u4E0D\u53EF\u91CD\u758A\uFF0C\u8ACB\u8ABF\u6574\u5F8C\u518D\u9810\u89BD\u3002",
        );
      }
      const entries = [...dates]
        .toSorted()
        .flatMap((date) => times.map((time) => ({ date, ...time })));
      if (entries.length === 0 || entries.length > 100) {
        throw new Error(
          "\u8ACB\u9078\u53D6\u65E5\u671F\u8207\u6642\u6BB5\uFF0C\u6BCF\u6279\u6700\u591A 100 \u7B46\u3002",
        );
      }
      const form = hostForm();
      const task = value(form, "I_LAB_SERIAL");
      const department = value(form, "I_SRV_ID");
      const note = value(form, "I_TASK_NOTE").trim();
      if (task === "" || department === "" || note === "" || note.length > 15) {
        throw new Error(
          "\u8ACB\u5148\u5728\u65B0\u589E\u8868\u55AE\u9078\u53D6\u4EFB\u52D9\u3001\u5DE5\u4F5C\u55AE\u4F4D\uFF0C\u4E26\u586B\u5BEB\u6700\u591A 15 \u5B57\u7684\u5DE5\u4F5C\u5167\u5BB9\u3002",
        );
      }
      if (!supportsBig5(note)) {
        throw new Error(
          "\u5DE5\u4F5C\u5167\u5BB9\u542B Big5 \u7121\u6CD5\u8868\u793A\u7684\u5B57\u5143\uFF0C\u8ACB\u79FB\u9664\u8868\u60C5\u7B26\u865F\u6216\u6539\u7528\u5E38\u7528\u4E2D\u6587\u5B57\u3002",
        );
      }
      const journal = readJournal();
      plan = { entries, task, department, note };
      preview.replaceChildren("");
      preview.append(
        element("p", `\u4EFB\u52D9 ${task} \u00B7 \u55AE\u4F4D ${department} \u00B7 ${note}`),
      );
      for (const entry of entries) {
        const input = field(
          preview,
          `${entry.date}\uFF08\u9031${
            "\u65E5\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D"[dateValue(entry.date).getUTCDay()]
          }\uFF09 ${entry.start}\u2013${entry.end}`,
          "checkbox",
        );
        const previous = journal[entryKey(task, entry)];
        input.checked = previous === undefined;
        input.disabled = previous !== undefined;
        if (previous !== undefined) {
          input.parentElement?.append(
            element(
              "strong",
              previous === "done"
                ? " \u5DF2\u767B\u9304"
                : " \u5F85\u67E5\u8A62\u78BA\u8A8D\uFF0C\u8ACB\u52FF\u91CD\u9001",
            ),
          );
        }
      }
      preview.append(
        element("p", "\u53D6\u6D88\u52FE\u9078\u53EF\u6392\u9664\u500B\u5225\u6642\u6BB5\u3002"),
      );
      stale = false;
      startButton.disabled = false;
      updateSummary();
    } catch (error) {
      invalidate();
      status.textContent = error instanceof Error ? error.message : String(error);
    }
  }

  function set(form: HTMLFormElement, name: string, next: string) {
    const controls = [
      ...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select"),
    ].filter((control) => control.name === name);
    if (controls.length === 0) {
      throw new Error(`\u6821\u65B9\u8868\u55AE\u7F3A\u5C11\u6B04\u4F4D\uFF1A${name}`);
    }
    for (const control of controls) {
      if (control.type === "radio") {
        control.checked = control.value === next;
      } else {
        control.value = next;
      }
    }
    if (value(form, name) !== next) {
      throw new Error(
        `\u6B64\u65E5\u671F\u7684\u4EFB\u52D9\u6216\u6B04\u4F4D\u9078\u9805\u4E0D\u53EF\u7528\uFF1A${name}`,
      );
    }
  }

  function setDate(form: HTMLFormElement, entry: Entry) {
    for (const [index, part] of ["Year", "Month", "Day"].entries()) {
      if (part === "Day") {
        (form.ownerDocument.defaultView as HostWindow | null)?.setDay?.(
          "insForm",
          "I_TASK_DT_",
          "onblur",
        );
      }
      set(form, `I_TASK_DT_${part}`, entry.date.split("-")[index]);
    }
  }

  async function navigate(frame: HTMLIFrameElement, action: () => void): Promise<Document> {
    return await new Promise((resolve, reject) => {
      const timer = globalThis.setTimeout(
        () => {
          cleanup();
          reject(
            new Error(
              "\u7B49\u5F85\u6821\u65B9\u56DE\u61C9\u903E\u6642\uFF0C\u8ACB\u5148\u67E5\u8A62\u5DE5\u6642\u7D00\u9304\uFF0C\u52FF\u76F4\u63A5\u91CD\u9001\u3002",
            ),
          );
        },
        30_000,
        undefined,
      );
      function cleanup() {
        clearTimeout(timer);
        frame.removeEventListener("load", loaded);
      }

      function loaded() {
        try {
          const doc = frame.contentDocument;
          if (!doc || doc.URL === "about:blank") {
            return;
          }
          cleanup();
          hostForm(doc);
          resolve(doc);
        } catch (error) {
          cleanup();
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }
      frame.addEventListener("load", loaded);
      try {
        action();
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  function submit(frame: HTMLIFrameElement, action: string) {
    const host = frame.contentWindow as HostWindow | null;
    if (!host?.toSubmit) {
      throw new Error(
        "\u6821\u65B9\u8868\u55AE\u5C1A\u672A\u5C31\u7DD2\uFF0C\u5DF2\u505C\u6B62\u3002",
      );
    }
    const form = hostForm(host.document);
    let message = "";
    host.alert = (text?: unknown) => {
      message = String(text);
    };
    host.confirm = (text?: string) => {
      message =
        text ??
        "\u6821\u65B9\u8981\u6C42\u78BA\u8A8D\uFF0C\u8ACB\u6539\u7528\u55AE\u7B46\u767B\u9304\u3002";
      return false;
    };
    // Native form.submit() omits submit buttons. Supply the server's canonical action explicitly.
    const submitControl = form.querySelector<HTMLInputElement>('input[name="S_SUBMIT"]');
    if (!submitControl) {
      throw new Error("\u627E\u4E0D\u5230\u6821\u65B9\u9001\u51FA\u6309\u9215\u3002");
    }
    const previousType = submitControl.type;
    submitControl.type = "hidden";
    if (action === "ins") {
      submitControl.value = "\u65B0\u589E(Add)";
    }
    try {
      if (host.toSubmit(form, action) !== true) {
        throw new Error(
          message === ""
            ? "\u6821\u65B9\u9A57\u8B49\u672A\u901A\u904E\uFF0C\u8ACB\u78BA\u8A8D\u65E5\u671F\u3001\u6642\u6BB5\u8207\u4EFB\u52D9\u8CC7\u6599\u3002"
            : message,
        );
      }
    } finally {
      submitControl.type = previousType;
    }
  }

  function succeeded(doc: Document, entry: Entry, current: Plan) {
    const roc =
      String(Number(entry.date.slice(0, 4)) - 1911) + entry.date.slice(5).replace("-", "");
    return (
      [...doc.querySelectorAll<HTMLTableRowElement>("#listForm tr")].some((row) => {
        const { cells } = row;
        if (cells.length !== 15) {
          return false;
        }
        const times = cells[2].textContent.match(/\d{2}:\d{2}/gu);
        return (
          cells[1].textContent.trim() === roc &&
          times?.[0] === entry.start &&
          times[1] === entry.end &&
          cells[4].textContent.trim() === current.task &&
          cells[6].textContent.trim() === current.note
        );
      }) &&
      [...doc.scripts].some((script) =>
        /alert\(['"][^'"]*Add successfully!/iu.test(script.textContent),
      )
    );
  }

  async function run() {
    if (running || stale || !plan) {
      return;
    }
    const current = plan;
    const checks = [...preview.querySelectorAll<HTMLInputElement>("input")];
    const entries = current.entries.filter((_entry, index) => checks[index].checked);
    if (entries.length === 0) {
      status.textContent = "\u8ACB\u81F3\u5C11\u52FE\u9078\u4E00\u7B46\u3002";
      return;
    }
    let journal: Record<string, string | undefined>;
    try {
      journal = readJournal();
      sessionStorage.setItem(journalKey, JSON.stringify(journal));
    } catch {
      status.textContent =
        "\u7121\u6CD5\u4FDD\u5B58\u672C\u6B21\u9032\u5EA6\uFF0C\u8ACB\u5141\u8A31\u6B64\u9801\u9762\u7684\u5DE5\u4F5C\u968E\u6BB5\u5132\u5B58\u5F8C\u518D\u8A66\u3002";
      return;
    }
    running = true;
    stopped = false;
    settings.disabled = true;
    startButton.disabled = true;
    stopButton.hidden = false;
    stopButton.disabled = false;
    for (const check of checks) {
      check.disabled = true;
    }
    // Prevent changing the shared form or navigating its transport during the batch.
    const form = hostForm();
    const locked = [
      ...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(
        "input, select, button",
      ),
    ].filter((control) => !control.disabled);
    const token = value(form, "ACIXSTORE");
    for (const control of locked) {
      control.disabled = true;
    }
    const frame = element("iframe");
    frame.name = "ccxp-lite-pe14d-batch";
    frame.hidden = true;
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
    panel.append(frame);
    let completed = 0;
    try {
      for (const entry of entries) {
        if (isStopped()) {
          break;
        }
        const key = entryKey(current.task, entry);
        if (Object.hasOwn(journal, key)) {
          throw new Error(
            `${entry.date} ${entry.start} \u5DF2\u9001\u51FA\u904E\u6216\u7D50\u679C\u5C1A\u5F85\u78BA\u8A8D\uFF0C\u8ACB\u5148\u67E5\u8A62\u7D00\u9304\u3002`,
          );
        }
        status.textContent = `\u5DF2\u5B8C\u6210 ${completed} / ${
          entries.length
        }\uFF1B\u6B63\u5728\u8655\u7406 ${entry.date} ${entry.start}\u2013${entry.end}`;
        const url = new URL("PE14D1.php", globalThis.location.href);
        url.searchParams.set("ACIXSTORE", token);
        await navigate(frame, () => {
          frame.src = url.href;
        });
        const initial = hostForm(frame.contentDocument ?? undefined);
        setDate(initial, entry);
        const doc = await navigate(frame, () => {
          submit(frame, "getLabInsList");
        });
        const next = hostForm(doc);
        setDate(next, entry);
        set(next, "I_LAB_SERIAL", current.task);
        set(next, "I_SRV_ID", current.department);
        set(next, "I_TASK_NOTE", current.note);
        for (const [prefix, time] of [
          ["A", entry.start],
          ["Z", entry.end],
        ]) {
          set(next, `I_TASK_${prefix}_TM_Hour`, time.split(":")[0]);
          set(next, `I_TASK_${prefix}_TM_Minute`, time.split(":")[1]);
        }
        if (isStopped()) {
          break;
        }
        journal[key] = "pending";
        sessionStorage.setItem(journalKey, JSON.stringify(journal));
        const response = await navigate(frame, () => {
          submit(frame, "ins");
        });
        if (!succeeded(response, entry, current)) {
          throw new Error(
            `\u672A\u80FD\u78BA\u8A8D ${entry.date} ${
              entry.start
            } \u767B\u9304\u6210\u529F\uFF0C\u5DF2\u505C\u6B62\u3002\u8ACB\u5148\u67E5\u8A62\u7D00\u9304\u8207\u6821\u65B9\u63D0\u793A\u3002`,
          );
        }
        journal[key] = "done";
        sessionStorage.setItem(journalKey, JSON.stringify(journal));
        completed++;
        const index = current.entries.indexOf(entry);
        checks[index].checked = false;
        checks[index].parentElement?.append(element("strong", " \u2713 \u5DF2\u767B\u9304"));
      }
      status.textContent = `${isStopped() ? "\u5DF2\u505C\u6B62\u3002" : "\u767B\u9304\u5B8C\u6210\u3002"}\u6210\u529F ${completed} \u7B46\uFF1B\u8ACB\u81F3\u67E5\u8A62\u9801\u78BA\u8A8D\u7D00\u9304\u3002`;
    } catch (error) {
      status.textContent = `\u5DF2\u5B8C\u6210 ${completed} \u7B46\u3002${error instanceof Error ? error.message : String(error)}`;
    } finally {
      frame.remove();
      running = false;
      settings.disabled = false;
      stopButton.hidden = true;
      for (const control of locked) {
        control.disabled = false;
      }
      for (const check of checks) {
        check.disabled = false;
      }
      // Re-preview is required; confirmed or uncertain entries remain guarded in the journal.
      stale = true;
    }
  }
  const observer = new MutationObserver(build);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  build();
})();
