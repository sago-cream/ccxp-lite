# Independent packaged UI assessment — reviewer B, round 7

Suite: **8.7/10**. This is a polished, cohesive utility interface with strong legibility and clear action states. The main remaining opportunity is to make the narrow sidebar experience as easy to scan and learn as the full-width Menu experience. No blocking visual defect appears in the supplied captures.

## Evidence and limits

I opened all 15 PNGs in `round-7/head` with `view_image`, plus nine English-control PNGs in `round-7-english/head`: desktop/narrow profile, dialog, favorites and search, and narrow Menu. These are packaged-extension captures of sanitized live-derived host DOM/assets in their original frames. Identity and favorites are synthetic data entered through actual controls. This review assesses the representative student role and Chinese host. The additional current survey entry remains a documented coverage gap. English controls demonstrate control-label fit; they do not establish English-host fidelity.

Supplied verification outside this image review: primary/danger contrast ≥4.5:1; focus/input contrast ≥3:1; native modal focus trapping and whole-frameset inertness; live Tab/Escape and focus restoration; profile switch state; keyboard search; touch-style Menu opening labeled navigation; favorites cap of four expanding to ten, keyboard operation and custom ordering. I accept those as supplied verification, not independently observed behavior. Screenshots alone do not establish screen-reader announcements, every zoom level, all roles or all host states.

## Scores

All dimensions are out of 10. Responsive/accessibility is a visual assessment informed by the supplied checks, not a conformance certification. Component totals are rounded judgments rather than a count of defects.

| Component              | Color / contrast | Typography | Spacing | Hierarchy | Consistency | Interaction affordances | Visible responsive / accessibility | Overall |
| ---------------------- | ---------------: | ---------: | ------: | --------: | ----------: | ----------------------: | ---------------------------------: | ------: |
| Login                  |              9.0 |        8.7 |     8.5 |       8.8 |         8.7 |                     8.6 |                                8.4 | **8.7** |
| Sidebar / Menu         |              8.9 |        8.3 |     8.3 |       8.4 |         8.8 |                     8.0 |                                8.1 | **8.4** |
| Profile                |              9.0 |        8.7 |     8.9 |       9.0 |         9.0 |                     8.8 |                                8.8 | **8.9** |
| Remove-favorite dialog |              9.3 |        9.1 |     9.1 |       9.4 |         9.2 |                     9.2 |                                9.2 | **9.2** |
| Home favorites         |              9.0 |        8.5 |     8.4 |       8.5 |         9.0 |                     8.6 |                                8.2 | **8.6** |
| Home search            |              9.1 |        8.8 |     8.7 |       9.0 |         9.0 |                     9.0 |                                8.8 | **8.9** |
| Suite                  |              9.1 |        8.7 |     8.6 |       8.9 |         9.0 |                     8.7 |                                8.6 | **8.7** |

## Component findings

**Login:** The wide layout has a clear form/announcements split and a strong single primary action. Inputs, labels and supporting actions remain comfortably readable in `login-narrow.png`; the announcement card stacks cleanly. The 145px narrow header and generous vertical form rhythm put announcements below the first viewport. That is a reasonable login-first priority, but the secondary institutional links consume noticeable space before the main task. The captcha’s audio/reload icons are recognizable yet less immediately explicit than the labeled form controls; their accessible names were not inspected here. Wide whitespace feels intentional rather than broken.

**Sidebar / Menu:** Desktop navigation is compact but well ordered, with stable icon/text/chevron alignment, indentation guides and distinct filled favorite stars. Long bilingual labels wrap in the 324px sidebar, making expanded groups materially denser than the home cards. In the narrow home captures the 64px icon rail reserves roughly one sixth of the viewport, leaving a relatively narrow content column. Unlabeled category shortcuts require learning the icon vocabulary. The visible Menu button and verified labeled navigation provide a usable route; this is a discoverability/efficiency deduction, not a claim that navigation is inaccessible. `sidebar-menu-narrow.png` is particularly successful: full-width labels, short summaries, consistent cards and a clear return action. English control labels fit cleanly.

**Profile:** Desktop and narrow popovers have clear Preferences / Support separation, aligned values and chevrons, a visibly off timer switch, and a separated logout action. The narrow panel stays inside the viewport and its trigger remains visible above it. The English version accommodates longer labels without clipping. The popup visually obscures underlying cards as expected for this surface. The navigation setting’s compact current-value-plus-chevron treatment is understandable, although a first-time user still has to open it to discover the available modes. No material layout issue is visible.

**Dialog:** The strongest component. Both languages show a precise title, concise consequence/recovery explanation and distinct Keep/Remove actions. A visible focus ring on the safe action is easy to locate. The backdrop visibly covers the sidebar and main content together, while the narrow dialog keeps comfortable margins and accommodates the longer English explanation. The red destructive action and purple focus indicator serve different, clear roles. The supplied focus/inertness checks substantiate the interaction quality; the image review does not independently prove them. No material visual deduction beyond ordinary scope limits.

**Home favorites:** Desktop cards provide a clean two-column scan, consistent category metadata, aligned star controls and sensible long-label wrapping. The narrow single-column presentation remains legible in Chinese and English. Its tradeoff is vertical cost: several bilingual cards use two title lines plus metadata, so the list extends well beyond the first viewport and recent items are less immediately reachable. The compact rail contributes to those wraps; the Menu capture shows that wider cards can fit the same long title in one line. The small right-aligned desktop Show all action is visually quieter than the broad Show all favorites button in Menu, making expansion less prominent on the home surface. Synthetic step names are not treated as a product-copy defect.

**Home search:** The search surface has excellent emphasis: a strong perimeter, clear query/clear control, result count/category context, visible matching terms and a distinct active-result outline. The narrow first-result and end-result captures show that wrapped rows and the final selected row remain contained. The empty state explains how to recover. English result metadata fits in the available width. A residual discoverability opportunity is the absence of visible keyboard-navigation guidance; keyboard operation is verified, but the screenshots do not advertise it. This is an optional enhancement, not a behavioral defect. Long typed queries naturally exceed the visible input width; no claim of lost query data is made.

## Priority feedback

1. **Improve narrow content efficiency.** Evaluate whether opening labeled Menu more prominently, or reducing the persistent rail’s footprint while reading home cards, gives bilingual titles more width. Preserve direct access and user-selected navigation mode. Evidence: `home-favorites-narrow.png` versus `sidebar-menu-narrow.png`, including English controls.
2. **Unify expansion affordance strength.** Consider giving the home favorites Show all control the same obvious relationship to the list as the full-width Menu expansion button. Keep the visible total where practical. Evidence: desktop `home-favorites.png` versus narrow Menu.
3. **Polish secondary discoverability.** Compact the narrow login’s institutional links if above-the-fold efficiency is a goal, and consider unobtrusive keyboard hints for search. Neither is a release blocker.

I would preserve the restrained palette, measured border treatment, card alignment, profile grouping, modal copy/action hierarchy and clearly visible search selection. Further score gains should come from narrow-screen efficiency and first-use discoverability, not more decoration.
