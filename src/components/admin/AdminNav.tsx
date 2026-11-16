"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ADMIN_GROUPS, currentAdminLabel, isAdminTabCurrent } from "@/content/admin-nav";

/** Grouped side navigation on wide screens; a single "current page" menu on phones. */
export default function AdminNav() {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);

  // Close the phone menu after navigating.
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  const groups = ADMIN_GROUPS.map((group) => (
    <div key={group.title ?? "top"} className="admin-nav__group">
      {group.title && <p className="admin-nav__title">{group.title}</p>}
      <ul>
        {group.items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} aria-current={isAdminTabCurrent(pathname, item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ));

  return (
    <nav className="admin-nav" aria-label="Admin pages">
      <details ref={menu} className="admin-nav__menu">
        <summary>
          <span className="admin-nav__section">Admin</span>
          <span className="admin-nav__current">{currentAdminLabel(pathname)}</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </summary>
        <div className="admin-nav__panel">{groups}</div>
      </details>
      <div className="admin-nav__rail">{groups}</div>
    </nav>
  );
}
