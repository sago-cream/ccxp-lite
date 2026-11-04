# Independent packaged UI assessment — reviewer B, round 8

Suite: **9.0/10**. The supplied interface is coherent, legible and well resolved across the reviewed desktop and phone states. Full-width Menu is a stronger phone entry experience: it gives bilingual favorites room to breathe and exposes labeled navigation directly. The bordered home favorites disclosure has an obvious relationship to its section. No blocking visual defect appears in these captures.

## Evidence and boundaries

I opened all 18 PNGs in `round-8-audit/head` with `view_image`, and the 12 requested PNGs in `round-8-audit-english/head`: desktop/narrow profile, remove dialog, favorites and search; narrow Menu; and `phone-menu-favorites`, `phone-menu-search`, `phone-menu-dialog`. Total: 30 images. No code or browser review was performed.

The evidence is packaged-extension rendering of sanitized live-derived host DOM/assets in original frames, with synthetic identity/favorites entered through actual controls. It represents the student role and Chinese host. The additional current survey entry and unavailable entitlement/role/period/widget states remain coverage limits. English controls demonstrate control-label fit against the Chinese host; they do not establish English-host fidelity. Matched base/head fixtures support regression comparison, not comprehensive live-site fidelity.

Supplied capture assertions establish that unconfigured windows at ≤600px start in genuine full-width Menu, while explicit saved choices are respected. The `phone-menu-*` images represent that phone default. Retained `home-*-narrow` rail images represent an explicitly saved Sidebar preference stress state. I do not treat the rail as the initial phone flow.

Supplied verification outside this image review: primary/danger contrast ≥4.5:1 and focus/input ≥3:1; native modal focus trapping and whole-frameset inertness; live Tab/Escape and focus restoration; profile switch state; keyboard search; labeled Menu navigation; favorite limits/expansion, keyboard operation and custom ordering; 230 unit and 17 browser checks passing. Those are accepted as supplied results, not independently reproduced. Images cannot establish screen-reader output, hit-box dimensions, every zoom level, or all host states.

## Scores

All scores are out of 10. Responsive/accessibility scores reflect visible presentation plus the supplied checks, not a conformance certification. Overall scores are rounded design judgments.

| Component              | Color / contrast | Typography | Spacing | Hierarchy | Consistency | Interaction affordances | Visible responsive / accessibility | Overall |
| ---------------------- | ---------------: | ---------: | ------: | --------: | ----------: | ----------------------: | ---------------------------------: | ------: |
| Login                  |              9.0 |        8.7 |     8.7 |       9.0 |         8.8 |                     8.6 |                                8.7 | **8.8** |
| Sidebar / Menu         |              8.9 |        8.7 |     8.9 |       9.0 |         8.9 |                     8.9 |                                9.0 | **8.9** |
| Profile                |              9.0 |        8.7 |     8.9 |       9.0 |         9.0 |                     8.8 |                                8.8 | **8.9** |
| Remove-favorite dialog |              9.3 |        9.1 |     9.1 |       9.4 |         9.2 |                     9.2 |                                9.2 | **9.2** |
| Home favorites         |              9.0 |        8.9 |     9.0 |       9.1 |         9.1 |                     9.2 |                                9.1 | **9.1** |
| Home search            |              9.1 |        8.8 |     8.9 |       9.0 |         9.0 |                     8.9 |                                9.0 | **8.9** |
| Suite                  |              9.1 |        8.8 |     8.9 |       9.1 |         9.0 |                     8.9 |                                9.0 | **9.0** |

## Findings

**Login — 8.8:** The desktop form/announcement split is calm and easy to understand, with readable field labels and a dominant Login action. The narrow capture uses a roughly 99px header, giving the form and announcement content more immediate space. Form controls retain comfortable dimensions and spacing. The residual tradeoff is the four institutional utility links on a single compact row: the labels and external-link icons sit very close together. They remain readable, but distinct visual click/touch regions are less obvious than elsewhere in the interface. This is a minor utility-navigation polish issue; no hit-box or accessibility failure is claimed. Captcha audio/reload icons remain recognizable but less explicit than labeled controls; accessible naming was not inspected.

