# ccxpLite design guidelines

ccxpLite makes dense university workflows easier to read and operate. Prefer familiar native
controls, clear labels, restrained emphasis, and predictable navigation. Preserve the host's
working controls and submission behavior while improving their presentation.

These guidelines derive from the shared DOM extraction in PR #29 and its reuse in #31 and #32.
The local packages and Storybook describe the implementation shipped with this repository.
They are private workspaces, versioned with the extension, with no npm publishing step.

## Foundations

`packages/tokens/src/index.ts` is the canonical token source. It exports foundational values,
semantic CSS aliases, and component values. `bun run design:build` generates `tokens.css` and
classic extension scripts. Do not hand-edit the generated CSS. `bun run design:check` rejects
stale CSS, unknown token references, and alias cycles.

| Decision     | Rule                                                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Emphasis     | Use the existing muted purple primary color for actions and navigation. Reserve danger for removal or errors.                                                    |
| Surfaces     | Use white for the main surface and a quiet neutral tint for navigation and secondary groups. Borders separate related content without heavy containers.          |
| Typography   | Use semantic font roles. Body is 16px; utilities and captions are 14px. Titles establish hierarchy without competing with form actions.                          |
| Language     | Provide Traditional Chinese and English labels. Verify long English copy and CJK wrapping.                                                                       |
| Numeric data | Align dates and times in stable columns. Work-log explicitly uses Arial with tabular numerals because the inherited CJK font did not provide equal-width digits. |
| Spacing      | Reuse semantic spacing tokens. Use a 4px grid for new layouts; preserve established 2/6/10/14px and optical adjustments until reviewed in context.               |
| Corners      | Use existing input, control, surface, and pill roles. Do not make every element equally rounded.                                                                 |
| Motion       | Keep feedback brief and tied to a state change. Existing action transitions use 120ms. Avoid decorative motion in data entry.                                    |

Use semantic names such as `--ccxp-lite-text-muted` when expressing intent. Keep existing names
compatible. Avoid aliases without distinct roles; do not promote every legacy measurement into
a universal rule.

## Components and ownership

`@ccxp-lite/ui` contains the renderer, resource controller, buttons, icons, help popovers,
status switch presentation, display helpers, login field views, and dialog view. Factories
accept the owning `Document`; imports need neither Chrome nor `CCXP_LITE`.

1. **Views** create extension-owned DOM. They do not search host pages or submit records.
2. **Host adapters** find and move existing inputs, links, tables, and navigation targets. Keep
   them in `src/login`, `src/menu`, and the relevant feature directory.
3. **Controllers** coordinate state and release listeners, observers, and other resources through
   `destroy()`.

Reuse existing patterns. Add a variant for a real difference in intent or state; extract another
component when a second concrete use warrants it. Unique page layouts can use tokens and recipes.

Existing public namespace interfaces remain compatibility contracts. `scripts/design-ui-entry.ts`
bridges the library to those interfaces and attaches popover cleanup to the application. The
runtime and Storybook compile the same implementation sources.

## Styles and legacy pages

Component classes retain their `ccxp-lite-*` names. Shared popover CSS belongs to the library.
Other skins remain with their surfaces and are imported by the local library stylesheet entry
point. This preserves selector order and surface-specific variants.

The token CSS declares variables only, with no reset. Extension theme setup still applies the
same variables to each document: CSS variables do not inherit across iframe roots. The build
packages all assets locally and includes workspace sources in the Firefox source archive.

Preserve control identity, names, values, inline handlers, and structural styles. Legacy display,
positioning, visibility, and overflow can carry behavior. Keep style cleanup in its adapter;
never apply a blanket host reset or remove all `!important` declarations.

## States and accessibility

Document applicable states: default, hover, keyboard focus, disabled, expanded, loading, empty,
and error. Use buttons for actions, links for navigation, and persistent labels for inputs.
Icon-only actions need accessible names. Help must support keyboard and pointer input.
Dialog controllers provide dismissal, keyboard containment, and focus restoration. Rendering a
preview never submits records; batch confirmation remains a feature operation after validation.

The catalog exposes existing behavior; it is not an accessibility certification. Deliberate
follow-up is needed for purple/focus contrast, a distinct disabled action-button style,
reduced-motion handling for skeletons, and focus containment in the legacy remove-pinned
controller. Evaluate those changes in both the component and host pages. This extraction
preserves their existing behavior.

## Review and verification

- Update the component, relevant story, and changed guidelines or recipes together. Keep the
  English and Traditional Chinese documentation in sync.
- Inspect Chinese/English, keyboard focus, long content, and narrow frames in Storybook. The
  toolbar language menu switches documentation and examples; `zh-TW` is the default.
- Run `bun run check`, `bun run test:browser`, `bun run build`, and `bun run storybook:build`.
- Run `bun run test:design` against the built catalog for browser rendering and interactions.
- Compare packaged base/head extensions with the browser-parity harness. An isolated canvas
  cannot reveal every Kendo, frameset, or inline-style conflict.

Extraction should preserve the browser-parity baseline. Intentional visual changes need reviewed
before/after evidence. Never regenerate snapshots simply to conceal a regression.
