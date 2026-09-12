import { createRenderer } from "./renderer.js";
import type { CcxpLiteLoginFieldRowView } from "../types.js";

export function createFieldRow(
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

export function createFieldLabel(
  targetDocument: Document,
  fieldId: string,
  text: string,
): HTMLLabelElement {
  return createRenderer(targetDocument).element("label", {
    className: "ccxp-lite-login-field-label",
    text,
    attributes: { for: fieldId },
  });
}

export function createLabelRow(targetDocument: Document): HTMLDivElement {
  return createRenderer(targetDocument).element("div", {
    className: "ccxp-lite-login-field-label-row",
  });
}

export function createFieldsContainer(targetDocument: Document): HTMLDivElement {
  return createRenderer(targetDocument).element("div", {
    className: "ccxp-lite-login-fields",
  });
}
