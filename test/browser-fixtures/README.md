# Browser parity fixtures

These pages are sanitized, deterministic stand-ins for the CCXP login, frameset navigation, and
standalone inquiry surfaces. They contain no live user or university data. The login fixture is
derived from the live, logged-out CCXP DOM captured in a browser with CCXP Lite disabled; dynamic
CAPTCHA values, media, announcements, and account-related content are replaced with inert examples.

`bun run test:browser-parity` loads the packaged base and head extensions against the same pages in
Chromium. It compares screenshots with a small anti-aliasing tolerance and compares selected
computed styles and inline `!important` priorities exactly. Failed CI runs upload both revisions,
pixel diffs, computed-style JSON, and a report.

Behavior-preserving changes should pass without updating fixtures or expectations. An intentional
visual change can be reviewed from the uploaded artifacts and acknowledged by a maintainer with the
`accept-visual-change` pull-request label.
