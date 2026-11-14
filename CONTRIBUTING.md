# Contributing to ccxpLite

Thanks for helping improve ccxpLite.

## Before You Start

Small bug fixes and documentation improvements can go directly to a pull request. Please open an issue first for new behavior, broad visual changes, or work that affects several parts of the extension so we can agree on the direction.

Security and privacy issues should be reported privately according to our [security policy](.github/SECURITY.md), not through a public issue.

## Development

You need [Bun](https://bun.sh/) 1.3.9 or later.

```sh
bun install
bun run check
bun run build
```

`bun run check` runs type checking, linting, formatting checks, and unit tests. `bun run build` rebuilds the Chrome and Firefox extensions. Run both before submitting changes. If a command fails on an unchanged `main` branch too, include that comparison in your pull request instead of hiding the failure.

Keep tests focused on the behavior you changed. Do not commit generated build output from `dist/`.

After `bun run build`, run `bun run test:firefox-source` to check the Firefox source archive.
This requires `unzip` and rebuilds the extracted sources with frozen dependencies in a temporary
directory, then compares every packaged file with the original Firefox build.

### Manual Browser Testing

Build and load the extension locally before submitting changes to browser behavior or CCXP pages:

- Chrome: run `bun run build:crx`, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/crx/unpacked`.
- Firefox: run `bun run build:firefox`, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/firefox/unpacked/manifest.json`.

Rebuild after changing TypeScript. Test the affected CCXP pages with your own account, and remove personal information from screenshots.

## README animation

Run `bun run build:readme-comparisons` to regenerate the animated demo from the four
committed PNGs in `docs/assets/`. Use `bun run build:readme-comparisons --help` for custom
image paths and captions. `bun run update:readme-assets` refreshes the two ccxpLite
images from capture outputs and rebuilds the SVG.

## Pull Requests

- Create your branch from the latest `main`.
- Keep each pull request focused on one reviewable concern.
- Do not stack pull requests unless you have agreed on that workflow with the maintainer. If a pull request has a dependency, link it clearly.
- Use a [Conventional Commits](https://www.conventionalcommits.org/) title, such as `fix: restore section heading contrast`.
- Describe the user-visible problem, the chosen solution, and relevant trade-offs.
- For visual changes, include before and after screenshots taken in the same state and viewport.
- For changes to CCXP pages, list the affected page paths and browsers you tested.
- Add or update focused tests for behavior changes.

AI-assisted contributions are welcome, but write the pull request description in your own words, and review, understand, test, and take responsibility for every submitted line. Remove generated placeholders, irrelevant commentary, and unrelated changes before opening the pull request. Be prepared to explain your changes and respond to review feedback.

### Visual Changes and Browser Parity

The `browser-parity` CI job builds the pull request's base and head extensions, then compares their screenshots and computed styles. An intentional visual change can fail this comparison even when the behavioral assertions pass.

Use a sanitized, live-derived fixture for each affected page and state, preserving host styles and embedding mode. Record its provenance in `test/browser-fixtures/coverage.json` and add scoped behavioral assertions. Follow [the capture requirements](AGENTS.md#pr-visual-evidence); comparing head against itself does not verify a change.

In both revision checkouts, run `bun install --frozen-lockfile --ignore-scripts` and `bun run build:crx`. In the head checkout, install Chromium with `./node_modules/.bin/playwright install --with-deps chromium`, then compare the builds:

```sh
bun run test:browser-parity -- \
  --base-extension /absolute/path/to/base/dist/crx/unpacked \
  --head-extension dist/crx/unpacked \
  --output /tmp/ccxp-browser-parity-review
```

Choose a fresh output directory for every run. Match the `--expect-*` options selected for these revisions by [the CI workflow](.github/workflows/ci.yml); they scope expected differences. Keep behavioral assertions for the changed behavior. Do not add broad masks or weaken assertions to make a comparison pass.

Include matching before/after screenshots and explain the intended differences. Inspect the Actions run's `browser-parity` artifact: completed captures include base/head screenshots, capture manifests and computed styles; a completed comparison adds `report.json` and difference images where generated. An earlier build or assertion failure can leave these outputs incomplete; inspect the job log too.

After reviewing every reported difference and confirming the behavioral assertions pass, a maintainer can apply `accept-visual-change`. The label sets `ALLOW_VISUAL_CHANGE=true`, accepting the final comparison's failures across the whole PR, including screenshot, bounds and computed-style differences. It does not bypass capture-time assertions, builds or the separate `check` job. Adding or removing the label reruns CI. Review the artifacts again after subsequent commits, and remove the label if the differences are no longer accepted.

### Checks Awaiting Approval

Depending on repository policy, workflows from public forks may require approval before running. If Actions reports **Approval required**, a maintainer with write access reviews the proposed code and workflow, then chooses **Approve and run**. See [GitHub's approval guidance](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/approve-runs-from-forks). This is separate from accepting visual differences; the visual-change label does not approve a pending workflow run. Inspect the checks after they run.

By contributing, you agree that your contribution will be licensed under the [MIT License](LICENSE) and that you will follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Shared design work

Read the [design guidelines](docs/design/guidelines.md) and [recipes](docs/design/recipes.md).
Use `bun run storybook` to inspect production components locally. Shared UI changes should update
relevant stories and pass `bun run storybook:build` plus `bun run test:design`, in addition to the
existing extension checks. Both design workspaces are private and release with this repository.

Current accessibility follow-ups: purple/focus contrast, disabled button styling, reduced-motion
support for skeletons, and focus containment in the remove-pinned dialog.
