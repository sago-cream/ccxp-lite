# Native CCXP page classes

Use these classes to compose interactive pages with the existing ccxpLite tokens, typography and purple action styles. Import `@ccxp-lite/ui/interactive-page.css` with the shared token stylesheet and opt in with a `ccxp-ui` container. The native deployment bundles this CSS in `/ccxp/INQUIRE/sa/portal/ui.css`; the extension does not load it by default. The presentation styles stay inside that container.

| Class                 | Purpose and usage                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `ccxp-ui`             | Opt-in root for shared tokens, font, colors and box sizing. Required around all examples. |
| `ccxp-page`           | Centered page with the shared maximum width and responsive padding.                       |
| `ccxp-stack`          | Vertical layout with a 24px gap and shrinkable children.                                  |
| `ccxp-row`            | Wrapping horizontal control row with a 12px gap.                                          |
| `ccxp-grid`           | Two equal columns; a single column at 600px and below.                                    |
| `ccxp-panel`          | Bordered white panel with 24px desktop / 16px mobile padding.                             |
| `ccxp-title`          | Page heading using the shared page-title type token.                                      |
| `ccxp-copy`           | Body copy without default margins; long text can wrap.                                    |
| `ccxp-muted`          | Secondary text color; combine with another text class.                                    |
| `ccxp-caption`        | 14px supporting text, such as a field hint.                                               |
| `ccxp-field`          | Label, control and hint stacked with an 8px gap.                                          |
| `ccxp-label`          | Strong label text; use a real `label` with `for`.                                         |
| `ccxp-control`        | Input, select or textarea; at least 44px high with native semantics and focus.            |
| `ccxp-button`         | Secondary button or action link, at least 44px high.                                      |
| `ccxp-button-primary` | Combine with `ccxp-button` for a filled primary action.                                   |
| `ccxp-link`           | Inline link with a visible keyboard focus outline.                                        |
| `ccxp-notice`         | Neutral status surface; provide the appropriate HTML role.                                |
| `ccxp-error`          | Error text color; explain the problem in words as well.                                   |

```html
<main class="ccxp-ui">
  <div class="ccxp-page ccxp-stack">
    <h1 class="ccxp-title">Page title</h1>
    <form class="ccxp-panel ccxp-stack">
      <div class="ccxp-field">
        <label for="note" class="ccxp-label">Description</label>
        <textarea id="note" class="ccxp-control"></textarea>
      </div>
      <button class="ccxp-button ccxp-button-primary">Submit</button>
    </form>
  </div>
</main>
```

The source is `packages/ui/styles/interactive-page.css`; tokens come from `packages/tokens/src/index.ts`. The native CCXP overhaul uses these classes for 介面建議. Host discovery, authentication, validation and submission stay in the consuming application's adapters.

The examples use this same stylesheet and support the catalog's language and viewport controls. They have no backend connection or submit handler.

Apply these classes only to reviewed interactive pages. Official print, signature, submission and administrative documents retain their original fonts, spacing, tables and pagination; do not load this stylesheet or add `ccxp-ui` to them.
