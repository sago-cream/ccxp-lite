# Mozilla Add-ons

Use configured issuer/key and secret. [Authentication](https://mozilla.github.io/addons-server/topics/api/auth.html) uses HS256 JWTs with `iss`, unique `jti`, `iat`, and `exp` within five minutes; send `Authorization: JWT …` privately.

Verify addon ID/GUID and channel. Read the last public listed version and its `release_notes` through the [Add-ons API](https://mozilla.github.io/addons-server/topics/api/addons.html). Exclude unlisted/pending versions from that baseline.

Before approval: multipart `POST /api/v5/addons/upload/` with `upload` and `channel=listed`; poll `GET /api/v5/addons/upload/{uuid}/`. Require `processed`, `valid`, matching version, and `submitted=false`. Retain UUID.

**Only after approval:** `POST /api/v5/addons/addon/{addon}/versions/` creates/submits the version. For non-patch releases, include the approved one-line localized `release_notes`. For patch releases omit `release_notes` entirely; preserve the existing public notes. Where source is required, follow the documented multipart version-source flow; complex localized notes require a separate JSON request. Prepare all payloads beforehand and attach source at the earliest supported submission operation.

Keep public notes separate from reviewer `approval_notes`. Never substitute unlisted signing for listed publication. After uncertainty, inspect existing versions before retrying. Verify returned version ID, source, notes, and status.
