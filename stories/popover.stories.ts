import type { Meta, StoryObj } from "@storybook/html-vite";
import { createRenderer, mountInfoPopover } from "@ccxp-lite/ui";
import { localized, surface, withCleanup } from "./helpers.js";

interface Args {
  open: boolean;
  longText: boolean;
}
const meta = {
  title: "Components/Help popover",
  args: { open: false, longText: false },
  render: (args, context) => {
    const dom = createRenderer(document);
    const text = localized(
      context.globals.locale,
      "選擇日期後，請確認開始與結束時間。",
      "After selecting dates, check the start and end times.",
    );
    const mounted = mountInfoPopover(
      document,
      args.longText ? text.repeat(6) : text,
      localized(context.globals.locale, "操作說明", "Instructions"),
    );
    const row = dom.element("div", { className: "ds-row" }, [
      dom.element("span", { text: localized(context.globals.locale, "工作日期", "Work date") }),
      mounted.element,
    ]);
    const root = surface(row);
    root.classList.add("ds-popover-example");
    if (args.open) {
      mounted.element.querySelector<HTMLButtonElement>("button")?.click();
    }
    return withCleanup(root, mounted.destroy);
  },
  parameters: {
    i18n: {
      description: {
        component:
          "游標移入可預覽說明，點擊可保持展開。按 Escape 或點擊外部可關閉。移除所屬視圖時，務必呼叫 destroy()。",
      },
    },
    docs: {
      description: {
        component:
          "Hover previews help; click pins it open. Escape and outside clicks dismiss it. Always call destroy() when the owning view is removed.",
      },
    },
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Closed: Story = {};
export const Open: Story = { args: { open: true } };
export const LongText: Story = { args: { open: true, longText: true } };
