import { completeConfigBase } from "eslint-config-complete";

export default [
  ...completeConfigBase,

  {
    ignores: [
      ".build/**",
      ".playwright-cli/**",
      "dist/**",
      "storybook-static/**",
      "fixtures/ccxp-snapshot/**",
      "node_modules/**",
      "release-it*.config.cjs",
    ],
  },

  {
    rules: {
      "import-x/no-unassigned-import": [
        "error",
        {
          allow: ["**/*.css"],
        },
      ],
    },
  },

  // Storybook requires default metadata exports and contextually typed CSF callbacks. Keep
  // bilingual specimen copy readable in the catalog source.
  {
    files: [".storybook/**/*.ts", "stories/**/*.ts"],
    rules: {
      "import-x/no-default-export": "off",
      "import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "complete/require-capital-const-assertions": "off",
      "complete/require-ascii": "off",
    },
  },
];
