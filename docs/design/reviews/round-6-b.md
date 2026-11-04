# Round 6 — independent reviewer B

Date: 2026-11-04. Read-only review against `docs/design/guidelines.md`, using the same six-component/seven-category rubric as before. No product edits, browser use, delegation, or other reviewer reports. The score arithmetic below was computed directly from the category rows.

## Evidence and verification limits

I opened and visually inspected all 24 requested PNGs using `tools.view_image`:

- All 15 in `round-6/head/`: `login.png`, `login-wide.png`, `login-narrow.png`, `sidebar-classic.png`, `sidebar-menu-narrow.png`, `profile-expanded.png`, `profile-expanded-narrow.png`, `dialog-remove-favorite.png`, `dialog-remove-favorite-narrow.png`, `home-favorites.png`, `home-favorites-narrow.png`, `home-search.png`, `home-search-narrow.png`, `home-search-end-narrow.png`, `home-search-empty-narrow.png`.
- Nine English-control captures in `round-6-english/head/`: desktop and narrow profile, dialog, favorites, and search, plus `sidebar-menu-narrow.png`.

The English controls are shown with the supplied Chinese/mixed-language host content. This is not full-English-host certification. I did not use the English login captures as evidence. The extra current survey entitlement remains an explicit fixture coverage gap; the search example is not proof of that unavailable live state.

Supplied checks retained: primary/danger contrast at least 4.5:1; focus/input contrast at least 3:1; modal focus containment and inert shell; preference state; keyboard search/end cue; menu entry/search focus; favorites expansion reachability and return. Additional supplied native-live verification covers whole-shell modal dimming, Tab containment, and Escape focus restoration without deletion. These strengthen the evidence, but I did not reproduce them. The screenshot observations below are separate from those supplied behavior results.

Screen-reader output, actual touch hit areas, zoom/larger text, reduced motion, login help/error states, expanded announcements, and additional host-language/role/entitlement states remain unverified by this review. The six current results fit the narrow search panel; its last-result capture does not independently prove overflow behavior for longer lists.

## Scores

Scale unchanged: 5 = usable with substantial weaknesses; 7 = competent with clear unresolved issues; 8 = polished with limited weaknesses; 9 = exceptionally resolved; 10 = no material improvement supported by the evidence. Component scores are unweighted means of seven categories; the suite is the mean of the unrounded component scores. Precision records the rubric rather than a scientific measurement.

| Component                 | Color / contrast | Typography | Spacing / alignment | Hierarchy | Affordance / state clarity | Consistency | Accessibility / responsive evidence | Overall visual score |
| ------------------------- | ---------------: | ---------: | ------------------: | --------: | -------------------------: | ----------: | ----------------------------------: | -------------------: |
| Login                     |              8.5 |        8.5 |                 8.5 |       9.0 |                        8.5 |         9.0 |                                 8.0 |        **8.57 / 10** |
| Sidebar                   |              8.5 |        8.5 |                 8.5 |       8.5 |                        9.0 |         9.0 |                                 8.5 |        **8.64 / 10** |
| Expanded profile          |              8.5 |        8.5 |                 8.5 |       9.0 |                        9.0 |         9.0 |                                 9.0 |        **8.79 / 10** |
| Shared dialog             |              9.0 |        9.0 |                 9.0 |       9.0 |                        9.0 |         9.0 |                                 9.0 |        **9.00 / 10** |
| Homepage favorite cards   |              8.5 |        8.5 |                 8.5 |       8.5 |                        8.5 |         9.0 |                                 8.5 |        **8.57 / 10** |
| Homepage search / results |              8.5 |        8.5 |                 8.5 |       9.0 |                        9.0 |         9.0 |                                 8.5 |        **8.71 / 10** |

**Overall suite: 8.71 / 10.** The captured states are polished and coherent. I would accept their current visual presentation. No P1 or P2 visual issue is evident. Remaining changes would be optional density and fine-presentation refinements, rather than necessary fixes before accepting these states.

## Component assessment

### 1. Login — healthy; unchanged score

Evidence: standard (`login.png`), wide (`login-wide.png`), narrow (`login-narrow.png`).

The bounded form/announcement pair, visible labels, strong input outlines, clear primary button, and complete two-notice preview remain well resolved. Desktop columns stay together as the viewport widens. Secondary actions are compact and orderly. Narrow form content fits without horizontal clipping.

The remaining visible tradeoff is the roughly 145px narrow utility header before the login section. It is orderly and usable, but comparatively generous for secondary information. Help, audio, refresh, and password visibility are icon-led; their actual names and targets cannot be assessed from stills. Announcement expansion and error/help states are not shown. I see no new material visual defect and no reason to alter the previous score merely because another round occurred.

### 2. Sidebar/navigation — clear and consistent

Evidence: desktop (`sidebar-classic.png`), Chinese menu (`sidebar-menu-narrow.png`), English menu (`sidebar-menu-narrow.png`).

