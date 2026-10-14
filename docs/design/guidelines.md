# ccxpLite design guidelines

## Foundations

| Use        | Rule                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Color      | Purple for primary actions and navigation; danger for removal and errors.                              |
| Surfaces   | White for content, neutral tints for navigation and secondary groups. Use borders to separate content. |
| Typography | Use a 14px base for body, controls, utilities, and captions.                                           |
| Language   | Support Traditional Chinese and English. Check CJK wrapping and long English labels.                   |
| Numbers    | Align date and time columns. Use Arial with tabular numerals in work-log.                              |
| Spacing    | Reuse spacing tokens. Use a 4px grid for new layouts; preserve existing optical adjustments.           |
| Corners    | Match the input, control, surface, or pill role.                                                       |
| Motion     | Keep action feedback brief: 120ms. Respect reduced-motion preferences.                                 |

Body text and control labels use 14px regular. Action buttons and standalone text links use 14px semibold (600). Inline links inherit the surrounding text size and use semibold weight. Preserve existing heading and branding typography.

The home search input, results, and function-card labels use 16px regular for emphasis. Sidebar navigation and preferences use 14px regular text; profile support links keep 14px semibold text. These rows share a 36px height. Logout uses the same regular weight and text color as the preferences controls.

## Reuse

- Use `@ccxp-lite/tokens` and `@ccxp-lite/ui`. Prefer semantic names such as `--ccxp-lite-text-muted`.
- Edit tokens in `packages/tokens/src/index.ts`, then run `bun run design:build`. Do not edit generated CSS.
- Add variants for distinct actions or states. Extract a component when a second use needs it.
- Keep host discovery, validation, submission, and navigation in feature adapters. Release listeners and observers with `destroy()`.

## Legacy pages

Preserve original controls, names, values, form associations, handlers, and structural styles.
Keep style cleanup in host adapters; avoid blanket resets. Install styles and tokens in each
iframe document. Preserve component class names and selector order.

## States and accessibility

Use visible input labels, named icon buttons, and links for navigation. Keep essential instructions
visible. Support keyboard and pointer access to help. Dialogs need Escape dismissal, focus
containment, and focus restoration.

Check focus, disabled, expanded, loading, empty, and error states at narrow widths in both
languages. Update examples with shared UI changes and verify the affected CCXP pages.
