import type { Meta, StoryObj } from "@storybook/html-vite";
import {
  createController,
  createDialogActionButton,
  createEmptyState,
  createRemovePinnedDialog,
  createRenderer,
  createSidebarSearch,
  createSkeletonStack,
  mountInfoPopoverContent,
} from "@ccxp-lite/ui";
import { localized, surface, withCleanup } from "./helpers.js";

const meta = { title: "Recipes/Composition", args: {} } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Confirmation: Story = {
  render: (_args, context) => {
    const dom = createRenderer(document);
    const controller = createController(document);
    const removal = _args.removal === true;
    const titlePrefix = removal
      ? localized(context.globals.locale, "移除「", "Remove ")
      : localized(context.globals.locale, "確認登錄日期", "Confirm work dates");
    const description = removal
      ? localized(
          context.globals.locale,
          "此功能將從常用功能移除，仍可隨時從選單加回。",
          "This function will be removed from Favorites. You can add it again from the menu.",
        )
      : localized(
          context.globals.locale,
          "共 3 天，送出前請檢查所選日期。",
          "3 days selected. Review the dates before submitting.",
        );
    const open = createDialogActionButton(
      document,
      localized(context.globals.locale, "預覽確認視窗", "Preview confirmation"),
      "primary",
    );
    const status = dom.element("p", { className: "ds-caption", attributes: { role: "status" } });
    const root = surface(dom.element("div", { className: "ds-row" }, [open]), status);
    let closeCurrent: (() => void) | undefined;
    controller.listen(open, "click", () => {
      closeCurrent?.();
      const dialogController = createController(document);
      const view = createRemovePinnedDialog(
        document,
        removal
          ? localized(
              context.globals.locale,
              "填寫教學意見調查 Course evaluation",
              "Teaching feedback and course evaluation",
            )
          : "",
        {
          sidebarRemovePinnedDialogTitlePrefix: titlePrefix,
          sidebarRemovePinnedDialogTitleSuffix: removal
            ? localized(context.globals.locale, "」？", "?")
            : "",
          sidebarRemovePinnedDialogDescription: description,
          sidebarRemovePinnedDialogCancel: localized(context.globals.locale, "取消", "Cancel"),
          sidebarRemovePinnedDialogConfirm: removal
            ? localized(context.globals.locale, "確認移除", "Remove favorite")
            : localized(context.globals.locale, "確認送出", "Confirm"),
        },
        removal ? "danger" : "primary",
      );
      const close = () => {
        dialogController.destroy();
        view.overlay.remove();
        open.focus();
      };
      closeCurrent = close;
      dialogController.listen(view.keepButton, "click", close);
      dialogController.listen(view.confirmButton, "click", () => {
        status.textContent = localized(context.globals.locale, "已確認。", "Confirmed.");
        close();
      });
      dialogController.listen(view.overlay, "click", (event) => {
        if (event.target === view.overlay) {
          close();
        }
      });
      dialogController.listen(view.overlay, "keydown", (event) => {
        const { key } = event as KeyboardEvent;
        if (key === "Escape") {
          event.preventDefault();
          close();
        }
        if (key === "Tab") {
          event.preventDefault();
          (document.activeElement === view.keepButton
            ? view.confirmButton
            : view.keepButton
          ).focus();
        }
      });
      root.append(view.overlay);
      view.keepButton.focus();
    });
    return withCleanup(root, () => {
      closeCurrent?.();
      controller.destroy();
    });
  },
  parameters: {
    i18n: {
      description: {
        story: "按「取消」、Escape 或點擊背景可關閉。",
      },
    },
    docs: {
      description: {
        story: "Cancel, Escape, or a backdrop click closes the dialog.",
      },
    },
  },
};
export const RemovalLongName: Story = {
  ...Confirmation,
  args: { removal: true },
  parameters: {
    docs: {
      description: {
        story:
          "Long bilingual names wrap inside the shared dialog; the action row wraps at narrow widths. Destructive actions use the accessible danger token.",
      },
    },
  },
};
export const SearchWithInstructions: Story = {
  render: (_args, context) => {
    const dom = createRenderer(document);
    const search = createSidebarSearch(document, {
      sidebarSearchPlaceholder: localized(context.globals.locale, "搜尋選單", "Search menu"),
    });
    const help = mountInfoPopoverContent(
      document,
      dom.element("span", {
        text: localized(
          context.globals.locale,
          "使用功能名稱搜尋。選擇星號可將功能加入常用項目。",
          "Search by function name. Use the star to pin a function.",
        ),
      }),
      localized(context.globals.locale, "搜尋說明", "Search help"),
    );
    const root = surface(dom.element("div", { className: "ds-row" }, [search, help.element]));
    root.classList.add("ds-popover-example");
    return withCleanup(root, help.destroy);
  },
};
export const Loading: Story = {
  render: (_args, context) => {
    const dom = createRenderer(document);
    const stack = createSkeletonStack(document, 3, "ccxp-lite-skeleton-card");
    stack.setAttribute("aria-hidden", "true");
    return surface(
      dom.element("section", { className: "ds-state-preview", attributes: { "aria-busy": true } }, [
        dom.element("p", {
          text: localized(context.globals.locale, "正在載入功能…", "Loading functions…"),
          attributes: { role: "status" },
        }),
        stack,
      ]),
    );
  },
};
export const ErrorAndRetry: Story = {
  render: (_args, context) => {
    const dom = createRenderer(document);
    const controller = createController(document);
    const panel = createEmptyState(
      document,
      localized(context.globals.locale, "無法載入頁面", "Could not load the page"),
      localized(context.globals.locale, "請稍後再試。", "Please try again."),
    );
    panel.setAttribute("role", "status");
    const retry = createDialogActionButton(
      document,
      localized(context.globals.locale, "重試", "Retry"),
      "secondary",
    );
    controller.listen(retry, "click", () => {
      panel.replaceChildren(
        dom.element("p", {
          text: localized(context.globals.locale, "已載入。", "Loaded."),
        }),
      );
    });
    return withCleanup(
      surface(panel, dom.element("div", { className: "ds-row" }, [retry])),
      controller.destroy,
    );
  },
};
