"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarAccount from "./SidebarAccount";
import MobileTabBar from "./MobileTabBar";
import { useAccountState } from "@/components/AccountState";
import { getApps } from "@/content/apps";
import { ADMIN_NAV, isAdminTabCurrent } from "@/content/admin-nav";
import { appSlug, isAdminPath } from "@/lib/paths";

/** Full-screen shell for a single MastApp or the admin area: a slim header with the pages, and a scrolling canvas. */
export default function FullScreenApp({ shopUrl, children }: { shopUrl: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const { signedIn } = useAccountState();
  const slug = appSlug(pathname);
  const app = getApps(shopUrl).find((a) => a.slug === slug);
  const admin = isAdminPath(pathname);
  const appNav = app?.nav?.filter((item) => signedIn || !item.needsLogin) ?? [];

  return (
    <div className={admin ? "dash dash--admin" : "dash"}>
      <header className="dash-bar">
        {/* Always the way out: back to the MastApps hub from an app, back to the site from the hub itself. */}
        <Link href={app || admin ? "/mastapps" : "/"} className="dash-back">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          <span>{app || admin ? "MastApps" : "Back to site"}</span>
        </Link>

        {admin && <span className="dash-title">Admin</span>}

        {admin && (
          <nav className="dash-nav" aria-label="Admin pages">
            {ADMIN_NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isAdminTabCurrent(pathname, item.href) ? "page" : undefined}>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* A single page needs no tabs (signed-out visitors of Activities only have the list). */}
        {app && appNav.length > 1 && (
          <nav className="dash-nav" aria-label={`${app.name} pages`}>
            {appNav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}

        <div className={admin ? "dash-foot" : "dash-foot dash-foot--desktop"}>
          <SidebarAccount />
        </div>
      </header>

      <main id="main" className="dash-main">
        {children}
      </main>

      {/* The admin area keeps its dense tab row; everywhere else phones get the same tab bar as the site. */}
      {!admin && <MobileTabBar />}
    </div>
  );
}
