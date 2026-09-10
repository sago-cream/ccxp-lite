import type { UserConfig } from "vitest/config";

export default {
  test: {
    include: ["test/**/*.browser.ts"],
    environment: "node",
    maxWorkers: 1,
  },
} satisfies UserConfig;
