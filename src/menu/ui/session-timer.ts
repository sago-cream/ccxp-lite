(function registerSidebarSessionTimer(globalScope: typeof globalThis) {
  const app = globalScope.CCXP_LITE;
  if (!app?.uiRenderer || !app.uiButtons || !app.uiController || !app.uiIcons) {
    return;
  }
  const { createRenderer } = app.uiRenderer;
  const { createButton } = app.uiButtons;
  const { createController } = app.uiController;
  const { createCategoryIcon } = app.uiIcons;
  const visibilityKey = "ccxp-lite-show-session-timer";
  const warningStates = new WeakMap<Document, { dismissed: boolean }>();
  let visible: boolean | undefined;

  function getVisible() {
    if (visible === undefined) {
      try {
        visible = globalScope.localStorage.getItem(visibilityKey) === "true";
      } catch {
        visible = false;
      }
    }
    return visible;
  }

  function readClock(topDocument: Document) {
    try {
      const frame = topDocument.querySelector<HTMLIFrameElement>('frame[src*="top.php"]');
      const header = frame?.contentDocument;
      if (!header || new URL(header.URL).pathname !== "/ccxp/INQUIRE/top.php") {
        return undefined;
      }
      const runtime = app?.sharedDom?.getRuntimeSafely();
      if (runtime && !header.querySelector("#ccxp-lite-session-clock-script")) {
        const script = header.createElement("script");
        script.id = "ccxp-lite-session-clock-script";
        script.src = runtime.getURL("menu/session-clock.js");
        header.documentElement.append(script);
      }
      const raw = header.documentElement.dataset.ccxpLiteSessionClock;
      if (raw === undefined || raw === "") {
        return undefined;
      }
      const clock = JSON.parse(raw) as { deadline?: unknown; sampledAt?: unknown };
      if (
        typeof clock.deadline !== "number" ||
        typeof clock.sampledAt !== "number" ||
        !Number.isFinite(clock.deadline) ||
        !Number.isFinite(clock.sampledAt) ||
        Date.now() - clock.sampledAt > 15_000 ||
        clock.sampledAt > Date.now() + 1000
      ) {
        return undefined;
      }
      return Math.max(0, Math.ceil((clock.deadline - Date.now()) / 1000));
    } catch {
      return undefined;
    }
  }

  function mount(
    targetDocument: Document,
    card: HTMLElement,
    settings: HTMLButtonElement,
    popup: HTMLElement,
    english: boolean,
  ) {
    const topDocument = targetDocument.defaultView?.top?.document ?? targetDocument;
    const warningState = warningStates.get(topDocument) ?? { dismissed: false };
    warningStates.set(topDocument, warningState);
    const dom = createRenderer(targetDocument);
    const controller = createController(targetDocument);
    const timer = dom.element("span", {
      className: "ccxp-lite-session-timer",
      attributes: {
        hidden: "",
        "aria-label": english ? "Time until logout" : "\u767B\u51FA\u5012\u6578",
      },
    });
    settings.append(timer);
    const toggle = createButton(targetDocument, {
      className: "ccxp-lite-profile-row ccxp-lite-profile-control ccxp-lite-session-timer-toggle",
      icon: createCategoryIcon(targetDocument, "clock"),
    });
    const toggleLabel = dom.element("span");
    toggle.append(toggleLabel);
    (popup.querySelector(".ccxp-lite-profile-settings") ?? popup).append(toggle);
    const icon = targetDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (const [key, value] of Object.entries({
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "aria-hidden": "true",
    })) {
      icon.setAttribute(key, value);
    }
    const path = targetDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "m6 6 12 12M6 18 18 6");
    icon.append(path);
    const dismiss = createButton(targetDocument, {
      className: "ccxp-lite-session-warning-dismiss",
      ariaLabel: english ? "Dismiss reminder" : "\u95DC\u9589\u63D0\u9192",
      icon,
    });
    const warning = dom.element(
      "div",
      { className: "ccxp-lite-session-warning", attributes: { hidden: "" } },
      [
        dom.element("span", {
          text: english
            ? "Logout in 5 min due to inactivity"
            : "5\u5206\u9418\u5F8C\u5C07\u56E0\u9592\u7F6E\u767B\u51FA",
          attributes: { role: "status" },
        }),
        dismiss,
      ],
    );
    const overlays = dom.element("div", { className: "ccxp-lite-profile-overlays" }, [
      warning,
      popup,
    ]);
    card.append(overlays);
    const showLabel = english ? "Show session timer" : "\u986F\u793A\u767B\u51FA\u5012\u6578";
    const hideLabel = english ? "Hide session timer" : "\u96B1\u85CF\u767B\u51FA\u5012\u6578";
    const update = () => {
      toggleLabel.textContent = getVisible() ? hideLabel : showLabel;
      const remaining = readClock(topDocument);
      timer.hidden = !getVisible() || remaining === undefined;
      if (remaining === undefined) {
        warning.hidden = true;
        return;
      }
      const minutes = Math.floor(remaining / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (remaining % 60).toString().padStart(2, "0");
      timer.textContent = `${minutes}:${seconds}`;
      if (remaining > 305) {
        warningState.dismissed = false;
      }
      warning.hidden = remaining === 0 || remaining > 300 || warningState.dismissed;
    };
    controller.listen(toggle, "click", () => {
      visible = !getVisible();
      try {
        globalScope.localStorage.setItem(visibilityKey, String(visible));
      } catch {
        // Keep the current preference when storage is unavailable.
      }
      update();
    });
    controller.listen(dismiss, "click", () => {
      warningState.dismissed = true;
      warning.hidden = true;
      settings.focus();
    });
    controller.listen(warning, "keydown", (event) => {
      if ((event as KeyboardEvent).key === "Escape") {
        warningState.dismissed = true;
        warning.hidden = true;
        settings.focus();
      }
    });
    controller.listen(targetDocument, "visibilitychange", update);
    update();
    const interval = globalScope.setInterval(update, 1000, undefined);
    return () => {
      globalScope.clearInterval(interval);
      controller.destroy();
    };
  }

  app.sidebarSessionTimer = { mount };
})(globalThis);
