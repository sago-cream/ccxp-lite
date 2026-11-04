# Independent visual review — reviewer A

**Suite visual-design score: 8.0/10.** The extension has a coherent, restrained design language: purple actions and navigation, white content, tinted navigation and secondary surfaces, consistent borders, and readable Traditional Chinese/English text. The primary opportunities are modal scope clarity, visibility of clipped content, and preserving complete bilingual function names. No redesign is needed to address these.

## Scope and evidence

I personally opened all eight supplied files with `tools.view_image` and read `docs/design/guidelines.md`. This is a still-image review of the packaged extension, not an interaction or implementation audit. No source files were changed, no browser was opened, and no other reviewer's findings were inspected.

The capture provenance supplied for this review is: sanitized live-derived legacy pages, real host CSS/assets, and original frame embedding; login recaptured live on 2026-11-04; complete legacy student sidebar/main DOM retained; synthetic names, credentials, and favorites; anonymous expired host CAPTCHA; no layout/theme overrides or isolated module injection. These facts were supplied by the capture author and were not independently revalidated in this read-only image review.

Screenshots below are the exact inspected evidence, linked relative to this report. The numbers identify review steps, not an observed interaction sequence.

1. Login, standard (`round-0-final/head/login.png`) — healthy, clear form hierarchy.
2. Login, wide (`round-0-final/head/login-wide.png`) — healthy, controlled form width; announcement continuation could be clearer.
3. Login, narrow (`round-0-final/head/login-narrow.png`) — healthy visible reflow; form and secondary links fit.
4. Classic sidebar (`round-0-final/head/sidebar-classic.png`) — healthy, easy to scan; empty favorites instruction visible.
5. Expanded profile (`round-0-final/head/profile-expanded.png`) — healthy grouped preferences/support panel; action semantics need interaction checks.
6. Remove favorite dialog (`round-0-final/head/dialog-remove-favorite.png`) — clear content and danger action; visually ambiguous backdrop scope.
7. Homepage favorites (`round-0-final/head/home-favorites.png`) — healthy card organization; long bilingual labels truncate.
8. Homepage search (`round-0-final/head/home-search.png`) — healthy result list and query visibility; selected-row semantics unverified.

## Scores

Scores judge visible execution, not WCAG compliance. Color scores reflect visual legibility, not measured contrast ratios. Affordances/states scores cover only visible controls and depicted states. A missing test is not scored as a design defect.

| Component          | Color / contrast | Typography | Spacing / alignment | Visual hierarchy | Affordances / visible states | Consistency | Responsive / accessibility evidence                                     | Overall |
| ------------------ | ---------------: | ---------: | ------------------: | ---------------: | ---------------------------: | ----------: | ----------------------------------------------------------------------- | ------: |
| Login              |              8.0 |        8.5 |                 8.0 |              8.5 |                          8.0 |         8.5 | 8.0 for visible wide/narrow reflow and labels; keyboard/AT not-observed | **8.2** |
| Sidebar            |              8.5 |        8.0 |                 8.5 |              8.0 |                          8.0 |         8.5 | Narrow/zoom/keyboard/AT not-observed; readable desktop labels visible   | **8.2** |
| Expanded profile   |              8.5 |        8.5 |                 8.5 |              8.0 |                          7.5 |         8.5 | Narrow/zoom/keyboard/AT not-observed; grouped labels visible            | **8.2** |
| Dialog             |              8.0 |        8.5 |                 8.5 |              7.0 |                          7.5 |         8.0 | Narrow/zoom/focus containment/Escape/AT not-observed                    | **7.6** |
| Homepage favorites |              8.5 |        8.0 |                 8.5 |              7.5 |                          8.0 |         8.5 | Narrow/zoom/keyboard/AT not-observed; desktop grouping visible          | **8.1** |
| Homepage search    |              8.5 |        8.5 |                 8.5 |              8.0 |                          8.0 |         8.5 | Narrow/zoom/keyboard/AT not-observed; desktop results visible           | **8.3** |

Suite score is an overall judgment, rounded to one decimal, with the modal ambiguity and limited responsive evidence kept in view; it is not a compliance score or a behavioral pass rate.

