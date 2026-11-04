# Independent visual review — round 5, reviewer A

**Suite visual-design score: 9.2/10.** The supplied suite is visually ready: consistent, readable, well organized, and appropriately restrained for a university information system. All six components now have a strong visual baseline. Remaining feedback is minor English-control copy and narrow-header efficiency; no P1 or P2 visual blocker is evident.

## Scope, scoring and evidence limits

I personally opened all **15 requested main captures** in `round-5-ready/head` and the **eight requested English-control counterparts** in `round-5-ready-english/head` with `tools.view_image`. The counterparts were profile, dialog, favorites and search, each at desktop and narrow widths. I did not inspect the other PNGs in the English directory. I used the project's established design guidelines. No browser was opened, code changed, or other reviewer's report consulted.

English-control captures retain Chinese/bilingual host function names and synthetic host content. They demonstrate translated extension controls and their layouts, **not** an English host or an English login source. Login evidence remains Chinese.

Supplied validation reports contrast checks (primary/danger ≥4.5; focus/input ≥3), modal focus containment, profile states, keyboard search, touch-style menu entry, sidebar four-to-ten favorites keyboard access, and actual menu expansion/return. I did not rerun these checks. They are **reported checks**, separate from direct visual observations. Screen-reader output, full WCAG conformance, reduced motion, zoom, short-height behavior, unshown loading/error states and full-English host content remain **not-observed**.

Color scores reflect visual execution plus the scoped contrast results supplied by the author. Affordances/states scores cover depicted states, not inferred behavior. Responsive/accessibility scores cover visible desktop/narrow reflow, visible labels/focus and the supplied scoped checks. Missing evidence is not scored as a failure.

## Scores

| Component          | Color / contrast | Typography | Spacing / alignment | Visual hierarchy | Affordances / visible states | Consistency | Responsive / accessibility evidence | Overall |
| ------------------ | ---------------: | ---------: | ------------------: | ---------------: | ---------------------------: | ----------: | ----------------------------------: | ------: |
| Login              |              9.2 |        9.2 |                 9.2 |              9.3 |                          9.2 |         9.2 |                                 9.1 | **9.2** |
| Sidebar / menu     |              9.2 |        9.0 |                 9.1 |              9.1 |                          9.2 |         8.8 |                                 9.0 | **9.0** |
| Expanded profile   |              9.2 |        9.2 |                 9.2 |              9.2 |                          9.3 |         9.2 |                                 9.2 | **9.2** |
| Dialog             |              9.2 |        9.2 |                 9.3 |              9.3 |                          9.0 |         9.1 |                                 9.2 | **9.2** |
| Homepage favorites |              9.2 |        9.2 |                 8.8 |              8.9 |                          9.2 |         9.2 |                                 8.8 | **9.0** |
| Homepage search    |              9.2 |        9.3 |                 9.3 |              9.4 |                          9.4 |         9.3 |                                 9.2 | **9.3** |

The suite score is a rounded overall judgment, not a compliance rating. Scores in the low 9s describe strong visible execution. They do not imply an undisclosed serious defect. Material differences in this table are explained below; I would not invent extra issues merely to justify every fraction below 10.

## Component assessments

### Login — 9.2/10

The standard and wide compositions have a bounded, centered form/announcement pairing. The two complete announcement previews followed by **顯示全部公告（13）** form an understandable hierarchy, without an unfinished third notice. All three labels have a consistent visual rhythm above their fields. Primary login, secondary options and account recovery are clearly separated by prominence. CAPTCHA image/audio/refresh actions remain grouped and centered.

The narrow view retains readable header links, generous field targets and contained secondary actions. No visible label collision or horizontal overflow is evident. No material remaining visual deduction is warranted for the shown login states.

The narrow announcement disclosure is below the supplied image boundary and remains **not-observed**. Validation, help-open, loading and English login are **not-observed**; their absence is not a failure.

### Sidebar / menu — 9.0/10

The desktop tree remains legible, with stable star/chevron columns, readable nesting and full wrapped bilingual labels. Four favorites plus an explicit count/disclosure keep categories accessible. In `round-5-ready/head/sidebar-menu-narrow.png`, the **選單** heading, **返回側邊欄** action, capped pinned list and **所有功能** section establish where the user is and how to return. Three category cards are visible in the first screen. This is a sound information order, and it resolves the first-screen navigation concern.

**Small consistency deduction, P3:** The English desktop sidebar heading is **Favorite**, while the homepage is **Favorites** and the disclosure is **Show all favorites (10)**. Use **Favorites** consistently. Evidence: English `home-favorites.png`, `profile-expanded.png`, and `home-search.png`. This is terminology polish, not a navigation failure.

Actual expansion/return and keyboard operation are supported by supplied checks, not direct observation in this review. Fully expanded menu favorites and every category destination remain **not-observed**.

### Expanded profile — 9.2/10

Both languages preserve the same information structure and comfortably fit the desktop and narrow panels. Current navigation mode is explicit (**側邊欄/選單**, **Sidebar/Menu**), and the countdown preference exposes **關閉/Off** beside its switch. Support links have consistent external-link indicators. The divider before logout is clear, and the identity chevron visibly changes with expansion.

The longer English **Restore original order** row fits without truncation or collision in the narrow panel. There is no material remaining visible issue in the supplied profile states. Short-height, zoom and mode-submenu layouts remain **not-observed**.

### Dialog — 9.2/10

All four dialog captures show coherent full-shell dimming, a named item, a concise explanation, a quiet retention action and a danger-colored removal action. The purple focus outline on the retention button is clear. Desktop margins and narrow wrapping are comfortable. English body copy expands to more lines naturally, without pushing either action out of the dialog.

