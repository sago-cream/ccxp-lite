# Independent packaged UI assessment — reviewer B, round 9

Suite: **9.0/10**. This is a polished, cohesive utility interface across the supplied desktop and phone states. The small refinements improve secondary information clarity without disturbing the established layout. No blocking visual defect appears in the reviewed captures. Further broad redesign is not justified by this evidence.

## Evidence and limits

I independently opened all 18 PNGs in `round-9/head` with `view_image`, plus 12 English-control counterparts in `round-9-english/head`: desktop/narrow profile, dialog, favorites and search; narrow Menu; and the three `phone-menu-*` states. Total: 30 images. No browser, code or other review was performed.

These captures use the packaged extension with sanitized live-derived Chinese host DOM/assets in original frames. Identity and favorite records are synthetic data entered through actual controls. The represented student role is not evidence for all entitlements, roles, periods or widgets. The additional current survey entry remains a documented coverage gap. English controls establish label fit in the represented Chinese host, not English-host fidelity. Base/head agreement is regression evidence rather than comprehensive proof of live-site fidelity.

The supplied default-mode assertion establishes full-width Menu for unconfigured windows at ≤600px and preservation of explicit saved choices. `phone-menu-favorites/search/dialog` represent the initial phone flow. The retained rail-based `home-*-narrow` captures are a saved Sidebar preference stress state, which I assess separately from that default.

Supplied verification retained outside this image review: primary/danger contrast ≥4.5:1; focus/input contrast ≥3:1; native modal trapping focus and making the whole frameset inert; live Tab/Escape and focus restoration; profile switch state; keyboard search; labeled Menu navigation; favorite cap/expansion, keyboard operation and custom ordering. These are supplied checks, not independently reproduced results. Images alone do not establish screen-reader output, hit-box sizes, all zoom levels or unrepresented host states.

## Scores

All values are out of 10. Responsive/accessibility scores reflect visible quality informed by the supplied checks, not a conformance certification. Component totals and suite score are rounded design judgments.

| Component              | Color / contrast | Typography | Spacing | Hierarchy | Consistency | Interaction affordances | Visible responsive / accessibility | Overall |
| ---------------------- | ---------------: | ---------: | ------: | --------: | ----------: | ----------------------: | ---------------------------------: | ------: |
| Login                  |              9.0 |        8.8 |     8.8 |       9.0 |         8.9 |                     8.7 |                                8.8 | **8.9** |
| Sidebar / Menu         |              8.9 |        8.7 |     8.9 |       9.0 |         8.9 |                     8.9 |                                9.0 | **8.9** |
| Profile                |              9.0 |        8.7 |     8.9 |       9.0 |         9.0 |                     8.8 |                                8.8 | **8.9** |
| Remove-favorite dialog |              9.3 |        9.1 |     9.1 |       9.4 |         9.2 |                     9.2 |                                9.2 | **9.2** |
| Home favorites         |              9.0 |        8.9 |     9.0 |       9.1 |         9.1 |                     9.2 |                                9.1 | **9.1** |
| Home search            |              9.1 |        8.9 |     9.0 |       9.1 |         9.0 |                     8.9 |                                9.1 | **9.0** |
| Suite                  |              9.1 |        8.9 |     9.0 |       9.1 |         9.0 |                     9.0 |                                9.0 | **9.0** |

## Component assessment

**Login — 8.9:** Desktop form and announcement columns are balanced and readable, with an unmistakable primary Login action. The narrow header stays compact while the field sequence retains generous dimensions and useful spacing. Small separators add demarcation between the four institutional utility links. That row remains dense, but the destinations are more clearly distinct and the main login task has ample room. I would not add header height solely to chase a higher score. Captcha audio/reload controls remain recognizable icon actions; accessible naming and target measurements were not inspected here. Announcements stack cleanly below the form.

**Sidebar / Menu — 8.9:** Desktop alignment, indentation guides, filled/outline stars and chevrons give navigation a stable visual vocabulary. Expanded bilingual sidebar labels make the tree dense, but readable. The full-width default phone Menu provides labeled categories, brief category summaries and a concise four-favorite preview with counted expansion. Both control languages fit. The explicit Use sidebar action is understandable. The saved compact rail still requires learning shortcut icons and reduces content width; because it is a chosen alternative, this is an accepted presentation tradeoff rather than an initial-phone-flow defect.

**Profile — 8.9:** Preferences, support and logout are distinctly grouped. Current values, chevrons and the off switch align well. Desktop and narrow popovers remain contained within their viewports; the narrow trigger stays visible above its popup. English labels fit without clipping. The navigation row communicates a setting with a current value and additional choices. No material visual issue is visible. Supplied interaction checks remain separate from this visual finding.

**Dialog — 9.2:** The strongest component remains the removal dialog. The item-specific title, consequence/recovery explanation and safe/destructive action pair are immediately understandable. The safe action has a visible focus ring; the destructive action is clearly differentiated. The background is visually suppressed across both navigation and content. Desktop, saved Sidebar phone and default Menu phone all preserve comfortable margins, including the longer English explanation. No new visual defect appears. Focus trapping, inertness and keyboard restoration rely on supplied verification.

**Home favorites — 9.1:** Desktop cards align cleanly, with consistent category metadata, star placement and long-label wrapping. The bordered Show all favorites (10) control sits directly below the grid and makes the expansion scope clear. Default phone Menu gives bilingual titles much more width and exposes the four-item preview plus expansion before labeled All categories. The saved Sidebar version uses more vertical space because titles wrap, yet remains legible. Synthetic step names are not product-copy findings. The compact Menu list and richer desktop cards are appropriate spatial adaptations.

**Home search — 9.0:** Desktop search has a clear query/clear control, result count/context, matching-term emphasis and a conspicuous active-result outline. In saved Sidebar narrow mode the discrete neutral category label separates context from count. The English label wraps cleanly to its own line without stranded punctuation or collision, while the selected row remains fully contained. The first/last selected-result and empty-state captures show clear state treatment. Default phone Menu search provides full-width result cards, meaningful groups, a retained query and consistently placed favorite stars. A result count or more visible reset action in that Menu surface could improve first-use state recognition, but the absence is a minor opportunity, not evidence of a functional problem. Keyboard operation is supplied as verified.

## Remaining feedback

- **Optional:** Consider a match count or explicit reset affordance for the default phone Menu search surface, if first-use testing shows that users confuse filtered results with ordinary category browsing. Evidence: both `phone-menu-search.png` captures. Do not add UI solely for score improvement without that need.
- **Accepted tradeoffs:** The login utility row is compact; expanded desktop navigation is dense; saved phone Sidebar reduces card width. None appears blocking in these captures, and none warrants removing user choice or weakening the main task hierarchy.
- **Preserve:** The full-width phone default, counted favorites disclosure, neutral narrow search category label, restrained purple/neutral palette, profile grouping and modal action hierarchy.

There are no required visual corrections from this pass. The remaining score margin reflects secondary discoverability and compact-navigation compromises, not an identified release-blocking defect. Coverage and behavior claims remain limited as stated above.
