# Round 0 — independent reviewer B

Date: 2026-11-04. Scope: the six requested ccxpLite components, reviewed against `docs/design/guidelines.md` and independent visual judgment. Product files were not changed. No native Chrome, other reviewer reports, or delegated review was used.

## Evidence and limits

I opened and visually inspected every requested PNG using `tools.view_image`: `login.png`, `login-wide.png`, `login-narrow.png`, `sidebar-classic.png`, `profile-expanded.png`, `dialog-remove-favorite.png`, `home-favorites.png`, and `home-search.png`, all under `round-0-final/head/`.

These are the supplied packaged-extension captures on sanitized live-derived pages with the original host CSS/assets and frame context. Per the supplied provenance, login was recaptured live on 2026-11-04; the student sidebar/main retain full legacy host DOM. Identities/favorites are synthetic, and the CAPTCHA is an anonymous expired host image. I have not independently validated their live-site fidelity. I did not treat synthetic names such as the step labels as product copy defects.

This is a visual audit of the supplied states, not an exercised interaction audit. Focus order, keyboard operation, focus containment/restoration, Escape, screen-reader names/announcements, true target areas, scrolling behavior, submit/error handling, motion, and contrast ratios are **unverified**. Only login has a supplied narrow-width capture in this assignment; English layouts and narrow states for the other five components are **unverified**. A pale control is a contrast risk, not a measured WCAG failure. The accessibility/responsive column evaluates the available visible evidence; its deductions do not assert unobserved implementation failures.

## Scores

Scale: 5 = usable with substantial weaknesses; 7 = competent with clear unresolved issues; 8 = polished with limited weaknesses; 9 = exceptionally resolved; 10 = no material improvement supported by the evidence. Each overall component score is the unweighted mean of its seven columns. Suite score is the mean of the unrounded component means. Numerical precision records this rubric, not a scientific measurement.

| Component                 | Color / contrast | Typography | Spacing / alignment | Hierarchy | Affordance / state clarity | Consistency | Accessibility / responsive evidence | Overall visual score |
| ------------------------- | ---------------: | ---------: | ------------------: | --------: | -------------------------: | ----------: | ----------------------------------: | -------------------: |
| Login                     |              7.5 |        8.0 |                 7.0 |       8.0 |                        7.0 |         8.0 |                                 7.0 |        **7.50 / 10** |
| Sidebar                   |              8.0 |        7.5 |                 8.0 |       7.5 |                        7.0 |         8.0 |                                 6.5 |        **7.50 / 10** |
| Expanded profile          |              8.0 |        8.0 |                 8.0 |       8.0 |                        6.0 |         8.0 |                                 6.0 |        **7.43 / 10** |
| Shared dialog             |              7.5 |        8.0 |                 8.5 |       6.5 |                        8.0 |         7.0 |                                 5.5 |        **7.29 / 10** |
| Homepage favorite cards   |              8.0 |        7.5 |                 8.0 |       7.5 |                        7.0 |         7.5 |                                 6.0 |        **7.36 / 10** |
| Homepage search / results |              7.5 |        8.0 |                 7.5 |       7.0 |                        6.5 |         7.5 |                                 6.0 |        **7.14 / 10** |

**Overall suite: 7.37 / 10.** The suite has a coherent visual system and readable primary content. The remaining gap is chiefly in visible state communication, bilingual destination identification, and the relationship between the extension shell and frame-local UI.

## Inspected states and findings

### 1. Login — healthy basic form; weaker supporting information

Evidence: standard (`round-0-final/head/login.png`), wide (`round-0-final/head/login-wide.png`), narrow (`round-0-final/head/login-narrow.png`).

The title, persistent labels, adequately spaced inputs, full-width primary button, and quieter secondary actions make the main task obvious. The narrow capture preserves the form without horizontal clipping and places announcements beneath it. The university branding is restrained rather than competing with the form. The CAPTCHA has visible audio and refresh controls, which are promising affordances; their naming and behavior are unverified.

Deductions:

