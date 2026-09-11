(function registerUiLoading(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.shared) {
    return;
  }
  const { ensureDocumentHead, removeNode } = namespace.shared;
  const LOADING_SPRITE_ID = "ccxp-lite-loading-sprite";
  const LOADING_SPRITE_STYLE_ID = "ccxp-lite-loading-sprite-style";
  function ensureLoadingSprite(targetDocument: Document) {
    const head = ensureDocumentHead(targetDocument);
    if (head && !targetDocument.querySelector(`#${CSS.escape(LOADING_SPRITE_STYLE_ID)}`)) {
      const styleNode = targetDocument.createElement("style");
      styleNode.id = LOADING_SPRITE_STYLE_ID;
      styleNode.textContent = `
        html, body {
          background: #ffffff !important;
        }

        html:not([data-ccxp-lite-loading-ready="true"]) body {
          opacity: 0 !important;
        }

        /* A frameset document has no body, and its child frames can paint
           above the loading sprite. Hide the frames themselves until ready. */
        html:not([data-ccxp-lite-loading-ready="true"]) frameset,
        html:not([data-ccxp-lite-loading-ready="true"]) frame {
          visibility: hidden !important;
        }

        html[data-ccxp-lite-loading-ready="true"] body,
        body[data-ccxp-lite-loading-ready="true"] {
          opacity: 1 !important;
          transition: opacity 120ms ease;
        }

        #${LOADING_SPRITE_ID} {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          pointer-events: none;
          background: #ffffff;
          opacity: 1;
          transition: opacity 160ms ease;
        }

        #${LOADING_SPRITE_ID}::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 22px;
          height: 22px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.08), 0 8px 24px rgba(17, 24, 39, 0.08);
        }
      `;
      head.append(styleNode);
    }
    if (!targetDocument.querySelector(`#${CSS.escape(LOADING_SPRITE_ID)}`)) {
      const sprite = targetDocument.createElement("div");
      sprite.id = LOADING_SPRITE_ID;
      targetDocument.documentElement.append(sprite);
    }
  }

  function releaseLoadingSprite(targetDocument: Document) {
    const sprite = targetDocument.querySelector<HTMLElement>(`#${CSS.escape(LOADING_SPRITE_ID)}`);
    const styleNode = targetDocument.querySelector<HTMLElement>(
      `#${CSS.escape(LOADING_SPRITE_STYLE_ID)}`,
    );
    const targetDocumentElement = targetDocument.documentElement;
    targetDocumentElement.dataset.ccxpLiteLoadingReady = "true";
    const targetBody = targetDocument.querySelector("body");
    if (targetBody) {
      targetBody.dataset.ccxpLiteLoadingReady = "true";
    }
    if (sprite) {
      sprite.style.opacity = "0";
    }
    globalThis.setTimeout(
      () => {
        removeNode(sprite ?? undefined);
        removeNode(styleNode ?? undefined);
      },
      180,
      undefined,
    );
  }
  namespace.uiLoading = { ensureLoadingSprite, releaseLoadingSprite };
})(globalThis);
