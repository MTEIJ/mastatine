/** Pages of the admin area, shown as tabs in its header. */
export const ADMIN_NAV = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Masts", href: "/admin/masts" },
  { label: "Committees", href: "/admin/committees" },
  { label: "Agenda", href: "/admin/agenda" },
  { label: "News", href: "/admin/news" },
  { label: "Newsletter", href: "/admin/newsletter" },
  { label: "Documents", href: "/admin/documents" },
  { label: "Finance access", href: "/admin/finance-access" },
] as const;

/** Overview is only current on /admin itself; every other tab also covers its sub-pages. */
export function isAdminTabCurrent(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