**Small affordance deduction, P3:** English uses **Confirm** for the danger action, while Chinese says **確認移除**. **Remove** would identify the action directly and fit the existing button width. Evidence: English `dialog-remove-favorite.png` and `dialog-remove-favorite-narrow.png`. The current title/body still make the meaning understandable, so this is not a blocker.

The supplied native-modal focus check supports reported behavior. Escape dismissal, restoration to the exact invoking control and screen-reader announcement remain **not-observed** directly.

### Homepage favorites — 9.0/10

Desktop cards are well aligned, with complete names, smaller category context and consistent star placement. The narrow cards preserve bilingual wrapping rather than truncating distinguishing content. The compact NTHU lockup is proportionate. English category labels such as **Planning & Enrollment** and **Graduation & Defense** fit the card widths. The recent-use bilingual label wraps cleanly on desktop.

**Visible narrow-English efficiency deduction, P3:** In English `home-favorites-narrow.png`, **Contact campus offices** and **System usage guide** occupy separate header rows with a large vertical separation. The extra header row shifts the logo, search and favorites about 64px lower than the Chinese narrow view. Tighten the stacked utility-link spacing at narrow widths; keep both links readable. This is wasted vertical space rather than broken content.

**Minor copy-fit deduction, P3:** The narrow English search placeholder clips the end of **Search system functions**, showing approximately **Search system function**. A shorter localized placeholder such as **Search functions** would fit cleanly. Evidence: English `home-favorites-narrow.png` and the background in English `dialog-remove-favorite-narrow.png`. This is a placeholder-fit issue, not proof of a missing accessible name.

Narrow recent-use and show-all outcomes remain **not-observed**. No further card-layout change is indicated by these images.

### Homepage search — 9.3/10

The shared category in the count line (**6 個結果 · 教學意見** / **6 results · Teaching Feedback**) conveys context with little repetition. Results have a clear selected outline, useful matching-text emphasis, and adequate row spacing. On narrow screens the long bilingual results wrap fully, and the long Chinese teaching-survey label no longer leaves a lone final character. English count/category text wraps onto two lines cleanly. Hidden background cards eliminate competing text behind and below active results.

The final-result capture shows a distinct last-row selection; the empty capture shows an explicit zero count and recovery guidance. All six results now fit in the shown narrow result panel. That is a density improvement, not evidence that overflow logic is broken.

No material remaining visible search issue is evident. The English utility header adds the same vertical cost described under favorites, but the search results themselves remain comfortably usable. Mixed-category results, longer overflowing sets and their continuation hint are **not-observed in this revision's requested captures**. The brief reports mixed-category handling; I do not claim to have visually verified it. Keyboard behavior is supplied validation, not an observed interaction.

## Remaining feedback, in priority order

All are **P3 polish**; none requires blocking the visible design:

1. Compact the stacked English utility-header rows at narrow widths, which currently push the task content about 64px lower (`round-5-ready-english/head/home-favorites-narrow.png`, `home-search-narrow.png`).
2. Shorten the narrow English search placeholder so its ending fits (`round-5-ready-english/head/home-favorites-narrow.png`).
3. Name the English removal action **Remove**, replacing generic **Confirm** (both English dialog captures).
4. Use **Favorites** consistently for the English sidebar collection heading (English desktop captures).

## Exact inspected inventory

The numbers identify review observations, not a witnessed flow. Each capture was opened and visually inspected.

1. Main login (`login.png`) — healthy bounded two-column composition.
2. Wide login (`login-wide.png`) — healthy controlled reading widths.
3. Narrow login (`login-narrow.png`) — healthy form/header reflow.
4. Classic sidebar (`sidebar-classic.png`) — healthy navigation and empty instruction.
5. Narrow menu (`sidebar-menu-narrow.png`) — healthy heading/return/disclosure/category order.
6. Desktop profile (`profile-expanded.png`) — healthy states and grouping.
7. Narrow profile (`profile-expanded-narrow.png`) — healthy contained panel.
8. Desktop dialog (`dialog-remove-favorite.png`) — strong modal scope/action hierarchy.
9. Narrow dialog (`dialog-remove-favorite-narrow.png`) — healthy wrapping and actions.
10. Desktop favorites (`home-favorites.png`) — healthy labeled grid.
11. Narrow favorites (`home-favorites-narrow.png`) — healthy full-label single column.
12. Desktop search (`home-search.png`) — strong context and result hierarchy.
13. Narrow search (`home-search-narrow.png`) — strong fit and wrapping.
14. Narrow final-result state (`home-search-end-narrow.png`) — healthy visible final selection; no current overflow.
15. Narrow empty search (`home-search-empty-narrow.png`) — healthy zero-state recovery.
16. English desktop profile (`profile-expanded.png`) — healthy translated control fit.
17. English narrow profile (`profile-expanded-narrow.png`) — healthy translated control fit.
18. English desktop dialog (`dialog-remove-favorite.png`) — healthy layout; generic confirmation label.
19. English narrow dialog (`dialog-remove-favorite-narrow.png`) — healthy multiline body/actions; generic confirmation label.
20. English desktop favorites (`home-favorites.png`) — healthy card/context fit; singular sidebar heading.
21. English narrow favorites (`home-favorites-narrow.png`) — healthy cards; inefficient utility header and clipped placeholder.
22. English desktop search (`home-search.png`) — healthy count/context translation.
23. English narrow search (`home-search-narrow.png`) — healthy wrapped count/results; utility header could be tighter.
