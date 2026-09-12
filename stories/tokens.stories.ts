import type { Meta, StoryObj } from "@storybook/html-vite";
import { cssVariables } from "@ccxp-lite/tokens";
import { createRenderer } from "@ccxp-lite/ui";
import { surface } from "./helpers.js";

interface Args {
  filter: string;
}
const meta = {
  title: "Foundations/Tokens",
  args: { filter: "" },
  parameters: {
    docs: {
      description: {
        component:
          "Shared CSS variables for colors, spacing, surfaces, and typography. Copy their names directly into CSS; use the filter control to narrow the list. Values are generated from @ccxp-lite/tokens.",
      },
    },
    i18n: {
      description: {
        component:
          "共用 CSS 變數涵蓋色彩、間距、表面與字體排版。變數名稱可直接複製到 CSS；使用 filter 設定可篩選清單。所有值皆由 @ccxp-lite/tokens 產生。",
      },
    },
  },
  render: ({ filter }: Args) => {
    const dom = createRenderer(document);
    const grid = dom.element("div", { className: "ds-token-grid" });
    for (const [name, value] of Object.entries(cssVariables)) {
      if (!name.includes(filter)) {
        continue;
      }
      const card = dom.element("section", { className: "ds-token" }, [
        dom.element("code", { text: name }),
        dom.element("code", { text: value }),
      ]);
      if (/^(#|rgba?\(|color-mix\(|transparent$)/.test(value)) {
        card.prepend(
          dom.element("div", {
            className: "ds-swatch",
            styleProperties: { "background-color": `var(${name})` },
            attributes: { "aria-hidden": true },
          }),
        );
      } else if (name.includes("spacing")) {
        card.append(
          dom.element("div", {
            className: "ds-space-sample",
            styleProperties: { width: `var(${name})` },
            attributes: { "aria-hidden": true },
          }),
        );
      }
      grid.append(card);
    }
    return surface(grid);
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<Args>;
export const AllTokens: Story = {};
export const Spacing: Story = { args: { filter: "spacing" } };
export const Surfaces: Story = { args: { filter: "surface" } };
export const Dialog: Story = { args: { filter: "dialog" } };
export const Typography: Story = {
  render: () => {
    const dom = createRenderer(document);
    const roles = ["display", "page-title", "body-strong", "body", "utility", "caption"];
    return surface(
      ...roles.map((role) =>
        dom.element("section", { className: "ds-token" }, [
          dom.element("code", { text: `--ccxp-lite-type-${role}` }),
          dom.element("div", {
            text: "校務資訊系統 · NTHU AIS 2026",
            styleProperties: {
              font: `var(--ccxp-lite-type-${role})`,
              color: `var(--ccxp-lite-type-${role}-color)`,
            },
          }),
        ]),
      ),
    );
  },
};
