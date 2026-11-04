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
user authorization.

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
