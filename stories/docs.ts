import {
  createContext,
  createElement,
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import {
  Canvas,
  Controls,
  DocsContainer,
  DocsContext,
  Markdown,
} from "@storybook/addon-docs/blocks";
import type { DocsContainerProps } from "@storybook/addon-docs/blocks";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import type { GlobalsUpdatedPayload } from "storybook/internal/types";
import { catalogLabel, catalogLocale } from "./i18n.js";
import type { CatalogLocale } from "./i18n.js";

interface DocumentationParameters {
  docs?: { description?: Partial<Record<"component" | "story", string>> };
  i18n?: { description?: Partial<Record<"component" | "story", string>> };
}

const LocaleContext = createContext<CatalogLocale>("zh-TW");

export function LocalizedDocsContainer(props: PropsWithChildren<DocsContainerProps>) {
  const { channel } = props.context;
  const readLocale = () => {
    // Docs entries emit globals before mounting, including standalone MDX pages.
    const last = channel.last(GLOBALS_UPDATED) as [GlobalsUpdatedPayload] | undefined;
    return catalogLocale(last?.[0].globals.locale);
  };
  const [locale, setLocale] = useState(readLocale);
  useEffect(() => {
    const update = ({ globals }: GlobalsUpdatedPayload) => {
      setLocale(catalogLocale(globals.locale));
    };
    channel.on(GLOBALS_UPDATED, update);
    setLocale(readLocale());
    return () => {
      channel.off(GLOBALS_UPDATED, update);
    };
  }, [channel]);
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return createElement(
    LocaleContext.Provider,
    { value: locale },
    createElement(DocsContainer, props, props.children),
  );
}

export function LocalizedMarkdown({ zh, en }: { zh: string; en: string }) {
  const locale = useContext(LocaleContext);
  return createElement(
    Markdown,
    { children: locale === "en" ? en : zh },
    locale === "en" ? en : zh,
  );
}

export function LocalizedDocsPage() {
  const context = useContext(DocsContext);
  const locale = useContext(LocaleContext);
  const stories = context.componentStories();
  const first = stories.at(0);
  if (first === undefined) {
    return undefined;
  }
  const description = (story: typeof first, kind: "component" | "story") => {
    const parameters = story.parameters as DocumentationParameters;
    const english = parameters.docs?.description?.[kind];
    const chinese = parameters.i18n?.description?.[kind];
    const text = locale === "en" ? english : (chinese ?? english);
    return text === undefined ? undefined : createElement(Markdown, { children: text }, text);
  };
  const title = first.title.split("/").at(-1) ?? first.title;
  return createElement(
    Fragment,
    undefined,
    createElement("h1", undefined, catalogLabel(locale, title)),
    description(first, "component"),
    createElement("h2", undefined, catalogLabel(locale, "Examples")),
    ...stories.map((story) =>
      createElement(
        "section",
        { key: story.id, id: story.id },
        createElement("h3", undefined, catalogLabel(locale, story.name)),
        description(story, "story"),
        createElement(Canvas, { of: story.moduleExport, className: "ds-docs-canvas" }, undefined),
      ),
    ),
    Object.keys(first.argTypes).length === 0
      ? undefined
      : createElement(
          Fragment,
          undefined,
          createElement("h2", undefined, catalogLabel(locale, "Controls")),
          createElement(Controls, { of: first.moduleExport }, undefined),
        ),
  );
}
