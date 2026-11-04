# Round 4 — independent reviewer B

Date: 2026-11-04. Read-only visual review of the six requested ccxpLite components against `docs/design/guidelines.md`, using the same seven-category rubric as my first review. I did not edit product files, open a browser, delegate the review, or read another reviewer’s report.

## Evidence and scope

I opened and visually inspected all 15 PNGs using `tools.view_image`, under `round-4-final/head/`:

1. Login: `login.png`, `login-wide.png`, `login-narrow.png`.
2. Sidebar/navigation: `sidebar-classic.png`, `sidebar-menu-narrow.png`.
3. Profile: `profile-expanded.png`, `profile-expanded-narrow.png`.
4. Dialog: `dialog-remove-favorite.png`, `dialog-remove-favorite-narrow.png`.
5. Favorite cards: `home-favorites.png`, `home-favorites-narrow.png`.
6. Search: `home-search.png`, `home-search-narrow.png`, `home-search-end-narrow.png`, `home-search-empty-narrow.png`.

The supplied verification reports primary/danger text contrast of at least 4.5:1, focus/input contrast of at least 3:1, dialog focus trapping and an inert shell, profile state handling, keyboard search with the end cue, Menu entry focusing expanded navigation search, and keyboard reachability after sidebar favorites expand from four to ten. I accept those as **supplied verification**, not tests I performed. The screenshots visibly support stronger contrast/focus treatments, explicit preference state, whole-shell dimming, responsive wrapping, and distinct search overflow/empty states. They cannot prove the reported behavior.

Screen-reader output, focus restoration, Escape behavior, actual touch target boundaries, zoom/reflow, live announcements, motion preferences, login errors/help, announcement expansion, and complete English-localized layouts remain **unverified by this review**. Narrow captures substantially improve responsive evidence; they do not establish every viewport/state combination.

## Scores

Scale unchanged: 5 = usable with substantial weaknesses; 7 = competent with clear unresolved issues; 8 = polished with limited weaknesses; 9 = exceptionally resolved; 10 = no material improvement supported by the evidence. Overall component scores are unweighted means of seven columns; the suite is the mean of unrounded component means. Precision records the rubric, not a scientific measurement.

| Component                 | Color / contrast | Typography | Spacing / alignment | Hierarchy | Affordance / state clarity | Consistency | Accessibility / responsive evidence | Overall visual score |
| ------------------------- | ---------------: | ---------: | ------------------: | --------: | -------------------------: | ----------: | ----------------------------------: | -------------------: |
| Login                     |              8.5 |        8.5 |                 8.0 |       8.5 |                        8.5 |         8.5 |                                 8.0 |        **8.36 / 10** |
| Sidebar                   |              8.5 |        8.0 |                 8.0 |       8.0 |                        8.5 |         8.5 |                                 8.0 |        **8.21 / 10** |
| Expanded profile          |              8.5 |        8.5 |                 8.5 |       8.5 |                        9.0 |         8.5 |                                 8.5 |        **8.57 / 10** |
| Shared dialog             |              9.0 |        9.0 |                 9.0 |       9.0 |                        9.0 |         9.0 |                                 8.5 |        **8.93 / 10** |
| Homepage favorite cards   |              8.5 |        8.5 |                 8.0 |       8.0 |                        8.5 |         8.5 |                                 8.0 |        **8.29 / 10** |
| Homepage search / results |              8.5 |        8.0 |                 8.0 |       8.0 |                        8.5 |         8.5 |                                 8.0 |        **8.21 / 10** |

**Overall suite: 8.43 / 10.** This is a polished, coherent extension UI with meaningfully clearer states. No P1 visual issue is evident in the supplied states. The remaining gaps concern narrow navigation, density, and fine text hierarchy rather than a fundamental visual-system problem.

## Component observations and deductions

### 1. Login — healthy and substantially better composed

Screens: standard (`login.png`), wide (`login-wide.png`), narrow (`login-narrow.png`).

The bounded form/announcement composition now reads as a unit at both desktop widths. Stronger input outlines improve definition; the main login action is unmistakable. The two secondary actions share one row without competing with the primary button. CAPTCHA controls align well. The narrow utility links form a deliberate two-by-two arrangement. Announcement fading plus “顯示全部公告（13）” makes the desktop truncation look intentional and provides a visible next action.

Remaining deductions:

- The announcement fade begins through the third item’s body. Even with the disclosure below, this previews a partly readable item. Ending the preview between complete notices would make the information boundary cleaner; this is polish rather than a discovery blocker now.
- The narrow header consumes roughly 145px before the login section. It is orderly, but utilities still receive substantial first-screen space relative to the core task. A more compact header is an optional density improvement, not a required redesign.
- The round CAPTCHA audio/refresh buttons and account/password help remain icon-led. Their behavior, names, and touch hit areas are unverified. The narrow screenshot does not extend far enough to inspect the announcement disclosure itself, and the expanded announcement state is not shown.

### 2. Sidebar — strong desktop tree; narrow navigation still has a discoverability cost

Screens: desktop (`sidebar-classic.png`), menu mode at narrow width (`sidebar-menu-narrow.png`), plus the populated tree in favorites (`home-favorites.png`).

Four-item favorites with an explicit “顯示全部常用功能（10）” entry protect space for categories. Bilingual labels wrap rather than disappearing into ellipses, and nesting/guide lines remain intelligible. The narrow homepage’s visible “選單” button gives users a text entry point that the icon rail alone lacked. The provided keyboard verification addresses reachability beyond the four-item preview.

Remaining deductions:

