export type CcxpLiteDomChild = Node | string | number | false | null | undefined;

export interface CcxpLiteDomElementOptions {
  className?: string;
  text?: string;
  attributes?: Readonly<Record<string, string | number | boolean | undefined>>;
  data?: Readonly<Record<string, string | number | boolean | undefined>>;
  styleProperties?: Readonly<Record<string, string | undefined>>;
}

export interface CcxpLiteDomRenderer {
  readonly document: Document;
  append: <T extends ParentNode & Node>(parent: T, ...children: readonly CcxpLiteDomChild[]) => T;
  element: <K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: CcxpLiteDomElementOptions,
    children?: readonly CcxpLiteDomChild[],
  ) => HTMLElementTagNameMap[K];
  fragment: (...children: readonly CcxpLiteDomChild[]) => DocumentFragment;
}

export interface CcxpLiteUiController {
  readonly signal: AbortSignal;
  readonly destroyed: boolean;
  listen: (
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ) => void;
  addCleanup: (cleanup: () => void) => void;
  destroy: () => void;
}

export interface CcxpLiteMounted<T extends Node> {
  readonly element: T;
  destroy: () => void;
}

export interface CcxpLiteLoginFieldRowView {
  readonly element: HTMLTableRowElement;
  readonly controlSlot: HTMLDivElement;
}

export interface CcxpLiteRemovePinnedDialogView {
  readonly overlay: HTMLDivElement;
  readonly dialog: HTMLDivElement;
  readonly keepButton: HTMLElement;
  readonly confirmButton: HTMLElement;
}
