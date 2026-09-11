(function registerSidebarFavoriteControls(globalScope: typeof globalThis) {
  const namespace = globalScope.CCXP_LITE;
  if (!namespace?.uiButtons) {
    return;
  }
  const { createButton } = namespace.uiButtons;
  if (!namespace.sidebarFavorites || !namespace.uiIcons || !namespace.sidebarOverlays) {
    return;
  }
  const { isFavoriteLink, toggleFavoriteLink, isFavoriteBlock, toggleFavoriteBlock } =
    namespace.sidebarFavorites;
  const { createFavoriteStarIcon } = namespace.uiIcons;
  const { showRemovePinnedDialog } = namespace.sidebarOverlays;

  function createFavoriteToggle(
    targetDocument: Document,
    linkItem: CcxpLiteSidebarLinkItem,
    strings: Readonly<Record<string, string>>,
    onFavoritesChange: () => void,
  ): HTMLElement {
    const isFavorite = isFavoriteLink(linkItem);
    const favoriteButton = createFavoriteButton(
      targetDocument,
      linkItem.label,
      isFavorite,
      strings,
      false,
    );
    favoriteButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const applyFavoriteChange = () => {
        toggleFavoriteLink(linkItem);
        if (typeof onFavoritesChange === "function") {
          onFavoritesChange();
        }
      };
      if (isFavoriteLink(linkItem)) {
        showRemovePinnedDialog(targetDocument, linkItem.label, strings).then(
          (shouldRemove) => {
            if (!shouldRemove) {
              return;
            }
            applyFavoriteChange();
          },
          () => undefined,
        );
        return;
      }
      applyFavoriteChange();
    });
    return favoriteButton;
  }

  function createBlockFavoriteToggle(
    targetDocument: Document,
    block: CcxpLiteSidebarBlock,
    strings: Readonly<Record<string, string>>,
    onFavoritesChange: () => void,
  ): HTMLElement {
    const blockIsFavorite = isFavoriteBlock(block);
    const favoriteButton = createFavoriteButton(
      targetDocument,
      block.label,
      blockIsFavorite,
      strings,
      true,
    );
    favoriteButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (blockIsFavorite) {
        showRemovePinnedDialog(targetDocument, block.label, strings).then(
          (shouldRemove) => {
            if (!shouldRemove) {
              return;
            }
            applyBlockFavoriteChange(block, onFavoritesChange);
          },
          () => undefined,
        );
        return;
      }
      applyBlockFavoriteChange(block, onFavoritesChange);
    });
    return favoriteButton;
  }

  function applyBlockFavoriteChange(block: CcxpLiteSidebarBlock, onFavoritesChange: () => void) {
    toggleFavoriteBlock(block);
    if (typeof onFavoritesChange === "function") {
      onFavoritesChange();
    }
  }

  function createFavoriteButton(
    targetDocument: Document,
    label: string,
    active: boolean,
    strings: Readonly<Record<string, string>>,
    isBlock: boolean,
  ) {
    const button = createButton(targetDocument, {
      className: isBlock
        ? "ccxp-lite-favorite-toggle ccxp-lite-favorite-toggle-block"
        : "ccxp-lite-favorite-toggle",
    });
    if (isBlock) {
      button.dataset.ccxpLiteFavoriteState = active ? "all" : "none";
    }
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.setAttribute(
      "aria-label",
      `${active ? strings.sidebarRemoveFavorite : strings.sidebarAddFavorite}: ${label}`,
    );
    button.setAttribute(
      "title",
      active ? strings.sidebarRemoveFavorite : strings.sidebarAddFavorite,
    );
    button.append(createFavoriteStarIcon(targetDocument, active));
    return button;
  }
  namespace.sidebarFavoriteControls = { createFavoriteToggle, createBlockFavoriteToggle };
})(globalThis);
