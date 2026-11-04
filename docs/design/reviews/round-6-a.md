# Independent visual review — round 6, reviewer A

**Suite visual-design score: 9.3/10.** The current screenshots show a polished, consistent extension that respects the established purple/neutral design language and the legacy information system. Labels are readable, actions are distinct, bilingual content fits, and desktop/narrow layouts have clear task hierarchy. I see **no remaining material visual defect and no P1/P2 recommendation** in these representative states. I would not request further design changes solely to raise the numeric score.

## Scope and evidence

I personally opened **all 15 PNGs** in `round-6/head`, plus **nine requested English-control PNGs** in `round-6-english/head`: desktop/narrow profile, dialog, favorites and search, and narrow menu. Every image listed below was inspected with `tools.view_image`. No browser was opened, code changed, or other reviewer's report consulted. The benchmark is `docs/design/guidelines.md`.

These are representative original student fixtures. The supplied entitlement inventory explicitly documents an extra-survey gap. This review does not claim coverage of that entitlement or of every role, category, widget, survey or period. The English images demonstrate extension-control localization around retained Chinese/bilingual host function names, not a fully English host. Login evidence remains Chinese.

Supplied validation reports contrast checks (primary/danger ≥4.5, focus/input ≥3), keyboard search, profile states, native-modal focus containment, touch/menu entry, four-to-ten favorites keyboard access, and expansion/return. The author also reports a native live final-modal check confirming full-shell dimming, Tab containment and Escape restoration without removal. I did **not** rerun those checks. Full-shell dimming and a focused retention button are directly visible; keyboard/focus transitions are supplied test evidence, not observed interactions by this reviewer.

Color scores combine visual legibility with the scoped contrast results supplied. Affordance scores cover depicted controls/states. Responsive/accessibility scores cover visible desktop/narrow reflow, labels/focus and supplied scoped checks. Unshown behavior is **not-observed**, not an inferred pass or failure. Scores are visual judgments, not WCAG ratings.

## Scores

| Component          | Color / contrast | Typography | Spacing / alignment | Visual hierarchy | Affordances / visible states | Consistency | Responsive / accessibility evidence | Overall |
| ------------------ | ---------------: | ---------: | ------------------: | ---------------: | ---------------------------: | ----------: | ----------------------------------: | ------: |
| Login              |              9.2 |        9.2 |                 9.2 |              9.3 |                          9.2 |         9.2 |                                 9.1 | **9.2** |
| Sidebar / menu     |              9.3 |        9.2 |                 9.3 |              9.3 |                          9.4 |         9.4 |                                 9.2 | **9.3** |
| Expanded profile   |              9.3 |        9.3 |                 9.3 |              9.3 |                          9.4 |         9.4 |                                 9.2 | **9.3** |
| Dialog             |              9.3 |        9.3 |                 9.4 |              9.5 |                          9.5 |         9.4 |                                 9.3 | **9.4** |
| Homepage favorites |              9.3 |        9.3 |                 9.3 |              9.3 |                          9.3 |         9.4 |                                 9.2 | **9.3** |
| Homepage search    |              9.3 |        9.3 |                 9.3 |              9.4 |                          9.4 |         9.3 |                                 9.2 | **9.3** |

The suite score is a rounded overall judgment. There is no material deduction corresponding to a hidden blocker. The low-9 range denotes strong execution of the established design, not proof that every possible state is perfect. Missing coverage is reported separately, not converted into a fictitious visual flaw.

## Component assessments

### Login — 9.2/10

The bounded form and announcement panel compose well at standard and wide widths. Label/input spacing is consistent. Dark input borders provide clear fields without competing with the purple primary action. Secondary options and recovery remain visually subordinate. CAPTCHA, audio and refresh are grouped clearly. The desktop notice preview ends after two complete items and has an explicit **顯示全部公告（13）** footer.

The narrow screenshot has readable utility links, full-width inputs and a contained secondary-action row. No clipping or collision is visible. The announcement disclosure lies below the captured narrow boundary and is **not-observed** there. There is no material remaining visual issue in the shown states.

### Sidebar / menu — 9.3/10

Desktop labels, nesting guides and aligned star/chevron columns are clear. Wrapped bilingual labels retain the full function name. The four-item favorites cap and count/disclosure preserve space for the general category tree.

Both narrow menu captures show an explicit **選單/Menu** heading and **返回側邊欄/Back to sidebar** action. **常用功能/Favorites** now names the saved collection consistently across menu, sidebar and homepage. Four favorite cards, a show-all disclosure and the visible **所有功能/All** categories form a useful first screen. English labels fit, including **Planning & Enrollment**. The compact rail retains a visible named Menu control in the home views.

No material remaining visual deduction is warranted. Full expansion of every category, deeper menu states and actual scrolling remain **not-observed** directly; supplied checks cover the stated expansion/keyboard paths.

### Expanded profile — 9.3/10

Chinese and English panels share a coherent structure: preferences, support links, divider, logout. **導覽模式/Navigation** has a quiet current value and chevron, correctly reading as a single row rather than a nested outlined control. The **關閉/Off** text plus switch exposes countdown state without relying solely on color. All English rows fit the narrow panel, including **Restore original order**. The panel stays within the visible viewport and anchors predictably to the identity control.

