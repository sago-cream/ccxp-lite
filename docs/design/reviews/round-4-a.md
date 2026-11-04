# Independent visual review — round 4, reviewer A

**Suite visual-design score: 8.9/10.** The current suite is polished and coherent. It combines readable bilingual labels, restrained purple/neutral styling, clear search feedback, explicit preference values, and a visually unambiguous full-shell dialog. The remaining feedback concerns narrow-menu information order and small typography/spacing details. I see no high-priority visual blocker in these captures.

## Evidence and limits

I personally opened all **15 PNGs** in `round-4-final/head` with `tools.view_image`. I used the established rules in `docs/design/guidelines.md`: purple navigation/actions, danger for removal, white/neutral surfaces, readable CJK/English, and shared control/row conventions. This report assesses the current images on their own merits. I did not open a browser, change code, inspect other reviewers' reports, or independently rerun the supplied checks.

Supplied validation reports primary/danger contrast ≥4.5, focus/input contrast ≥3, native-modal focus containment, profile state, keyboard search, touch-style menu entry revealing labeled navigation and focusing search, and keyboard access from four to ten sidebar favorites. These are useful **reported test results**, distinct from my direct visual observations. They are not a basis for claiming full accessibility compliance.

Scores reflect visible design execution. Responsive/accessibility scores cover the shown desktop/narrow states, visible labels/focus and supplied scoped checks; unshown behavior remains **not-observed**, rather than being treated as a failure.

| Component          | Color / contrast | Typography | Spacing / alignment | Visual hierarchy | Affordances / visible states | Consistency | Responsive / accessibility evidence | Overall |
| ------------------ | ---------------: | ---------: | ------------------: | ---------------: | ---------------------------: | ----------: | ----------------------------------: | ------: |
| Login              |              9.0 |        9.0 |                 8.5 |              9.0 |                          9.0 |         9.0 |                                 8.8 | **8.9** |
| Sidebar / menu     |              9.0 |        8.8 |                 8.8 |              8.2 |                          8.8 |         9.0 |                                 8.6 | **8.6** |
| Expanded profile   |              9.0 |        9.0 |                 9.0 |              9.0 |                          9.2 |         9.0 |                                 9.0 | **9.0** |
| Dialog             |              9.2 |        9.0 |                 9.2 |              9.3 |                          9.3 |         9.0 |                                 9.2 | **9.2** |
| Homepage favorites |              9.0 |        9.0 |                 9.0 |              8.8 |                          9.0 |         9.0 |                                 8.8 | **8.9** |
| Homepage search    |              9.0 |        8.7 |                 9.0 |              9.2 |                          9.2 |         9.0 |                                 9.0 | **9.0** |

The suite score is an overall judgment, not a compliance score or an average test pass rate.

## Capture inventory and health

These links point to the exact inspected files. Numbers identify review observations, not a witnessed interaction sequence.

1. Login (`login.png`) — healthy: bounded form/announcement columns and a clear primary action.
2. Wide login (`login-wide.png`) — healthy: centered overall grouping with controlled content widths.
3. Narrow login (`login-narrow.png`) — healthy: header links, form and secondary actions fit without collision.
4. Classic sidebar (`sidebar-classic.png`) — healthy: legible categories and useful empty-favorites instruction.
5. Narrow menu (`sidebar-menu-narrow.png`) — functional-looking entry surface; pinned cards dominate the first screen.
6. Expanded desktop profile (`profile-expanded.png`) — healthy: explicit sidebar mode and countdown state.
7. Expanded narrow profile (`profile-expanded-narrow.png`) — healthy: readable panel, contained within the viewport.
8. Desktop removal dialog (`dialog-remove-favorite.png`) — strong: consistent full-shell dimming and visible initial focus.
9. Narrow removal dialog (`dialog-remove-favorite-narrow.png`) — strong: title/body wrap cleanly and both actions fit.
10. Desktop favorites (`home-favorites.png`) — healthy: complete bilingual card names, category context, orderly grid.
11. Narrow favorites (`home-favorites-narrow.png`) — healthy: compact branding, labeled menu entry and readable single-column cards.
12. Desktop search (`home-search.png`) — strong: query, count, matching text, context and selected row are distinct.
13. Narrow search overflow (`home-search-narrow.png`) — healthy: clear continuation cue; one minor CJK orphan.
14. Narrow search end (`home-search-end-narrow.png`) — healthy: last result is visible and continuation cue is absent at the bottom.
15. Narrow empty search (`home-search-empty-narrow.png`) — healthy: explicit zero count and useful recovery instruction.

## Component assessments

### Login — 8.9/10

The form and notice panel now read as one bounded composition in `login.png` and `login-wide.png`. The stronger input borders remain restrained, and the filled purple login action is clear. The two secondary actions share a compact row, preserving hierarchy and reducing vertical travel. In `login-narrow.png`, the two-row utility-link arrangement is orderly, the fields fit, and the centered CAPTCHA/audio/refresh group reads as a single unit.

The announcement fade and **顯示全部公告（13）** in desktop captures make intentional clipping understandable. The narrow capture does not extend far enough to show the announcement footer, so its narrow disclosure placement is **not-observed**, not a confirmed defect.

