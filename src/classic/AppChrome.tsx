"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAccountState } from "@/components/AccountState";
import { Icons } from "@/content/apps";
import { APP_HOME } from "@/lib/paths";

/**
 * The installed app's chrome: a top app bar (where am I, and the way back) and a bottom navigation bar (the four
 * places). Both are rendered everywhere but only show in the installed app; see surfaces.css.
 */

/** Where the Today tab goes: the app's own Today screen. */
const TODAY_HREF = APP_HOME;

const under = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

const iconProps = { viewBox: "0 0 24 24", width: 24, height: 24, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const TodayIcon = (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </svg>
);
const YouIcon = (
  <svg {...iconProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const MastsIcon = (
  <svg {...iconProps}>
    <path d="M12 2v20M8 22h8M9 7h6M8 12h8M7 17h10" />
  </svg>
);

interface Tab {
  label: string;
  href: string;
  icon: ReactNode;
  isCurrent: (pathname: string) => boolean;
}

const TABS: Tab[] = [
  { label: "Today", href: TODAY_HREF, icon: TodayIcon, isCurrent: (p) => p === "/" || p === "/app" },
  { label: "Activities", href: "/mastapps/activities", icon: Icons.activities, isCurrent: (p) => under(p, "/mastapps/activities") },
  { label: "Masts", href: "/masts", icon: MastsIcon, isCurrent: (p) => under(p, "/masts") },
  { label: "Apps", href: "/mastapps", icon: Icons.dashboard, isCurrent: (p) => (under(p, "/mastapps") && !under(p, "/mastapps/activities")) || under(p, "/admin") },
  { label: "You", href: "/account", icon: YouIcon, isCurrent: (p) => under(p, "/account") },
];

/** Website pages that can be opened from inside the app, with the name the top bar gives them. */
const SECTION_TITLES: [string, string][] = [
  ["/news", "News"], ["/shop", "Merch"], ["/membership", "Membership"], ["/about", "About"], ["/board", "The board"],
  ["/committees", "Committees"], ["/history", "History"], ["/contact", "Contact"], ["/privacy", "Privacy"],
  ["/terms", "Site rules"], ["/newsletter", "Newsletter"], ["/login", "Sign in"], ["/welcome", "Welcome"],
];

const ROOTS = new Set(["/", "/app", "/masts", "/mastapps", "/mastapps/activities", "/account"]);

/** The section the current page belongs to: the name in the top bar. Signed out, Today is just the way in. */
function titleFor(pathname: string, signedIn: boolean): string {
  if (pathname === "/" || pathname === "/app") return signedIn ? "Today" : "M.A. Mastatine";
  if (under(pathname, "/mastapps/activities")) return "Activities";
  if (under(pathname, "/masts")) return "Masts";
  if (pathname === "/mastapps") return "Apps";
  if (under(pathname, "/admin")) return "Admin";
  if (under(pathname, "/account")) return "You";
  if (under(pathname, "/mastapps")) {
    // Every MastApp is named after its slug (minutes, quotes, finance...).
    const slug = pathname.split("/")[2] ?? "";
    return slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Apps";
  }
  return SECTION_TITLES.find(([base]) => under(pathname, base))?.[1] ?? "M.A. Mastatine";
}

/** One step up, for when there is no history to go back to (the app was opened from a notification, say). */
function parentOf(pathname: string): string {
  if (under(pathname, "/mastapps/activities")) return "/mastapps/activities";
  if (under(pathname, "/account")) return "/account";
  if (pathname === "/admin") return "/mastapps";
  const segments = pathname.split("/").filter(Boolean);
  // Never climb above an app's own root (/mastapps/<app>) or the admin root.
  const rootSegments = under(pathname, "/mastapps") ? 2 : 1;
  if (segments.length > rootSegments) return `/${segments.slice(0, -1).join("/")}`;
  return under(pathname, "/mastapps") ? "/mastapps" : TODAY_HREF;
}

/** Top app bar: the section, and a back arrow on every page that is not one of the four places. */
export function AppTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signedIn } = useAccountState();
  const showBack = !ROOTS.has(pathname);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(parentOf(pathname));
  }

  return (
    <header className="appbar only-app">
      {showBack && (
        <button type="button" className="appbar__back" onClick={goBack} aria-label="Back">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
      )}
      <p className="appbar__title">{titleFor(pathname, signedIn)}</p>
    </header>
  );
}

/** Bottom navigation bar: Today, Activities, Masts, Apps, You. Only for people who are signed in (the others have nothing to navigate). */
export function AppTabBar() {
  const pathname = usePathname();
  const { signedIn } = useAccountState();
  if (!signedIn) return null;

  return (
    <nav className="tabbar only-app" aria-label="Main">
      {TABS.map((tab) => (
        <Link key={tab.label} href={tab.href} className="tabbar__tab" aria-current={tab.isCurrent(pathname) ? "page" : undefined}>
          {/* The pill behind the icon is the M3 active indicator; it springs open on the current tab. */}
          <span className="tabbar__icon">{tab.icon}</span>
          <span className="tabbar__label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
