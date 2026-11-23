import { describe, expect, test, vi } from "vitest";

import { createLoginHtml } from "../helpers/login-fixtures.js";
import {
  createTestWindow,
  loadModules,
  loginModulePaths,
  requireElement,
} from "../helpers/module-loader.js";

const loginBootstrapModulePaths = [
  ...loginModulePaths,
  "src/login/pipeline/bootstrap.ts",
  "src/main/bootstrap.ts",
];

describe("main bootstrap login path", () => {
  test("keeps legacy frames hidden until the sidebar is applied", async () => {
    const { window } = createTestWindow(
      undefined,
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php",
    );
    const document = window.document as unknown as Document;
    // The production shell uses deprecated frames; Happy DOM cannot parse their markup.
    /* eslint-disable @typescript-eslint/no-deprecated */
    const frameset = document.createElement("frameset");
    const navFrame = document.createElement("frame");
    const mainFrame = document.createElement("frame");
    /* eslint-enable @typescript-eslint/no-deprecated */
    frameset.setAttribute("cols", "200,*");
    navFrame.setAttribute("name", "nav");
    mainFrame.setAttribute("name", "main");
    frameset.append(navFrame, mainFrame);
    document.body.replaceWith(frameset);
    const FrameEvent = window.Event as unknown as typeof Event;

    const { window: navWindow } = createTestWindow("<body>Legacy navigation</body>");
    const { window: mainWindow } = createTestWindow("<body>Legacy main content</body>");
    const navDocument = navWindow.document as unknown as Document;
    Object.defineProperty(navFrame, "contentDocument", { value: navDocument });
    Object.defineProperty(mainFrame, "contentDocument", { value: mainWindow.document });
    window.requestAnimationFrame = vi.fn(() => 1) as unknown as typeof window.requestAnimationFrame;
    let sidebarReady = false;
    window.CCXP_LITE.sidebar = {
      simplifySidebar: () => {
        if (sidebarReady) {
          navDocument.body.dataset.ccxpLiteSidebarApplied = "true";
        }
      },
    };

    loadModules(window, loginBootstrapModulePaths);

    expect(document.querySelector("body")).toBeNull();
    expect(window.getComputedStyle(navFrame).visibility).toBe("hidden");
    expect(window.getComputedStyle(mainFrame).visibility).toBe("hidden");
    mainFrame.dispatchEvent(new FrameEvent("load"));
    expect(window.getComputedStyle(navFrame).visibility).toBe("hidden");

    sidebarReady = true;
    navFrame.dispatchEvent(new FrameEvent("load"));
    expect(document.documentElement.dataset.ccxpLiteLoadingReady).toBe("true");
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 200);
    });
    expect(window.getComputedStyle(navFrame).visibility).not.toBe("hidden");
    expect(window.getComputedStyle(mainFrame).visibility).not.toBe("hidden");
  });

  test("rewrites the login page without requiring sidebar registration", async () => {
    const { window } = createTestWindow(
      createLoginHtml(),
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/",
    );
    window.fetch = vi
      .fn()
      .mockRejectedValue(
        new Error("captcha fetch disabled in test"),
      ) as unknown as typeof window.fetch;

    loadModules(window, loginBootstrapModulePaths);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    const document = window.document as unknown as Document;
    const body = document.body as HTMLBodyElement;
    const landingShell = document.querySelector("main.ccxp-lite-landing-shell");

    expect(body.dataset.ccxpLiteLandingApplied).toBe("true");
    expect(landingShell).not.toBeNull();
  });

  test("rewrites the login page when bootstrap starts before the form is parsed", async () => {
    const { window } = createTestWindow(
      "<!doctype html><html lang='zh'><head></head><body></body></html>",
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/",
    );
    window.fetch = vi
      .fn()
      .mockRejectedValue(
        new Error("captcha fetch disabled in test"),
      ) as unknown as typeof window.fetch;

    let readyState: DocumentReadyState = "loading";
    Object.defineProperty(window.document, "readyState", {
      configurable: true,
      get: () => readyState,
    });

    loadModules(window, loginBootstrapModulePaths);

    const parsedDocument = new window.DOMParser().parseFromString(
      createLoginHtml(),
      "text/html",
    ) as unknown as Document;
    const document = window.document as unknown as Document;
    const targetBody = document.body as HTMLBodyElement;
    const replacementBody = parsedDocument.body.cloneNode(true) as HTMLBodyElement;
    targetBody.replaceChildren(...replacementBody.childNodes);
    readyState = "complete";

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 300);
    });

    const body = document.body as HTMLBodyElement;
    const landingShell = document.querySelector("main.ccxp-lite-landing-shell");

    expect(body.dataset.ccxpLiteLandingApplied).toBe("true");
    expect(landingShell).not.toBeNull();
  });

  test("skins standalone inquire pages when they open outside the frameset", async () => {
    const { window } = createTestWindow(
      "<!doctype html><html lang='zh'><head></head><body><main style='color: red !important; width: 11px !important; display: none !important'>Standalone page</main></body></html>",
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/JH/B/B.2/B.2.3/JHB23001.php?ACIXSTORE=test",
    );

    loadModules(window, loginBootstrapModulePaths);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    const document = window.document as unknown as Document;
    const body = document.body as HTMLBodyElement;
    const main = document.querySelector<HTMLElement>("main");

    expect(body.classList.contains("ccxp-lite-main-skin")).toBe(true);
    expect(body.style.getPropertyValue("background-image")).toBe("none");
    expect(body.style.getPropertyValue("background-color")).toBe("var(--ccxp-lite-bg)");
    expect(main?.style.getPropertyValue("color")).toBe("red");
    expect(main?.style.getPropertyPriority("color")).toBe("");
    expect(main?.style.getPropertyPriority("width")).toBe("");
    expect(main?.style.getPropertyPriority("display")).toBe("important");
  });
});

