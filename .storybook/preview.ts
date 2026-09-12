import type { Preview } from "@storybook/html-vite";
import { useEffect } from "storybook/preview-api";
import "@ccxp-lite/tokens/tokens.css";
import "@ccxp-lite/ui/styles.css";
import "../stories/catalog.css";
import { disposeStory } from "../stories/helpers.js";
import { LocalizedDocsContainer, LocalizedDocsPage } from "../stories/docs.js";
import { catalogLocale } from "../stories/i18n.js";

const preview: Preview = {
  tags: ["autodocs"],
  globalTypes: {
    locale: {
      description: "語言 / Language",
      toolbar: {
        icon: "globe",
        dynamicTitle: true,
        items: [
          { value: "zh-TW", title: "繁體中文（台灣）" },
          { value: "en", title: "English" },
        ],
      },
    },
  },
  initialGlobals: { locale: "zh-TW" },
  parameters: {
    layout: "padded",
    docs: {
      container: LocalizedDocsContainer,
      page: LocalizedDocsPage,
      story: { inline: true, height: "420px" },
    },
    options: {
      storySort: { order: ["Start here", "Foundations", "Components", "Recipes"] },
    },
  },
  decorators: [
    (renderStory, context) => {
      document.documentElement.lang = catalogLocale(context.globals.locale);
      const element = renderStory();
      if (element instanceof Element) {
        element.setAttribute("lang", catalogLocale(context.globals.locale));
      }
      useEffect(
        () => () => {
          if (typeof element !== "string") {
            disposeStory(element);
          }
        },
        [element],
      );
      return element;
    },
  ],
};

export default preview;