- On both desktop widths, the announcements panel cuts through the third notice at its bottom edge. There is no visible continuation cue in these captures. A reader sees an incomplete dated announcement without a clear way to discover the rest. Add a visible scroll cue or an explicit “全部公告” link and a deliberate preview boundary; scrolling itself is unverified.
- At 1600px, the form remains a narrow column in the middle while the announcement panel sits close to the far right, separated by a conspicuously large gap. At 1280px the relationship is closer. A bounded two-column content container would make the form and supporting notices read as one composition across desktop widths.
- The narrow header becomes two rows of utility links beneath the brand/language row; the single “服務電話” item occupies the last line. It works, but the isolated link and then the large gap before the login title make the header feel unsettled. Use a deliberate two-column link arrangement or a compact utility grouping at this width.
- Help, password visibility, CAPTCHA audio, and refresh rely on small icons. Pale input outlines are also very quiet against white. Verify non-text contrast, accessible names, and actual hit areas; consider strengthening boundaries and providing visible help affordances where needed.

### 2. Sidebar — orderly tree; bilingual labels lose identity

Evidence: collapsed categories / empty favorites (`round-0-final/head/sidebar-classic.png`), expanded tree (`round-0-final/head/home-favorites.png`).

The neutral sidebar surface, consistent 36px-style rows, purple category icons, aligned chevrons, indentation, and tree guide lines make a large legacy menu substantially easier to scan. Search and the pinned identity row have clear boundaries. The empty favorites instruction is concrete and explains how to populate the section. A visible focus-like ring is present on the sidebar search in `home-favorites.png`, although keyboard focus behavior is unverified.

Deductions:

- Expanded bilingual destinations truncate frequently: “課程預排 Tentative sche…”, “預排系統 Tentative sche…”, and the deeper “課程預排 Tentative s…”. Indentation leaves less space exactly where destination specificity matters most. Preserve the complete Chinese title, and expose the English secondary label by a deliberate two-line layout or an accessible full-label disclosure; do not depend solely on a hover tooltip.
- A filled purple star distinguishes favorites from outlined stars reasonably well, but the icon is small and sits close to the expansion chevron in some parent rows. The screenshot cannot establish separate target areas. Give favorite and expand actions generous, distinct hit areas and verify that choosing one cannot inadvertently trigger the other.
- In the expanded state, a long favorites list consumes much of the initial sidebar height, while only a few categories remain visible below it. Consider a bounded, independently discoverable favorites region or a “show more” control so the main category tree remains easier to reach. Current scrolling is unverified.
- The header collapse control is a compact icon without visible text. Its behavior/name and narrow-layout replacement are unverified. Provide a discoverable label on hover/focus and test it at smaller widths.

### 3. Expanded profile — clean grouping; preference states are not visible

Evidence: expanded profile (`round-0-final/head/profile-expanded.png`).

The popover has consistent padding, readable section labels, a separate support group, and a divider before logout. External-link markers on support destinations communicate navigation well. The identity trigger remains visible below the popover, so its anchor is understandable. Logout uses the same dark text family as the other controls, consistent with the guideline.

Deductions:

- “使用選單模式” and “顯示登出倒數” look like ordinary command rows. Neither row communicates whether the preference is currently on or off. “還原面板排序”, which performs a different kind of action, receives the same treatment. Add visible switch/check state or state-bearing labels for the preferences, and retain an ordinary action treatment for reset. This is the component’s largest visible weakness.
- The identity trigger provides no strong visible expanded indicator in this capture; the open panel itself supplies most of the state information. A chevron or consistent pressed treatment would clarify the relationship.
- This capture does not show how the tall, bottom-anchored panel fits a shorter/narrower viewport. Verify available-height containment, internal scrolling, zoom, and English label wrapping before treating it as responsive.

### 4. Shared removal dialog — strong local content; ambiguous shell scope

Evidence: remove favorite dialog (`round-0-final/head/dialog-remove-favorite.png`).

The dialog is spacious and compact, with a specific item name, a short consequence statement, a neutral “保留” button, and a differentiated danger action. Button labels are concrete. The action does not imply deletion of the underlying university function. Typography and button alignment are calm and readable.

Deductions:

- The backdrop dims the main frame while the whole sidebar remains bright and visually available. The dialog is centered within that frame, not the full application. A removal originating from a favorite can therefore appear to block one region while leaving the other region unrelated to the decision. If this is intended to be a modal decision for the application, mount its backdrop and dialog at the shell level. If it is deliberately local, make that scope explicit and verify what navigation remains available. The still does **not** establish whether the sidebar is actually interactive or whether focus escapes.
- The dialog calls the destination “快速存取”, while the visible section is “常用功能”. Use the same term in the consequence statement, for example “此項目將從常用功能移除”, to reduce uncertainty about what changes.
- No narrow or long-title dialog is shown. Wrapping, button stacking, focus visibility, focus containment/restoration, and Escape dismissal remain unverified. The visually clean desktop dialog is not evidence for those behaviors.

