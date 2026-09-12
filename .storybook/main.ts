import type { StorybookConfig } from "@storybook/html-vite";

const config: StorybookConfig = {
  framework: "@storybook/html-vite",
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.ts"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  core: { disableTelemetry: true },
};

export default config;
