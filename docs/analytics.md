# Menu mode analytics

Use a dedicated GA4 web stream for extension runtime events. The existing
`G-Z6QQ37YNZP` stream belongs to the managed Chrome Web Store listing property;
keep that stream for listing traffic.

The prepared runtime setup is account `414707512`, property
[`ccxpLite Extension Runtime`](https://analytics.google.com/analytics/web/#/a414707512p562305718/admin),
web stream `16270665475`, measurement ID `G-JC8PYML0BP` (Taiwan reporting time).
Runtime collection is intentionally disabled: no Measurement Protocol API secret
has been created. Before activation, the account owner must complete Google's
user-data collection acknowledgement confirming the required disclosures and
user authorization. Keep both build settings unset until the activation work below
is complete; supplying both settings enables delivery without a per-user consent
check in the current implementation.

Event-scoped custom dimensions **Menu mode** (`menu_mode`) and **Previous menu
mode** (`previous_menu_mode`) are already registered in the runtime property.

The obsolete `GTM-MVCTGKXT` container's **[Retired] GA4 - config** tag is paused
in published version 3. Current extension packages do not load GTM. Preserve the
managed Chrome Web Store property for listing analytics.

Set `CCXP_LITE_GA4_MEASUREMENT_ID` and `CCXP_LITE_GA4_API_SECRET` in the build environment or an ignored `.env.local`,
then run `bun run build:crx` (or `bun run build:firefox`). Bun loads `.env.local`
automatically. Builds without either setting disable analytics, including CI fixture
builds. The secret is included in the packaged background worker, as required by
the extension's direct Measurement Protocol integration; use a dedicated secret
for this extension and rotate it through GA4 when needed. Do not commit it.
The build adds Google Analytics host access only when both settings are present.

## Future activation work

The consent UI remains an idea, not part of this implementation. Consider a small,
unchecked opt-in in the login footer, with a Privacy link and wording that clearly
identifies Google Analytics and the menu usage statistics being shared. Expose the
same setting in the signed-in profile menu so users can withdraw without logging
out. A modal is not required by this proposed design.

Before activating collection:

- Implement and persist an explicit per-user choice in extension storage. Gate all
  analytics in the background worker before creating identifiers or sending events;
  unknown or declined choices must send nothing. Do not replay pre-consent events.
- Review the event payloads and minimize them for the intended comparison. Current
  events still include page paths/titles, function IDs/labels, and a persistent
  pseudonymous client ID. Removing URL query strings and fragments does not make
  that data anonymous.
- Publish the privacy disclosure and update Chrome Web Store privacy practices.
  Update Firefox's `data_collection_permissions` before enabling its builds; it
  currently declares no collection. Decide how to record consent and handle
  withdrawal and identifier deletion.
- Complete Google's user-data collection acknowledgement only when accurate,
  create a dedicated API secret, and configure the release build credentials.
  Packaged secrets are extractable; review whether to retain direct Measurement
  Protocol delivery or introduce a collector before activation.
- Validate payloads and verify real events in GA4 Realtime/DebugView. Delivery
  tests currently mock Google; no live runtime collection has been verified.

The proposed opt-in is informed by the
[Chrome disclosure requirements](https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements)
and [GA privacy disclosure policy](https://support.google.com/analytics/answer/7318509).

## Events and reporting

| Event                                                     | Meaning                                                                                                           |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `ccxp_lite_menu_view`                                     | Initial rendered menu mode, then each change of mode. Search, favorites, and category rerenders do not add views. |
| `ccxp_lite_menu_mode_change`                              | A user changes the mode in Settings; includes `previous_menu_mode`.                                               |
| `ccxp_lite` with `feature=navigation`, `action=open_link` | A function is opened from the menu or homepage.                                                                   |

All these events include `menu_mode=sidebar` or `menu_mode=fullscreen`. Existing
`sidebar_variant=classic` / `layered` parameters remain available. Inquire page
views also include the mode. Page URLs exclude query strings and fragments so
CCXP session tokens are not sent.

In **Explore**, use Menu mode as rows and Event name as
columns, with Event count and Total users as values. Filter to the events above;
for link usage, also filter to `feature=navigation` and `action=open_link` using
event-scoped custom dimensions for those existing parameters. Menu views count
activations per loaded page, not time spent. A person switching modes can count
in both user totals. Historical data cannot be backfilled.

Validate sample payloads with Google's
[Measurement Protocol validation endpoint](https://developers.google.com/analytics/devguides/collection/protocol/ga4/validating-events),
then verify actual delivery in GA4 Realtime. A successful collection HTTP response
alone does not prove GA4 processed the event.
