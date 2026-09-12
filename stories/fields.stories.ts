import type { Meta, StoryObj } from "@storybook/html-vite";
import { createFieldRow, createRenderer, mountInfoPopover } from "@ccxp-lite/ui";
import { localized, surface, withCleanup } from "./helpers.js";

interface Args {
  disabled: boolean;
  help: boolean;
}
const meta = {
  title: "Components/Form field",
  args: { disabled: false, help: false },
  render: (args, context) => {
    const dom = createRenderer(document);
    const fieldId = `${context.id}-account`;
    const mounted = args.help
      ? mountInfoPopover(
          document,
          localized(
            context.globals.locale,
            "請輸入您的學號或帳號。",
            "Enter your student ID or account.",
          ),
          localized(context.globals.locale, "帳號格式", "Account format"),
        )
      : undefined;
    const row = createFieldRow(document, {
      fieldId,
      columnCount: 1,
      labelText: localized(context.globals.locale, "帳號", "Account"),
      accessory: mounted?.element,
    });
    const input = dom.element("input", {
      className: "inputtext",
      attributes: { id: fieldId, type: "text", autocomplete: "username" },
    });
    input.disabled = args.disabled;
    row.controlSlot.append(input);
    const form = dom.element("form", { className: "ccxp-lite-login-form" }, [
      dom.element("table", { className: "ccxp-lite-login-form-table" }, [
        dom.element("tbody", {}, [row.element]),
      ]),
    ]);
    const root = surface(dom.element("section", { className: "ccxp-lite-landing-login" }, [form]));
    return withCleanup(root, () => mounted?.destroy());
  },
  parameters: {
    i18n: {
      description: {
        component: "標籤持續顯示，補充說明放在旁邊。",
      },
    },
    docs: {
      description: {
        component: "Keep labels visible and place optional help beside them.",
      },
    },
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const Account: Story = {};
export const WithHelp: Story = { args: { help: true } };
export const Disabled: Story = { args: { disabled: true } };
