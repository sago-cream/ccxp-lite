import type { Meta, StoryObj } from "@storybook/html-vite";
import { mountSearchSelect } from "@ccxp-lite/ui";
import { localized, surface, withCleanup } from "./helpers.js";

const meta = {
  title: "Components/Search select",
  render: (_args, context) => {
    const form = document.createElement("form");
    form.style.display = "grid";
    form.style.gap = "8px";
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
      ["EE", "EE - 電機工程學系 / Electrical Engineering"],
      ["CS", "CS - 資訊工程學系 / Computer Science"],
      ["MA", "MA - 數學系 / Mathematics"],
      ["PH", "PH - 物理學系 / Physics"],
      ["CH", "CH - 化學系 / Chemistry"],
      ["EU0A", "EU0A - 竹師教育學院 / College of Education"],
    ]) {
      select.add(new Option(text, value));
    }
    form.append(label, input, select);
    const mounted = mountSearchSelect(input, select, undefined, () =>
      localized(context.globals.locale, "查無符合的單位", "No matching units"),
    );
    return withCleanup(surface(form), mounted.destroy);
  },
} satisfies Meta;
export default meta;
type Story = StoryObj;
export const Department: Story = {};