- In the narrow menu-mode capture, the first visible region is a long “已訂選” list. No category navigation is visible within the first screen, and there is no obvious visible close/back action or “選單” title. The profile control and university crest remain, but they do not plainly communicate how to return to the prior view. Add an explicit return/close affordance near the navigation search and make the menu’s identity clear. Actual exit behavior is unverified.
- The narrow homepage keeps a roughly 64px icon rail, leaving about 311px for the content frame and about 263px for cards/search. The rail is coherent, but it imposes a significant width cost at 375px and keeps many unlabeled icons on screen. Consider a narrower rail or a top-level Menu entry with more content width; retain the current scheme if frequent direct category access justifies the tradeoff.
- Wrapped nested bilingual rows are readable but considerably taller than single-line categories. The tree can still become dense after several groups expand. Verify the deepest English labels and usable scroll boundaries; the supplied captures do not show the end of the tree.

### 3. Expanded profile — healthy state communication

Screens: desktop (`profile-expanded.png`), narrow (`profile-expanded-narrow.png`).

“導覽模式” now has an explicit value (“側邊欄” or “選單”) and a navigation chevron. “登出倒數” shows both “關閉” and a switch. Reset remains a command row, so the three preferences have distinct meanings. The trigger chevron conveys expansion. Group spacing, dividers, and external-link cues are consistent. The narrow popover fits within the viewport without hiding its logout row.

Remaining deductions:

- The outlined navigation-mode value resembles a small standalone button nested in a row that also has a chevron. This is slightly ambiguous about whether only the value or the entire row changes mode. A quieter value treatment could make the single action target clearer. Actual hit boundaries are unverified.
- The off switch is visually small, although its adjacent state text makes the setting understandable. Supplied state verification helps; actual touch target dimensions and full English labels remain unverified.

### 4. Shared dialog — strongest component in this set

Screens: desktop (`dialog-remove-favorite.png`), narrow (`dialog-remove-favorite-narrow.png`).

The full shell is now uniformly dimmed and the dialog is centered on the viewport. The larger title establishes hierarchy. The consequence statement consistently names 常用功能 and explains that the function can be added again. “保留” and “確認移除” are clear, and the visible focus ring is strong. Both narrow buttons fit with comfortable padding, and the body wraps without crowding. This resolves the major visible scope problem from the first review.

The remaining deduction is primarily coverage: long English item titles, larger text settings, and error/interrupt states are not shown. Focus trapping/inert behavior is supplied verification, not independently exercised here. I see no concrete visual defect warranting a redesign of the captured dialog.

### 5. Homepage favorites — readable bilingual cards; repeated context adds bulk

Screens: desktop (`home-favorites.png`), narrow (`home-favorites-narrow.png`).

The compact brand block brings task content higher. Cards now expose category context, the eform card carries the external-link cue, and the recent bilingual title wraps fully. Narrow cards preserve readable labels and a distinct star action. The grid, icon circles, spacing, and saved/unsaved stars form a consistent system.

Remaining deductions:

- Several neighboring cards repeat the same category line, especially the graduation items. On narrow screens, that context plus two-line bilingual titles creates a long stack. A restrained grouped category treatment or omission of redundant context where the title is already unique could improve density. Keep context where it actually disambiguates destinations.
- Main titles and category text have only a modest visual separation on narrow cards. Slightly stronger distinction through muted color or spacing would make titles faster to scan without reducing text size.
- The persistent rail’s width cost makes “課程預排 Tentative schedule” and the evaluation title wrap. The wrapping is correct, but the resulting card heights reinforce the navigation/content-width tradeoff noted above.

### 6. Homepage search/results — much clearer states; a few density and wrapping issues

Screens: desktop (`home-search.png`), narrow initial (`home-search-narrow.png`), narrow end (`home-search-end-narrow.png`), narrow empty (`home-search-empty-narrow.png`).

The result count, matching-term emphasis, category context, selected-result boundary, shadow, and stronger panel outline make the active search state much clearer. “捲動查看更多結果” communicates overflow; the end capture no longer suggests more results. The zero-results message is readable and tells users to try another keyword. The supplied keyboard tests address behavior that still images cannot prove.

Remaining deductions:

- In narrow results, “填寫傑出教學教師調查問卷” leaves a single “卷” on the second line. This is legal CJK wrapping but visually awkward. More content width or balanced title wrapping would improve scanning.
- Every shown result repeats “教學意見”. Category context is useful in principle, but this query gains little disambiguation from six identical secondary lines. Where all results share a category, consider one shared category label or a more specific path only when needed.
- The results still sit over cards, with portions of covered cards visible immediately below the rounded panel. The stronger outline/shadow now makes foreground order understandable, but the composition remains busy on narrow screens. A quieter underlying region while search is active could reduce competition without changing result behavior.

## Prioritized next improvements

1. **P2 — Clarify the narrow menu screen’s identity and exit.** Add a plainly visible close/back action beside navigation search. The current first screen is a favorites list with no obvious visible route back; behavior itself is unverified.
2. **P2 — Reassess the persistent rail at 375px.** Its 64px width materially contributes to narrow card/result wrapping. Evaluate the tradeoff against a compact Menu entry or slimmer rail, using real navigation tasks before changing the shell.
3. **P3 — Reduce redundant context and refine narrow wrapping.** Keep category/path labels when they distinguish destinations; avoid repeating identical context where it consumes substantial vertical space. Address the lone trailing CJK character in the long search result.
4. **P3 — Cleanly end the announcement preview.** Prefer complete visible notices before disclosure rather than fading through a partially readable third notice.
5. **Verification coverage — complete English and larger-text states.** The captured Chinese/English mixed titles are stronger, but complete English UI layouts, zoom, actual touch target boundaries, and screen-reader output remain outside this visual review. Do not interpret the improved scores as a full accessibility certification.
