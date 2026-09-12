# Composition recipes

## Field with help

Keep the label visible and use help for optional detail. Move the original input into the control
slot to preserve its form behavior. Call `help.destroy()` when removing the field.

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
// Mount row.element in the form table; register help.destroy for cleanup.
```

## Search with instructions

Use `createSidebarSearch` with an accessible name. Add optional help with
`mountInfoPopoverContent`; keep essential instructions visible. The controller filters results.

## Confirmation

Use `createRemovePinnedDialog` with a clear title, a consequence, and Cancel plus Confirm or Remove.
Focus Cancel on open. Handle Escape and backdrop clicks, contain focus, and restore it on close.
Validate in the feature controller before confirmation; submit only after the user confirms.

## Loading, empty, and error

Pair `createSkeletonStack` with a loading status and `aria-busy`. Use `createEmptyState` to explain
an empty result and its next step. Give errors a specific explanation and a Retry action when
useful. Keep requests and retries in the feature controller.

## Styles

```ts
import "@ccxp-lite/tokens/tokens.css";
import "@ccxp-lite/ui/styles.css";
```

Install styles in each iframe document. To apply tokens programmatically:

```ts
import { applyTokens } from "@ccxp-lite/tokens";
applyTokens(frameDocument.documentElement);
```
