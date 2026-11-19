import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Lato } from "next/font/google";
import "./globals.css";
import "./navigation.css";
import "./m3.css";
import "./controls.css";
import "./surfaces.css";
import "./screens.css";
import Sidebar from "@/classic/Sidebar";
import SidebarAgenda from "@/classic/SidebarAgenda";
import Colophon from "@/classic/Colophon";
import AppShell from "@/classic/AppShell";
import AnnouncementBar from "@/components/AnnouncementBar";
import PwaBoot from "@/components/PwaBoot";
import { AccountStateProvider } from "@/components/AccountState";
import { getFinanceAccess } from "@/lib/finance-access";
import { getAnnouncement } from "@/lib/announcement";
import { siteUrl } from "@/lib/env";
import { getSession } from "@/lib/session";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "M.A. Mastatine | Master Association in Maastricht",
    template: "%s · M.A. Mastatine",
  },
  description:
    "M.A. Mastatine is the Master Association in Maastricht for masts, towers and pylons. Submit your favourite mast, vote on the most impressive structures in the Netherlands and join our activities.",
  applicationName: "M.A. Mastatine",
  icons: { icon: "/favicon.svg", apple: "/icons/apple-touch-icon.png" },
  // Installed on iOS: open full screen, under a short name.
  appleWebApp: { capable: true, title: "Mastatine", statusBarStyle: "default" },
  openGraph: {
    title: "M.A. Mastatine",
    description: "Submit a mast and vote on the finest transmission towers.",
    url: siteUrl(),
    siteName: "M.A. Mastatine",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#f57f20" };

/** Shown while the agenda loads, so the rest of the page is not held back by its queries. */
function AgendaSkeleton() {
  return (
    <section className="agenda" aria-busy="true">
      <h3 className="widget-title"><span>Agenda</span></h3>
    </section>
  );
}

/** The announcement comes from a cached read, so streaming it in costs almost nothing. */
async function AnnouncementSlot() {
  const announcement = await getAnnouncement();
  return announcement ? <AnnouncementBar {...announcement} /> : null;
}

// The layout reads who is signed in, so it is rendered per request.
export const instant = false;

/** Who is signed in, for the sidebar and the app shell. A broken auth setup shows the signed-out site rather than no site. */
async function readAccountState() {
  try {
    const session = await getSession();
    return {
      signedIn: Boolean(session),
      isAdmin: session?.user.role === "admin",
      isFinance: session ? (await getFinanceAccess()) !== null : false,
    };
  } catch (error) {
    console.error("Failed to read the session:", (error as Error).message);
    return { signedIn: false, isAdmin: false, isFinance: false };
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const account = await readAccountState();
  return (
    <html lang="en" className={lato.className} suppressHydrationWarning>
      <body className="verbosa-landing-page verbosa-magazine-two verbosa-magazine-layout verbosa-no-sidebar-back">
        <a
          href="#main"
          className="sr-only z-50 bg-white px-4 py-2 text-sm font-bold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <PwaBoot />
        <AccountStateProvider {...account}>
        <AppShell sidebar={<Sidebar agenda={<Suspense fallback={<AgendaSkeleton />}><SidebarAgenda /></Suspense>} />} colophon={<Colophon />} announcement={<Suspense fallback={null}><AnnouncementSlot /></Suspense>}>
          {children}
        </AppShell>
        </AccountStateProvider>
      </body>
    </html>
  );
}
