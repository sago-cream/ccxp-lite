# Release credentials

Use environment variables as the interface. Prefer injecting them from an existing password manager or secret manager. A gitignored `.env.release.local` is a convenient local alternative; the checked-in `.env.release.example` contains names and public IDs only. Do not put real keys in the skill, example, release packet, shell history, or chat.

## Local setup

From the repository root:

```sh
bun run release:setup
```

Paste each value at its prompt; input stays hidden. Enter keeps an existing value or skips an empty field. Each answer is saved immediately in the ignored `.env.release.local` with owner-only permissions. Ctrl+C stops while preserving saved answers. GitHub continues to use `gh` authentication; the setup command only writes local credentials and does not contact or submit to stores.

You can also fill the file in a local editor. Load it explicitly for Bun processes:

```sh
bun --env-file=.env.release.local run release <version> --ci --no-github.draft
```

Add the curated-note flags described in [ccxp-lite.md](ccxp-lite.md) when releasing. This example loads credentials; it does not replace that workflow or approve store submission. A plain `bun run release` does not automatically select this specially named env file. Store API clients must receive the same variables in their process environment; no store-upload script is implied by this template.

Worktrees do not share ignored files. If releasing from a different checkout, inject the variables there or use an explicit absolute `--env-file` path to the existing private file. Do not copy credentials into tracked worktree files. For a non-Bun client, use the secret manager's environment injection or a dotenv loader; do not source an untrusted file as shell code.

| Destination    | Variables                                                 | Source                                                                                                                       |
| -------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| GitHub         | Optional `GITHUB_TOKEN`                                   | Prefer existing `gh auth login` / keychain locally; privately pass its token to release-it if needed.                        |
| Chrome OAuth   | `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` | OAuth client and authorized refresh token for the Chrome Web Store scope. Exchange for a short-lived access token in memory. |
| Chrome target  | `CWS_PUBLISHER_ID`, `CWS_EXTENSION_ID`                    | Developer dashboard; these IDs are public configuration.                                                                     |
| Mozilla        | `AMO_JWT_ISSUER`, `AMO_JWT_SECRET`                        | AMO developer API credentials; mint a short-lived JWT in memory.                                                             |
| Mozilla target | `AMO_ADDON_ID`                                            | Existing add-on slug/GUID; public configuration.                                                                             |

The `CWS_*` and `AMO_ADDON_ID` names are this skill's convention. Existing `scripts/sign_firefox.ts` already consumes the two `AMO_JWT_*` variables, but signing remains behind the store approval boundary. An existing service-account setup may replace the Chrome OAuth trio; use its configured secret provider rather than creating a second credential system.

## CI

Use a protected GitHub Actions environment for release credentials. Store client secrets, refresh tokens, and AMO credentials as environment secrets; store public IDs as environment variables. Inject values only into the steps that need them. The GitHub release job needs an appropriately scoped token and `contents: write`; store credentials are separate.

Any future workflow must keep upload/validation separate from submission. Do not let an ordinary push publish to stores. Review of the exact packet and explicit store-note approval remains required; merely having credentials or passing a generic deployment gate is not approval of unseen text.

Check only whether required variables are present/nonempty. Report missing variable names, never values, token prefixes, or environment dumps. Read-only authentication checks may verify identity; do not test credentials by publishing or signing.