### 5. Homepage favorite cards — legible, consistent grid; destination treatment varies

Evidence: favorites (`round-0-final/head/home-favorites.png`), same grid with profile open (`round-0-final/head/profile-expanded.png`).

The two-column grid has even gutters and consistent card heights. Icon circles, 16px labels, and isolated star actions form a clear repeated pattern. Filled favorite stars versus the outlined star on the recent item communicate saved status. The “顯示全部 →” link sits at the end of the favorites group and the recent group has a separate heading.

Deductions:

- The eform destination has an external-link marker in the sidebar, but its homepage card has none. The card presents the same destination with less information about where it opens. Carry the external-destination cue consistently into the card.
- The bilingual recent item truncates to “填寫教學意見調查 Course eva…”, while the adjacent right-column space is empty. A card sized or wrapped for bilingual labels would use that space better and preserve identity. Test long English labels across all card states.
- Large branding and the generous gap above search place the first useful card around the middle of the viewport. The page looks calm, but the visual hierarchy gives the NTHU wordmark more weight than the task list. Modestly reduce the brand block/vertical gap to bring frequent actions higher without compressing the cards.
- Cards and stars appear actionable, but hover, card focus, star focus, full click regions, and accessible names are unverified. Narrow stacking is not shown.

### 6. Homepage search / results — readable results; weak explanation of state

Evidence: search for 教學 (`round-0-final/head/home-search.png`).

The query is visible, the clear control is easy to locate, and large result rows are readable. The rounded boundary visibly connects results to the search field. Bilingual result titles fit more completely than in the compact sidebar. The pale fill on the first result communicates some row emphasis, although whether it denotes hover, focus, or selection is unverified.

Deductions:

- Six plain result rows are shown without category/path context, result count, or a visible explanation of the ordering. Similar teaching/evaluation destinations require careful reading. Add a restrained secondary category/path line when it helps distinguish similarly named functions, and make the result state/count explicit.
- Matching query text is not visually distinguished within the titles. Subtle emphasis of the matching “教學” term would aid scanning without adding another color.
- The large dropdown covers the favorites heading and most of its grid; the bottom cuts across the underlying cards. This is normal overlay behavior but creates a busy overlap here. Use a deliberate search mode or more distinct elevation/separation so search results read as a clear foreground layer, and constrain/scroll the list for longer result sets.
- The first-row emphasis is very pale and the panel border is a pale purple ring. Verify contrast and ensure keyboard focus has an unmistakable indicator distinct from hover. No empty, loading, no-results, long-query, English, or narrow results state is present in this assignment; each remains unverified.

## Prioritized improvements

1. **P1 — Make preference state visible** (`profile-expanded.png`). Add clear on/off indications to menu mode and logout countdown. Keep reset as a command. Users should understand current settings before taking action.
2. **P1 — Resolve removal-dialog scope** (`dialog-remove-favorite.png`). Align its backdrop and interaction boundary with the intended application scope, and verify keyboard containment across frames. The visibly undimmed sidebar is the highest cross-component hierarchy concern. Also use “常用功能” consistently in the consequence text.
3. **P2 — Preserve bilingual destination identity** (`home-favorites.png`, `profile-expanded.png`). Resolve truncated tree/recent labels with intentional wrapping or secondary labels, preserve distinguishing text at nested levels, and carry external-link markers consistently between sidebar and cards.
4. **P2 — Clarify search state and result context** (`home-search.png`). Add modest path/context, matched-term emphasis, and a clear focus treatment. Make foreground separation from the covered cards more deliberate.
5. **P2 — Finish the login’s supporting layout** (`login.png`, `login-wide.png`, `login-narrow.png`). Show how to reach complete announcements, bind desktop columns into one composition, and avoid the lone utility link on its own narrow header row.
6. **P2 — Add the missing evidence before claiming accessibility/responsive completion.** Exercise keyboard/focus and screen-reader behavior; measure actual contrast and hit targets; capture narrow and English versions of sidebar, profile, dialog, cards, and results, plus errors/empty states. These are verification needs, not asserted failures.
