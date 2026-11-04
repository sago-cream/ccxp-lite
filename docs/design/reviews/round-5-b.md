# Round 5 — independent reviewer B

Date: 2026-11-04. Read-only review against `docs/design/guidelines.md` and the same six-component, seven-category rubric used in my earlier reviews. No product edits, browser use, delegated review, or other reviewer reports.

## Evidence inspected

I opened and visually inspected these 23 PNGs with `tools.view_image`:

- All 15 under `round-5-ready/head/`: `login.png`, `login-wide.png`, `login-narrow.png`, `sidebar-classic.png`, `sidebar-menu-narrow.png`, `profile-expanded.png`, `profile-expanded-narrow.png`, `dialog-remove-favorite.png`, `dialog-remove-favorite-narrow.png`, `home-favorites.png`, `home-favorites-narrow.png`, `home-search.png`, `home-search-narrow.png`, `home-search-end-narrow.png`, `home-search-empty-narrow.png`.
- Eight English-control counterparts under `round-5-ready-english/head/`: desktop and narrow versions of `profile-expanded`, `dialog-remove-favorite`, `home-favorites`, and `home-search`.

The English counterparts demonstrate extension-control layout with the supplied Chinese/mixed-language host content. They do **not** certify the English host login or an entirely English host dataset. I did not inspect the English login screenshots or treat them as certified English evidence.

Supplied verification, not independently reproduced here: primary/danger contrast at least 4.5:1; focus/input contrast at least 3:1; modal focus trapping and inert shell; profile state; keyboard search and end cue; Menu entry focusing expanded navigation search; favorites disclosure keyboard reachability; menu expansion and return. The stills visibly support full-shell dimming, strong focus styling, explicit preference values, responsive wrapping, menu identity/return, and search selection/empty states. They do not prove the behavioral checks.

Screen-reader output, actual touch target boundaries, zoom, larger text settings, reduced motion, login errors/help, expanded announcements, and complete English host layouts remain **unverified by this review**. All six current Chinese search results fit the revised narrow panel; the file named `home-search-end-narrow.png` visibly shows the final result emphasized, but does not independently demonstrate an overflowing list in this revision. Overflow behavior remains supplied verification.

## Scores

Scale unchanged: 5 = usable with substantial weaknesses; 7 = competent with clear unresolved issues; 8 = polished with limited weaknesses; 9 = exceptionally resolved; 10 = no material improvement supported by the evidence. Each component overall is the unweighted mean of its seven columns; the suite uses the unrounded means. Decimal precision records this rubric, not a scientific measurement.

| Component                 | Color / contrast | Typography | Spacing / alignment | Hierarchy | Affordance / state clarity | Consistency | Accessibility / responsive evidence | Overall visual score |
| ------------------------- | ---------------: | ---------: | ------------------: | --------: | -------------------------: | ----------: | ----------------------------------: | -------------------: |
| Login                     |              8.5 |        8.5 |                 8.5 |       9.0 |                        8.5 |         9.0 |                                 8.0 |        **8.57 / 10** |
| Sidebar                   |              8.5 |        8.5 |                 8.5 |       8.5 |                        9.0 |         8.0 |                                 8.5 |        **8.50 / 10** |
| Expanded profile          |              8.5 |        8.5 |                 8.5 |       8.5 |                        9.0 |         8.5 |                                 9.0 |        **8.64 / 10** |
| Shared dialog             |              9.0 |        9.0 |                 9.0 |       9.0 |                        8.5 |         8.5 |                                 9.0 |        **8.86 / 10** |
| Homepage favorite cards   |              8.5 |        8.5 |                 8.0 |       8.0 |                        8.5 |         8.5 |                                 8.5 |        **8.36 / 10** |
| Homepage search / results |              8.5 |        8.5 |                 8.5 |       9.0 |                        9.0 |         8.5 |                                 8.5 |        **8.71 / 10** |

**Overall suite: 8.61 / 10.** The captured suite is polished and coherent. The principal navigation and search-state issues are resolved visibly. No P1 issue is evident in these captures. Remaining deductions are concentrated in narrow English density, a less specific English destructive action, and smaller consistency/affordance refinements.

