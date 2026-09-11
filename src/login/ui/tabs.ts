(function registerCcxpLiteLoginTabs(globalScope: typeof globalThis) {
  const runtimeScope = globalScope;
  const namespace = runtimeScope.CCXP_LITE ?? {};
  const { shared } = namespace;
  if (!shared) {
    return;
  }
  const { getLocalizedStrings } = shared;

  if (!namespace.uiPopover || !namespace.uiDisplay || !namespace.uiRenderer) {
    return;
  }
  const { buildInfoPopover, buildInfoPopoverContent } = namespace.uiPopover;
  const { createSection } = namespace.uiDisplay;
  const { createRenderer } = namespace.uiRenderer;

  function createAccountGuide(
    targetDocument: Document,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
    supportLinks?: HTMLElement,
  ) {
    const copy = getGuideCopy(strings, targetDocument);
    const dom = createRenderer(targetDocument);
    return dom.element("section", { className: "ccxp-lite-account-guide" }, [
      dom.element("div", { className: "ccxp-lite-account-guide-header" }, [
        dom.element("div", { className: "ccxp-lite-account-guide-title-wrap" }, [
          dom.element("h3", { className: "ccxp-lite-account-guide-title", text: copy.title }),
          copy.infoItems.length === 0
            ? undefined
            : dom.element(
                "ul",
                { className: "ccxp-lite-account-guide-info-list" },
                copy.infoItems.map((itemText) => dom.element("li", { text: itemText })),
              ),
        ]),
      ]),
      dom.element(
        "ul",
        { className: "ccxp-lite-account-guide-account-list" },
        copy.accounts.map((spec) => buildAccountItem(targetDocument, spec)),
      ),
      supportLinks,
    ]);
  }

  function buildAccountItem(
    targetDocument: Document,
    spec: Readonly<{
      label: string;
      value: string;
      popup?: string;
      popupLabel?: string;
    }>,
  ) {
    const dom = createRenderer(targetDocument);
    return dom.element("li", { className: "ccxp-lite-account-guide-account-item" }, [
      dom.element("div", { className: "ccxp-lite-account-guide-account-line" }, [
        dom.element("span", {
          className: "ccxp-lite-account-guide-account-label",
          text: `${spec.label}:`,
        }),
        dom.element("span", {
          className: "ccxp-lite-account-guide-account-value",
          text: spec.value,
        }),
        spec.popup === undefined || spec.popup === ""
          ? undefined
          : buildInfoPopover(targetDocument, spec.popup, spec.popupLabel ?? spec.label),
      ]),
    ]);
  }

  function createAccountFormatExamples(
    targetDocument: Document,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
  ) {
    const copy = getGuideCopy(strings, targetDocument);
    const dom = createRenderer(targetDocument);
    return dom.element(
      "ul",
      { className: "ccxp-lite-account-format-list" },
      copy.accounts.map((spec) =>
        dom.element("li", { className: "ccxp-lite-account-format-item" }, [
          dom.element("span", {
            className: "ccxp-lite-account-format-label",
            text: `${spec.label}: `,
          }),
          dom.element("span", {
            className: "ccxp-lite-account-format-value",
            text: spec.value,
          }),
        ]),
      ),
    );
  }

  function createAccountFormatPopover(
    targetDocument: Document,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
  ) {
    return buildInfoPopoverContent(
      targetDocument,
      createAccountFormatExamples(targetDocument, strings),
      strings.fieldAccount,
      "ccxp-lite-account-format-popup",
    );
  }

  function createPasswordHelpPopover(
    targetDocument: Document,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
  ) {
    const copy = getPasswordHelpCopy(strings, targetDocument);
    const dom = createRenderer(targetDocument);
    const content = dom.element(
      "ul",
      { className: "ccxp-lite-password-help-popup" },
      copy.rules.map((rule) =>
        dom.element("li", { className: "ccxp-lite-password-help-popup-line", text: rule }),
      ),
    );

    return buildInfoPopoverContent(
      targetDocument,
      content,
      copy.buttonLabel,
      "ccxp-lite-password-help-popup-shell",
    );
  }

  function createPasswordHelpActionButton(
    targetDocument: Document,
    strings: Readonly<Record<string, string>> = getLocalizedStrings("zh"),
  ) {
    return createPasswordHelpPopover(targetDocument, strings);
  }

  function getGuideCopy(
    strings: Readonly<Record<string, string>>,
    targetDocument: Document,
  ): Readonly<{
    title: string;
    infoItems: readonly string[];
    accounts: ReadonlyArray<{
      label: string;
      value: string;
      popup?: string;
      popupLabel?: string;
    }>;
  }> {
    const documentLanguage = targetDocument.documentElement.lang.toLowerCase();
    const isZh =
      documentLanguage.startsWith("zh") || strings.cannotLogin.includes("\u7121\u6CD5\u767B\u5165");

    if (!isZh) {
      return {
        title: "Login Info",
        infoItems: [],
        accounts: [
          {
            label: "Student / alumni account",
            value: "student ID (e.g. 110061190, X1106099, 102061190)",
          },
          {
            label: "Faculty / staff account",
            value: "employee number (e.g. W09090)",
          },
          {
            label: "Vendor account",
            value: "company tax ID",
          },
          {
            label: "Individual payee account",
            value: "national ID number",
          },
          {
            label: "Public course taker account",
            value: "guest",
          },
          {
            label: "Mandarin Center student account",
            value: "student ID (e.g. C1100088)",
          },
          {
            label: "Delegated account",
            value: "delegator employee number-01 (e.g. A11111-01)",
          },
        ],
      };
    }

    return {
      title: "\u767B\u5165\u8CC7\u8A0A",
      infoItems: [],
      accounts: [
        {
          label: "\u5B78\u751F\uFF0F\u6821\u53CB\u5E33\u865F",
          value: "\u5B78\u865F\uFF08\u4F8B\uFF1A110061190\u3001X1106099\u3001102061190\uFF09",
        },
        {
          label: "\u6559\u8077\u54E1\u5E33\u865F",
          value: "\u54E1\u5DE5\u7DE8\u865F\uFF08\u4F8B\uFF1AW09090\uFF09",
        },
        {
          label: "\u5EE0\u5546\u5E33\u865F",
          value: "\u7D71\u4E00\u7DE8\u865F",
        },
        {
          label: "\u500B\u4EBA\u53D7\u6B3E\u4EBA\u5E33\u865F",
          value: "\u8EAB\u5206\u8B49\u5B57\u865F",
        },
        {
          label: "\u793E\u6703\u4EBA\u58EB\u9078\u8AB2\u5E33\u865F",
          value: "guest",
        },
        {
          label: "\u83EF\u8A9E\u4E2D\u5FC3\u5B78\u54E1\u5E33\u865F",
          value: "\u5B78\u865F\uFF08\u4F8B\uFF1AC1100088\uFF09",
        },
        {
          label: "\u59D4\u8A17\u6388\u6B0A\u5E33\u865F",
          value: "\u59D4\u8A17\u4EBA\u54E1\u5DE5\u7DE8\u865F-01\uFF08\u4F8B\uFF1AA11111-01\uFF09",
        },
      ],
    };
  }

  function getPasswordHelpCopy(
    strings: Readonly<Record<string, string>>,
    _targetDocument: Document,
  ): Readonly<{
    buttonLabel: string;
    rules: readonly string[];
  }> {
    return {
      buttonLabel: strings.passwordHelpLabel,
      rules: [
        strings.passwordRulePeriod,
        strings.passwordRuleCooldown,
        strings.passwordRuleLength,
        strings.passwordRuleComposition,
        strings.passwordRuleAvoidPii,
      ],
    };
  }

  namespace.loginTabs = {
    createAccountFormatExamples,
    createAccountFormatPopover,
    createPasswordHelpActionButton,
    createPasswordHelpPopover,
    createAccountGuide,
    createSection,
  };
})(globalThis);
