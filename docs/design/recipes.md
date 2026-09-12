# Composition recipes

The **Recipes / Composition** stories are interactive examples built from the production library.
Their data and callbacks are inert. Follow these composition and ownership rules on CCXP pages.

## Field with help

Use `createFieldRow` for the label and control slot and `mountInfoPopover` for concise help.
Keep the label visible when help is closed. The adapter moves the original input into the slot,
preserving its name, value, form association, and listeners. Dispose the help with its view.

```ts
import { createFieldRow, mountInfoPopover } from "@ccxp-lite/ui";

const help = mountInfoPopover(doc, "Enter your student ID or account.", "Account format");
const row = createFieldRow(doc, {
  fieldId: originalInput.id,
  labelText: "Account",
  columnCount: 1,
  accessory: help.element,
});
row.controlSlot.append(originalInput);
// Append row.element to the existing form table and register help.destroy for cleanup.
```

## Search toolbar with instructions

Use `createSidebarSearch` with a localized accessible name. Place supplemental instructions
beside it with `mountInfoPopoverContent`. Keep essential instructions visible. The controller
performs filtering and manages results. Move original language links through their host adapter.

## Confirmation before a commit

The shared view supplies title, description, and secondary/primary or danger actions. Its
compatibility entry point is named `createRemovePinnedDialog`; work-log also uses it with primary
actions and feature-owned content. Keep this API until a concrete consumer needs a new contract.

The controller mounts in the correct document, focuses Cancel, handles Escape/backdrop/cancel,
contains keyboard focus, restores the initiating control, and disposes listeners. Confirmation
calls the owning feature; rendering the view never initiates a request.

For work-log dates, use the validated plan after weekday filtering and duplicate checks. Preserve
the date/time columns, Arial numeric treatment, and 12px gap below the count. Do not reproduce the
batching or validation algorithm in the library or Storybook.

## Loading, empty, and error

Use `createSkeletonStack` for placeholders, with a readable loading status and `aria-busy` on
the changing region. Use `createEmptyState` for an empty result and its next step. Errors need a
specific explanation and, when useful, a secondary Retry action. Keep retries, timeouts,
navigation targets, and request cancellation in the destination controller.

The Error and retry story uses an inert callback. Packaged extension tests cover real destination
navigation behavior.

## Applying tokens

```ts
import "@ccxp-lite/tokens/tokens.css";
import "@ccxp-lite/ui/styles.css";
```

For a frame or another document, install styles there or apply the same generated token map:

```ts
import { applyTokens } from "@ccxp-lite/tokens";
applyTokens(frameDocument.documentElement);
```

Add values in `packages/tokens/src/index.ts`, regenerate with `bun run design:build`, and inspect
affected examples. The extension uses the classic bridge automatically; do not add ESM imports
to unbundled content scripts.
