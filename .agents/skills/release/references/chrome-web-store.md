# Chrome Web Store

Use the personal service-account impersonation configuration in [credentials.md](credentials.md). Keep short-lived access tokens in memory. Verify publisher/item IDs. The [official guide](https://developer.chrome.com/docs/webstore/using-api) covers OAuth (`chromewebstore` scope), authorized service accounts, and uploads. Keep tokens private.

Read the published baseline from `publishedItemRevisionStatus.distributionChannels[].crxVersion` via [fetchStatus](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus); read both full previous descriptions from the published localized listings through HTTP/web tools. Submitted revisions are separate.

Before approval, use [media.upload](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/media/upload) for the ZIP. Verify version/upload state; query status while processing. Save target identity and package hash.

The [v2 API](https://developer.chrome.com/docs/webstore/api/reference/rest) has no release-notes metadata method. Find the listing's established changelog location; keep proposed text local. For non-patch releases, prepare the complete descriptions using the headline/history format in [ccxp-lite.md](ccxp-lite.md), preserving the remainder. After approval, hand both text files and the dashboard link to the user for pasting, saving, and submitting. The agent does not perform these dashboard steps. Patch releases leave descriptions unchanged. Do not invent fields or substitute private reviewer instructions for public notes. If no note location exists, include that decision in the review.

**Only after approval:** patches use [publish](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/publish); non-patch Chrome submission belongs to the user in the dashboard. `STAGED_PUBLISH` still submits for review, so it belongs after the gate. Preserve rollout; distinguish review status from public availability.

The publish request has no package-only selector to exclude other saved listing edits. Preserve the existing rollout/visibility, and distinguish the absence of description-edit API calls from proof that no saved dashboard changes exist.
