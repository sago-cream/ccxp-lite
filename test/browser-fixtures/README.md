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
the evaluation form available during an open period. For these original fixtures, media are not bundled and requests are blocked
by the harness. The work-log fixture below additionally bundles its host styles and images. These are reduced DOM fixtures, not complete archived copies of the site.

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

## Work-log fidelity and PR captures

The original #30 suite covered five states: login, standalone closed evaluation, classic sidebar,
layered search, and an embedded closed evaluation page. It did not cover `PE14D1.php`, its host CSS,
its add/search panels, or batch submission. Comparing two builds on the same reduced fixture cannot
prove that either screenshot resembles the live site.

Earlier #32 recordings were produced separately from the minimal submission-test form, loading
selected source modules and injecting theme/layout CSS. That omitted `locale.js`, main bootstrap,
`#insTask`, `.datatable4`, host CSS, and the main-frame context. Passing submission tests and the
unrelated #30 gate therefore did not validate those recordings.

`work-log.html` is derived from the extension-disabled live DOM inspected on 2026-09-12. Its
provenance file documents sanitization and remaining limitations. It retains the original host
wrappers, labels, classes, inline CSS, and linked stylesheet/image assets. It freezes initialized
controls and replaces host scripts with a deterministic offline submission shim. The inspected date
had no eligible task; the one fixture task is synthetic, not a captured employment record.

The command bundles the harness with Bun and runs it under Node. Bun 1.3.9 left video teardown
pending after Chromium exited during local captures; Node completes the same run.

The packaged-extension suite now captures standalone work-log, framed multi-day entry, and the result
of pressing Add. It checks main-skin, language/header, real form wrappers, styled field dimensions,
and action controls before capture. No source modules, fake runtime/theme, or layout CSS are injected.
Animation/caret stabilization remains permitted. The router never forwards fixture form submissions.

For PR evidence, build the exact base and head revisions, then run:

```sh
bun run test:browser-parity -- --base-extension /path/to/base/dist/crx/unpacked \
  --head-extension /path/to/head/dist/crx/unpacked --work-log-only --record-video \
  --output /tmp/new-work-log-comparison
```

An intentional dialog change will produce a visual difference; review it and use
`ALLOW_VISUAL_CHANGE=true` only to acknowledge that difference. Each revision includes screenshots,
video (when requested), readiness/style evidence, and a manifest with package/fixture content hashes.
Use these artifacts for PR media. Preserve the actual base recording when updating the head.

This adds work-log coverage, not complete CCXP coverage. The navigation fixture is still a reduced
category set, the backend is simulated, and other roles, responsive sizes, real task details,
validation dialogs, and returned record variants require their own live-derived cases.
