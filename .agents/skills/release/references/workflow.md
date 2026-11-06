# Executable local release flow

Use `bun run release:flow` for the deterministic operations. The agent supplies editorial judgment and the authenticated Chrome dashboard interaction; the user only reviews the prepared release packet. This is an agent-driven local workflow, not a headless CI publisher. No live release is authorized merely by implementing or testing it.

Use the configured private environment, including an explicit absolute Bun `--env-file` path when working from a different checkout. Tokens stay inside the process. `release:flow help` lists commands; `inspect` reads current store identity and published versions without changing stores.

## GitHub and preparation

1. Confirm the requested destinations/version and inspect the existing release. If that exact version is already published by both stores, verify it and report its status rather than uploading it again.
2. Draft GitHub notes in the established grouped style. From the required clean, updated `main`, run `bun run release:flow github <version> --notes /absolute/github-notes.md`. It invokes the existing required release command with curated notes and verifies the remote tag, body, archive versions, source GUID, and all three published assets. If GitHub already has the matching published release, it verifies and reuses it.
3. Run `bun run release:flow prepare <version>`. This downloads the released artifacts, validates archive integrity, checks source ZIP paths, records SHA-256 hashes, and reads separate store baselines. Work is saved under `.build/releases/<version>/`. Never put credentials in this packet.
4. Inspect `baselines.json` and `changes.json`. The runner determines patch versus non-patch from the previous shared GitHub release, independently of store version gaps. Patch releases already have an empty note plan; leave Chrome descriptions and Mozilla public notes untouched.

## Non-patch note drafting

Capture both full Chrome description values from the existing signed-in dashboard, switching between **English – en** and **Chinese (Taiwan) – zh-TW**. Keep the exact text, including invitation, URL, line breaks, and old history. Also read the published public listing in English and Traditional Chinese and include its exact text as `publishedDescriptions` (same locale keys). Read the published English and Chinese listing at `https://chromewebstore.google.com/detail/glcnfmnbmknbphfgjgbokbbchahmiakk?hl=en` and the same URL with `hl=zh-TW`. The published text supplies the previous online headline/history; the dashboard text may contain an unrelated unsubmitted draft, which may be overwritten with the approved result. Save a JSON observation locally:

```json
{
  "publisherId": "<configured publisher>",
  "extensionId": "glcnfmnbmknbphfgjgbokbbchahmiakk",
  "url": "https://chrome.google.com/webstore/devconsole/<publisher>/glcnfmnbmknbphfgjgbokbbchahmiakk/edit/listing",
  "observedAt": "<current ISO timestamp>",
  "descriptions": {
    "en": "<exact complete current English description>",
    "zh-TW": "<exact complete current Traditional Chinese description>"
  },
  "publishedDescriptions": {
    "en": "<exact complete online English description>",
    "zh-TW": "<exact complete online Traditional Chinese description>"
  }
}
```

Run `release:flow context <version> --chrome-listings /absolute/listings.json` **before drafting**. It maps the headline versions to source refs and updates `changes.json`. Public package versions and public note versions are separate: notes must also cover patches that shipped since the previous non-patch summary. Mozilla context uses the latest public listed version that actually has release notes. Exclude pending/unlisted versions. When a historical mapping is genuinely ambiguous, supply a verified source ref with the relevant `--chrome-baseline-ref`, `--mozilla-baseline-ref`, or note-ref option rather than guessing.

Write `notes.json` with only the new one-line summaries, using the locales created by `prepare`:

```json
{
  "chrome": { "en": "New features and improvements", "zh-TW": "新增功能與改善" },
  "mozilla": { "en-US": "New features and improvements." }
}
```

Run `release:flow plan <version> --notes /absolute/notes.json --chrome-listings /absolute/listings.json`. The runner preserves each description's surrounding text and moves its previous headline into its own history, with the existing English/Chinese punctuation. It rejects conflicting same-version text in the published baseline and duplicate/conflicting history. It validates one Mozilla line per configured note locale. Review the resulting complete descriptions; do not rewrite the invitations or GitHub links.

## Upload/validation and one review

Run `release:flow stage <version>`. It uploads the Chrome ZIP and Mozilla listed XPI concurrently, validates the exact upload/version/channel, and saves receipts. It may replace an unsubmitted Chrome draft; the user permits this. It does not replace an active review submission or a published version. The Firefox source ZIP is integrity/hash checked locally and attached when AMO creates the listed version, after approval. Staging never submits, signs, publishes, or sends notes.

If validation is still processing, resume `stage` for the acknowledged uploads; do not upload again. Read saved validation warnings. Run `release:flow review <version>` to refresh `review.md` and its digest once validation succeeds.