test("rewrites Turnstile login in place without moveBefore or detaching the widget", () => {
  const { window } = createTestWindow(
    createLoginHtml()
      .replace(
        "<form action=",
        '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script><form id="login-form" action=',
      )
      .replace('<input type="hidden" name="fnstr" value="20260428-777" />', "")
      .replace(
        '<button type="submit">',
        '<div class="cf-turnstile"><iframe></iframe></div><button type="submit">',
      )
      .replace(
        "</body>",
        '<input type="hidden" name="fnstr" value="20260428-777" form="login-form" /></body>',
      ),
  );
  const document = window.document as Document;
  const form = requireElement(document.querySelector<HTMLFormElement>("form"));
  const turnstile = requireElement(document.querySelector<HTMLElement>(".cf-turnstile"));
  const iframe = requireElement(document.querySelector("iframe"));
  const fnstr = requireElement(document.querySelector<HTMLInputElement>("input[name='fnstr']"));
  const removedCriticalNodes: Node[] = [];
  const collectRemovedCriticalNodes = (
    records: ReadonlyArray<Readonly<{ removedNodes: Iterable<unknown> }>>,
  ) => {
    for (const record of records) {
      for (const node of record.removedNodes) {
        const removedNode = node as Node;
        if (
          removedNode === form ||
          removedNode === turnstile ||
          removedNode === iframe ||
          (typeof (removedNode as Element).contains === "function" &&
            ((removedNode as Element).contains(form) ||
              (removedNode as Element).contains(turnstile) ||
              (removedNode as Element).contains(iframe)))
        ) {
          removedCriticalNodes.push(removedNode);
        }
      }
    }
  };
  const observer = new window.MutationObserver(
    (records: ReadonlyArray<Readonly<{ removedNodes: Iterable<unknown> }>>) => {
      collectRemovedCriticalNodes(records);
    },
  );
  observer.observe(document.body as unknown as Parameters<typeof observer.observe>[0], {
    childList: true,
    subtree: true,
  });

  loadModules(window, [...loginModulePaths, "src/login/pipeline/bootstrap.ts"]);
  let ready = false;
  window.CCXP_LITE.login?.simplifyLoginPage(document, {
    onReady: () => {
      ready = true;
    },
  });
  collectRemovedCriticalNodes(observer.takeRecords());
  observer.disconnect();

  expect(ready).toBe(true);
  expect(document.body.dataset.ccxpLiteLandingApplied).toBe("true");
  expect(document.body.classList.contains("ccxp-lite-landing-shell")).toBe(true);
  expect(removedCriticalNodes).toHaveLength(0);
  expect(document.querySelector("form")).toBe(form);
  expect(document.querySelector(".cf-turnstile")).toBe(turnstile);
  expect(document.querySelector("iframe")).toBe(iframe);
  expect(form.contains(fnstr)).toBe(true);
  expect(fnstr.value).toBe("20260428-777");
  expect(turnstile.nextElementSibling?.classList.contains("ccxp-lite-login-action-group")).toBe(
    true,
  );
  expect(document.querySelector("script[src*='turnstile']")).not.toBeNull();
});

