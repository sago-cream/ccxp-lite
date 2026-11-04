# Independent design review B — round 3

**Overall: 8.7/10.** This is a polished, coherent modernization of a dense institutional portal. The purple accent, cool neutral surfaces, restrained borders, and clear input/action styling work well together. It feels credible for a university system. The strongest surfaces are the removal dialog and profile menu. The remaining opportunities concern narrow-screen information density, navigation discoverability, and a little extra whitespace efficiency rather than obvious visual defects.

I independently opened all 15 supplied PNGs with `view_image`. This is a screenshot-based visual review of the packaged extension captures, not a new live interaction audit. The brief identifies these as sanitized, live-derived fixtures retaining host DOM, assets, styles, frames, and embedding modes, with synthetic identity/favorites. I did not independently establish that provenance or test the live site.

## Component scores

| Component                                    |      Score | Assessment                                                                                                                                                                                                             |
| -------------------------------------------- | ---------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login: desktop, wide, narrow                 | **8.8/10** | Clear, calm form with readable labels and strong primary action; mobile order is sensible.                                                                                                                             |
| Navigation: classic sidebar and narrow menu  | **8.4/10** | Desktop hierarchy is unusually readable for the amount of institutional navigation. Narrow icon-only navigation needs familiarity, and the alternate narrow menu is spacious enough to require considerable scrolling. |
| Expanded profile menu: desktop and narrow    | **9.0/10** | Well-grouped settings and support links, clear current values, consistent icons, and good separation of logout.                                                                                                        |
| Remove-favorite dialog: desktop and narrow   | **9.2/10** | Explicit object name, concise reversibility explanation, obvious safe default, and clear destructive action. Both widths are composed well.                                                                            |
| Homepage favorites: desktop and narrow       | **8.6/10** | Clear title/category distinction, understandable stars, orderly grid. Mobile loses substantial width to the rail and becomes a tall list.                                                                              |
| Homepage search: desktop, narrow, end, empty | **8.5/10** | Strong selected-result treatment, query/count hierarchy, match emphasis, useful empty-state text, and a visible narrow scroll cue. The narrow list is visually dense and has a conspicuous nested scroll boundary.     |

Scores measure the supplied states and their visual usability, not the completeness of the entire portal.

## Category scores

| Category                              |      Score | Evidence and qualification                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------- | ---------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color and contrast                    | **9.0/10** | Dark text reads cleanly; purple identifies actions and favorites without saturating the entire screen; muted red distinguishes confirmation. Contrast measurements in the brief support primary/danger text at ≥4.5:1 and input/focus at ≥3:1. I did not remeasure every secondary label, border, or icon.                                                        |
| Typography                            | **8.6/10** | Text is legible, headings restrained, and bilingual names preserved. Narrow English titles wrap unevenly, increasing scan time. This is a layout opportunity, not a reason to remove legitimate host-language content.                                                                                                                                            |
| Spacing                               | **8.7/10** | Inputs, menus, dialogs, and desktop cards are well aligned. Narrow favorites and menu rows trade considerable vertical space for comfortable targets; the branding region also consumes useful mobile height.                                                                                                                                                     |
| Hierarchy                             | **8.8/10** | Primary actions, card titles, category metadata, and menu groupings are clear. The desktop search panel almost meets the “recently used” heading, slightly weakening the separation between overlay and underlying page.                                                                                                                                          |
| Consistency                           | **9.0/10** | Repeated purple icons, stars, neutral borders, corner treatment, and secondary text produce a convincing shared system. Desktop sidebar, popup, form, and modal still retain appropriate differences for their jobs.                                                                                                                                              |
| Affordances                           | **8.4/10** | Clear field borders, selected search result, dialog actions, chevrons, and toggle state. Collapsed navigation glyphs and small star glyphs are less self-explanatory without labels or prior knowledge. Actual hit areas cannot be determined from the images.                                                                                                    |
| Responsive behavior and accessibility | **8.4/10** | No visible horizontal overflow or broken dialog/menu placement. Long bilingual labels wrap instead of disappearing. The 375 px home layout devotes about 64 px to the rail, leaving a relatively narrow content column. Supplied keyboard/focus checks are positive; screenshots alone cannot establish screen-reader behavior, zoom support, or full compliance. |

## Reviewed steps and evidence

### 1. Sign in — healthy

The desktop and wide layouts use a compact form beside a distinct announcement card. The wide layout does not stretch the inputs excessively. Account, password, CAPTCHA, login, alternate destinations, and recovery are visually ordered. On narrow screens the form becomes full width and announcements follow the primary task. The audio and refresh controls are visibly separate from the CAPTCHA image.

The CAPTCHA remains visually noisy by its nature, but it is an authentic host task rather than an extension styling fault. Recovery is readable. The empty lower desktop space is acceptable for a login task and does not require filling with decoration.

Login desktop (`login.png`)
Login wide (`login-wide.png`)
Login narrow (`login-narrow.png`)

### 2. Navigate — healthy, with a mobile discoverability tradeoff

The classic sidebar has an easy-to-find search field, clear category labels, consistent line icons, a visible open-category branch, and an anchored account control. In the empty-favorites state, the explanatory copy is correctly placed within the expanded favorites branch.

The narrow menu capture uses large bordered favorite rows and preserves long bilingual titles. That supports selection but means only a limited portion of a long list is visible. In the separate narrow homepage captures, the rail is composed of unlabeled glyphs. Categories such as forms, campus systems, and miscellaneous items cannot all be inferred confidently from the icon alone. Hover labels, accessible names, or interaction with these glyphs were not inspected.

