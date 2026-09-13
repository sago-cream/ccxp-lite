import type { Meta, StoryObj } from "@storybook/html-vite";
import { mountSearchSelect } from "@ccxp-lite/ui";
import { localized, surface, withCleanup } from "./helpers.js";

const meta = {
  title: "Components/Search select",
  render: (_args, context) => {
    const form = document.createElement("form");
    const input = document.createElement("input");
    input.id = `${context.id}-search`;
    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = localized(
      context.globals.locale,
      "以代碼或名稱搜尋",
      "Search by code or name",
    );
    const select = document.createElement("select");
    select.setAttribute(
      "aria-label",
      localized(context.globals.locale, "選擇單位", "Choose a unit"),
    );
    for (const [value, text] of [
      ["", "－請選擇 / Please select"],
      ["EM05", "EM05 - 清華學院學士班 / Interdisciplinary Program"],
      ["EU0A", "EU0A - 竹師教育學院 / College of Education"],
    ]) {
      select.add(new Option(text, value));
    }
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    form.append(label, input, select, status);
    const mounted = mountSearchSelect(
      input,
      select,
      status,
      (count) => `${count} ${localized(context.globals.locale, "個符合的單位", "matching units")}`,
    );
    return withCleanup(surface(form), mounted.destroy);
  },
} satisfies Meta;
export default meta;
type Story = StoryObj;
export const Department: Story = {};