**Remaining detail, P3:** Account/password labels have noticeably more space before their input borders than 驗證碼 does. In `login-narrow.png`, 帳號 and 密碼 sit roughly 27px above their field tops, while 驗證碼 is roughly 16px above. Use a common label-to-control rhythm while retaining the help icons' usable targets. This is polish, not a readability failure.

Error, loading, disabled, help-open and full-English states remain **not-observed**.

### Sidebar / menu — 8.6/10

Desktop navigation is compact and readable. `home-favorites.png` shows four favorites followed by an explicit **顯示全部常用功能（10）**, so the favorites section no longer visually overwhelms the category tree. Wrapped labels such as 課程預排 Tentative / schedule preserve the English name. Repeated star/chevron columns and nesting guides remain easy to follow. The outlined **選單** control in `home-favorites-narrow.png` gives the compact icon rail a visible, named way into navigation.

**Remaining opportunity, P2:** `sidebar-menu-narrow.png` opens to **已釘選** followed by a long sequence of full-width favorite cards. At least nine pinned destinations occupy the captured screen; no broader category headings are visible. This provides labeled destinations, but users seeking an unpinned function must infer that more navigation exists below. Consider applying the desktop four-item cap/disclosure here too, or placing a visible category-navigation entry before the long pinned list. Keep search available at the top. The supplied touch/menu and four-to-ten keyboard checks establish reported operability; this feedback concerns the visual priority of other destinations at entry.

Scrolling to the actual categories, complete expanded-favorites state and rail-icon tooltips are **not-observed** in these stills.

### Expanded profile — 9.0/10

`profile-expanded.png` and `profile-expanded-narrow.png` clearly distinguish headings, action rows, support links and logout. The **導覽模式** value (**側邊欄** / **選單**) makes the current mode explicit, with a chevron identifying the change path. **登出倒數** shows both **關閉** and a switch, so its current state is unambiguous without relying only on color. The desktop panel anchors above the identity control; the narrow panel anchors below it and stays within the viewport. The identity chevron communicates the expanded state.

No material remaining visual defect is evident. The panel legitimately overlaps page content while open; the capture does not indicate clipped panel controls. Verify short-height and enlarged-text layouts when extending coverage, but do not change this composition solely to address an unobserved risk.

Full-English labels, enlarged text, and the actual mode-choice submenu remain **not-observed**.

### Dialog — 9.2/10

Both removal captures show consistent dimming across sidebar and content, establishing clear modal scope. The item-specific title, reversible-action explanation, quiet **保留** button, and danger-colored **確認移除** form a strong hierarchy. The visible purple focus outline on **保留** is clear against the white dialog and gives the safer action an obvious starting point. On narrow screens the title and copy wrap naturally, generous outer margins remain, and the action row stays legible.

I see no substantive remaining visual issue. The supplied native-modal focus-containment check supports the intended modal behavior but was not rerun by me. Escape dismissal, focus restoration and screen-reader announcement remain **not-observed** directly.

### Homepage favorites — 8.9/10

The desktop grid is orderly and informative: primary labels, smaller category context, repeated star placement, and external-link markers are coherent. The recent-use bilingual name wraps instead of losing its English suffix. NTHU branding is now proportionate to the task surface. `home-favorites-narrow.png` brings search and favorites much higher, uses readable full-width cards, and preserves category context and complete bilingual labels. The seven visible cards by the bottom of the capture indicate a usable density without compressing text.

No significant remaining visual issue is evident in the cards themselves. The long pinned-list menu priority belongs to navigation, as discussed above. Narrow recent-use and show-all outcomes remain **not-observed**. Do not force all cards to identical heights at the expense of complete labels; the current wrapping is the right tradeoff.

### Homepage search — 9.0/10

Search is the strongest improvement in state clarity. `home-search.png` shows **6 個結果**, bold matching substrings, category context and a purple outlined selected row. In `home-search-narrow.png`, long bilingual labels wrap, and **捲動查看更多結果** makes the bounded result region discoverable. `home-search-end-narrow.png` shows the final result selected and removes that continuation hint at the end. The empty state explicitly says **0 個結果** and suggests trying another keyword. The clear action stays visible across these states.

**Remaining detail, P3:** In `home-search-narrow.png` and `home-search-end-narrow.png`, **填寫傑出教學教師調查問卷** wraps with the final **卷** alone on a second line. If the layout supports it, use balanced wrapping or a small padding adjustment to avoid this orphan while keeping the full label. This is typographic polish; the result remains readable and actionable.

The supplied keyboard-search check supports reported operation. Exact screen-reader result announcements, loading/error states, and full-English search results remain **not-observed** directly.

## Prioritized remaining feedback

1. **P2 — narrow-menu information order:** Keep access to general navigation visible before a screenful of pinned cards, or cap/disclose the pinned list (`sidebar-menu-narrow.png`).
2. **P3 — login spacing:** Normalize label-to-input spacing across account, password and CAPTCHA (`login.png`, `login-wide.png`, `login-narrow.png`).
3. **P3 — CJK wrap:** Avoid a single-character final line for the long teaching-survey search result where practical (`home-search-narrow.png`, `home-search-end-narrow.png`).

No P1 visual issue is evident. Full English, zoom/enlarged text, short-height panels, assistive-technology output, reduced motion and unshown dynamic states remain outside the direct evidence. These coverage limits do not imply failures.
