# Chrome Web Store

Use the personal service-account impersonation configuration in [credentials.md](credentials.md), or an explicitly configured OAuth alternative. Keep short-lived access tokens in memory. Verify publisher/item IDs. The [official guide](https://developer.chrome.com/docs/webstore/using-api) covers OAuth (`chromewebstore` scope), authorized service accounts, and uploads. Keep tokens private.

Read the published baseline from `publishedItemRevisionStatus.distributionChannels[].crxVersion` via [fetchStatus](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus); read previous notes from their actual listing/dashboard location. Submitted revisions are separate.

Before approval, use [media.upload](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/media/upload) for the ZIP. Verify version/upload state; query status while processing. Save target identity and package hash.

The [v2 API](https://developer.chrome.com/docs/webstore/api/reference/rest) has no release-notes metadata method. Find the listing's established changelog location; keep proposed text local. After approval, use the dashboard where necessary. For non-patch releases, update the headline/history in each locale using the format in [ccxp-lite.md](ccxp-lite.md), preserving the remainder of the description. Patch releases leave descriptions unchanged. Do not invent fields or substitute private reviewer instructions for public notes. If no note location exists, include that decision in the review.

**Only after approval:** [publish](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/publish) or its dashboard equivalent. `STAGED_PUBLISH` still submits for review, so it belongs after the gate. Preserve rollout; distinguish review status from public availability.
