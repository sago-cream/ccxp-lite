## Browser & Chrome

- For TS-based Chrome extensions, rebuild after changes

## PR visual evidence

- Use the packaged extension and a live-derived fixture for the affected page. Run
  `bun run test:browser-parity` with explicit base/head extension paths; use `--work-log-only
--record-video` for work-log PR recordings.
- Behavior fixtures in `test/work-log/batch.browser.ts` are not visual fixtures. Do not publish
  screenshots from them or inject selected extension modules, theme stubs, or layout overrides
  to make a capture look plausible.
- Keep the real page landmarks, host classes/styles, and embedding mode. Assert the extension
  finished styling the page before capture. Record fixture provenance and sanitized substitutions.
- Base/head agreement is regression evidence, not proof of live-site fidelity. If the affected
  page is not covered, inspect it live and add coverage before publishing visual evidence.
- Consult `test/browser-fixtures/coverage.json` for the exact affected page and state. A listed
  module is not blanket coverage: add a sanitized legacy capture and its host assets for uncovered
  states. Keep unavailable role/period/widget states explicitly listed as gaps.

## Design system

- Read [design guidelines](docs/design/guidelines.md) before changing shared UI or tokens.
- Reuse the local `@ccxp-lite/tokens` and `@ccxp-lite/ui` workspaces. Keep host adapters in feature directories.
- Edit token source, then run `bun run design:build`; do not hand-edit generated token CSS.
- Update relevant Storybook examples with shared UI changes and preserve packaged browser parity.
