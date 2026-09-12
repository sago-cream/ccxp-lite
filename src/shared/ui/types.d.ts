import type * as Ui from "@ccxp-lite/ui/types";

// Shared UI interfaces. Host discovery and feature state remain in their adapters.
export type CcxpLiteUiModuleMarker = never;

declare global {
  type CcxpLiteDomChild = Ui.CcxpLiteDomChild;

  type CcxpLiteDomElementOptions = Ui.CcxpLiteDomElementOptions;

  type CcxpLiteDomRenderer = Ui.CcxpLiteDomRenderer;

  type CcxpLiteUiController = Ui.CcxpLiteUiController;

  type CcxpLiteMounted<T extends Node> = Ui.CcxpLiteMounted<T>;

  interface CcxpLiteLegacyLoginField {
    readonly fieldNode: Element;
    readonly fieldCell: HTMLElement;
    readonly labelText: string;
  }

  type CcxpLiteLoginFieldRowView = Ui.CcxpLiteLoginFieldRowView;

  interface CcxpLiteLoginFormRenderOptions {
    resolveLabel: (field: CcxpLiteLegacyLoginField, targetDocument: Document) => string;
    createAccessory: (targetDocument: Document, fieldNode: Element) => Node | undefined;
  }

  interface CcxpLiteLoginAccessoryOptions {
    readonly fieldSelector: string;
    readonly attachedDataKey: string;
    readonly existingSelector: string;
    readonly markWhenUnavailable?: boolean;
    readonly skip?: (fieldNode: HTMLElement) => boolean;
    readonly createAccessory: () => Node | undefined;
  }

  type CcxpLiteRemovePinnedDialogView = Ui.CcxpLiteRemovePinnedDialogView;

  interface CcxpLiteClassicSidebarViewModel {
    readonly items: readonly CcxpLiteSidebarCategoryNode[];
    readonly expandedItemIds: ReadonlySet<string>;
  }

  interface CcxpLiteAnnouncementEntry {
    readonly date: string;
    readonly topicContent: HTMLElement;
    readonly hasTokenizedHeader: boolean;
  }

  interface CcxpLiteNamespace {
    uiRenderer?: {
      createRenderer: (targetDocument: Document) => CcxpLiteDomRenderer;
    };
    uiController?: {
      createController: (targetDocument: Document) => CcxpLiteUiController;
    };
    loginFieldView?: {
      createFieldRow: (
        targetDocument: Document,
        options: {
          fieldId: string;
          labelText: string;
          columnCount: number;
          accessory?: Node;
        },
      ) => CcxpLiteLoginFieldRowView;
      createFieldLabel: (
        targetDocument: Document,
        fieldId: string,
        text: string,
      ) => HTMLLabelElement;
      createLabelRow: (targetDocument: Document) => HTMLDivElement;
      createFieldsContainer: (targetDocument: Document) => HTMLDivElement;
    };
    loginFormAdapter?: {
      normalizeFormLayout: (rootNode: ParentNode, options: CcxpLiteLoginFormRenderOptions) => void;
      attachAccessory: (
        targetDocument: Document,
        rootNode: ParentNode,
        options: CcxpLiteLoginAccessoryOptions,
      ) => void;
    };
    sidebarViews?: {
      createDashboardView: (
        targetDocument: Document,
        navDocument: Document,
        favorites: CcxpLiteSidebarCategoryNode | undefined,
        categories: readonly CcxpLiteSidebarCategoryNode[],
        state: CcxpLiteSidebarState,
        strings: Readonly<Record<string, string>>,
        rerender: () => void,
      ) => HTMLElement;
      createCategoryDetailView: (
        targetDocument: Document,
        navDocument: Document,
        category: CcxpLiteSidebarCategoryNode,
        state: CcxpLiteSidebarState,
        strings: Readonly<Record<string, string>>,
        rerender: () => void,
        controller: CcxpLiteUiController,
      ) => HTMLElement;
    };
    sidebarDialogView?: {
      createRemovePinnedDialog: (
        targetDocument: Document,
        itemName: string,
        strings: Readonly<Record<string, string>>,
        variant?: "secondary" | "danger" | "primary",
      ) => CcxpLiteRemovePinnedDialogView;
    };
    sidebarDialogController?: {
      showRemovePinnedDialog: (
        targetDocument: Document,
        itemName: string,
        strings: Readonly<Record<string, string>>,
      ) => Promise<boolean>;
    };
    sidebarNavigationAdapter?: {
      createClassicViewModel: (
        model: CcxpLiteSidebarModel,
        state: CcxpLiteSidebarState,
        favoritesLoaded: boolean,
      ) => CcxpLiteClassicSidebarViewModel;
    };
    loginNoticeView?: {
      renderAnnouncementTable: (
        table: HTMLTableElement,
        titleText: string,
        entries: readonly CcxpLiteAnnouncementEntry[],
        strings: Readonly<Record<string, string>>,
      ) => void;
    };
    uiLegacyStyle?: {
      adaptLegacyStyles: (rootNode: Node | undefined) => void;
      prepareLegacySurface: (
        targetDocument: Document,
        scope: string,
        roots?: readonly Node[],
      ) => void;
    };
    uiLoading?: {
      ensureLoadingSprite: (targetDocument: Document) => void;
      releaseLoadingSprite: (targetDocument: Document) => void;
    };
    uiSwitch?: {
      createStatusSwitch: (
        targetDocument: Document,
        options: { mode: string; actionLabel: string; label: string; status: string; icon: Node },
      ) => HTMLButtonElement;
    };
    uiLanguage?: {
      findLanguageLinks: (targetDocument: Document) => HTMLElement | undefined;
      createLanguageSelector: (
        targetDocument: Document,
        links: HTMLElement | undefined,
      ) => HTMLElement;
    };
    uiIcons?: {
      createClassicChevronIcon: (targetDocument: Document, isExpanded: boolean) => SVGElement;
      createSearchIcon: (targetDocument: Document) => SVGElement;
      createBreadcrumbChevronIcon: (targetDocument: Document) => SVGElement;
      createExternalLinkIcon: (targetDocument: Document) => SVGElement;
      createFavoriteStarIcon: (targetDocument: Document, isFavorite: boolean) => SVGElement;
      createLabIcon: (targetDocument: Document) => SVGElement;
      createBackIcon: (targetDocument: Document) => SVGSVGElement;
      createForwardIcon: (targetDocument: Document) => SVGSVGElement;
      createCategoryIcon: (targetDocument: Document, iconName: string) => SVGElement;
      createAudioIcon: (targetDocument: Document) => SVGSVGElement;
      createPasswordVisibilityIcon: (targetDocument: Document, visible: boolean) => SVGSVGElement;
      createLandingExternalLinkIcon: (targetDocument: Document) => SVGSVGElement;
      createAnnouncementMegaphoneIcon: (targetDocument: Document) => SVGSVGElement;
      createInfoMarker: (targetDocument: Document) => SVGSVGElement;
    };
    uiButtons?: {
      createButton: (
        targetDocument: Document,
        options?: {
          type?: "button" | "submit";
          className?: string;
          label?: string;
          ariaLabel?: string;
          title?: string;
          icon?: Node;
          onClick?: (event: MouseEvent) => void;
        },
      ) => HTMLButtonElement;
      createDialogActionButton: (
        targetDocument: Document,
        label: string,
        variant: "secondary" | "danger" | "primary",
      ) => HTMLElement;
    };
    uiPopover?: {
      mountInfoPopover: (
        targetDocument: Document,
        popupText: string,
        labelText: string,
      ) => CcxpLiteMounted<HTMLSpanElement>;
      mountInfoPopoverContent: (
        targetDocument: Document,
        popupContent: Node,
        labelText: string,
        popupClassName?: string,
      ) => CcxpLiteMounted<HTMLSpanElement>;
      buildInfoPopover: (
        targetDocument: Document,
        popupText: string,
        labelText: string,
      ) => HTMLSpanElement;
      buildInfoPopoverContent: (
        targetDocument: Document,
        popupContent: Node,
        labelText: string,
        popupClassName?: string,
      ) => HTMLSpanElement;
    };
    uiDisplay?: {
      createSidebarSearch: (
        targetDocument: Document,
        strings: Readonly<Record<string, string>>,
      ) => HTMLElement;
      createSection: (targetDocument: Document, className: string) => HTMLElement;
      createSectionHeading: (targetDocument: Document, text: string) => HTMLElement;
      createEmptyState: (targetDocument: Document, title: string, body?: string) => HTMLElement;
      createSkeletonStack: (
        targetDocument: Document,
        count: number,
        itemClassName: string,
      ) => HTMLElement;
      createRowLabel: (
        targetDocument: Document,
        text: string,
        withExternalLinkIcon: boolean,
      ) => HTMLElement;
      createBreadcrumbHeading: (
        targetDocument: Document,
        activeCategory: CcxpLiteSidebarCategoryNode | undefined,
        activeLeaf: CcxpLiteSidebarLinkItem,
      ) => HTMLElement;
    };
    sidebarOverlays?: {
      showRemovePinnedDialog: (
        targetDocument: Document,
        itemName: string,
        strings: Readonly<Record<string, string>>,
      ) => Promise<boolean>;
      syncTopLevelFramesetLayout: (variant: "classic" | "layered") => void;
      mountSidebarVariantSwitch: (
        targetDocument: Document,
        state: CcxpLiteSidebarState,
        strings: Readonly<Record<string, string>>,
        rerender: () => void,
        _footer?: HTMLElement,
      ) => void;
    };
    sidebarFavoriteControls?: {
      createFavoriteToggle: (
        targetDocument: Document,
        linkItem: CcxpLiteSidebarLinkItem,
        strings: Readonly<Record<string, string>>,
        onFavoritesChange: () => void,
      ) => HTMLElement;
      createBlockFavoriteToggle: (
        targetDocument: Document,
        block: CcxpLiteSidebarBlock,
        strings: Readonly<Record<string, string>>,
        onFavoritesChange: () => void,
      ) => HTMLElement;
    };
    sidebarNavigation?: {
      createClassicSidebarView: (
        targetDocument: Document,
        navDocument: Document,
        model: CcxpLiteSidebarModel,
        state: CcxpLiteSidebarState,
        strings: Readonly<Record<string, string>>,
        rerender: () => void,
      ) => HTMLElement;
      createCategoryBlock: (
        targetDocument: Document,
        navDocument: Document,
        blockItem: CcxpLiteSidebarBlock,
        strings: Readonly<Record<string, string>>,
        rerender: () => void,
      ) => HTMLElement;
      createCategoryCard: (
        targetDocument: Document,
        category: CcxpLiteSidebarCategoryNode,
        strings: Readonly<Record<string, string>>,
        onOpen: () => void,
      ) => HTMLButtonElement;
      createPinnedLinkCard: (
        targetDocument: Document,
        navDocument: Document,
        linkItem: CcxpLiteSidebarLinkItem,
        strings: Readonly<Record<string, string>>,
        rerender: () => void,
      ) => HTMLButtonElement;
      createPinnedBlockCard: (
        targetDocument: Document,
        blockItem: CcxpLiteSidebarBlock,
        state: CcxpLiteSidebarState,
        strings: Readonly<Record<string, string>>,
        rerender: () => void,
      ) => HTMLButtonElement;
      createDetailLinkCard: (
        targetDocument: Document,
        navDocument: Document,
        linkItem: CcxpLiteSidebarLinkItem,
        strings: Readonly<Record<string, string>>,
        rerender: () => void,
      ) => HTMLButtonElement;
      trackNavigationEvent: (
        targetDocument: Document,
        linkItem: CcxpLiteSidebarLinkItem,
        options: {
          sidebarVariant: "classic" | "layered";
          navigationMode: "embedded" | "legacy_frame" | "new_tab";
        },
      ) => void;
    };
    sidebarDestination?: {
      createDestinationView: (
        targetDocument: Document,
        navDocument: Document,
        activeCategory: CcxpLiteSidebarCategoryNode | undefined,
        activeLeaf: CcxpLiteSidebarLinkItem,
        strings: Readonly<Record<string, string>>,
        rerender: () => void,
      ) => HTMLElement;
    };
    loginFields?: {
      normalizeLoginFormLayout: (rootNode: ParentNode) => void;
      attachAccountFormatInfo: (targetDocument: Document, rootNode: ParentNode) => void;
      attachPasswordInfoPopover: (targetDocument: Document, rootNode: ParentNode) => void;
      getLandingStrings: (targetDocument: Document) => Readonly<Record<string, string>>;
      cssEscape: (value: unknown) => string;
    };
    loginPassword?: {
      enhancePasswordVisibilityToggle: (targetDocument: Document, rootNode: ParentNode) => void;
    };
    loginActions?: {
      replaceLoginFormImageButtons: (targetDocument: Document, rootNode: ParentNode) => void;
      wrapPrimaryLoginButtons: (targetDocument: Document, rootNode: ParentNode) => void;
    };
    loginLinks?: {
      isCannotLoginLabel: (label: string | undefined) => boolean;
      buildLoginHelperLink: (
        targetDocument: Document,
        sourceAnchor: HTMLAnchorElement | undefined,
        strings?: Readonly<Record<string, string>>,
      ) => HTMLAnchorElement | undefined;
      buildSupportLinks: (
        targetDocument: Document,
        serviceLinkNode: Element | undefined,
        cannotLoginAnchor: HTMLAnchorElement | undefined,
        strings?: Readonly<Record<string, string>>,
      ) => HTMLDivElement | undefined;
      buildHeaderUtilityLinks: (
        targetDocument: Document,
        utilityLinksTable: Element | undefined,
        excludedAnchor: HTMLAnchorElement | undefined,
        serviceLinkNode: Element | undefined,
        strings?: Readonly<Record<string, string>>,
      ) => HTMLElement | undefined;
    };
    loginNotices?: {
      normalizeAnnouncementHeading: (rawText: string | undefined) => string;
      hasAnnouncementHeading: (headingText: string) => boolean;
      prepareAnnouncementTable: (
        table: HTMLTableElement | undefined,
        strings?: Readonly<Record<string, string>>,
      ) => HTMLAnchorElement | undefined;
    };
  }
}