Present the new English/Chinese summaries, every Mozilla line, old → new versions, exact destinations, source/archive identity, and validation results in one review. Link the full packet. For patches, explicitly state that public notes remain unchanged. Ask once for approval of those exact notes/packages/targets and normal store review/publication. Follow the approval boundary in SKILL.md; do not treat implementing the runner or a generic old approval as approval of a new packet.

After the user approves, the agent runs `release:flow approve <version> --digest <exact reviewed digest>`. This records the approved hash after checking artifacts and current baselines. The user does not need to copy hashes or run commands. Any change to text, targets, artifacts, or baseline invalidates approval. Before either store has submitted, `withdraw` clears an approval so wording can be revised and reviewed again. Do not revise an accepted/uncertain submission as though it were a fresh draft.

## Automatic completion after approval

Run `release:flow run <version>`. Each store advances independently, and a completed store is not submitted again if the other fails. Mozilla creates its listed version **with the source ZIP attached**, applies the approved localized notes only on non-patch releases, then reads back the raw notes and downloads/hashes its stored source to verify it.

For a non-patch Chrome release the runner returns `NEEDS_CHROME_LISTING`. The **agent**, not the user, completes this step with the available browser/computer-use tools:

1. Read both current full description values into a fresh observation using the schema above. `publishedDescriptions` is required for context/planning; it may be omitted from post-approval checks that only verify the dashboard values.
2. Run `release:flow chrome-check <version> --file /absolute/current-listings.json`. It verifies the target and emits the exact approved action per locale. Unsubmitted draft edits may be overwritten; the approved final text remains fixed. An already-correct locale is read back only; do not rotate its history twice.
3. In the authenticated publisher/item listing, select the appropriate locale, replace the description with the exact emitted `after` value, and save the draft. Use semantic fields/buttons where available. Do not submit via the browser; the API runner owns submission. Never alter unrelated listing fields. If the actual page differs, inspect it instead of injecting private endpoints or guessing.
4. After saving, re-read **both saved locale values** from the dashboard into another observation. Do not fabricate observations from the intended output or count unsaved input as verification.
5. Run `release:flow chrome-observed <version> --file /absolute/saved-listings.json`. It checks the target, timestamp, approval digest, and both exact strings. Resume `run` promptly; stale browser receipts require an automatic fresh read-back, not a second human review when the text is unchanged.

After the final package-version check below, the runner calls Chrome's normal publish endpoint, preserving its existing rollout and visibility, and verifies the requested submitted/public version. It blocks unexpected store validation warnings rather than silently ignoring them. Patch releases skip the description and note steps entirely.

Before Chrome submission on **every** release, including patches, the agent re-reads the package/status pages after approval and saves a package observation:

```json
{
  "publisherId": "<configured publisher>",
  "extensionId": "glcnfmnbmknbphfgjgbokbbchahmiakk",
  "url": "https://chrome.google.com/webstore/devconsole/<publisher>/glcnfmnbmknbphfgjgbokbbchahmiakk/edit/package",
  "observedAt": "<current ISO timestamp>",
  "packageVersion": "<approved new version shown in the staged package>",
  "hasUnsubmittedChanges": true,
  "state": "DRAFT"
}
```

Use `PUBLISHED` for the global item state if that is what the dashboard shows while its new package is still an unsubmitted draft; never use `PENDING_REVIEW`. Run `release:flow chrome-ready <version> --file /absolute/package-observation.json`, then resume `run` promptly. The runner returns `NEEDS_CHROME_PACKAGE_READY` until this fresh observation matches the approved uploaded version. The agent performs this without another human review. If an unsubmitted draft was replaced while approval was pending, run `chrome-restage <version>` to restore the same approved artifact, then repeat the automatic saved-text/package checks. This preserves Mozilla progress and the approval because the intended package and notes are unchanged. Completed Chrome submissions never require another browser step merely because Mozilla needs a retry.

Run `release:flow status <version>` for a final read-only report. Distinguish accepted for review, staged, rejected, and publicly available. Normal store review/publication happens independently; do not describe both as public just because both submissions succeeded. Do not create monitoring schedules unless requested.

## Recovery

The state journal is saved atomically before each upload/submission, and concurrent processes targeting the same stores are locked out across checkouts. On restart, a recorded upload UUID is reused. Lost submission responses are reconciled by remote version/status and, for Mozilla, the known upload UUID's submitted flag. If a non-publishing upload response is lost, the same verified package may be uploaded again: Chrome waits for an in-progress upload to finish before replacing its draft, and Mozilla can create another private validation upload. Submission/signing/review requests remain different: reconcile them by remote identity before any retry; never blindly submit them twice.

`status` performs reconciliation without mutating stores. Once a response is known to have been accepted, `run` resumes notes/source verification or the remaining destination. The CLI never prints bearer tokens, JWTs, or raw authentication error bodies. Saved state contains public IDs, hashes, validation evidence, and statuses, not credentials.
