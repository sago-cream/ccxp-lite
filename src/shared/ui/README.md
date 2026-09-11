# DOM UI architecture

The extension uses three layers so legacy-page knowledge does not leak into reusable markup.
Every layer accepts the owning `Document`, allowing the same code to work in the login document,
navigation frame, main frame, or top document while preserving node identity and event ownership.

1. **Renderers** create extension-owned DOM. `shared/ui/renderer.ts` binds element creation to one
   document; surface views describe markup with that renderer.
2. **Adapters** inspect and mutate host-owned DOM. They normalize CCXP tables, move original form
   controls and language links, preserve host handlers, and resolve legacy navigation targets.
3. **Controllers** own stateful behavior and cleanup. `shared/ui/controller.ts` groups listeners
   and other cleanup behind one `destroy()` call; sidebar rerenders and dialogs use it directly.

Renderers never query the host page. Adapters never hide host discovery inside generic element
helpers. Controllers coordinate those layers and are the only place that should own document or
window listener lifetimes.

## Where patterns live

| Pattern                                                              | Module                                                   |
| -------------------------------------------------------------------- | -------------------------------------------------------- |
| Document-bound elements, fragments, attributes, data, and CSS values | `shared/ui/renderer.ts`                                  |
| Listener and resource lifecycle                                      | `shared/ui/controller.ts`                                |
| Buttons, icon-button construction, dialog button variants            | `shared/ui/buttons.ts`                                   |
| Status switch presentation                                           | `shared/ui/switch.ts`                                    |
| Existing language links and their container                          | `shared/ui/language.ts`                                  |
| Help popover interaction                                             | `shared/ui/popover.ts`                                   |
| Icons and their existing visual variants                             | `shared/ui/icons.ts`                                     |
| Search field, labels, headings, breadcrumbs, empty states, skeletons | `shared/ui/display.ts`                                   |
| Initial loading curtain                                              | `shared/ui/loading.ts`                                   |
| Legacy inline-style adaptation and theme preparation                 | `shared/ui/legacy-style.ts`                              |
| Brand lockups and partner link                                       | `shared/brand.ts`                                        |
| Form fields, labels, account/password accessories                    | `login/ui/fields.ts`                                     |
| Host login-form recognition and node migration                       | `login/ui/form-adapter.ts`                               |
| Extension-owned login field markup                                   | `login/ui/field-view.ts`                                 |
| Password visibility and legacy eye-icon cleanup                      | `login/ui/password.ts`                                   |
| Submit actions, captcha audio, legacy image-button adaptation        | `login/ui/actions.ts`                                    |
| Support links and header utilities                                   | `login/ui/links.ts`                                      |
| Announcement entries and headings                                    | `login/ui/notices.ts`                                    |
| Extension-owned announcement markup                                  | `login/ui/notice-view.ts`                                |
| Account-guide content and examples                                   | `login/ui/tabs.ts`                                       |
| Tree/disclosure rows, navigation cards, category blocks              | `menu/ui/navigation.ts`                                  |
| Classic navigation view-model adaptation                             | `menu/ui/navigation-adapter.ts`                          |
| Link and block favorite controls                                     | `menu/ui/favorites.ts`                                   |
| Confirmation dialog, floating mounts, sidebar-mode changes           | `menu/ui/overlays.ts`                                    |
| Confirmation dialog markup and lifecycle                             | `menu/ui/dialog-view.ts`, `menu/ui/dialog-controller.ts` |
| Destination loading/error/retry/open/back behavior                   | `menu/ui/destination.ts`                                 |
| Sidebar view composition and rerender lifecycle                      | `menu/ui/views.ts`, `menu/ui/controller.ts`              |

`login/ui/login.ts`, `login/ui/support.ts`, and `menu/ui/controller.ts` retain the existing public
surface interfaces. Interface types for the extracted modules are in `shared/ui/types.d.ts`.

## Reusing a control

```ts
const dom = createRenderer(targetDocument);
const save = dom.element("button", { className: existingButtonClass }, [
  dom.element("span", { className: labelClass, text: strings.save }),
]);
```

Use `createButton()` when button defaults or an existing button variant are required. Use the
renderer for compound markup so its structure is visible as one tree instead of a sequence of
`createElement()`, assignment, and `append()` statements.

Use the appropriate existing CSS variant. The extraction deliberately retains the original
class names, selectors, stylesheet order, inline styles, and event semantics. Existing skins
remain in `login/components/`, `menu/components/`, and `menu/variants/`; brand skins remain in
those surfaces' `primitives/` directories. Changing a visual variant is a separate change from
moving its implementation.

`prepareLegacySurface()` installs the correct scoped stylesheet, runs the existing legacy
attribute cleanup, and downgrades inline `!important` only for visual properties owned by the
skin. It retains the declaration value and style attribute, allowing selectors that recognize
legacy colors to keep working. Structural declarations such as `display`, `position`,
`visibility`, and overflow retain their priority because they can carry page behavior.

The status switch owns presentation; the sidebar controller owns persistence, navigation reset,
frameset changes, mounting, and per-render cleanup. Both favorite adapters share one
pressed-button renderer while keeping their different link/block storage rules. Pinned and detail
links share one card renderer.

Stateful renderers return or internally use a mounted controller. Document and window listeners,
animation frames, observers, and other resources must be attached through that controller so a
rerender or frame teardown can release them together.

For host-owned controls, preserve node identity whenever the existing implementation does.
Language links and form fields are moved rather than cloned. Submit/image and utility-link
adapters retain the existing attribute-copying rules and exceptions. Do not introduce a broad
DOM replacement pass or change event propagation while extending a shared control.

The content-script order in `manifest.base.json` is part of the module contract. Add shared
modules before their consumers, and keep the module lists in `test/helpers/module-loader.ts`
in sync. OAuth's smaller content-script list does not use these UI modules.

## Regression checks

- `test/ui/patterns.test.ts` contains markup snapshots recorded before extraction, including
  login variants, announcements, password states, and classic/layered sidebar states.
- `test/ui/interactions.test.ts` covers keyboard/hover popovers, language/host behavior,
  switching, disclosure, search, favorites, confirmation, cross-document mounting, and
  destination loading/retry/back behavior.
- `test/login/main-bootstrap.test.ts` verifies that the login path still starts independently
  of sidebar registration, including a form parsed after bootstrap begins.

Run `bun run check` and `bun run build` after changes to these TypeScript content scripts.
