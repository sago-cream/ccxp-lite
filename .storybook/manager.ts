import { createElement, useEffect } from "react";
import { addons, useGlobals } from "storybook/manager-api";
import { create } from "storybook/theming";
import { tokens } from "@ccxp-lite/tokens";
import { catalogLabel, catalogLocale } from "../stories/i18n.js";

function SidebarLabel({ name }: { name: string }) {
  const [globals] = useGlobals();
  const locale = catalogLocale(globals.locale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return createElement("span", undefined, catalogLabel(locale, name));
}

addons.setConfig({
  sidebar: {
    renderLabel: (item) => createElement(SidebarLabel, { name: item.name }, undefined),
  },
  theme: create({
    base: "light",
    brandTitle: "ccxpLite Design",
    colorPrimary: tokens.colorPrimary,
    colorSecondary: tokens.colorPrimary,
    fontBase: tokens.fontSans,
  }),
});
