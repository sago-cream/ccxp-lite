# Browser parity fixtures

These pages are sanitized, deterministic stand-ins for the CCXP login, frameset navigation, and
standalone inquiry surfaces. They contain no live user or university data. The login fixture is
derived from the live, logged-out CCXP DOM captured in a browser with CCXP Lite disabled; dynamic
CAPTCHA values, media, announcements, and account-related content are replaced with inert examples.

Authenticated fixtures were inspected through computer use on 2026-09-11 with CCXP Lite disabled:
`frameset.html` preserves the live 130px/200px frame layout and route casing; `top.html` preserves
the header tables with the idle timer frozen and its polling scripts removed; `main.html` is a
trimmed `xp03_m.htm` service-announcement table with neutral text. `navigation.html` retains a
focused subset of the live tree declarations (evaluation and course categories), removes tracking
handlers and personal session parameters, and makes the tree script inert for extension parsing.
`standalone.html` captures the actual course-evaluation closed-period response; it does not cover
the evaluation form available during an open period. Media are not bundled and requests are blocked
by the harness. These are reduced DOM fixtures, not complete archived copies of the site.

`bun run test:browser-parity` loads the packaged base and head extensions against the same pages in
Chromium. It compares screenshots with a small anti-aliasing tolerance and compares selected
computed styles and inline `!important` priorities exactly. Failed CI runs upload both revisions,
pixel diffs, computed-style JSON, and a report.

Behavior-preserving changes should pass without updating fixtures or expectations. An intentional
visual change can be reviewed from the uploaded artifacts and acknowledged by a maintainer with the
`accept-visual-change` pull-request label.

The label acknowledges screenshot/style differences only; missing elements and failed interactions
still fail CI. Artifacts are uploaded on every run for inspection. Use explicit paths when comparing
different builds: `bun run test:browser-parity --base-extension /path/to/base --head-extension
/path/to/head --output /path/to/new-output-directory`. Unknown flags and existing output directories
are rejected. This focused suite is a starting gate for #29, not proof of parity on every CCXP page:
host media/external stylesheets, active evaluation forms, additional roles, and responsive layouts
still need coverage before a broad visual refactor can be considered fully validated.