No material remaining visual issue is evident. Still images cannot prove the whole-row hit area or its semantics; those remain implementation/interaction facts rather than visual claims.

### Dialog — 9.4/10

Across both languages and widths, the overlay consistently dims the full shell. The dialog names the item, explains reversibility, and distinguishes retention from removal. The English **Remove** button now names its action directly. Purple focus on **保留/Keep it** is clear, while danger color remains specific to removal. English multiline copy fits without crowding the buttons. The narrow dialog keeps comfortable margins and a stable action row.

No material remaining visual issue is evident. The reported native live check adds relevant interaction evidence without turning this screenshot review into an independent behavior verification. Screen-reader announcement and exact focus-restoration target remain **not-observed** by me.

### Homepage favorites — 9.3/10

Desktop cards use a clean two-column rhythm, full labels, useful category context and consistently aligned stars. Recent-use content wraps fully. Narrow cards retain readable bilingual names and fit their category labels without squeezing controls.

The English utility labels **Campus contacts** and **Usage guide** now fit one compact header row, matching the efficient Chinese composition. The shorter **Search functions** placeholder fits the narrow input. Task content begins high enough to show several useful destinations without compressing the text. There is no remaining clipping or wasted-header-space issue in these captures.

No material visual change is requested. Narrow recent-use/show-all outcomes remain **not-observed**.

### Homepage search — 9.3/10

Count/category metadata is concise. On narrow English, **6 results** and **· Teaching Feedback** wrap as intentional units instead of splitting the category phrase. The selected result is clearly outlined, matching text is emphasized, and full Chinese/English result names remain readable. The long Chinese teaching-survey label fits without a single-character final line. Background cards are absent during active results, keeping the task surface clear.

All six results fit in the supplied desktop/narrow result views; the last-row capture shows a distinct final selection. The zero-state clearly states **0 個結果** and suggests trying other keywords. No material remaining visible search issue is evident.

Longer overflowing result sets, mixed-category result rows and English empty-state controls are **not-observed in the requested images**. The reported keyboard and metadata behavior does not substitute for those missing visual states.

## Remaining feedback and boundaries

**No additional visual change is required by this review.** The previous round's concrete English header, placeholder, terminology and removal-label concerns are resolved in the inspected images. The current profile treatment is calmer and consistent with the rest of the controls.

Keep the extra-survey entitlement gap explicitly documented when describing coverage. A future capture of that state should be evaluated on its own host content and layout. This is a coverage limit, not a defect in the representative fixtures reviewed here.

The following remain **not-observed** directly: zoom/enlarged text, short-height panels, screen-reader semantics/output, reduced motion, unshown loading/error/disabled states, all entitlement combinations, English host pages, and English login. None is asserted to fail.

## Exact inspected inventory

Numbers identify review observations, not a witnessed interaction sequence.

1. Main login (`login.png`) — healthy bounded form/notice composition.
2. Wide login (`login-wide.png`) — healthy controlled widths.
3. Narrow login (`login-narrow.png`) — healthy label/control/header reflow.
4. Classic sidebar (`sidebar-classic.png`) — healthy categories and empty instruction.
5. Narrow menu (`sidebar-menu-narrow.png`) — healthy heading, return, favorites cap and category order.
6. Desktop profile (`profile-expanded.png`) — healthy current values and grouping.
7. Narrow profile (`profile-expanded-narrow.png`) — healthy contained panel.
8. Desktop dialog (`dialog-remove-favorite.png`) — strong modal scope/action hierarchy.
9. Narrow dialog (`dialog-remove-favorite-narrow.png`) — strong copy/action fit.
10. Desktop favorites (`home-favorites.png`) — healthy card grid/context.
11. Narrow favorites (`home-favorites-narrow.png`) — healthy compact header and full labels.
12. Desktop search (`home-search.png`) — strong count/context/selection hierarchy.
13. Narrow search (`home-search-narrow.png`) — strong readable fit.
14. Narrow final-result state (`home-search-end-narrow.png`) — healthy visible final selection.
15. Narrow empty search (`home-search-empty-narrow.png`) — healthy zero-state guidance.
16. English narrow menu (`sidebar-menu-narrow.png`) — healthy terminology and navigation order.
17. English desktop profile (`profile-expanded.png`) — healthy translated controls/current value.
18. English narrow profile (`profile-expanded-narrow.png`) — healthy full control labels.
19. English desktop dialog (`dialog-remove-favorite.png`) — strong named removal action.
20. English narrow dialog (`dialog-remove-favorite-narrow.png`) — healthy multiline copy/actions.
21. English desktop favorites (`home-favorites.png`) — healthy consistent collection labels.
22. English narrow favorites (`home-favorites-narrow.png`) — healthy compact header and fitting placeholder.
23. English desktop search (`home-search.png`) — healthy translated metadata.
24. English narrow search (`home-search-narrow.png`) — healthy metadata wrapping and complete results.