Classic sidebar (`sidebar-classic.png`)
Narrow menu (`sidebar-menu-narrow.png`)

### 3. Open profile settings — healthy

The popup groups preferences separately from support. Current navigation mode is visible as a small outlined value, the countdown has both text and switch, and logout has its own divided row. The desktop popover sits naturally above its trigger; the narrow version fits the viewport and keeps all options visible. The shadow is modest and sufficient to lift the menu above cards.

The navigation-mode value plus trailing chevron is readable, although its compactness gives it slightly less prominence than the other controls. No correction is required from this evidence.

Profile desktop (`profile-expanded.png`)
Profile narrow (`profile-expanded-narrow.png`)

### 4. Confirm removing a favorite — excellent

The heading names the affected feature. The body explains that removal is from favorites and can be reversed by adding it again. “保留” and “確認移除” are distinct and aligned predictably. A prominent purple outline is visible on the safe action. The backdrop dims the whole framed application consistently, and the mobile dialog uses sensible side margins without compressing the actions.

The brief reports a native modal that traps focus and inerts the frameset. I accept that as supplied verification; the screenshots themselves show only the visible default focus treatment and backdrop.

Removal dialog desktop (`dialog-remove-favorite.png`)
Removal dialog narrow (`dialog-remove-favorite-narrow.png`)

### 5. Browse homepage favorites — healthy

The desktop two-column grid is orderly. Card icons, titles, categories, and stars are easy to parse. A single longer recently-used card grows naturally rather than truncating its bilingual title. The “show all” link is visible at the end of the favorites group.

At 375 px the rail, content gutters, card icon, and star leave a comparatively small title area. Several labels wrap to two lines, making the page substantially taller. The typography remains readable and nothing visibly overflows. This is the clearest remaining responsive design opportunity.

Favorites desktop (`home-favorites.png`)
Favorites narrow (`home-favorites-narrow.png`)

### 6. Search, scroll to the end, and recover from no results — healthy

The query stays prominent, result count precedes the list, matching text is bold, and the selected row has both a tinted fill and strong outline. The narrow initial state explicitly says to scroll for more results. At the end, that cue is gone and the final result is visibly selected. The zero-results state keeps the query and clear control available and explains how to recover.

The desktop result panel has little breathing room before the underlying “最近使用” heading. In the narrow end state, a partially clipped earlier row is visible directly under the count, consistent with a scrolled inner list. The pinned header still communicates location, but a subtle divider at the header/list boundary could make that layering cleaner. The screenshots do not prove whether the list scrolls smoothly, announces active descendants, or works with a mobile software keyboard.

Search desktop (`home-search.png`)
Search narrow (`home-search-narrow.png`)
Search end narrow (`home-search-end-narrow.png`)
Search empty narrow (`home-search-empty-narrow.png`)

## Remaining improvements, prioritized

**P2 — Give narrow homepage content more room.** In `home-favorites-narrow.png` and the narrow search states, the persistent rail consumes roughly one sixth of the viewport before content gutters. Test a more compact mobile header/rail treatment or a clearly labeled menu entry that opens the full navigation. Keep the present readable font size and preserve full bilingual names. A reduced mobile branding/top gap is a smaller, lower-risk option for showing the first task sooner. This is a usability refinement, not a demonstrated failure of the existing navigation.

**P2 — Make compact navigation easier to learn.** Several rail glyphs are semantically broad or visually similar. Ensure names are available on keyboard focus and through assistive technology; those properties are unverified here. For touch, consider an explicit path to a labeled menu or a temporary expanded-label presentation. Do not solve this by adding permanent tiny captions under every glyph.

**P2 — Tighten mobile favorite-list rhythm selectively.** The narrow menu rows have substantial internal vertical space, while the home list grows as bilingual names wrap. Review whether padding can decrease slightly while preserving comfortable touch targets. Retain flexible row heights and complete names. Avoid shrinking body text to fit more rows.

**P3 — Clarify the search list boundary.** Add a restrained separator or additional inset below the fixed query/count block so partially scrolled content looks intentionally clipped. Give the desktop panel a little more visual separation from the underlying “recently used” heading. Keep the existing scroll cue and selected-row outline.

**P3 — Clarify icon-only action targets during focus/hover.** Favorite stars and login helper/CAPTCHA glyphs are visually small even when their containers may be adequate. Check that pointer/focus feedback makes the whole target apparent and that accessible names describe the action and current state. The images do not justify claiming their hit targets or names are missing.

No P0 or P1 visual blocker is established by these screenshots. I would not add decorative surfaces or increase the number of explanatory labels merely to chase a higher score.

## Verification boundaries

The brief reports passing checks for primary/danger contrast, input/focus contrast, native modal focus/inert behavior, real profile switch states, search Arrow/Enter/Escape handling and scroll cues, and sidebar expansion from 4 to 10 favorites with keyboard focus moved to revealed items. Those reduce the uncertainty behind the visible affordances. I did not rerun them, and they do not automatically cover every accessibility requirement.

Not independently verified: keyboard traversal outside those supplied checks, accessible names/roles/live announcements, browser zoom and text enlargement, touch hit boxes, software-keyboard behavior, intermediate viewport sizes, motion preferences, loading/error states beyond the shown empty search, all real-world long names, or live-site role/period/widget coverage. There is no basis here to claim full accessibility compliance or complete portal coverage.
