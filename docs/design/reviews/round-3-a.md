# Independent visual review — reviewer A

Overall suite: **8.3/10**. The extension looks coherent, calm, and substantially more usable than the legacy portal implied by the retained host structure. The plum accent, soft gray navigation, white surfaces, and restrained icon system fit an institutional product. This is a polished, usable result with a few remaining information-density and discoverability compromises, chiefly on narrow screens. None of the supplied screenshots shows a broken core layout.

Reviewed every supplied PNG directly with `view_image`; no code edits, injected styles, or additional browser captures were used. Scores assess the final screenshots independently, without comparison to earlier rounds.

## Scope and evidence

The user goal is to sign in, locate university functions, save/reopen frequently used functions, manage preferences, and safely remove a saved function. The screenshots are packaged-extension output on live-derived sanitized host fixtures. Real page structure, assets, and embedding are retained; identity and favorites are synthetic. The public login notices and CAPTCHA image are actual host content.

The following checks were supplied as verified outside this review: primary/danger text contrast reaches 4.5:1; input/focus contrast reaches 3:1; the native modal traps focus and makes the full frameset inert; the profile switch reflects its state; search supports arrows, Enter, and Escape; its scroll cue disappears at the bottom; and sidebar Show all expands four entries to ten with keyboard access. I accept those as supplied evidence, not as tests personally performed here.

## Category scores

| Category                              | Score /10 | Assessment                                                                                                                                                                                                                                       |
| ------------------------------------- | --------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Color and contrast                    |       8.8 | Clear dark text and restrained plum accents; very little decorative noise. Danger red is distinct from the plum action color. Pale surfaces separate regions without heavy chrome. Supplied contrast checks support the visible result.          |
| Typography                            |       8.2 | Main text is readable, Chinese and English coexist without obvious collision, and title/metadata distinction is effective. Bilingual labels become lengthy at narrow widths; a few desktop sidebar rows feel denser than the spacious main area. |
| Spacing and alignment                 |       8.4 | Cards, controls, modal padding, and popovers align consistently. Desktop proportions are measured. The narrow homepage dedicates considerable space to navigation and identity before the useful list begins.                                    |
| Hierarchy                             |       8.3 | Login and confirmation actions are unmistakable; section headings and metadata guide scanning. The large NTHU mark receives more emphasis than repeated task entry probably needs after login.                                                   |
| Consistency                           |       8.7 | Strong continuity across forms, navigation, cards, search, and preferences. The external-destination icon changes its visual relationship to the function name between sidebar and home cards.                                                   |
| Affordances                           |       7.9 | Stars, chevrons, selected results, and safe/destructive actions read well. The narrow icon rail is much less self-explanatory than the expanded sidebar; several category icons require learned meanings.                                        |
| Responsiveness                        |       7.9 | All supplied narrow states remain contained and readable. The mobile menu mode demonstrates good reflow. The persistent rail in the homepage mode materially reduces room for bilingual labels.                                                  |
| Accessibility, within evidence limits |       8.2 | Visible focus treatments, text labels, state text, and supplied keyboard/modal checks are reassuring. Screenshots cannot establish accessible names, touch target bounds, screen reader announcements, zoom resilience, or all error states.     |

These are design-quality judgments, not a WCAG certification or a quantitative average of automated checks.

## Screens and component judgments

### 1. Login — 8.5/10; healthy

Evidence: 1280 login (`login.png`), 1600 login (`login-wide.png`), 375 login (`login-narrow.png`).

The form has a clear, credible hierarchy: heading, labeled fields, CAPTCHA, dominant login action, then alternate destinations and account recovery. Inputs are generously sized and have visible borders. The secondary buttons do not compete with login. University branding and institutional links are present without turning the form into a promotional page. At 1600px the centered two-column block keeps line lengths controlled; at 375px it stacks cleanly with useful horizontal padding. The mobile header links fit in a deliberate two-by-two arrangement.

The announcement preview on desktop ends partway through a notice behind the fixed “顯示全部公告 (13)” footer. That makes the card look a little mechanically cropped. A deliberate fade/preview boundary, or ending the preview after the last complete visible notice, would communicate the truncation more gracefully. Preserve the actual public notice content rather than rewriting it to fit. On mobile, placing announcements after the sign-in form is sensible; their absence from the initial viewport is not a defect.

Minor typography polish: the spaced account/password labels (“帳 號”, “密 碼”) differ from “驗證碼.” Using one label-spacing convention would make the form feel more deliberately typeset. The CAPTCHA is visibly small and distorted, but it is the retained public challenge; the screenshots do not establish a failure, and audio/refresh alternatives are visibly available.

### 2. Classic sidebar / narrow menu — 7.9/10; healthy with a navigation tradeoff

Evidence: classic sidebar (`sidebar-classic.png`), narrow menu (`sidebar-menu-narrow.png`).

The desktop sidebar has an understandable title/search/navigation/account sequence. Plum category icons and muted chevrons are consistent, and the vertical branch rule makes the empty favorites instruction read as a child rather than a competing destination. The empty homepage gives useful instructions without inventing filler content. The narrow menu mode is particularly clean: a compact search/avatar header, readable saved-function names, and large separated cards.

There is a visible density mismatch between the compact desktop navigation and the expansive main canvas, but it remains usable. The more consequential limitation appears in the other narrow screenshots: the collapsed rail takes about 64 of 375 pixels and offers a long column of unlabeled categories. Several meanings are difficult to infer from generic folder, clipboard, building, and document icons. An obvious labeled menu/expand entry, or promoting the existing menu mode for narrow screens, would improve first-use discoverability. This is a visible communication problem; I am not claiming that tooltips or accessible names are absent.

### 3. Expanded profile — 8.7/10; healthy

