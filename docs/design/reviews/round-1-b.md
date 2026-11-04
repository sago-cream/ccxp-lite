# Independent current-state UI assessment — reviewer B

Assessment date: 2026-11-04. Product: ccxpLite, a Traditional Chinese/English extension for NTHU university systems. Reviewed against `docs/design/guidelines.md`. This review was completed independently; no other reviewer reports were consulted and no product files were edited.

## Scope and evidence

All 13 supplied PNGs in `round-1-settled/head/` were opened with `tools.view_image` at original detail. These are supplied captures of the actual packaged extension, with complete sanitized live-derived legacy DOM, original embedding, and real host CSS/assets. Per the supplied provenance, the login source was recaptured on November 4, 2026, and current packaged menu/profile/search/cards/dialog were inspected natively on the live site. Identities and favorites are synthetic; the CAPTCHA is an expired anonymous image. Narrow home uses the real compact-rail preference; narrow profile/sidebar uses real menu mode. No injected components, themes, or layout overrides were used.

Supplementary supplied measurements: primary against white 5.73:1, danger against white 5.47:1, and input boundaries greater than 3:1. Packaged narrow checks cover native modal behavior and Tab/Shift+Tab focus containment. These are useful strengths, not a complete accessibility certification.

The goal assessed is finding and using a university function, keeping favorites, managing preferences, and signing in without unnecessary friction. Scores describe observed execution. Unobserved behavior and assistive-technology support are unverified, not assumed failures.

## Scores

Each dimension is out of 10. Overall component scores are the equal-weight mean of their seven dimensions, rounded to one decimal. The suite score is the mean of all 42 dimension scores, rounded to one decimal: **8.8/10**.

| Component              | Color / contrast | Typography | Spacing / alignment | Hierarchy | Affordance / states | Consistency | Observed responsive / accessibility execution | Overall |
| ---------------------- | ---------------: | ---------: | ------------------: | --------: | ------------------: | ----------: | --------------------------------------------: | ------: |
| Login                  |              9.0 |        8.8 |                 8.8 |       9.0 |                 8.7 |         9.0 |                                           8.7 | **8.9** |
| Sidebar                |              8.9 |        8.6 |                 8.6 |       8.5 |                 8.3 |         8.8 |                                           8.0 | **8.5** |
| Expanded profile       |              9.0 |        8.8 |                 8.8 |       8.9 |                 8.4 |         9.0 |                                           8.5 | **8.8** |
| Remove-favorite dialog |              9.2 |        9.2 |                 9.3 |       9.4 |                 9.2 |         9.2 |                                           9.3 | **9.3** |
| Favorite cards         |              9.0 |        8.1 |                 8.2 |       8.7 |                 8.2 |         8.9 |                                           8.0 | **8.4** |
| Homepage search        |              8.9 |        8.7 |                 8.4 |       8.8 |                 8.4 |         8.8 |                                           8.5 | **8.6** |

## Screenshot steps and findings

1. **Sign in — healthy.** [Default](round-1-settled/head/login.png), [wide](round-1-settled/head/login-wide.png), [narrow](round-1-settled/head/login-narrow.png). The form has visible labels, strong input boundaries, a clear purple primary action, restrained secondary actions, and nearby password/CAPTCHA controls. The desktop announcement panel stays subordinate to sign-in. The narrow page reflows into a single column with the main action and recovery link intact. Minor deductions: the generous gap between the heading and first field makes the mobile form taller, and the three equally wide action pills give the secondary destinations more visual weight than their role warrants. Neither blocks the task. The announcement preview deliberately clips content behind its footer; it is not evidence of lost content. Error, loading, help-open, English, and zoom states are unverified.

2. **Browse navigation — healthy with a narrow-header defect.** [Classic sidebar](round-1-settled/head/sidebar-classic.png), [populated sidebar](round-1-settled/head/home-favorites.png), [narrow menu](round-1-settled/head/sidebar-menu-narrow.png), [compact rail](round-1-settled/head/home-favorites-narrow.png). The neutral navigation surface, purple category icons, aligned chevrons, clear tree guides, and persistent profile control create a coherent structure. Empty favorites explain how to add an item. Populated trees become visually busy because favorites, expandable branches, and repeated leaf entries share similar emphasis, but labels remain readable. In narrow menu mode the brand title visibly runs into the search control and the final character is clipped without a clear truncation treatment. The compact rail is an explicitly selected real preference; icon-only presentation is not itself a defect. Accessible names and tooltip behavior were not inspected.