Menu/選單 headings and the explicit Back to sidebar/返回側邊欄 action make the mode and exit obvious. The four-item preview/disclosure exposes general categories early. Favorites naming is now consistent across the English sidebar, menu, and homepage, with 常用功能 used consistently in Chinese. Nested bilingual labels wrap and retain distinguishing text. Categories, stars, chevrons, and guide lines share a stable visual grammar.

Remaining deduction: the persistent narrow icon rail still uses about 64px and leaves about 263px for main cards/search. This causes more bilingual wrapping and keeps many unlabeled icons visible. The Menu entry makes the arrangement usable; a slimmer rail is an optional efficiency study, not a required replacement. Expanded trees also become tall, which is an inherent density tradeoff in this design. No truncation defect is apparent in the shown labels.

### 3. Expanded profile — clean single-action rows

Evidence: Chinese desktop (`profile-expanded.png`), Chinese narrow (`profile-expanded-narrow.png`), English desktop (`profile-expanded.png`), English narrow (`profile-expanded-narrow.png`).

Plain text for the navigation mode removes the previous nested-button impression. The row now reads naturally as a label, current value, and chevron. Timer state remains explicit in text and switch form. Reset, support links, and logout have distinct roles, and both languages fit comfortably in the narrow popover. Trigger chevrons and external-link cues remain clear.

I see no material visible issue. The compact switch and small line icons keep the menu light, though they are less generous visually than the larger main-page controls. Their actual target areas are unverified. Larger text and unusually long translated labels are outside the supplied captures; this is a coverage limit, not a claimed defect.

### 4. Shared dialog — exceptionally resolved in the shown states

Evidence: Chinese desktop (`dialog-remove-favorite.png`), Chinese narrow (`dialog-remove-favorite-narrow.png`), English desktop (`dialog-remove-favorite.png`), English narrow (`dialog-remove-favorite-narrow.png`).

The English action now says Remove, matching the specificity of 確認移除. Title, consequence text, safe action, danger action, focus ring, and shell-wide dimming establish an unambiguous decision. Narrow English body copy wraps comfortably and both buttons retain their spacing. The consequence copy explains recoverability. Supplied native-live focus/Escape evidence addresses the main interaction uncertainty from the original review.

No further visible change is necessary. This score is for the shown dialog and supplied checks, not a blanket certification of every title length, browser text setting, or assistive-technology behavior.

### 5. Homepage favorites — readable and more efficient in both languages

Evidence: Chinese desktop (`home-favorites.png`), Chinese narrow (`home-favorites-narrow.png`), English desktop (`home-favorites.png`), English narrow (`home-favorites-narrow.png`).

Campus contacts and Usage guide fit on one compact narrow utility row. The former large English-only vertical penalty is gone. Search functions fits fully in the input. Chinese and English-control narrow pages now share a comparable content position. Cards retain full bilingual wrapping, clear category context, separate star actions, and the external eform cue.

Remaining visible deductions concern density: several neighboring graduation cards repeat the same category, and the rail width makes bilingual cards taller. The current result is readable and consistent, so I would not force another revision for this. If future usage shows the stack is burdensome, group or omit context only where it adds little distinction; preserve it for ambiguous titles.

### 6. Search/results — clear active mode and stable metadata

Evidence: Chinese desktop (`home-search.png`), Chinese narrow (`home-search-narrow.png`), last result (`home-search-end-narrow.png`), empty (`home-search-empty-narrow.png`), English desktop (`home-search.png`), English narrow (`home-search-narrow.png`).

The compact header raises the search task. Count/category metadata now keeps Teaching Feedback intact on its own line when necessary. Query, clear action, match emphasis, selected-result outline, and empty guidance are readable. The long CJK result avoids a trailing single-character line. Shared category context and hiding the cards keep the active panel calm.

The only fine-presentation issue I would note is the English narrow metadata’s leading separator on its second line: “· Teaching Feedback”. It remains intelligible, but could omit the separator in the stacked arrangement for a cleaner shape. This is minor polish, not a material affordance issue. Longer genuinely overflowing lists and mixed-category results remain outside the screenshot observations; retained supplied tests cover some behavior, not visual completeness of every dataset.

## Prioritized follow-up

1. **P3, optional — Evaluate density through real tasks.** The narrow rail and repeated card categories are the principal remaining visual tradeoffs. Compare navigation/task speed before changing a working shell or removing useful context.
2. **P3, optional — Tidy stacked search metadata.** Remove the leading separator when the category wraps to its own line. The current arrangement is already understandable.
3. **Evidence follow-up — Preserve the explicit gaps.** Extra survey entitlement, full-English-host states, screen-reader output, zoom/larger text, and unshown error/help/announcement states should remain unverified until directly covered. These are not reasons to invent defects or continue cosmetic iteration on the accepted captures.
