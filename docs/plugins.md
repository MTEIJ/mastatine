# Activity plugins

A plugin is an extra tool a committee can switch on for one activity, for example the scoreboard for the advent
calendar. Plugins are code in this repository and are added through a pull request; there is no uploading.

Committees use them from an activity: **Activity → Plugins → Add**. The overview of everything available is at
`/mastapps/plugins`, with an **Installed** tab (what is switched on for your activities) and an **Explore** tab (everything available, with an "Add to" picker).

## How it fits together

| Piece | Where |
| --- | --- |
| The contract (`definePlugin`) | `src/plugins/types.ts` |
| List of all plugins | `src/plugins/registry.ts` |
| One plugin | `src/plugins/<id>/index.tsx` (the scoreboard is the reference) |
| Instances: which plugin is on for which activity | table `activity_plugins`, `src/lib/plugin-instances.ts` |
| Per-instance storage for plugins | table `plugin_data`, `src/lib/plugin-data.ts` |
| Manage page (settings, link, add/remove) | `/mastapps/activities/[id]/plugins` |
| Public page without login | `/p/<token>`: standalone and full screen, without the site header, sidebar or footer (`isStandalonePath`) |
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
- `PublicPage` (optional): the page at `/p/<token>`. Without it the plugin has no public address. The page is standalone: the plugin renders all of it (header, theme, footer) and gets the activity name only when the activity is public.
- `onEvent` (optional): runs after a subscribe, unsubscribe or waitlist join. `userId` is the person (null when unknown).
- `onSaved` (optional): runs after an organiser saved the settings, with the previous settings, so a plugin can act on a changed option.

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

A score per player: the start score plus every +1 and -1. Settings:

- **Theme**: *Clean* (compact, calm, follows light or dark mode, the default) or *Advent* (winter night, snow and gold).
  A theme is a block of `--sb-*` tokens in `scoreboard.css` plus an entry in `THEMES` in `logic.ts`.
- **Scores**: a start score, a minimum and an optional maximum. A score never leaves the range; the limits are enforced
  inside the single SQL statement that records a change. With a maximum the bars show progress towards it.
- **Who may change scores**:
  - *Anyone with the link*: everyone with `/p/<token>` can change anybody's score.
  - *Only the committee*: the public page is read-only.
  - *Everyone only their own*: every player gets a personal link (`/p/<token>?p=<key>`) that only changes their row.
- **Add everyone who subscribes**, now and later, by first name. Switching it on imports the current subscribers;
  someone an organiser removed stays off unless they subscribe again. Subscribers get a fixed player id per board, so
  adding the same person twice is harmless.

Every change is its own row in `plugin_data` (a tick with a delta of +1 or -1) with who made it (`link`, `self` or
`committee:<user id>`) and when. The look lives in `src/plugins/scoreboard/scoreboard.css` (`.sb-*` classes): the same
list markup is light inside the site on the activity page, and takes the chosen theme on the full-screen page.
