import type { CcxpLiteDomChild, CcxpLiteDomRenderer, CcxpLiteDomElementOptions } from "../types.js";

export function createRenderer(targetDocument: Document): CcxpLiteDomRenderer {
  function append<T extends ParentNode & Node>(
    parent: T,
    ...children: readonly CcxpLiteDomChild[]
  ): T {
    for (const child of children) {
      if (child === undefined || child === null || child === false) {
        continue;
      }
      parent.append(isNode(child) ? child : targetDocument.createTextNode(String(child)));
    }
    return parent;
  }

  function element<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options: CcxpLiteDomElementOptions = {},
    children: readonly CcxpLiteDomChild[] = [],
  ): HTMLElementTagNameMap[K] {
    const node = targetDocument.createElement(tagName);
    if (options.className !== undefined) {
      node.className = options.className;
    }
    if (options.text !== undefined) {
      node.textContent = options.text;
    }
    for (const [name, value] of Object.entries(options.attributes ?? {})) {
      if (value === undefined || value === false) {
        continue;
      }
      node.setAttribute(name, String(value));
    }
    for (const [name, value] of Object.entries(options.data ?? {})) {
      if (value === undefined) {
        continue;
      }
      node.dataset[name] = String(value);
    }
    for (const [name, value] of Object.entries(options.styleProperties ?? {})) {
      if (value === undefined) {
        continue;
      }
      node.style.setProperty(name, value);
    }
    return append(node, ...children);
  }

  function fragment(...children: readonly CcxpLiteDomChild[]): DocumentFragment {
    return append(targetDocument.createDocumentFragment(), ...children);
  }

  return { document: targetDocument, append, element, fragment };
}

function isNode(value: CcxpLiteDomChild): value is Node {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.nodeType === "number" &&
    typeof value.nodeName === "string"
  );
}
