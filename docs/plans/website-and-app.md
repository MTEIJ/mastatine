# Plan: separate the website from the app

Status: approved (2026-11-16). Execute phase by phase; each phase ends in a working, committed state.

Progress: phase 0 done (`90ed875`); phase 1 done (surface switch in `src/app/surfaces.css`); phase 2 done (`AppChrome.tsx`:
top bar + bottom bar); phase 3 done (`/app` Today screen, `APP_HOME` in `src/lib/paths.ts`, manifest `start_url`, `PwaBoot`
redirect). Deviation: Today's "Coming up" cards show "You're going" / "Members only" but no join cue (one tap opens the
activity, where joining happens); revisit if people ask for joining straight from Today.

## The problem

The same pages and chrome serve two very different situations, and each borrows the wrong half of the other:

- **The website** (a browser tab, mostly visitors) has picked up app furniture: a bottom navigation bar for anyone who
  ever signed in, round icon-launcher shortcuts with "cookie" shapes on the homepage, pill buttons and tonal chips
  everywhere, full-screen app shells.
- **The installed app** (home-screen PWA) is really the website in a frame: hamburger drawer with the full site menu,
  orange page background, Minecraft/mast hero, "Stay in the loop" newsletter band, a three-column footer with legal
  links, the intro text, and an account page full of website cards. It also has three navigation systems at once:
  hamburger drawer, bottom bar, and the app shell's "← MastApps" back button plus sub-tabs.

Seen in screenshots (phone 390 px, signed in, `display-mode: standalone` emulated):

| Screen | What is wrong |
| --- | --- |
| App, Home | Website homepage: hero carousel, Minecraft chip, newsletter band, full footer. Nothing about *my* activities. |
| App, Account | "Install the app" card shows inside the installed app; "Open MastApps" duplicates the Apps tab; each card has a 2em h2 (legacy `h2` rule); sign out is the first action; newsletter band and footer below. |
| App, Activities | Full-screen shell with "← MastApps" back button that goes to the hub instead of back; bottom bar Home leads to the *website* homepage. |
| Website, desktop home | The next activity appears four times: announcement bar, sidebar agenda, hero countdown, "Coming up". Intro, hero, Coming up, masts, newsletter band, footer: too many sections before the masts. |
| Website, phone (member) | Bottom bar, launcher icons with organic shapes and a "Coming up" hub make it feel like an app. |

## The decision

Two surfaces, chosen by **where it runs**, not by who is signed in:

1. **Website** = any browser tab. Editorial and informational: who we are, what is on, news, masts, joining.
   Normal website navigation (desktop sidebar, phone header + drawer). No bottom bar, no launcher, calmer shapes.
   Signed-in members still get everything (account link, MastApps), just as a website.
2. **App** = the installed PWA (`display-mode: standalone`). Task-focused: what am I going to, what is on, my tools,
   my settings. App shell only: top app bar with the page title (and back where it makes sense) and a bottom bar.
   No hamburger, no footer, no newsletter band, no intro, no hero, no orange page background.

Material 3 Expressive (shapes, springs, tonal tiles) belongs to the **app** and the full-screen MastApps tools. The
website keeps the shared colour tokens but uses plainer shapes.

### How the surface is detected

Use the CSS media feature `display-mode`, not a cookie and not sign-in state:

- Render **both** chromes on the server and switch with `@media (display-mode: standalone)` / `(display-mode: browser)`.
  No flash, works on iOS home-screen apps, and needs no server knowledge.
- Do **not** use a cookie: an installed PWA shares cookies with the browser profile, so a cookie would turn the
  browser tab into the app too.
- Content that differs (the app's home) gets its own route, **`/app`**, with `start_url: "/app?source=pwa"` (see
  decision 3). In standalone, a visit to `/` is replaced with `/app?source=pwa` client-side (`router.replace`) so the
  logo/"Home" links never land on the website homepage inside the app.
- Remove the "app mode" heuristic (`src/lib/app-mode.ts`: signed in or signed in before). The bottom bar is standalone-only.

How to check: Chrome cannot emulate `display-mode` (neither DevTools nor CDP `Emulation.setEmulatedMedia` supports
it). Either install the site as an app and open it, or in a test script override `window.matchMedia` for
`(display-mode: standalone)` before load and, once loaded, switch every `display-mode` `CSSMediaRule` on
(`mediaText = "all"`; `"not all"` for the `not all and (display-mode: standalone)` ones). Production builds name the
session cookie `__Secure-better-auth.session_token` (`useSecureCookies`), dev builds `better-auth.session_token`.

## Decisions (confirmed by Michiel, 2026-11-16)

1. App bottom bar tabs: **Today** (`/app`), **Activities** (`/mastapps/activities`), **Apps** (`/mastapps`),
   **You** (`/account`). News and masts stay website-only.
