# Release credentials

Use environment variables as the interface. Prefer injecting them from an existing password manager or secret manager. A gitignored `.env.release.local` is a convenient local alternative; the checked-in `.env.release.example` contains names and public IDs only. Do not put real keys in the skill, example, release packet, shell history, or chat.

## Local setup

Use the personal Google Cloud project `ccxplite-releases` (`ccxpLite Releases`) for Chrome release authentication. It has no parent organization and no linked billing account. Keep this setup independent of NTHUSA projects, credentials, organization resources, and billing.

For local Chrome releases, use service-account impersonation: `CWS_SERVICE_ACCOUNT_EMAIL=ccxplite-release@ccxplite-releases.iam.gserviceaccount.com` and an explicitly configured personal `CWS_GCLOUD_ACCOUNT`. The personal account needs `roles/iam.serviceAccountTokenCreator` on that service account, and the service-account email must be linked to the personal Chrome publisher. Mint short-lived access tokens with `gcloud auth print-access-token --impersonate-service-account=... --scopes=https://www.googleapis.com/auth/chromewebstore --account=...`; capture the token in process memory, never print it. No Google private key file, Web-client secret, or refresh token is needed for this route. The repository setup verifier supports it.

Chrome allows one linked service account per publisher and grants API access to items owned by that publisher. Inspect the current link before editing it; do not replace an unrelated automation identity. See the [official service-account guide](https://developer.chrome.com/docs/webstore/service-accounts).

Collect one explicitly named value at a time through T3's private `request_secret` card with `delivery: "file"`. Open the relevant signed-in dashboard, identify the exact field, and do not capture credential values in browser snapshots, screenshots, tool output, or chat. Import the returned private file directly; never paste the value into command arguments.

From the repository root:

```sh
bun run release:setup status
bun run release:setup set AMO_JWT_ISSUER --from-file /private/path/from-entry-card
bun run release:setup clear AMO_JWT_ISSUER
bun run release:setup verify mozilla
bun run release:setup verify chrome
```

Each `set` names the destination field explicitly and saves only that value. `clear KEY` removes a wrong value; `reset` discards all saved values and restores only the default public extension/add-on IDs. The ignored `.env.release.local` is written atomically with owner-only permissions. `status` prints field names and presence only; `verify` exchanges tokens in memory and makes read-only requests to the configured store targets. GitHub continues to use the existing `gh` authentication. Setup does not upload, sign, or submit packages.

Mozilla's Manage API Keys page labels the two fields **JWT issuer** (`user:number:number`) and **JWT secret**. Keep them separate. Read-only verification checks both authentication and the add-on GUID against the Firefox manifest.

You can also fill the file in a local editor. Load it explicitly for Bun processes:

```sh
bun --env-file=.env.release.local run release <version> --ci --no-github.draft
```

Add the curated-note flags described in [ccxp-lite.md](ccxp-lite.md) when releasing. This example loads credentials; it does not replace that workflow or approve store submission. A plain `bun run release` does not automatically select this specially named env file. The `release:flow` runner loads the ignored local file and lets explicitly supplied environment values override it.

Worktrees do not share ignored files. If releasing from a different checkout, inject the variables there or use an explicit absolute `--env-file` path to the existing private file. Do not copy credentials into tracked worktree files. For a non-Bun client, use the secret manager's environment injection or a dotenv loader; do not source an untrusted file as shell code.

| Destination       | Variables                                         | Source                                                                                                                                         |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub            | Optional `GITHUB_TOKEN`                           | Prefer existing `gh auth login` / keychain locally; privately pass its token to release-it if needed.                                          |
| Chrome local auth | `CWS_SERVICE_ACCOUNT_EMAIL`, `CWS_GCLOUD_ACCOUNT` | Personal service account linked to the Chrome publisher; personal gcloud login permitted to impersonate it. Public configuration, not secrets. |
| Chrome target     | `CWS_PUBLISHER_ID`, `CWS_EXTENSION_ID`            | Developer dashboard; these IDs are public configuration.                                                                                       |
| Mozilla           | `AMO_JWT_ISSUER`, `AMO_JWT_SECRET`                | AMO developer API credentials; mint a short-lived JWT in memory.                                                                               |
| Mozilla target    | `AMO_ADDON_ID`                                    | Existing add-on slug/GUID; public configuration.                                                                                               |

The `CWS_*` and `AMO_ADDON_ID` names are this skill's convention. Existing `scripts/sign_firefox.ts` already consumes the two `AMO_JWT_*` variables, but signing remains behind the store approval boundary. The personal gcloud login stays in its existing local credential store; do not copy it into the repository or a release packet.

Check only whether required variables are present/nonempty. Report missing variable names, never values, token prefixes, or environment dumps. Read-only authentication checks may verify identity; do not test credentials by publishing or signing.
