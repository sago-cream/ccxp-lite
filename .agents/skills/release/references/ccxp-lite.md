# ccxpLite adapter

Apply only after verifying `sago-cream/ccxp-lite`. Read current repository instructions/configuration; these are discovery hints.

- Release from clean, updated `main`: `bun run release <version> --ci --no-github.draft`.
- Shared config: `config/release/release-it.config.cjs`. Current hooks check typecheck/lint/format before bumping and build both targets before GitHub publication.
- Curated release-it notes: `--no-github.autoGenerate` and `--github.releaseNotes=cat /absolute/path/github-notes.md`; pass the latter as one argument. Use configured GitHub authentication or capture `gh auth token` privately into the child-process environment.
- Verify three configured assets: `dist/crx/ccxpLite-crx-v<version>.zip`, `dist/firefox/ccxpLite-firefox-v<version>.xpi`, and `dist/firefox/ccxpLite-firefox-v<version>-sources.zip`.
- `release:crx` / `release:firefox` create platform-specific GitHub releases, not store submissions.
- `scripts/sign_firefox.ts` uses `AMO_JWT_ISSUER` / `AMO_JWT_SECRET` and currently calls `web-ext sign --channel unlisted`. It is neither upload-only staging nor the listed AMO release path. Do not run it before approval or silently substitute it for listed publication.
- Chrome item: `glcnfmnbmknbphfgjgbokbbchahmiakk`; discover publisher ID from authenticated configuration/dashboard.
- AMO slug: `ccxplite`; verify GUID against `src/manifest.firefox.json` and authenticated metadata.
- Accepted grouped-note examples: GitHub `v1.10.1`, `crx-v1.9.3`, and revised `v1.12.0`. Short behavior descriptions with related PR numbers in parentheses; neighboring auto-generated bodies are not the desired style.

Fetch current published baselines every run. If the GitHub version already exists, resume remaining store preparation instead of releasing it again. Never infer store publication from GitHub publication.

## Store-note policy and format

Only non-patch releases update public store notes. Patch packages are uploaded/submitted normally, with Chrome descriptions and Mozilla notes left unchanged. GitHub still receives notes for every release.

For a non-patch release, inspect both current Chrome locales, then replace only the first version-summary line and insert its previous contents at the top of the existing history. Preserve the invitation, GitHub URL, older history, and surrounding formatting exactly. Do not duplicate an existing entry on resume.

Observed dashboard format (2026-11-06; description headline v1.13.0):

- English (`en`): `v1.13.0: overall interface polish & NTHUMods course selection export`; GitHub invitation/link; `release note:`; older version lines.
- Traditional Chinese (`zh-TW`): `v1.13.0：整體介面優化、NTHUMods 選課匯出支援`; GitHub invitation/link; `版本紀錄：`; older version lines.
- Mozilla: one concise line in each configured locale, covering that store's unreleased user-facing changes. Read its current locale configuration before writing.

Prepare all wording and targets for a single user review. After approval, automate the description changes, Chrome ZIP upload, listed Mozilla XPI and source ZIP upload, exact notes, submission, and status verification. Package APIs and authenticated Chrome dashboard automation may be combined; the Chrome API alone does not update localized listing descriptions.
