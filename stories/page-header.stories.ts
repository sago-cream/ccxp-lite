import type { Meta, StoryObj } from "@storybook/html-vite";
import { createPageHeader, mountInfoPopover } from "@ccxp-lite/ui";
import { localized, surface, withCleanup } from "./helpers.js";

const meta = {
  title: "Components/Page header",
  args: { open: false },
  render: (args, context) => {
    const header = createPageHeader(document);
    const heading = document.createElement("h1");
    heading.textContent = localized(context.globals.locale, "首頁", "Home");
    const help = mountInfoPopover(
      document,
      localized(
        context.globals.locale,
        "請勿同時開啟多個視窗執行相同作業。",
        "Do not perform the same operation in multiple windows.",
      ),
      localized(context.globals.locale, "系統使用說明", "System usage guide"),
    );
    const button = help.element.querySelector("button");
    button?.append(localized(context.globals.locale, "系統使用說明", "System usage guide"));
    header.append(heading, help.element);
    if (args.open) {
      button?.click();
    }
    return withCleanup(surface(header), help.destroy);
  },
} satisfies Meta<{ open: boolean }>;
export default meta;
type Story = StoryObj<{ open: boolean }>;
export const Default: Story = {};
export const InstructionsOpen: Story = { args: { open: true } };