2. Desktop website keeps the **left sidebar**; simplify it, do not replace it.
3. **Signed-out visitors cannot open the app in a browser.** The app surface only exists in the installed PWA:
   - Browser tab, signed out, visiting `/app` → redirect to `/` (the website).
   - Browser tab, signed in, visiting `/app` → also redirect to `/`: in a browser the website is the experience.
   - Installed PWA, signed out → a welcome screen: logo, one line about the app, a **Sign in** button
     (`/login?next=/app%3Fsource%3Dpwa`). No activity list, no other content.
   - Installed PWA, signed in → Today.

   The server cannot see `display-mode`, so the app marks its own requests: `start_url` is **`/app?source=pwa`**, and
   the app chrome's Today tab links to `/app?source=pwa` too. `/app` without `source=pwa` redirects to `/`. The login
   flow must keep the `next` parameter (see `src/lib/safe-redirect.ts`) so the PWA returns to Today after signing in.

## Phases

### Phase 0 — Housekeeping (small)

- Local dev DB stability: PGlite's socket desyncs under concurrent queries ("bind message supplies N parameters, but
  prepared statement \"\" requires 0"), after which pages hang. Add `DATABASE_POOL_MAX` to `src/lib/db.ts`
  (`max: Number(process.env.DATABASE_POOL_MAX ?? 10)`), document it in `.env.example`, and set it to `1` for the
  PGlite dev database (mention in README's dev section).
- Remove the unused `writeFile` import in `scripts/seed-activities.mjs` (the only lint warning).

### Phase 1 — Surface switch infrastructure

- `src/app/m3.css` (or a new `src/app/surfaces.css` imported after it): two utility classes,
  `.only-app` (hidden unless `display-mode: standalone`) and `.only-web` (hidden in standalone). Use
  `@media not (display-mode: standalone)` rather than `(display-mode: browser)` so `minimal-ui`/`fullscreen` count as web.
- In standalone, hide all website chrome with those classes or targeted rules: `#sidebar` and `.mobile-bar`
  (`src/classic/Sidebar.tsx`), `.announce` (`AnnouncementBar`), `NewsletterBand`, `#colophon` (`Colophon`), and switch the
  body background from orange to `var(--md-surface)`.
- `src/classic/MobileTabBar.tsx`: render always, wrap in `.only-app`; delete `useAppMode` and `src/lib/app-mode.ts`.
  Update the `body:has(.tabbar)` rules in `src/app/navigation.css` to apply only in standalone.
- (Moved to phase 3, because they need the `/app` route to exist.) `src/app/manifest.ts`:
  `start_url: "/app?source=pwa"`; shortcuts stay. `src/components/PwaBoot.tsx`: when standalone and `pathname === "/"`,
  `router.replace("/app?source=pwa")`.
- Acceptance: in a browser tab nothing app-like appears (no bottom bar at any width); with standalone emulated, no
  hamburger, footer, newsletter band, announcement or orange background on any page.

### Phase 2 — App shell

- New `src/classic/AppChrome.tsx` (client), rendered once in `AppShell` and `FullScreenApp`, inside `.only-app`:
  - **Top app bar**: page title (derive from route: Today / Activities / Apps / You / app name), a back button on
    detail pages (activity detail, meeting, quote) using `router.back()` with a fallback href, and nothing else.
  - **Bottom bar**: Today (`/app?source=pwa`), Activities, Apps, You, built on the existing `.tabbar` styles.
- `src/classic/FullScreenApp.tsx` in standalone: hide `.dash-back` ("← MastApps") and the desktop account link; keep the
  app's sub-pages (e.g. Activities / New activity / Your activities) as a tab row under the top app bar.
- Page-level headings that duplicate the top app bar title (`PageHeader`, `AppFrame` titles) get `.only-web`.
- Acceptance: standalone has exactly one way up (top bar back) and one way across (bottom bar); every tab keeps
  the bottom bar visible; no page shows both a top-bar title and the same big heading.

### Phase 3 — Today (`/app`)

- New `src/app/(pages)/app/page.tsx` (server). Without `?source=pwa` → `redirect("/")` (decision 3). Signed in:
  1. **Next for you**: the next activity the user joined (hero card: poster, name, date, place, live countdown from
     `ActivityCountdown`, "Add to calendar" via `/mastapps/activities/[id]/event.ics`). Empty state: "You have not
     joined anything yet" + link to Activities.
  2. **Coming up**: the next 3–5 activities with the join cue (reuse `joinCue`/card markup from
     `src/app/(pages)/mastapps/activities/page.tsx`; extract it to a shared component first).
  3. Nothing else. No launcher (the Apps tab is the launcher), no news, no masts.
- Signed out (only reachable from the installed app): a welcome screen with the logo, one line, and a **Sign in**
  button to `/login?next=/app%3Fsource%3Dpwa`. Check that `/login` honours `next` after the magic link and that
  `src/lib/safe-redirect.ts` accepts the query string.
- Data: add `getMyNextActivity(userId)` to `src/lib/activities.ts` (subscribed, visible, not ended, soonest).
- In a browser tab `/app` redirects to `/`, so it never appears in the website.

### Phase 4 — You (`/account`) as app settings

- In standalone, restyle `src/app/(pages)/account/page.tsx` as an M3 list: profile row (name, email, edit), a
  **Notifications** switch row (from `AppSettings`), **Newsletter** switch row, **Membership** row, then a quiet
  "Download my data", "Sign out", and the danger zone last.
- Remove "Open MastApps" in the app (`.only-web`), and hide the install card in standalone. Note: with standalone
  emulated the "Install the app" card still showed; check `installStore` in `src/lib/pwa-client.ts` (snapshot taken
  before hydration?) and fix so it hides in the installed app.
- Fix the oversized card headings: the legacy `h2 { font-size: 2em }` in `src/app/globals.css` leaks into cards; give
  card titles an explicit size (`text-lg font-extrabold`).

### Phase 5 — Calmer website

- **Homepage** (`src/app/page.tsx`, `src/components/HomeHub.tsx`):
  - One place for "what is on": keep **Coming up**, drop the duplicate countdown from the hero
    (`UpcomingActivities` highlight) *or* the sidebar agenda on the homepage; keep the announcement bar for news only.
  - Remove the signed-in app launcher (`AppLauncher` with `ShapeIcon`) from the website; signed-in members see
    Coming up with "You're going" marks, nothing more. The intro can stay hidden for members.
  - Phone order for visitors: short intro → Coming up → hero (masts) → news/masts grid.
- **Shapes on the website**: scope the expressive rules in `src/app/m3.css` (`.shape-icon`, organic masks, morphing
  radii, spring hover on cards) to the app and `.dash` shells. Website buttons: keep rounded but drop the press
  morph; cards: `--shape-lg` corners, no hover-lift springs.
- **MastApps page** (`src/app/(pages)/mastapps/page.tsx`) in a browser: a plain list/grid of apps with name and one
  line, no organic shapes; in the app (Apps tab) keep the bento tiles.
- Remove the bottom-bar spacing rules for the website; check the phone footer still sits flush.

### Phase 6 — Verify and ship

- Screenshot matrix: {visitor, member} × {phone 390, tablet 720, desktop 1440} in the browser, plus phone in
  standalone, for `/`, `/app`, `/mastapps`, `/mastapps/activities`, an activity detail, `/account`, `/about`.
- Keyboard pass (focus visible, focus not under sticky bars), reduced motion, iOS Safari standalone if available.
- `bunx tsc --noEmit`, `bun run lint`, `npx next build` (local Bun 1.2 on Windows fails page-data collection with a
  ChunkLoadError unrelated to this work; CI's Bun 1.4 on Linux is the reference).
- Commit per phase; pull --rebase and push after each commit.

## Files most likely touched

`src/app/layout.tsx`, `src/classic/AppShell.tsx`, `src/classic/FullScreenApp.tsx`, `src/classic/Sidebar.tsx`,
`src/classic/MobileTabBar.tsx`, new `src/classic/AppChrome.tsx`, `src/components/PwaBoot.tsx`, `src/app/manifest.ts`,
new `src/app/(pages)/app/page.tsx`, `src/components/HomeHub.tsx`, `src/app/page.tsx`,
`src/app/(pages)/account/page.tsx`, `src/components/AppSettings.tsx`, `src/lib/pwa-client.ts`, `src/lib/activities.ts`,
`src/app/m3.css`, `src/app/navigation.css`, `src/app/globals.css`; delete `src/lib/app-mode.ts`.

## Risks

- **Rendering both chromes** adds a little HTML per page; keep `AppChrome` light (no data fetching; titles from the
  route).
- **`router.replace("/app?source=pwa")` on `/`** briefly shows the website homepage if the app ever opens on `/`;
  acceptable, since `start_url` is `/app?source=pwa`.
- **`source=pwa` is only a hint**: anyone can type it in a browser and see the app's Today screen. That is harmless
  (it shows only what the website shows that person anyway); it is about presentation, not access control.
- **Existing installs** keep their old `start_url` until the browser refreshes the manifest; the `/` → `/app`
  redirect in `PwaBoot` covers them in the meantime.
- **Next 16**: read `node_modules/next/dist/docs/` before using routing APIs (`proxy.ts` replaced middleware; not
  needed for this plan).
- **Shared components** (activity card, settings rows) should be extracted before being reused, not copied.
