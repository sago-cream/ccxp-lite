# @ccxp-lite/ui

Private DOM component library. Pass the owning `Document` to factories. Stateful popovers
return `{ element, destroy }`; controllers collect resources behind `destroy()`.
The module entry point needs no Chrome API or application global.

`styles.css` imports shared popover CSS and existing surface skins without the host reset.
The extension emits classic registrations from `scripts/design-ui-entry.ts` using the same
implementation as Storybook. Host discovery, persistence, and navigation stay in feature adapters.

The library includes existing repeated patterns. See [guidelines](../../docs/design/guidelines.md),
[recipes](../../docs/design/recipes.md), and [extension integration](../../src/shared/ui/README.md).