## Findings and actionable feedback

### 1. Login — 8.2/10

**Strengths:** In all three login images the primary purple 登入 button is immediately distinct from the two outlined alternatives. The field labels remain visible above the controls, and account/password help icons occupy consistent positions. Controls have generous vertical space. CAPTCHA audio and refresh buttons are visually separate, and password visibility has a recognizable eye icon. On the narrow capture the form fits the viewport, header links wrap without colliding, and announcements move below the form. The form stays a usable fixed reading width on wide screens instead of stretching.

**Visible opportunity, P2:** In `login.png` and `login-wide.png`, the announcement card ends in the middle of the 2026/08/03 announcement. Its rounded lower boundary is visible, but there is no visible scrollbar, fade, or continuation label. A user can reasonably mistake this for cut-off content. Add a persistent continuation cue or make the bounded scroll region easier to discover while preserving complete announcement text. Verify actual scrolling separately; the still does not prove it is broken.

**Polish, P3:** In `login-narrow.png`, the CAPTCHA image and its two circular actions are left-aligned below the input while the action stack is centered/full width. This remains usable; consider a stable single alignment rule for that group if polishing the narrow form. The wide layout's large empty areas are restrained and do not by themselves justify changing its proportions.

**Not observed:** Validation errors, required-state indication, loading/disabled states, help content, keyboard order, actual audio access, English page layout, zoom, and screen-reader names. The supplied CAPTCHA is expired, so its visible content is not evidence of login behavior.

### 2. Sidebar — 8.2/10

**Strengths:** `sidebar-classic.png` separates navigation using a light neutral pane and a clear right border. Purple category icons, aligned labels and right-side chevrons create a steady rhythm. The search field is prominent without overpowering navigation. The empty 常用功能 branch includes an explicit instruction instead of an unexplained blank list. The bottom identity pill is easy to locate.

**Visible opportunity, P2:** `home-favorites.png` and `dialog-remove-favorite.png` show long bilingual labels such as 課程預排 Tentative sche… and deeper 預排系統 Tentative sche… shortened in the tree. Chinese labels preserve much of their meaning, but English readers lose the distinguishing suffix. Preserve access to the full name through wrapping where practical or a focus/pointer-accessible full-label disclosure; do not rely on a hover-only tooltip. The presence of such a disclosure is not-observed.

**Polish, P3:** With many favorites expanded, the favorite list consumes most of the upper navigation pane and pushes regular categories down. The capture still reads clearly, but consider a visible compact/all-favorites option if longer real lists are common. The synthetic list is not proof that actual users encounter overload.

**Not observed:** Collapsed-width layout, narrow window handling, sidebar scrolling, hit areas around chevrons/stars, selected page semantics, keyboard tree navigation, or accessible names for the collapse icon.

### 3. Expanded profile — 8.2/10

**Strengths:** `profile-expanded.png` places preferences and support in a white bordered panel above the identity pill. Headings, section spacing, the divider before 登出, and repeated 36px-looking rows make the grouping legible. Purple support links and external-link icons distinguish navigation from the darker preference actions. Logout receives the same quiet treatment as the guidelines specify.

**Visible opportunity, P2:** 使用選單模式 and 顯示登出倒數 are presented as action rows without any visible current-state marker. If these are toggles, show their current values/checks so users can predict what a click will change. If they open settings, a clear navigation affordance would help. The still cannot establish which model is intended, so this is a conditional recommendation rather than a confirmed functional defect.

**Polish, P3:** The identity pill receives a subtle tinted treatment while expanded; the connection to the larger white panel is understated. A clearer expanded indicator on the pill could improve discoverability, provided it matches the existing row language.

**Not observed:** Opening/closing behavior, whether the panel is focus-contained or a disclosure, preferences' actual state, keyboard dismissal, and narrow-height overflow behavior.

### 4. Remove-favorite dialog — 7.6/10

