"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAccountState } from "@/components/AccountState";
import { Icons } from "@/content/apps";

interface Tab {
  label: string;
  href: string;
  icon: ReactNode;
  isCurrent: (pathname: string) => boolean;
}

const under = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

const UserIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

function buildTabs(signedIn: boolean): Tab[] {
  return [
    { label: "Home", href: "/", icon: Icons.site, isCurrent: (p) => p === "/" },
    { label: "Activities", href: "/mastapps/activities", icon: Icons.activities, isCurrent: (p) => under(p, "/mastapps/activities") },
    { label: "MastApps", href: "/mastapps", icon: Icons.dashboard, isCurrent: (p) => under(p, "/mastapps") && !under(p, "/mastapps/activities") },
    signedIn
      ? { label: "Account", href: "/account", icon: UserIcon, isCurrent: (p) => under(p, "/account") }
      : { label: "Sign in", href: "/login", icon: UserIcon, isCurrent: (p) => under(p, "/login") },
  ];
}

/** Bottom navigation bar of the installed app (hidden in a browser tab, see surfaces.css): the activities and the MastApps are always one tap away. */
export default function MobileTabBar() {
  const pathname = usePathname();
  const { signedIn } = useAccountState();

  return (
    <nav className="tabbar only-app" aria-label="Quick navigation">
      {buildTabs(signedIn).map((tab) => {
        const current = tab.isCurrent(pathname);
        return (
          <Link key={tab.href} href={tab.href} className="tabbar__tab" aria-current={current ? "page" : undefined}>
            {/* The pill behind the icon is the M3 active indicator; it springs open on the current tab. */}
            <span className="tabbar__icon">{tab.icon}</span>
            <span className="tabbar__label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