## Findings by component

### 1. Login — healthy, clear composition

Screens: standard (`login.png`), wide (`login-wide.png`), narrow (`login-narrow.png`).

The form and announcement panel remain a well-proportioned desktop pair. The labels now read naturally as 帳號/密碼 rather than artificially spaced characters, and label rows have a consistent rhythm. The announcement preview ends after two complete notices, with a separate, clear disclosure row. This is substantially cleaner than a fade through a partially readable notice. Primary/secondary action hierarchy and narrow form wrapping remain good.

Remaining deductions: the narrow utility header still occupies roughly 145px before the form section, although its two-column arrangement is orderly. Help and CAPTCHA controls remain icon-led, and their names/hit areas are unverified. The narrow image does not show the announcement disclosure below the visible fold; expanded announcements and validation/error layouts are not shown. These are evidence limits rather than asserted defects. I see no material visual blocker in the supplied login states.

### 2. Sidebar/navigation — prior menu concern resolved

Screens: desktop (`sidebar-classic.png`), narrow menu (`sidebar-menu-narrow.png`), and populated trees in the desktop profile/favorites captures.

“選單” plus “返回側邊欄 ←” clearly names the narrow mode and provides an obvious route back. Four pinned items and a disclosure expose 所有功能 and several category cards within the first screen. The relationship between favorites and the general function catalog is now understandable. Wrapped bilingual sidebar labels remain readable. The supplied expansion/return checks complement these visible improvements.

Remaining deductions:

- The narrow homepage still reserves about 64px for the icon rail, leaving about 263px of card/search width. This produces longer bilingual wrapping and a tall stack. It is a defensible navigation tradeoff, not a broken layout, but deserves a real-task comparison with a slimmer rail or Menu-only entry before being considered fully resolved.
- English naming varies between “Favorite” in the sidebar, “Favorites” on the homepage, and “Pinned” in menu mode. The screenshots show the same saved destinations in these surfaces. Use one term unless pinned and favorite are intentionally different concepts; the current distinction is not explained visibly.
- Deep expanded bilingual trees still consume substantial vertical space. The end of the full tree and larger text behavior are not shown. Do not mistake one successful narrow menu screen for complete tree coverage.

### 3. Expanded profile — clear states in both control languages

Screens: Chinese desktop (`profile-expanded.png`), Chinese narrow (`profile-expanded-narrow.png`), English desktop (`profile-expanded.png`), English narrow (`profile-expanded-narrow.png`).

Both languages fit cleanly without truncated preference labels or displaced actions. Navigation has an explicit current value; the timer has both an Off/關閉 label and a switch; reset is a command. Support grouping, dividers, external-link marks, and logout are clear. The narrow popover contains all its rows and remains visibly anchored to the identity control.

Remaining deduction: the outlined Sidebar/Menu value looks like a small button nested in a row with a separate chevron. This leaves a slight visual ambiguity about whether the value or whole row is actionable. A quieter value treatment would clarify a single row action. Actual hit boundaries remain unverified. The switch is compact, but adjacent state text prevents reliance on its tiny thumb alone.

### 4. Shared dialog — excellent layout; English action can be clearer

Screens: Chinese desktop (`dialog-remove-favorite.png`), Chinese narrow (`dialog-remove-favorite-narrow.png`), English desktop (`dialog-remove-favorite.png`), English narrow (`dialog-remove-favorite-narrow.png`).

Whole-shell dimming, a specific title, readable consequence copy, visible safe-action focus, and a differentiated danger button form a strong modal hierarchy. English body copy wraps comfortably at narrow width without disrupting button placement. The Chinese action “確認移除” is explicit and the consequence copy explains recoverability.

The English danger button says only **“Confirm”**. It is understandable after reading the title, but less specific than the Chinese equivalent and less useful when scanning the action row. Change it to **“Remove”** or **“Remove favorite”** while keeping **“Keep it”** as the safe choice. This is the material affordance/consistency deduction in an otherwise exceptionally resolved component. The broader English evidence is included in this score; the Chinese version itself remains stronger.

