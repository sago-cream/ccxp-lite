import { createRenderer } from "@ccxp-lite/ui";
import { catalogLocale } from "./i18n.js";

const cleanups = new WeakMap<Node, () => void>();

export function withCleanup<T extends Node>(element: T, destroy: () => void): T {
  cleanups.set(element, destroy);
  return element;
}

export function disposeStory(element: Node): void {
  cleanups.get(element)?.();
  cleanups.delete(element);
}

export function surface(...children: readonly Node[]): HTMLElement {
  return createRenderer(document).element("main", { className: "ds-surface" }, children);
}

export function localized(locale: unknown, zh: string, en: string): string {
  return catalogLocale(locale) === "en" ? en : zh;
}
