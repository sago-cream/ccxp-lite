import type { Meta, StoryObj } from "@storybook/html-vite";
import {
  createBreadcrumbHeading,
  createEmptyState,
  createLabIcon,
  createRenderer,
  createSidebarSearch,
  createStatusSwitch,
} from "@ccxp-lite/ui";
import { localized, surface } from "./helpers.js";

const meta = { title: "Components/Navigation", args: {} } satisfies Meta;
export default meta;
type Story = StoryObj;
export const Search: Story = {
  render: (_args, context) =>
    surface(
      createSidebarSearch(document, {
        sidebarSearchPlaceholder: localized(context.globals.locale, "搜尋選單", "Search menu"),
      }),
    ),
};
export const Empty: Story = {
  render: (_args, context) =>
    surface(
      createEmptyState(
        document,
        localized(context.globals.locale, "尚無常用項目", "No pinned items yet"),
        localized(
          context.globals.locale,
          "點選功能旁的星號即可加入。",
          "Star a function to keep it here.",
        ),
      ),
    ),
};
export const Breadcrumb: Story = {
  render: (_args, context) =>
    surface(
      createBreadcrumbHeading(
        document,
        { label: localized(context.globals.locale, "選課與課程", "Courses and enrollment") },
        { label: localized(context.globals.locale, "課程查詢", "Course search") },
      ),
    ),
};
export const LayoutSwitch: Story = {
  render: (_args, context) => {
    const dom = createRenderer(document);
    return surface(
      dom.element(
        "div",
        { className: "ds-row" },
        ["classic", "layered"].map((mode) =>
          createStatusSwitch(document, {
            mode,
            actionLabel: localized(
              context.globals.locale,
              "切換導覽模式",
              "Switch navigation layout",
            ),
            label: localized(context.globals.locale, "實驗介面", "Experimental layout"),
            status:
              mode === "layered"
                ? localized(context.globals.locale, "開啟", "On")
                : localized(context.globals.locale, "關閉", "Off"),
            icon: createLabIcon(document),
          }),
        ),
      ),
    );
  },
};