### 5. Favorite cards — healthy content layout; narrow English shell uses space inefficiently

Screens: Chinese desktop (`home-favorites.png`), Chinese narrow (`home-favorites-narrow.png`), English desktop (`home-favorites.png`), English narrow (`home-favorites-narrow.png`).

Labels and category context fit, bilingual titles wrap fully, saved stars remain separate, and the eform external-link cue is consistent with the sidebar. English category labels such as “Planning & Enrollment” and “Graduation & Defense” fit without clipping. Desktop grid rhythm remains strong.

Remaining deductions:

- In the English narrow shell, “Contact campus offices” and “System usage guide” occupy widely separated rows. The logo/search/cards move about 64px lower than in the Chinese narrow shell: the first card begins around y342 rather than y278. Make the English utility group a compact two-row unit with a smaller row gap, or shorten labels thoughtfully. The current version gives secondary utilities disproportionate space.
- Repeating the same category under adjacent graduation cards adds vertical bulk, especially with two-line bilingual titles. Context is useful, but could be grouped or omitted where it does not distinguish destinations. This is optional density refinement, not a reason to remove context broadly.
- The persistent rail width contributes to wrapping. Cards remain readable; the deduction is for efficiency and hierarchy rather than clipping or overlap.

### 6. Search/results — clear, calm active mode

Screens: Chinese desktop (`home-search.png`), Chinese narrow (`home-search-narrow.png`), last result (`home-search-end-narrow.png`), empty (`home-search-empty-narrow.png`), English desktop (`home-search.png`), English narrow (`home-search-narrow.png`).

Shared category context in the count row eliminates the repetitive secondary lines. Matching text and selected-result focus are clear. The long CJK result now fits without leaving a lone trailing character. Hiding the cards while search is active removes the competing partial-card layer and makes the panel read as a deliberate search mode. Empty copy is readable and useful. All six results fit the current Chinese narrow panel, reducing the need to scroll for this query.

Remaining deductions:

- The English narrow count/category line wraps “Teaching Feedback” onto a second line. It is understandable, but the metadata has a less tidy shape than the Chinese one-line version. Treat count and category as deliberate units, with a predictable stacked layout when needed.
- The same tall English utility header lowers the active search panel. This is a shell-density issue shared with favorites, not a search failure.
- Mixed-category context, a genuinely overflowing revised list, long English-only result labels, and English empty-state copy are not within the eight English counterparts inspected here. Their behavior/layout remains outside this visual evidence. Supplied keyboard checks are retained as supplied evidence only.

## Prioritized feedback

1. **P2 — Compact the English narrow utility header.** The two widely separated links add roughly 64px before the core homepage/search task. Preserve readable link targets while reducing the vertical gap.
2. **P2 — Make the English removal action explicit.** Replace “Confirm” with “Remove” or “Remove favorite” to match the Chinese action clarity.
3. **P3 — Standardize saved-item terminology.** Choose a consistent term across Favorite/Favorites/Pinned unless there is a real, visible distinction.
4. **P3 — Refine narrow metadata and optional density.** Stack the English result count/category intentionally; reconsider repeated category text on neighboring cards only where it contributes little distinction.
5. **P3 — Evaluate the rail width using real navigation tasks.** The current design works, but its width cost is visible. This is a considered follow-up, not a necessary shell redesign before accepting the current captures.

English host login certification, screen-reader behavior, zoom/larger-text coverage, and the unshown interaction states remain verification gaps. No visual score here constitutes full accessibility certification.

## Arithmetic correction — recorded during round 6

The round-five search category row sums to **60.5**, giving **8.64 / 10**, rather than the originally reported **8.71 / 10**. The corrected suite mean is **8.60 / 10**, rather than the originally reported **8.61 / 10**. Category scores and qualitative findings are unchanged. The original table values above are retained for traceability; this correction supersedes those two aggregate numbers.