3. **Open profile preferences — healthy.** [Desktop](round-1-settled/head/profile-expanded.png), [narrow](round-1-settled/head/profile-expanded-narrow.png). Group headings, predictable 36px rows, support-link styling, and a divider before logout make the menu easy to scan. The narrow popup fits within the viewport and gives its contents comfortable separation. Minor deductions: the current-value pills for navigation mode and logout countdown look more like static status labels than controls. A consistent trailing disclosure or control treatment would make changeable rows more discoverable. The narrow header clipping belongs to the sidebar finding above; the popup itself does not overflow. Escape, keyboard activation, focus restoration, and preference transitions were not independently exercised in this review.

4. **Confirm removal of a favorite — very healthy.** [Desktop](round-1-settled/head/dialog-remove-favorite.png), [narrow](round-1-settled/head/dialog-remove-favorite-narrow.png). The named item in the title and explicit explanation that the function can be added again remove ambiguity. Danger color is reserved for confirmation; retaining the favorite is visibly focused. The backdrop gives the modal strong separation, and both actions remain aligned and readable after the body wraps at narrow width. The supplied modal and focus-containment checks support the observed design. There is no material visible defect to fix. A shorter title punctuation treatment would be subjective polish only. Full screen-reader announcement behavior remains unverified.

5. **Use favorite cards — healthy; narrow density can improve.** [Desktop](round-1-settled/head/home-favorites.png), [narrow](round-1-settled/head/home-favorites-narrow.png). The icon, function label, category subtitle, favorite state, and external destination indicator form a clear hierarchy. The desktop grid has consistent edges and comfortable spacing. Narrow cards retain all labels and controls without overflow, but the combination of rail, outer gutters, icon column, and star column leaves little text width. `課程預排 Tentative schedule` becomes three lines, while `畢業生離校程序說明` leaves the final character on its own line. Unequal card heights make a long favorites list slower to scan. This is a density/typography improvement, not hidden content or a broken responsive layout. The filled/unfilled star distinction is visible; accessible names and full activation targets were not measured.

6. **Search for a function — healthy.** [Desktop results](round-1-settled/head/home-search.png), [narrow results](round-1-settled/head/home-search-narrow.png). The query stays visible, result count provides orientation, matched words are emphasized, categories clarify context, the first result has a visible focus/selection treatment, and clear is easy to locate. The narrow panel fits its available content area and wraps bilingual labels. Minor deductions: the result list cuts through the next row at its lower boundary, with no persistent visible scroll cue in these stills; six results are reported while only part of the list is shown. Consider a subtle scroll affordance or a result-area height that ends on a full row when practical. The large purple outline around the entire panel is somewhat visually heavy, but that is subjective polish. Keyboard result navigation, announcement of result changes, no-results, loading, error, and English states are unverified.

## Prioritized changes

### Required visible fix

1. **Prevent narrow menu-header branding from being clipped.** Evidence: `sidebar-menu-narrow.png` and `profile-expanded-narrow.png`. Reserve explicit room for the search and profile controls and let the brand text truncate with an ellipsis, or use a deliberate abbreviated/logo-only brand presentation at that width. Keep the complete accessible brand name. Priority: medium. This is a visible layout defect, although the main tasks remain available.

### Recommended polish, not release blockers

2. **Recover text width in narrow favorite cards.** Evidence: `home-favorites-narrow.png`. Reduce the narrow content gutters or card horizontal padding and tighten the decorative icon allocation, while retaining the real favorite control. Recheck the supplied bilingual title and the one-character CJK orphan. Do not shrink the prescribed 16px function labels just to force them to fit.

3. **Give changeable preference rows a clearer action cue.** Evidence: both expanded-profile captures. Use a consistent disclosure or appropriate state-control treatment for the navigation-mode and logout-countdown rows. Their value pills currently communicate state more clearly than editability. Keep the existing compact row rhythm.

4. **Clarify that search results continue below the visible panel.** Evidence: both search captures. A subtle scroll cue or more deliberate row cutoff would help people understand the six-result count. This is a still-image affordance concern; it does not establish a scrolling failure.

5. **Consider reducing mobile login height slightly.** Evidence: `login-narrow.png`. Tighten the gap above the first field and/or the spacing around secondary destinations while preserving generous field and button targets. The current form is usable; this is throughput polish.

## Evidence limits

All requested screenshots were inspected. No browser or product code was used to infer missing states. Supplied contrast and modal checks were accepted as supplementary evidence, not independently rerun. Focus styling is visible on several inputs/buttons, but screenshots cannot establish complete keyboard order, accessible names/roles, screen-reader behavior, Escape dismissal, focus restoration, target hitboxes, reduced motion, or zoom resilience. English labels are present in mixed-language content; a complete English UI and its long labels are not shown. No points were deducted simply because these states were unobserved.
