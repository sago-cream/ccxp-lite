(function registerLoginFieldView(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiRenderer) {
    return;
  }
  const { createRenderer } = namespace.uiRenderer;

  function createFieldRow(
    targetDocument: Document,
    options: {
      fieldId: string;
      labelText: string;
      columnCount: number;
      accessory?: Node;
    },
  ): CcxpLiteLoginFieldRowView {
    const dom = createRenderer(targetDocument);
    const controlSlot = dom.element("div", {
      className: "ccxp-lite-login-field-control",
    });
    const labelRow = dom.element("div", { className: "ccxp-lite-login-field-label-row" }, [
      createFieldLabel(targetDocument, options.fieldId, options.labelText),
      options.accessory,
    ]);
    const fieldGroup = dom.element("div", { className: "ccxp-lite-login-field" }, [
      labelRow,
      controlSlot,
    ]);
    const cell = dom.element("td", { className: "ccxp-lite-login-field-cell" }, [fieldGroup]);
    cell.colSpan = options.columnCount;
    const row = dom.element("tr", { className: "ccxp-lite-login-field-row" }, [cell]);
    return { element: row, controlSlot };
  }

  function createFieldLabel(targetDocument: Document, fieldId: string, text: string) {
    return createRenderer(targetDocument).element("label", {
      className: "ccxp-lite-login-field-label",
      text,
      attributes: { for: fieldId },
    });
  }

  function createLabelRow(targetDocument: Document) {
    return createRenderer(targetDocument).element("div", {
      className: "ccxp-lite-login-field-label-row",
    });
  }

  function createFieldsContainer(targetDocument: Document) {
    return createRenderer(targetDocument).element("div", {
      className: "ccxp-lite-login-fields",
    });
  }

  namespace.loginFieldView = {
    createFieldRow,
    createFieldLabel,
    createLabelRow,
    createFieldsContainer,
  };
})(globalThis);
