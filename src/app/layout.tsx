import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Lato } from "next/font/google";
import "./globals.css";
import Sidebar from "@/classic/Sidebar";
import SidebarAgenda from "@/classic/SidebarAgenda";
import Colophon from "@/classic/Colophon";
import AppShell from "@/classic/AppShell";
import AnnouncementBar from "@/components/AnnouncementBar";
import { getAnnouncement } from "@/lib/announcement";
import { siteUrl } from "@/lib/env";
import { getShopUrl } from "@/lib/shop";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "S.A. Mastatine | The study association for mastende engineers",
    template: "%s · S.A. Mastatine",
  },
  description:
    "S.A. Mastatine is the study association for Advanced Mast Technology. Submit your favourite mast and vote on the most impressive electromagnetic structures in the Netherlands.",
  applicationName: "S.A. Mastatine",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "S.A. Mastatine",
    description: "Submit a mast and vote on the finest transmission towers.",
    url: siteUrl(),
    siteName: "S.A. Mastatine",
    type: "website",
  },
  robots: { index: true, follow: true },
};

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

// The shop link comes from a runtime environment variable, so the layout is rendered per request.
export const instant = false;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return (
    <html lang="en" className={lato.className} suppressHydrationWarning>
      <body className="verbosa-landing-page verbosa-magazine-two verbosa-magazine-layout verbosa-no-sidebar-back">
        <a
          href="#main"
          className="sr-only z-50 bg-white px-4 py-2 text-sm font-bold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <AppShell shopUrl={getShopUrl()} sidebar={<Sidebar shopUrl={getShopUrl()} agenda={<Suspense fallback={<AgendaSkeleton />}><SidebarAgenda /></Suspense>} />} colophon={<Colophon />} announcement={<Suspense fallback={null}><AnnouncementSlot /></Suspense>}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
