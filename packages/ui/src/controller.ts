import type { CcxpLiteUiController } from "../types.js";

export function createController(targetDocument: Document): CcxpLiteUiController {
  const AbortControllerConstructor =
    targetDocument.defaultView?.AbortController ?? globalThis.AbortController;
  const abortController = new AbortControllerConstructor();
  const fallbackCleanups: Array<() => void> = [];
  let destroyed = false;

  function listen(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options: AddEventListenerOptions | boolean = {},
  ) {
    if (destroyed) {
      return;
    }
    const normalizedOptions = typeof options === "boolean" ? { capture: options } : options;
    try {
      target.addEventListener(type, listener, {
        ...normalizedOptions,
        signal: abortController.signal,
      });
    } catch {
      target.addEventListener(type, listener, options);
      fallbackCleanups.push(() => {
        target.removeEventListener(type, listener, options);
      });
    }
  }

  function addCleanup(cleanup: () => void) {
    if (destroyed) {
      cleanup();
      return;
    }
    fallbackCleanups.push(cleanup);
  }

  function destroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    abortController.abort();
    for (const cleanup of fallbackCleanups.splice(0).toReversed()) {
      cleanup();
    }
  }

  return {
    signal: abortController.signal,
    listen,
    addCleanup,
    destroy,
    get destroyed() {
      return destroyed;
    },
  };
}