**Sidebar / Menu — 8.9:** Desktop typography, aligned icons/chevrons, indentation guides and filled/outline stars provide a stable navigation vocabulary. Expanded bilingual desktop groups are dense, but contained and readable. The phone default in `phone-menu-favorites.png` is substantially stronger: full-width labels, a compact four-item favorites preview, a clear counted expansion action, and labeled category cards. The alternate-mode action says Use sidebar rather than implying a previous state, and its English text fits. The saved Sidebar rail still trades text labels and content width for persistent shortcuts; that is an explicit preference tradeoff, not a default-flow defect. No need to remove the option follows from these images.

**Profile — 8.9:** Preferences, support links and logout form clear groups, with aligned current values and a visibly off switch. The narrow popup stays within the viewport and maintains its relationship to the avatar trigger. English labels fit without clipping. The navigation preference is understandable as a setting with a current value and deeper choices. No material visual issue is visible. Behavior claims about switching, focus or dismissal rely on the supplied checks.

**Dialog — 9.2:** The modal remains the strongest component. Desktop, saved Sidebar phone and default Menu phone all show a precise item-specific title, consequence/recovery text, clearly separated safe/destructive actions and a conspicuous safe-action focus ring. The backdrop covers the entire visible host surface, including navigation. The longer English body wraps naturally inside comfortable margins. Native modal and keyboard verification substantiate the interaction quality, but were not reproduced here. No new visual issue appears in the default phone embedding.

**Home favorites — 9.1:** Desktop cards align consistently and distinguish function titles, category metadata, external destinations and favorite state. The bordered Show all favorites (10) action sits directly under the grid, with enough visual weight and a clear total. Default phone Menu exposes four favorites and the expansion action before labeled All categories; bilingual titles such as Tentative schedule and Course evaluation fit on one line in the supplied examples. This addresses the narrow-width efficiency issue. The explicitly selected Sidebar version still needs multi-line titles and more scrolling, but remains legible. Synthetic step labels are not treated as product-copy defects. The different desktop/card and Menu/list presentations are coherent adaptations to space, not a visual inconsistency requiring identical layouts.

**Home search — 8.9:** Desktop search has a clear query/clear affordance, result count/context, matching-term emphasis and a strong active-result outline. Saved Sidebar narrow captures retain readable first/last selection and a helpful empty state. Default phone Menu search gives results generous width, groups them with meaningful headings, retains the query visibly at the top, and places stars consistently at the right. The focused result is visibly distinguished. This phone surface is more like a filtered navigation page than the desktop result panel; it works visually, though it lacks the explicit result count and obvious clear control shown on desktop. A concise match count or equally clear reset affordance would help first-use state understanding if desired. Screenshot evidence alone does not prove that resetting is difficult; keyboard search is supplied as verified.

## Priorities

1. **Minor: give narrow login utility links clearer separation.** Preserve the compact header, but consider a little more visual space or a deliberate compact grouping between independent destinations. Evidence: `login-narrow.png`. Do not infer a hit-target failure without measurement.
2. **Optional: clarify the phone Menu search state.** Consider a small match count and/or visible reset affordance consistent with desktop. Evidence: `phone-menu-search.png` in both control languages. This is discoverability polish, not a verified functional problem.
3. **Preserve the full-width phone default and explicit preference handling.** The supplied default favorites/search/dialog captures support this choice. Keep saved Sidebar stress coverage to prevent that valid alternative from regressing.

No further major visual redesign is warranted from these images. The remaining deductions concern secondary utility spacing, first-use discoverability and compact desktop navigation density. The reviewed evidence supports a polished release-quality design within the stated host and role limits.
