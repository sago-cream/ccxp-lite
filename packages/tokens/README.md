# @ccxp-lite/tokens

Private ccxpLite workspace, with no separate release or npm publishing.

- `src/index.ts`: canonical values, CSS aliases, typed names, and `applyTokens`.
- `tokens.css`: generated variables only, with no reset or external assets.

Run `bun run design:build` from the repository root after editing values. CI's
`bun run design:check` detects stale CSS and invalid or circular references.

See the [guidelines](../../docs/design/guidelines.md) and Foundations in Storybook.