test("skins standalone password reset page without detaching Turnstile or form inputs", async () => {
  const { window } = createTestWindow(
    `<!doctype html><html><head><title>Reset Password</title></head><body>
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      <form id="form1" method="post" action="PC13002.php">
        <table>
          <tr><td>Account:</td><td><input type="text" name="U_NAME" id="U_NAME" value=""></td></tr>
          <tr><td></td><td>
            <input type="hidden" name="fnstr" value="20261123-737590049884">
            <input type="hidden" name="code" id="code" value="">
            <input type="submit" name="choice" value="Next">
            <input type="submit" name="choice" value="Cancel">
          </td></tr>
          <tr><td></td><td>
            <div id="cf-turnstile" class="cf-turnstile" data-sitekey="1x00000000000000000000AA">
              <iframe></iframe>
            </div>
          </td></tr>
        </table>
      </form>
    </body></html>`,
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PC/1/1.3/PC13001.php?lang=C",
  );
  const document = window.document as Document;
  const form = requireElement(document.querySelector<HTMLFormElement>("#form1"));
  const turnstile = requireElement(document.querySelector<HTMLElement>("#cf-turnstile"));
  const removedNodes: unknown[] = [];
  const observer = new window.MutationObserver(
    (records: ReadonlyArray<Readonly<{ removedNodes: Iterable<unknown> }>>) => {
      for (const record of records) {
        for (const node of record.removedNodes) {
          removedNodes.push(node);
        }
      }
    },
  );
  observer.observe(document.body as unknown as Parameters<typeof observer.observe>[0], {
    childList: true,
    subtree: true,
  });

  loadModules(window, loginBootstrapModulePaths);
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
  for (const record of observer.takeRecords()) {
    for (const node of record.removedNodes) {
      removedNodes.push(node);
    }
  }
  observer.disconnect();

  expect(document.documentElement.dataset.ccxpLiteScope).toBe("main");
  expect(document.body.classList.contains("ccxp-lite-main-skin")).toBe(true);
  expect(removedNodes).toHaveLength(0);
  expect(document.querySelector("#cf-turnstile")).toBe(turnstile);
  expect(form.querySelector("input[name='U_NAME']")).not.toBeNull();
  expect(form.querySelector("input[name='fnstr']")?.getAttribute("value")).toBe(
    "20261123-737590049884",
  );
  expect(form.querySelector("input[name='code']")).not.toBeNull();
  expect(form.querySelectorAll("input[name='choice']")).toHaveLength(2);
});

test("prepareTurnstile ignores 0px pre-layout viewports and re-evaluates on DOMContentLoaded", async () => {
  const { window } = createTestWindow(
    "<!doctype html><html lang='zh'><head></head><body></body></html>",
    "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/index.php",
  );
  const document = window.document as unknown as Document;
  let readyState: DocumentReadyState = "loading";
  Object.defineProperty(document, "readyState", {
    configurable: true,
    get: () => readyState,
  });
  let narrowViewport = false;
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === "(min-width: 1px) and (max-width: 331px)" ? narrowViewport : false,
    media: query,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  loadModules(window, [...loginModulePaths, "src/login/pipeline/bootstrap.ts"]);

  const widget = document.createElement("div");
  widget.className = "cf-turnstile";
  widget.dataset.sitekey = "1x00000000000000000000AA";
  document.body.append(widget);
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

  expect(widget.dataset.size).toBe("flexible");
  expect(widget.dataset.theme).toBe("light");

  narrowViewport = true;
  readyState = "interactive";
  document.dispatchEvent(new (window.Event as unknown as typeof Event)("DOMContentLoaded"));

  expect(widget.dataset.size).toBe("compact");
});

