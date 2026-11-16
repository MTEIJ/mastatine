# Activity plugins

A plugin is an extra tool a committee can switch on for one activity, for example the scoreboard for the advent
calendar. Plugins are code in this repository and are added through a pull request; there is no uploading.

Committees use them from an activity: **Activity → Plugins → Add**. The overview of everything available is at
`/mastapps/plugins`.

## How it fits together

| Piece | Where |
| --- | --- |
| The contract (`definePlugin`) | `src/plugins/types.ts` |
| List of all plugins | `src/plugins/registry.ts` |
| One plugin | `src/plugins/<id>/index.tsx` (the scoreboard is the reference) |
| Instances: which plugin is on for which activity | table `activity_plugins`, `src/lib/plugin-instances.ts` |
| Per-instance storage for plugins | table `plugin_data`, `src/lib/plugin-data.ts` |
| Manage page (settings, link, add/remove) | `/mastapps/activities/[id]/plugins` |
| Public page without login | `/p/<token>` |
| Signup events | `src/plugins/events.ts`, called from `logActivityEvent` |

## Writing a plugin

1. Create `src/plugins/<id>/index.tsx` and default-export `definePlugin({...})`.
2. Import it in `src/plugins/registry.ts` and add it to `PLUGINS`.
3. If it needs more than the key/value store, add a migration with its own tables (cascading from `activity_plugins`).

What a definition provides:

- `id`, `name`, `description`. Never rename the `id` once the plugin has been used: it is stored in the database.
- `configSchema` (zod), `defaultConfig`, `configFromForm`, `ConfigFields`: the settings. The host wraps `ConfigFields`
  in a form, validates the result with `configSchema` and stores it.
- `Manage` (optional): extra tools for organisers beside the settings.
- `ActivitySection` (optional): a block on the activity page.
- `PublicPage` (optional): the page at `/p/<token>`. Without it the plugin has no public address.
- `onEvent` (optional): runs after a subscribe, unsubscribe or waitlist join.

## Rules that keep it safe

- **Server actions are public endpoints.** Check permission inside every action. The scoreboard does this with
  `canMark` (pure and tested) on each write, and with `getPluginViewer(...).isManager` for organiser actions.
- **Never trust ids from a form.** Load the instance from the database and check `plugin_id` and the activity's committee.
- **The public token is the only secret on a public page.** It is 128 bits, can be regenerated, and the page is
  `noindex` with no referrer. Do not put other secrets in the address; if you need per-person links (the scoreboard's
  "self" mode), compare keys with a constant-time check and never render another person's key.
- **Public pages show first names only**, never emails or user ids.
- **Rate-limit public writes** with `createRateLimiter`.
- **Keep SQL fragments out of module scope**: `sql` must not run at import time (`next build` has no database).
- Keep pure rules (permissions, parsing, ranking) in a file without React or database imports, and test them
  (see `src/plugins/scoreboard/logic.test.ts`).

## Scoreboard

Keeps a free-form number of marks per player. Settings: a title and who may add marks:

- **Anyone with the link**: everyone with `/p/<token>` can add or undo marks for anybody.
- **Only the committee**: the public page is read-only.
- **Everyone only their own**: every player gets a personal link (`/p/<token>?p=<key>`) that only changes their row.

Every mark is its own row in `plugin_data` with who made it (`link`, `self` or `committee:<user id>`) and when.
