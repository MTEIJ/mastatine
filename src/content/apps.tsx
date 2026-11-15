import type { ReactNode } from "react";
import { ChartIcon, CheckIcon, ListIcon, PlusIcon } from "@/components/ui/icons";
import type { ShapeName, Tone } from "@/components/ui/ShapeIcon";

/** One entry per MastApp. The dashboard rail and the hub tiles both render from this list. */
export interface MastApp {
  slug: string;
  name: string;
  description: string;
  href: string;
  /** Opens in a new tab (the external shop). */
  external?: boolean;
  icon: ReactNode;
  /** Pages of this app, shown in its full-screen sidebar. */
  nav?: { label: string; href: string; icon: ReactNode; /** Only shown to signed-in visitors. */ needsLogin?: boolean }[];
  /** Who can use it, when not everyone: shown as a badge on the hub tile. */
  access?: string;
  /** Material 3 Expressive look: the shape behind the icon and the colour role of the tile. */
  shape: ShapeName;
  tone: Tone;
}

const svg = { viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const Icons = {
  activities: (
    <svg {...svg}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  minutes: (
    <svg {...svg}>
      <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" />
    </svg>
  ),
  dashboard: (
    <svg {...svg}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  quotes: (
    <svg {...svg}>
      <path d="M7 7h4v4H7zM15 7h4v4h-4z" />
      <path d="M7 11c0 3-1 4-3 5M15 11c0 3-1 4-3 5" />
    </svg>
  ),
  merch: (
    <svg {...svg}>
      <path d="M8 4 3 7l2 4 3-1v10h8V10l3 1 2-4-5-3a4 4 0 0 1-8 0z" />
    </svg>
  ),
  site: (
    <svg {...svg}>
      <path d="M3 11 12 4l9 7M5 10v10h14V10" />
    </svg>
  ),
  admin: (
    <svg {...svg}>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
    </svg>
  ),
};

/** Admin is an app like the others, but only admins see it. It brings its own tabs (ADMIN_NAV), so it has no nav here. */
export const ADMIN_APP: MastApp = {
  slug: "admin",
  name: "Admin",
  description: "Users, masts, committees, news and the newsletter.",
  href: "/admin",
  icon: Icons.admin,
  shape: "cookie6",
  tone: "neutral",
  access: "Admins",
};

export function getApps(isAdmin = false): MastApp[] {
  return [
    {
      slug: "activities",
      name: "Activities",
      description: "Find activities and subscribe, or organise your own.",
      href: "/mastapps/activities",
      icon: Icons.activities,
      shape: "cookie9",
      tone: "primary",
      nav: [
        { label: "Activities", href: "/mastapps/activities", icon: <ListIcon /> },
        { label: "New activity", href: "/mastapps/activities/new", icon: <PlusIcon />, needsLogin: true },
        { label: "Your activities", href: "/mastapps/activities/mine", icon: <CheckIcon />, needsLogin: true },
      ],
    },
    {
      slug: "minutes",
      name: "Minutes",
      description: "Agendas, minutes and action points for committees.",
      href: "/mastapps/minutes",
      icon: Icons.minutes,
      shape: "cookie4",
      tone: "tertiary",
      access: "Committees",
      nav: [
        { label: "Dashboard", href: "/mastapps/minutes", icon: Icons.dashboard },
        { label: "Meetings", href: "/mastapps/minutes/meetings", icon: <ListIcon /> },
      ],
    },
    {
      slug: "quotes",
      name: "Quotes",
      description: "Things members said, graded from 1 to 10.",
      href: "/mastapps/quotes",
      icon: Icons.quotes,
      shape: "clover4",
      tone: "secondary",
      access: "Members",
      nav: [
        { label: "All quotes", href: "/mastapps/quotes", icon: <ListIcon /> },
        { label: "Statistics", href: "/mastapps/quotes/statistics", icon: <ChartIcon /> },
        { label: "New quote", href: "/mastapps/quotes/new", icon: <PlusIcon />, needsLogin: true },
      ],
    },
    { slug: "merch", name: "Merch", description: "Wear the tallest opinions in the room.", href: "/shop", icon: Icons.merch, shape: "flower", tone: "primary" },
    ...(isAdmin ? [ADMIN_APP] : []),
  ];
}