Evidence: desktop profile (`profile-expanded.png`), narrow profile (`profile-expanded-narrow.png`).

The popover groups preferences, support, and logout clearly. The divider before logout is useful, and the action rows have consistent icon/text alignment. The current navigation mode is legible as a compact value chip, and the switch has explicit “關閉” text alongside its position, reducing reliance on color. Desktop anchoring above the account bar and narrow anchoring below the avatar both make the relationship to the trigger clear. The panel fits the narrow viewport with comfortable edge clearance and a restrained shadow.

The small mode chip and switch look compact beside the otherwise generous rows. Their actual interactive bounds are not visible, so this is a target-size check to make during implementation validation, not a confirmed accessibility violation. Keep the whole appropriate row or an adequately padded control target interactive. The navigation-mode value plus chevron is somewhat denser than the other rows, but still understandable.

### 4. Remove-favorite confirmation — 9.1/10; very healthy

Evidence: desktop dialog (`dialog-remove-favorite.png`), narrow dialog (`dialog-remove-favorite-narrow.png`).

This is the strongest component. The title names the exact function, the explanatory sentence states that it remains recoverable from the menu, and the safe “保留” action has visible initial focus. “確認移除” uses a distinct danger color with clear wording. The dimming covers the sidebar and content together, making the modal appear to belong to the whole application. Narrow margins, text wrapping, and two-button placement are all comfortable at 375px.

No material visual issue is evident. The supplied full-frameset inert/focus-trap verification addresses the largest behavior concern that screenshots alone would leave open. Long function names beyond the supplied examples and elevated text zoom remain unverified.

### 5. Homepage favorites — 8.2/10; healthy with mobile density opportunities

Evidence: desktop favorites (`home-favorites.png`), narrow favorites (`home-favorites-narrow.png`).

The desktop grid has clean alignment and a reliable hierarchy: function name, category, icon, and saved star. Two columns make the content scannable without very long rows. The recent-use section is visibly separate and uses the same component language. The selected versus unselected stars are easy to distinguish. Narrow cards grow to accommodate bilingual names without clipping, which is preferable to hiding the identity of a function.

The narrow rail leaves the actual card about 263px wide. “課程預排 Tentative schedule” and “填寫教學意見調查 Course evaluation” consequently occupy more vertical space. The logo, generous upper spacing, and utility links also delay the first card until roughly one-third of the screenshot height. A more compact narrow header and an optional drawer/menu navigation would let users reach more functions in one screen while retaining readable type.

The external-link glyph for the eform destination sits with category metadata in the card, whereas the sidebar places it next to the function title. Align it consistently with the destination name so users understand which thing opens externally. This is a small but concrete consistency improvement.

The synthetic “步驟一/二/三/四” functions do not demonstrate realistic content quality, so I do not penalize their wording or repeated category. Real long-name and many-favorites states should remain part of content testing.

### 6. Homepage search — 8.3/10; healthy

Evidence: desktop results (`home-search.png`), narrow results (`home-search-narrow.png`), narrow end (`home-search-end-narrow.png`), narrow empty (`home-search-empty-narrow.png`).

Search has a strong active boundary and a clearly highlighted current result. Bold query matches help scanning without introducing another accent color, category labels distinguish the result context, and the count establishes the size of the result set. The clear icon is easy to find. The empty state gives a direct next step, and keeping the input present makes recovery obvious. The scrolling cue is visible in the initial narrow results and absent at the end, consistent with the supplied behavior check. The final selected item has adequate bottom clearance.

The narrow popup inherits the same rail-related width constraint as favorites. Several bilingual result names wrap to two lines, and a Chinese title wraps its final character to a new line in the supplied initial result state. That is readable but visually ragged. Recovering horizontal room from navigation would improve this more than shrinking the font. The partially visible row at the upper edge in the scrolled-end image is normal clipped scroll content, not evidence of broken layout.

The desktop result list is airy but not wasteful; there is no need to make it dramatically denser. I would preserve the visible focus/selection treatment and explicit result count.

## Prioritized recommendations

1. **Improve narrow navigation discoverability and room for content.** The 64px rail in `home-favorites-narrow`, both populated narrow search states, and the narrow dialog background consumes roughly 17% of screen width. Offer a conspicuous menu/expand control and consider making the already demonstrated menu mode the narrow default. Preserve accessible names and keyboard behavior. This is the largest remaining usability opportunity, not a release-blocking layout failure.
2. **Compact the narrow homepage header.** Reduce the gap around the NTHU mark and consider folding secondary utility links into a compact header/menu so saved functions and results begin sooner. Keep login branding and announcements intact; this recommendation concerns the signed-in homepage.
3. **Make announcement truncation intentional.** In the desktop login card, show an explicit preview boundary rather than letting a partial notice run into the footer. Do not replace real notices with shorter synthetic copy for visual polish.
4. **Place external-destination indicators consistently.** Keep the indicator attached to the function name on home cards and sidebar entries. This makes the navigation consequence clearer and removes a minor visual mismatch.
5. **Finish small typography/control checks.** Unify login label spacing and verify actual hit bounds of compact profile controls and icon actions. The screenshots show compact glyphs, not their invisible hit areas, so no target-size failure is asserted here.

## Remaining verification limits

No new behavior testing was performed. Screen reader naming and announcements, touch hit regions, hover/focus variations beyond the captured states, reduced motion, 200–400% zoom, login validation/error recovery, exceptionally long names, and unavailable role/period/widget variants cannot be judged from these images. These are limits on the review, not findings that those features fail. The supplied contrast and keyboard checks should be retained as evidence alongside the screenshots.

The suite is ready for practical review and use. The remaining changes are focused refinements to narrow-screen efficiency and a few visible polish details; the dialog, popover, and core form/card system already look well resolved.
