---
name: release
description: Release ccxpLite using its release scripts, write concise grouped notes from each destination's previous release, and verify tags and assets. Stage Chrome Web Store and Mozilla Add-ons uploads with environment credentials, then require approval of the exact store notes before submission.
---

# Release

Run ccxpLite's release workflow and prepare distribution updates. Scope destinations to the user's request and configured channels. Creating or editing this skill does not authorize a live release.

## Establish baselines

- Read repository instructions and release scripts, including hooks. Use the required clean, updated release branch; locate its checkout with `git worktree list --porcelain` instead of resetting another checkout. Follow project checks and reuse applicable successful CI evidence.
- Identify the repository, intended version, artifacts, and configured destinations. Suggest a bump from actual changes if unspecified; follow existing version rules.
- Read several previous release bodies to find the intended editorial style. Prefer concise grouped notes over a generated PR-title list. Read [notes.md](references/notes.md).
- Establish **separate** last-published baselines for GitHub and each store: version, channel/locale, previous notes, and source tag/commit. Drafts, review queues, and unlisted builds are not published listed releases. If a store skipped versions, cover its entire unreleased interval. If a baseline cannot be mapped confidently, continue independent preparation and ask for that mapping before making release claims.
- Check version eligibility against each destination's published and pending versions before uploading. Reuse an existing matching release/upload; do not downgrade, replace unrelated pending work, or silently bump the approved version to bypass a store conflict.
- Read [ccxp-lite.md](references/ccxp-lite.md) for this repository's commands, artifacts, store IDs, and note examples.

## Credentials and resumable state

Read [credentials.md](references/credentials.md). Environment variables are the credential interface: inject them from a secret manager, use an explicitly loaded ignored local file, or supply CI secrets. Inspect presence/names without printing values. Keep secrets out of command arguments, logs, notes, Git, and saved state. If absent, name the required credential and secure configuration location; do not request secrets in chat.

Keep a release packet in `.build/releases/<version>/` or an external directory: version/source commit; each published baseline and evidence URL; exact note files/locales; target IDs/channels; artifact paths and SHA-256 hashes; validation/upload IDs; submission results. No credentials. Inspect remote state before repeating mutations, especially after timeouts. If acceptance cannot be resolved, including when an upload ID was lost, stop dependent submission and report the uncertainty instead of retrying automatically.

## GitHub release

1. Gather merged PRs and the net diff since the previous GitHub release. Write and check grouped notes before invoking the release command.
2. Run the repository's release script with its required flags. Feed curated notes through supported configuration; disable automatic generation when it would replace them. Use a file for multiline text.
3. Verify the remote tag resolves to the intended release commit, the published body matches the notes, and every configured asset exists. Check hashes/sizes, archive integrity, and packaged versions. Respect requested draft/public status.

A request to release authorizes the configured GitHub release. The additional store approval below applies to unseen store text and store submission, not ordinary preparation or GitHub publication already requested.

## Prepare store updates

When stores are in scope, read applicable references: [Chrome Web Store](references/chrome-web-store.md) and [Mozilla Add-ons](references/mozilla-addons.md). Recheck official API documentation when executing.

- Build or reuse artifacts from the released source commit; verify provenance and store-specific manifests. Do not describe unsigned Firefox submission input as signed or publicly distributed.
- Draft each store's notes against **that store's last published version**, matching its earlier language, length, and note location. Include changes across skipped releases; omit internal maintenance unless useful to that audience. Do not blindly copy the newest GitHub delta.
- Authenticate and complete supported non-publishing package uploads and validation. Record warnings and exact upload IDs. If a tool combines upload with submission/signing/publication, defer that combined action until approval; explain the boundary and finish other preparation first.
- Keep unapproved text local unless there is a verified private draft field. Do not overwrite existing submissions or unrelated metadata. Prepare required source archives and reviewer information before requesting approval.

## Required store approval

**Stop before sending store release notes or taking any action that submits, signs, queues review, or publishes a store version.** Upload-only staging is allowed only where it cannot trigger those actions. A generic request to release is not approval of unseen store text.

Present one concrete review with each store's old → new version, exact complete notes for every locale, intended field/location, package identity, validation status, and submission/publication behavior. Link the saved packet and dashboards. Ask for confirmation of those exact notes and targets. Explain that this stop follows the user's required store-release approval boundary; cite this skill if needed.

After explicit confirmation, recheck note/artifact hashes, published baselines, and remote state. If a baseline changed, recalculate its release interval and notes. Changed text, artifact, version, channel, or target requires a revised review and approval. Approval may cover one store only; proceed only for approved targets.

## Submit and report

Submit the approved package and exact text through supported APIs or the authenticated dashboard. Preserve rollout, visibility, and locales unless otherwise authorized. Save partial results: do not resubmit a successful destination because another failed. After ambiguous responses, query status before retrying.

Verify target/version and stored notes. Distinguish uploaded, validated, submitted for review, approved/staged, and publicly published. Report links and actual status; an upload or successful submission does not prove public availability. Do not create monitoring automations unless requested.
