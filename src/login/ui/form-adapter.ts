(function registerLoginFormAdapter(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.shared || !namespace.loginFieldView) {
    return;
  }
  const { moveChildNodes, removeNode } = namespace.shared;
  const { createFieldRow, createFieldLabel, createLabelRow, createFieldsContainer } =
    namespace.loginFieldView;

  function normalizeFormLayout(rootNode: ParentNode, options: CcxpLiteLoginFormRenderOptions) {
    const targetDocument = resolveOwningDocument(rootNode);
    if (!targetDocument) {
      return;
    }
    for (const formNode of rootNode.querySelectorAll<HTMLFormElement>("form")) {
      if (formNode.dataset.ccxpLiteFormStructured !== "true") {
        rewriteTableRows(targetDocument, formNode, options);
        rebuildFlatLabels(targetDocument, formNode);
        groupFieldRows(targetDocument, formNode);
      }
      formNode.classList.add("ccxp-lite-login-form");
      formNode.dataset.ccxpLiteFormStructured = "true";
    }
  }

  function rewriteTableRows(
    targetDocument: Document,
    formNode: HTMLFormElement,
    options: CcxpLiteLoginFormRenderOptions,
  ) {
    const rows = [...formNode.querySelectorAll<HTMLTableRowElement>("tr")];
    for (const [rowIndex, rowNode] of rows.entries()) {
      if (rowNode.dataset.ccxpLiteLoginRow === "true") {
        continue;
      }
      const cells = [...rowNode.querySelectorAll<HTMLElement>(":scope > th, :scope > td")];
      const fieldPairs = cells.length === 0 ? [] : collectFieldPairs(rowNode, cells);
      if (fieldPairs.length === 0) {
        continue;
      }
      const replacementRows = fieldPairs.map((fieldPair, pairIndex) => {
        const fieldId = ensureFieldId(fieldPair.fieldNode as HTMLElement, rowIndex, pairIndex);
        const view = createFieldRow(targetDocument, {
          fieldId,
          labelText: options.resolveLabel(fieldPair, targetDocument),
          columnCount: Math.max(1, cells.length),
          accessory: options.createAccessory(targetDocument, fieldPair.fieldNode),
        });
        removeInlineLabelNodes(fieldPair.fieldCell, fieldPair.fieldNode);
        moveChildNodes(fieldPair.fieldCell, view.controlSlot);
        view.element.dataset.ccxpLiteLoginRow = "true";
        return view.element;
      });
      const table = rowNode.closest("table");
      rowNode.replaceWith(...replacementRows);
      table?.classList.add("ccxp-lite-login-form-table");
    }
  }

  function rebuildFlatLabels(targetDocument: Document, formNode: HTMLFormElement) {
    const fields = formNode.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea");
    for (const [fieldIndex, fieldNode] of [...fields].entries()) {
      const inputType = (fieldNode.getAttribute("type") ?? "text").toLowerCase();
      if (
        ["button", "checkbox", "file", "hidden", "image", "radio", "reset", "submit"].includes(
          inputType,
        ) ||
        fieldNode.parentNode !== formNode
      ) {
        continue;
      }
      const labelSourceNode = findLegacyInlineLabelNode(fieldNode, formNode);
      const labelText = getNodeText(labelSourceNode);
      if (!labelSourceNode || labelText === "") {
        continue;
      }
      labelSourceNode.replaceWith(
        createFieldLabel(targetDocument, ensureFieldId(fieldNode, fieldIndex), labelText),
      );
    }
  }

  function groupFieldRows(targetDocument: Document, formNode: HTMLFormElement) {
    if (formNode.dataset.ccxpLiteFieldRowsGrouped === "true") {
      return;
    }
    const fieldRows = [
      ...formNode.querySelectorAll<HTMLTableRowElement>("tr.ccxp-lite-login-field-row"),
    ];
    if (fieldRows.length === 0) {
      return;
    }
    const fieldsContainer = createFieldsContainer(targetDocument);
    const firstTable = fieldRows[0].closest("table");
    if (firstTable?.parentNode) {
      firstTable.parentNode.insertBefore(fieldsContainer, firstTable);
    } else {
      formNode.insertBefore(fieldsContainer, formNode.firstChild);
    }
    for (const rowNode of fieldRows) {
      const fieldGroup = rowNode.querySelector(".ccxp-lite-login-field");
      if (fieldGroup) {
        fieldsContainer.append(fieldGroup);
      }
      removeNode(rowNode);
    }
    for (const tableNode of formNode.querySelectorAll<HTMLTableElement>(
      "table.ccxp-lite-login-form-table",
    )) {
      if (!tableNode.querySelector("tr")) {
        removeNode(tableNode);
      }
    }
    const formElement = formNode;
    formElement.dataset.ccxpLiteFieldRowsGrouped = "true";
  }

  function attachAccessory(
    targetDocument: Document,
    rootNode: ParentNode,
    options: CcxpLiteLoginAccessoryOptions,
  ) {
    for (const fieldNode of rootNode.querySelectorAll<HTMLElement>(options.fieldSelector)) {
      if (
        options.skip?.(fieldNode) === true ||
        fieldNode.dataset[options.attachedDataKey] === "true"
      ) {
        continue;
      }
      const accessory = options.createAccessory();
      if (!accessory) {
        continue;
      }
      const labelRow = findOrCreateLabelRow(targetDocument, rootNode, fieldNode);
      if (labelRow) {
        if (!labelRow.querySelector(options.existingSelector)) {
          labelRow.append(accessory);
        }
        fieldNode.dataset[options.attachedDataKey] = "true";
        continue;
      }
      const labelCell = fieldNode.closest("tr")?.querySelector<HTMLElement>("th, td");
      if (!labelCell || labelCell.querySelector(options.existingSelector)) {
        if (options.markWhenUnavailable === true) {
          fieldNode.dataset[options.attachedDataKey] = "true";
        }
        continue;
      }
      labelCell.append(targetDocument.createTextNode(" "), accessory);
      fieldNode.dataset[options.attachedDataKey] = "true";
    }
  }

  function findOrCreateLabelRow(
    targetDocument: Document,
    rootNode: ParentNode,
    fieldNode: Element,
  ) {
    const fieldGroupRow = fieldNode
      .closest(".ccxp-lite-login-field")
      ?.querySelector<HTMLElement>(".ccxp-lite-login-field-label-row");
    if (fieldGroupRow) {
      return fieldGroupRow;
    }
    const standaloneLabel = findStandaloneFieldLabel(rootNode, fieldNode);
    if (!standaloneLabel) {
      return undefined;
    }
    const existingRow = standaloneLabel.closest<HTMLElement>(".ccxp-lite-login-field-label-row");
    if (existingRow) {
      return existingRow;
    }
    if (!standaloneLabel.parentNode) {
      return undefined;
    }
    const labelRow = createLabelRow(targetDocument);
    standaloneLabel.before(labelRow);
    labelRow.append(standaloneLabel);
    return labelRow;
  }

  function collectFieldPairs(
    rowNode: ParentNode,
    cells: readonly HTMLElement[],
  ): readonly CcxpLiteLegacyLoginField[] {
    const pairs: CcxpLiteLegacyLoginField[] = [];
    const usedFieldCells = new Set<HTMLElement>();
    for (const [cellIndex, cellNode] of cells.entries()) {
      const fieldNode = findPrimaryFieldControl(cellNode);
      if (!fieldNode) {
        continue;
      }
      const fieldCell = fieldNode.closest<HTMLElement>("th, td") ?? cellNode;
      if (usedFieldCells.has(fieldCell)) {
        continue;
      }
      const resolvedIndex = cells.indexOf(fieldCell);
      const labelCell = resolveLabelCell(cells, resolvedIndex === -1 ? cellIndex : resolvedIndex);
      pairs.push({
        fieldNode,
        fieldCell,
        labelText: getPreferredLabelText(labelCell, fieldCell, fieldNode),
      });
      usedFieldCells.add(fieldCell);
    }
    if (pairs.length > 0) {
      return pairs;
    }
    const fieldNode = findPrimaryFieldControl(rowNode);
    const fieldCell = fieldNode?.closest<HTMLElement>("th, td") ?? cells.at(-1);
    if (!fieldNode || !fieldCell) {
      return pairs;
    }
    const labelCell = resolveLabelCell(cells, cells.indexOf(fieldCell));
    return [
      {
        fieldNode,
        fieldCell,
        labelText: getPreferredLabelText(labelCell, fieldCell, fieldNode),
      },
    ];
  }

  function resolveLabelCell(cells: readonly HTMLElement[], fieldCellIndex: number) {
    for (let index = fieldCellIndex - 1; index >= 0; index--) {
      const candidate = cells[index];
      if (!findPrimaryFieldControl(candidate) && getNodeText(candidate) !== "") {
        return candidate;
      }
    }
    return cells[0];
  }

  function findPrimaryFieldControl(scopeNode: ParentNode) {
    return [
      ...scopeNode.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea",
      ),
    ].find((field) => {
      const inputType = (field.getAttribute("type") ?? "text").toLowerCase();
      return !["button", "checkbox", "file", "hidden", "image", "radio", "submit"].includes(
        inputType,
      );
    });
  }

  function findStandaloneFieldLabel(rootNode: ParentNode, fieldNode: Element) {
    const fieldId = fieldNode.getAttribute("id") ?? "";
    if (fieldId !== "") {
      const explicitLabel = rootNode.querySelector<HTMLLabelElement>(
        `label[for="${CSS.escape(fieldId)}"]`,
      );
      if (explicitLabel) {
        return explicitLabel;
      }
    }
    let siblingNode = fieldNode.previousSibling;
    while (siblingNode) {
      if (siblingNode.nodeType === Node.TEXT_NODE && getNodeText(siblingNode) === "") {
        siblingNode = siblingNode.previousSibling;
        continue;
      }
      if (siblingNode.nodeType !== Node.ELEMENT_NODE) {
        return undefined;
      }
      const siblingElement = siblingNode as HTMLElement;
      return siblingElement.tagName.toLowerCase() === "label" && getNodeText(siblingElement) !== ""
        ? (siblingElement as HTMLLabelElement)
        : undefined;
    }
    return undefined;
  }

  function findLegacyInlineLabelNode(fieldNode: Node, boundaryNode: Node) {
    let currentNode = fieldNode.previousSibling;
    while (currentNode && currentNode !== boundaryNode) {
      if (currentNode.nodeType === Node.TEXT_NODE && getNodeText(currentNode) === "") {
        currentNode = currentNode.previousSibling;
        continue;
      }
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as Element;
        const tagName = element.tagName.toLowerCase();
        if (tagName === "br" || ["a", "button", "img", "svg"].includes(tagName)) {
          currentNode = currentNode.previousSibling;
          continue;
        }
        if (tagName === "label" && element.classList.contains("ccxp-lite-login-field-label")) {
          return undefined;
        }
      }
      return getNodeText(currentNode) === "" ? undefined : currentNode;
    }
    return undefined;
  }

  function getPreferredLabelText(labelCell: Node | undefined, fieldCell: Node, fieldNode: Element) {
    const explicitLabel = getNodeText(labelCell);
    return explicitLabel === "" ? getInlineLabelText(fieldCell, fieldNode) : explicitLabel;
  }

  function getInlineLabelText(fieldCell: Node, fieldNode: Node) {
    return collectLeadingNodes(fieldCell, fieldNode)
      .map((node) => getNodeText(node))
      .join(" ")
      .replaceAll(/\s+/g, " ")
      .trim();
  }

  function removeInlineLabelNodes(fieldCell: Node, fieldNode: Node) {
    for (const node of collectLeadingNodes(fieldCell, fieldNode)) {
      removeNode(node as ChildNode);
    }
  }

  function collectLeadingNodes(fieldCell: Node, fieldNode: Node): readonly Node[] {
    if (fieldNode.parentNode !== fieldCell) {
      return [];
    }
    const leadingNodes: Node[] = [];
    let currentNode = (fieldCell as ParentNode).firstChild;
    while (currentNode && currentNode !== fieldNode) {
      const nextNode = currentNode.nextSibling;
      const isBreak =
        currentNode.nodeType === Node.ELEMENT_NODE &&
        (currentNode as Element).tagName.toLowerCase() === "br";
      if (getNodeText(currentNode) !== "" || isBreak) {
        leadingNodes.push(currentNode);
      }
      currentNode = nextNode;
    }
    return leadingNodes;
  }

  function ensureFieldId(fieldNode: HTMLElement, rowIndex: number, pairIndex = 0) {
    if (fieldNode.id !== "") {
      return fieldNode.id;
    }
    const normalizedName = (fieldNode.getAttribute("name") ?? "field")
      .trim()
      .replaceAll(/[^\w-]+/g, "-")
      .replaceAll(/^-+|-+$/g, "");
    const baseName = normalizedName === "" ? "field" : normalizedName;
    const pairSuffix = pairIndex > 0 ? `-${pairIndex + 1}` : "";
    const inputField = fieldNode;
    inputField.id = `ccxp-lite-${baseName}-${rowIndex + 1}${pairSuffix}`;
    return inputField.id;
  }

  function getNodeText(node: Node | undefined) {
    return (node?.textContent ?? "").replaceAll(/\s+/g, " ").trim();
  }

  function resolveOwningDocument(rootNode: ParentNode) {
    return rootNode.nodeType === Node.DOCUMENT_NODE
      ? (rootNode as Document)
      : (rootNode.ownerDocument ?? undefined);
  }

  namespace.loginFormAdapter = { normalizeFormLayout, attachAccessory };
})(globalThis);