**Strengths:** `dialog-remove-favorite.png` names the exact item, explains that it will disappear from quick access, and gives a plain 保留 alternative. The red 確認移除 button correctly reserves danger color for removal. Dialog padding, two-button alignment and width are clean. The concise copy avoids making a reversible favorite removal appear like data deletion.

**Visible issue, P1:** The main content is dimmed, but the entire sidebar remains bright and visually available. Because that sidebar also contains the same favorite stars and navigation, the active boundary is ambiguous. Use a backdrop that visually covers the full relevant application surface, or make an intentionally pane-scoped dialog's boundary clear and consistent. This is a visible scope issue; the screenshot does **not** prove the sidebar remains clickable or that keyboard focus escapes.

**Not observed:** Focus entry, visible focus, focus containment/restoration across frames, Escape dismissal, background inertness, accessible dialog name/description, or narrow-screen button wrapping. These are required follow-up checks, not verified failures.

### 5. Homepage favorites — 8.1/10

**Strengths:** `home-favorites.png` uses an orderly two-column card grid with consistent gutters, tinted icon circles and right-aligned favorite stars. Content labels are visually larger than sidebar labels, matching the documented emphasis. The outline star in 最近使用 and filled stars in 常用功能 convey distinct saved states without relying solely on color. 顯示全部 is positioned after the capped favorite grid.

**Visible opportunity, P2:** The recent-use card truncates 填寫教學意見調查 Course eva… even though its section has ample unused horizontal space. Give long bilingual recent items more room, allow sensible wrapping, or guarantee a visible full-name disclosure on focus. Preserve readable Chinese and complete English access.

**Polish, P3:** The NTHU lockup is substantially more visually dominant than the task headings, and the favorites begin well below the top of the viewport. A modest reduction in branding scale or top whitespace could bring frequent actions higher, particularly on shorter screens. This is a hierarchy optimization, not evidence of broken layout.

**Not observed:** Whole-card click target, separation of star actions from navigation, tooltips, reordering, 顯示全部 behavior, empty recent-use state, narrow grid reflow, or live announcements after saving/removal.

### 6. Homepage search — 8.3/10

**Strengths:** `home-search.png` keeps the entered query 教學 visible, adds a clear control at the upper right, and places full-width result rows directly beneath the query. The result typography is readable, including the full first bilingual course-evaluation label. A restrained neutral highlight distinguishes the first row; purple outline ties the result panel to the search field. The panel overlays the card region cleanly without distorting its grid.

**Visible opportunity, P3:** The result list contains no visible count or explanatory status. A compact result count could make larger query sets easier to assess, although six visible rows are already easy to scan. Avoid adding redundant status copy solely for this small set.

**Interaction check, not a confirmed visual defect:** The first row's grey fill may indicate keyboard selection, hover, or a default suggestion. Verify that a selected result is also indicated through semantics and an observable keyboard focus pattern, and that Enter, Escape, arrow keys and the clear control behave predictably. The image cannot identify the state source or test any of these actions.

**Not observed:** No-results state, loading, query matching rules, result announcements, focus management, mobile overflow, or long-result wrapping.

## Priority order

1. **P1:** Resolve the visible modal/backdrop scope ambiguity across main pane and sidebar (`dialog-remove-favorite.png`). Check background inertness and focus separately.
2. **P2:** Make announcement continuation discoverable (`login.png`, `login-wide.png`).
3. **P2:** Preserve access to full bilingual sidebar and recent-use labels (`home-favorites.png`, `dialog-remove-favorite.png`).
4. **P2, conditional:** Expose current values or destination affordances for profile preference rows (`profile-expanded.png`).
5. **P3:** Consider modest homepage branding/spacing reduction only after short-height and narrow captures show a practical benefit.

## Verification boundaries

Only login has multiple viewport captures. Responsive quality for sidebar, expanded profile, dialog, favorites and search is **not-observed**. Only the Traditional Chinese-led interface with some English labels is shown; full English localization is **not-observed**. Contrast ratios, DOM semantics, accessible names, screen-reader output, focus behavior, keyboard operation, reduced motion, touch targets and dynamic state transitions are **not-observed**. No still-image finding here should be read as a claim that those behaviors pass or fail.
