export interface AdminNavItem {
  label: string;
  href: string;
}

export interface AdminNavGroup {
  /** Null for the ungrouped first entry. */
  title: string | null;
  items: readonly AdminNavItem[];
}

/** Pages of the admin area, grouped by what an admin is trying to do. */
export const ADMIN_GROUPS: readonly AdminNavGroup[] = [
  { title: null, items: [{ label: "Overview", href: "/admin" }] },
  {
    title: "People",
    items: [
      { label: "Users", href: "/admin/users" },
      { label: "Committees", href: "/admin/committees" },
      { label: "Finance access", href: "/admin/finance-access" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Agenda", href: "/admin/agenda" },
      { label: "News", href: "/admin/news" },
      { label: "Newsletter", href: "/admin/newsletter" },
      { label: "Documents", href: "/admin/documents" },
      { label: "Masts", href: "/admin/masts" },
    ],
  },
];

/** Overview is only current on /admin itself; every other page also covers its sub-pages. */
export function isAdminTabCurrent(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** The label of the page the admin is on, for the collapsed phone menu. */
export function currentAdminLabel(pathname: string): string {
  const items = ADMIN_GROUPS.flatMap((g) => g.items);
  return items.find((i) => isAdminTabCurrent(pathname, i.href))?.label ?? "Admin";
}
