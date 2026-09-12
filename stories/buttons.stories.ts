import type { Meta, StoryObj } from "@storybook/html-vite";
import { createDialogActionButton, createRenderer } from "@ccxp-lite/ui";
import { localized, surface } from "./helpers.js";

interface Args {
  variant: "primary" | "secondary" | "danger";
  label: string;
  disabled: boolean;
  longLabel: boolean;
}
const meta = {
  title: "Components/Action button",
  args: { variant: "primary", label: "", disabled: false, longLabel: false },
  argTypes: { variant: { control: "select", options: ["primary", "secondary", "danger"] } },
  render: (args, context) => {
    let { label } = args;
    if (label === "") {
      const labels = {
        primary: localized(context.globals.locale, "確認送出", "Confirm submission"),
        secondary: localized(context.globals.locale, "取消", "Cancel"),
        danger: localized(context.globals.locale, "移除", "Remove"),
      };
      label = args.longLabel
        ? localized(
            context.globals.locale,
            "確認所選日期並送出",
            "Confirm selected dates and submit",
          )
        : labels[args.variant];
    }
    const button = createDialogActionButton(document, label, args.variant) as HTMLButtonElement;
    button.disabled = args.disabled;
    const row = createRenderer(document).element("div", { className: "ds-row" }, [button]);
    return surface(row);
  },
  parameters: {
    i18n: {
      description: {
        component:
          "主要按鈕用於送出等核心操作，次要按鈕用於取消，危險按鈕用於移除。這些按鈕與 CCXP 對話框共用同一份實作。停用狀態目前沿用既有外觀，但已停用原生啟動行為。",
      },
    },
    docs: {
      description: {
        component:
          "Use primary for the main commit action, secondary for cancel, and danger for removal. These are the same dialog buttons used by CCXP. Disabled currently retains the existing visual treatment; native activation is disabled.",
      },
    },
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Danger: Story = { args: { variant: "danger" } };
export const Disabled: Story = { args: { disabled: true } };
export const LongLabel: Story = { args: { longLabel: true } };
