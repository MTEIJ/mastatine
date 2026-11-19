"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MastatineLogo from "./MastatineLogo";
import SidebarAccount from "./SidebarAccount";
import { useAccountState } from "@/components/AccountState";

interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  children?: NavItem[];
}

function buildNav(): NavItem[] {
  return [
  { label: "Home", href: "/" },
  {
    label: "Association",
    href: "/about", // clicking the group opens its landing page and expands the subpages
    children: [
      { label: "About us", href: "/about" },
      { label: "The Board", href: "/board" },
      { label: "Committees", href: "/committees" },
      { label: "Membership", href: "/membership" },
      { label: "History", href: "/history" },
      { label: "Contact", href: "/contact" },
    ],
  },
  { label: "Activities", href: "/mastapps/activities" },
  { label: "MastApps", href: "/mastapps" },
  { label: "Merch", href: "/shop" },
  ];
}

function NavNode({ item, depth = 0, onNavigate }: { item: NavItem; depth?: number; onNavigate?: () => void }) {
  const has = !!item.children?.length;
  const pathname = usePathname();
  const matches = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const childActive = has && item.children!.some((c) => matches(c.href));
  const [open, setOpen] = useState(childActive);
  // Landing on (or navigating to) a page inside the group expands it. Adjusting state while rendering, from the
  // previous value of childActive, avoids the extra render pass an effect would cause.
  const [wasChildActive, setWasChildActive] = useState(childActive);
  if (childActive !== wasChildActive) {
    setWasChildActive(childActive);
    if (childActive) setOpen(true);
  }
  const active = !has && !item.external && matches(item.href);
  // Internal pages navigate client-side; only the external shop stays a plain anchor.
  const Tag: React.ElementType = !item.external ? Link : "a";

  return (
    <li style={{ position: "relative", display: "block", float: "none", clear: "both" }}>
      <div data-navrow style={{ display: "flex", alignItems: "center" }}>
        <Tag
          href={item.href}
          className="nav-link"
          data-active={active}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          onClick={has ? () => setOpen(true) : onNavigate}
          style={{
            display: "inline-block",
            lineHeight: 3,
            fontFamily: "Lato, Arial, sans-serif",
            fontSize: "110%",
            fontWeight: 700,
            cursor: "pointer",
            userSelect: "none",
            flex: 1,
            paddingLeft: `${0.9 + depth * 1.1}em`,
            textDecoration: "none",
            transition: "color .3s",
            maxWidth: has ? "calc(100% - 3em)" : "100%",
          }}
        >
          <span
            style={{
              display: "block",
              position: "relative",
              lineHeight: 1.5,
              padding: ".75em 0",
              wordBreak: "break-word",
              transition: "all .5s ease-in-out",
            }}
          >
            {item.label}
          </span>
        </Tag>
        {has && (
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={`${open ? "Close" : "Open"} ${item.label} submenu`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden style={{ transform: open ? "rotate(180deg)" : "none" }}>
              <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      {has && open && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {item.children!.map((child) => (
            <NavNode key={child.label} item={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Menu list; rows tint themselves on hover/focus and for the current page (pure CSS). */
function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate: () => void }) {
  return (
    <ul id="prime_nav" className="nav-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((item) => (
        <NavNode key={item.label} item={item} onNavigate={onNavigate} />
      ))}
    </ul>
  );
}

export default function Sidebar({ agenda }: { /** Upcoming activities, rendered on the server. */ agenda?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signedIn } = useAccountState();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const slider = document.querySelector<HTMLElement>(".lp-slider-overlay");
    const aside = sidebarRef.current;
    if (!slider || !aside) return;

    // The open mobile drawer is fixed to the viewport: a sticky offset would push it off screen.
    if (mobileOpen) {
      aside.style.top = "0px";
      return;
    }

    function setTop() {
      // Absolute distance from the page top to the slider's bottom edge.
      // Using this as a negative sticky top means the sidebar scrolls freely
      // until the slider bottom exits the viewport, then locks in place.
      const sliderAbsoluteBottom =
        slider!.getBoundingClientRect().bottom + window.scrollY;
      // The sticky announcement bar publishes its height; stay below it.
      aside!.style.top = `calc(var(--announce-h, 0px) - ${Math.max(0, sliderAbsoluteBottom)}px)`;
    }

    setTop();
    window.addEventListener("resize", setTop);
    return () => window.removeEventListener("resize", setTop);
  }, [mobileOpen]);

  // While the drawer is open: freeze the page behind it and let Escape close it.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Phones and tablets: a plain website header. Who we are on the left; sign in (visitors) and the menu on the right. */}
      <div className="mobile-bar lg:hidden">
        <Link href="/" className="mobile-bar__brand" aria-label="M.A. Mastatine, home">
          <MastatineLogo size={32} />
          <span>M.A. Mastatine</span>
        </Link>
        {!signedIn && <Link href="/login" className="mobile-bar__signin">Sign in</Link>}
        <button
          type="button"
          className="mobile-bar__menu"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="sidebar"
          id="nav-toggle"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="drawer-overlay lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        ref={sidebarRef}
        id="sidebar"
        // Any link in the drawer (account, logo, menu, agenda) closes it; group toggles have no href.
        onClick={(e) => { if ((e.target as HTMLElement).closest("a[href]")) setMobileOpen(false); }}
        className={[
          "flex flex-col",
          mobileOpen
            ? "mobile-drawer fixed inset-y-0 right-0 z-50 overflow-y-auto overscroll-contain"
            : "hidden lg:flex",
        ].join(" ")}
      >
        {/* Mobile close */}
        <button
          className="lg:hidden absolute top-1 right-1 h-11 w-11 text-2xl leading-none"
          style={{ color: "var(--text-mid)", background: "none", border: "none", cursor: "pointer" }}
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          id="nav-cancel"
        >
          ×
        </button>

        {/* ── HEADER (branding + nav + widgets + footer) ── */}
        <header id="header">
          {/* ── BRANDING ── */}
          <div id="branding" role="banner">
            <div className="identity hidden lg:block">
              <Link id="logo" href="/" title="M.A. Mastatine" rel="home">
                <MastatineLogo size={80} />
              </Link>
            </div>
            <h1 id="site-title" itemProp="headline">
              <span>
                <Link href="/" title="The Master Association" rel="home">
                  M.A. Mastatine
                </Link>
              </span>
            </h1>
            <span id="site-description" itemProp="description">
              The Master Association
            </span>
            <div className="branding-spacer" />

            {/* ── ACCOUNT: up here so it is visible without scrolling past the agenda ── */}
            <div className="loop-account">
              <SidebarAccount />
            </div>

            {/* ── PRIMARY NAV ── */}
            <nav id="access" role="navigation" aria-label="Primary menu">
              <h3 className="widget-title menu-title">
                <span>Menu</span>
              </h3>
              <div>
                <NavList items={buildNav()} onNavigate={() => setMobileOpen(false)} />
              </div>
            </nav>

            {agenda}

          </div>
        </header>
      </aside>
    </>
  );
}

