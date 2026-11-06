# Local release flow

Use `bun run release:flow` for packages and store APIs. The agent drafts notes and obtains one review of the exact packet. Mozilla finishes through the API. Patch Chrome also submits through the API; non-patch Chrome remains uploaded for the user to paste both prepared descriptions and click Submit for review. No computer use or browser automation is needed.

Use the configured private environment, including an absolute Bun `--env-file` path when working from a different checkout. Tokens stay inside the process. `release:flow help` lists commands; `inspect` reads store identities and published versions. Implementing or testing this workflow does not authorize a live release.

## GitHub and preparation

1. Confirm destinations/version. If both stores already publish that version, verify and report it instead of uploading it again.
2. Draft grouped GitHub notes. From clean, updated `main`, run `bun run release:flow github <version> --notes /absolute/github-notes.md`. It invokes the required release command and verifies the tag, body, and three assets. An existing matching published GitHub release is verified and reused.
3. Run `release:flow prepare <version>`. It downloads and checks the archives, packaged versions, source paths, and SHA-256 hashes, then records separate store baselines under `.build/releases/<version>/`. Keep credentials out of this packet.
4. Read `baselines.json` and `changes.json`. Patch/non-patch policy uses the previous shared GitHub release, independently of store version gaps. Patches already have an empty note plan and skip the next section.

## Non-patch notes

Read the **complete published** Chrome descriptions through HTTP/web tools at `https://chromewebstore.google.com/detail/glcnfmnbmknbphfgjgbokbbchahmiakk?hl=en` and the same URL with `hl=zh-TW`. Use the original multiline text, including the invitation, GitHub link, and full history. The detailed description starts with the version headline; the separate short manifest description is not part of this text. Decode HTML entities and preserve newlines. Do not read signed-in dashboard drafts or fabricate missing/truncated text. Save the public observation:

```json
{
  "extensionId": "glcnfmnbmknbphfgjgbokbbchahmiakk",
  "observedAt": "<current ISO timestamp>",
  "urls": {
    "en": "https://chromewebstore.google.com/detail/glcnfmnbmknbphfgjgbokbbchahmiakk?hl=en",
    "zh-TW": "https://chromewebstore.google.com/detail/glcnfmnbmknbphfgjgbokbbchahmiakk?hl=zh-TW"
  },
  "descriptions": {
    "en": "<exact complete published English description>",
    "zh-TW": "<exact complete published Traditional Chinese description>"
  }
}
```

Run `release:flow context <version> --chrome-listings /absolute/listings.json` before drafting. It resolves each headline's source baseline and writes note intervals to `changes.json`. Mozilla uses its latest public listed version with notes. Include intervening patches since those note baselines, excluding pending/unlisted releases. For ambiguous history, supply the verified `--chrome-en-note-ref`, `--chrome-zh-note-ref`, or `--mozilla-note-ref` during the corresponding context/preparation step.

Write `notes.json` with the new single-line summaries and every Mozilla locale created by `prepare`:

```json
{
  "chrome": { "en": "New features and improvements", "zh-TW": "新增功能與改善" },
  "mozilla": { "en-US": "New features and improvements." }
}
```

Run `release:flow plan <version> --notes /absolute/notes.json --chrome-listings /absolute/listings.json`. It inserts the new headline, moves the previous online headline into history, and preserves each locale's punctuation, invitation, URL, and older entries. Check the complete result.

## Upload, review, and approved API work

Run `release:flow stage <version>`. Chrome ZIP and listed Mozilla XPI uploads run independently; the runner polls validation and saves receipts. Reversible unsubmitted Chrome drafts may be replaced. Active review and published submissions are not overwritten. Source is verified locally and attached when AMO creates the version after approval. Staging does not sign, submit, publish, or send notes. Resume `stage` for acknowledged validation still processing.

Run `release:flow review <version>` once uploads validate. Present exact notes, targets, old/new versions, package identities, validation results, and the saved `review.md`. Explain the final behavior: Mozilla API completion plus manual Chrome paste-and-submit for non-patches; API submission for both stores with notes unchanged for patches. Chrome submission uses the saved item draft, so other saved dashboard edits may also be included; there is no package-only exclusion flag.

After explicit approval, run `release:flow approve <version> --digest <reviewed digest>`, then `release:flow run <version>`. The runner checks hashes and baselines and saves progress independently. Mozilla creates the listed version with the source ZIP attached, applies non-patch notes, and verifies stored notes/source. Patches submit Chrome through the API with normal review/publication settings. Do not require a dashboard package check.

## Non-patch Chrome handoff

`run` returns `AWAITING_USER_SUBMISSION` for Chrome and writes:

- `chrome-description-en.txt` and `chrome-description-zh-TW.txt`: complete text ready to paste, not just the new headlines.
- `chrome-handoff.md`: exact listing link, version, and dashboard steps.

Report Mozilla's actual result separately. Tell the user: **Chrome is uploaded only. Paste these descriptions in the English/Chinese locales, save, and click Submit for review.** Link both text files and the listing. The user owns both the description update and Chrome submission. Do not edit the dashboard, ask them to return so the agent can submit, or call Chrome publish on a retry. Stop once the handoff and other authorized API work are complete.

If later asked to check progress, `release:flow status <version>` observes a manual submission/publication by version. It cannot verify Chrome description text through the API; report that limit accurately. Do not create monitoring schedules unless requested.

## Recovery

The journal is saved before each mutation and locked across checkouts. Known upload UUIDs are reused. Lost non-publishing upload responses permit retrying the same verified artifact; Chrome waits for uploads already in progress. Lost API submission responses require remote reconciliation before any retry. Successful destinations are not submitted again.

`chrome-restage <version>` restores the same unsubmitted Chrome package while preserving approval and Mozilla progress; it first checks whether the user has submitted and refuses to replace accepted/uncertain submissions. After restaging a non-patch, `run` refreshes the handoff. `withdraw` is available only before an accepted/uncertain submission or a Chrome handoff, so an already-issued handoff cannot silently change. Changed wording, targets, version, artifacts, or baselines require a new review.

Use `status` for read-only store reconciliation. Distinguish uploaded, awaiting user submission, under review, rejected, staged, and public. Saved state contains public IDs, hashes, validation results, and statuses; credentials and raw authentication response bodies are never printed.
