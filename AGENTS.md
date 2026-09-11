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