test.each([
  {
    name: "single ancestor wrapper",
    wrapInDiv: true,
    expectedAncestorsClass: "ccxp-lite-landing-inplace-solo-login",
    expectedBodyClass: undefined,
  },
  {
    name: "form directly under body",
    wrapInDiv: false,
    expectedAncestorsClass: undefined,
    expectedBodyClass: "ccxp-lite-landing-inplace-direct",
  },
])(
  "rewrites Turnstile login in place for $name without detaching widget or skipping buttons",
  ({ wrapInDiv, expectedAncestorsClass, expectedBodyClass }) => {
    const formMarkup = `<form action="pre_select_entry.php" method="post">
      <input type="text" name="account" />
      <input type="password" name="passwd" />
      <div class="cf-turnstile"><iframe></iframe></div>
      <button type="reset">\u6E05\u9664</button>
      <input type="submit" value="\u767B\u5165" />
    </form>`;
    const bodyMarkup = wrapInDiv ? `<div>${formMarkup}</div>` : formMarkup;
    const { window } = createTestWindow(
      `<!doctype html><html lang='zh'><head></head><body>${bodyMarkup}</body></html>`,
      "https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/index.php",
    );
    const document = window.document as Document;
    const form = requireElement(document.querySelector<HTMLFormElement>("form"));
    const turnstile = requireElement(document.querySelector<HTMLElement>(".cf-turnstile"));
    const iframe = requireElement(document.querySelector("iframe"));
    const detachedCriticalNodes: Node[] = [];
    const observer = new window.MutationObserver(
      (records: ReadonlyArray<Readonly<{ removedNodes: Iterable<unknown> }>>) => {
        for (const record of records) {
          for (const node of record.removedNodes) {
            const removed = node as Node;
            if (
              removed === form ||
              removed === turnstile ||
              removed === iframe ||
              (typeof (removed as Element).contains === "function" &&
                ((removed as Element).contains(form) ||
                  (removed as Element).contains(turnstile) ||
                  (removed as Element).contains(iframe)))
            ) {
              detachedCriticalNodes.push(removed);
            }
          }
        }
      },
    );
    observer.observe(document.body as unknown as Parameters<typeof observer.observe>[0], {
      childList: true,
      subtree: true,
    });

    loadModules(window, [...loginModulePaths, "src/login/pipeline/bootstrap.ts"]);
    const strings = window.CCXP_LITE.shared?.getLocalizedStrings("zh");
    const rewrite = window.CCXP_LITE.loginRewrite;
    expect(strings).toBeDefined();
    expect(rewrite).toBeDefined();
    if (!strings || !rewrite) {
      throw new Error("Missing login rewrite modules");
    }

    const result = rewrite.rewriteLoginSurface(document, {
      loginForm: form,
      loginSourceCell: form,
      tabNavigation: undefined,
      tabContents: [],
      languageLinks: undefined,
      announcementTable: undefined,
      utilityLinks: undefined,
      cannotLoginLink: undefined,
      serviceLink: undefined,
      locale: "zh",
      strings,
    });
    observer.disconnect();

    expect(result.inPlace).toBe(true);
    expect(detachedCriticalNodes).toHaveLength(0);
    expect(document.querySelector("form")).toBe(form);
    expect(document.querySelector(".cf-turnstile")).toBe(turnstile);
    expect(document.querySelector("iframe")).toBe(iframe);
    expect(form.querySelector("[type='reset']")).toBeNull();
    expect(form.querySelector("button.ccxp-lite-login-primary-button")?.textContent).toBe(
      "\u767B\u5165",
    );
    expect(turnstile.nextElementSibling?.classList.contains("ccxp-lite-login-action-group")).toBe(
      true,
    );
    if (expectedAncestorsClass !== undefined) {
      expect(form.parentElement?.classList.contains(expectedAncestorsClass)).toBe(true);
    }
    if (expectedBodyClass !== undefined) {
      expect(document.body.classList.contains(expectedBodyClass)).toBe(true);
    }
  },
);
