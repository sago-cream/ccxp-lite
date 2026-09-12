# Legacy browser fixtures

Use the actual legacy page structure and host assets for every affected visual surface. Two builds
matching the same simplified mock does not prove fidelity to the live site.

`coverage.json` is the page inventory: source route, owning extension modules, captured state,
sanitization, and explicit gaps. These fixtures were inspected with ccxpLite disabled. Login,
student navigation, header, main service announcements, assistant registration, and assistant
history were recaptured on 2026-09-12 with their complete DOM. Registration retains initialized
Kendo controls and the grid; history retains expanded effective items and its initialized grids.
Staff identities, dropdown options, and every grid data cell are replaced by synthetic values.
Host scripts and polling are removed; widget snapshots do not simulate live Kendo behavior.

The student navigation retains the full tree declarations and rendered DOM rather than a selected
category subset. Session parameters are removed/replaced. The frame shell retains the original
130px header and 200px navigation dimensions. The extension applies its own layout at runtime.
Host CSS, images, and fonts are bundled at their source routes through `host-assets.json`.
Duplicate assets share one local file. No private source captures are committed.

## Coverage and limits

The packaged-extension harness captures ten states: login, assistant registration, assistant
history, standalone closed evaluation, classic sidebar, layered search, embedded closed evaluation,
standalone work log, framed multi-day work log, and post-Add work log. It waits for the shared main skin as well as page-specific readiness and loaded stylesheets.
It fails on missing visual assets, missing readiness markers, and failed interactions before
comparing screenshots and styles.
Tests also reject truncated captures and check synthetic staff grid rows and CSS asset references.

This is representative coverage, not every possible CCXP route or state. OAuth authorization,
non-student roles, active evaluation forms, responsive breakpoints, staff record-detail/editing,
live widget loading, and real work-log task/validation variants remain explicit gaps. A change
in one of those states needs its own live-derived fixture and verification before its PR media
can be considered representative. Do not use the existence of another fixture for the same module
as evidence that the affected state is covered.

## What #30 missed

The original #30 suite covered five reduced states and no work-log page. It compared packaged
builds, but blocked unbundled host media/styles and did not establish fixture-versus-live fidelity.
Earlier #32 recordings additionally used the minimal submission-test form, injected source modules,
and theme/layout overrides. That omitted the real work-log wrappers, locale/main bootstrap, host
CSS, and frame context. Submission tests and the unrelated parity gate could both pass while the
recordings looked unlike the real page.

`work-log.html` preserves the live add/search form structure and styles. Its separate provenance
file records the synthetic eligible task and offline response shim. No real submissions occur.

## Capture and review

Build the exact base and head packages, then run:

```sh
bun run test:browser-parity -- --base-extension /path/to/base/dist/crx/unpacked \
  --head-extension /path/to/head/dist/crx/unpacked --output /tmp/new-comparison
```

Add `--work-log-only --record-video` for a work-log interaction recording. The script bundles with
Bun and executes under Node because Bun 1.3.9 hung during persistent-browser video teardown.
The output includes screenshots, computed styles, package/fixture hashes, viewport and provenance.
No extension modules, theme variables, or layout CSS are injected; only animation/caret stabilization
is permitted. Unknown flags and existing output directories are rejected.

An intentional visual change may be acknowledged with `ALLOW_VISUAL_CHANGE=true` locally or the
`accept-visual-change` PR label in CI. This only permits pixel/style differences; missing assets,
elements, and interactions still fail. CI uploads artifacts on every run. For PR updates, retain
the recording from the actual base commit and replace the head recording after visual changes.
