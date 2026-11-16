"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import FullScreenApp from "./FullScreenApp";
import NewsletterBand from "./NewsletterBand";
import { AppTabBar, AppTopBar } from "./AppChrome";
import InstallBanner from "@/components/InstallBanner";
import { isFullScreenAppPath, isInformationPath, isStandalonePath } from "@/lib/paths";

interface AppShellProps {
  /** The regular site chrome, rendered on the server and passed in. */
  sidebar: ReactNode;
  colophon: ReactNode;
  /** Announcement strip shown above the site chrome (not in full-screen MastApps). */
  announcement?: ReactNode;
  children: ReactNode;
}

/** MastApps open full screen as a dashboard; every other page keeps the site layout (sidebar + footer). */
export default function AppShell({ sidebar, colophon, announcement, children }: AppShellProps) {
  const pathname = usePathname();

  if (isStandalonePath(pathname)) return <>{children}</>;

  if (isFullScreenAppPath(pathname)) {
    return <FullScreenApp>{children}</FullScreenApp>;
  }

  return (
    <div id="site-wrapper">
      <AppTopBar />
      {announcement}
      <div id="content" className="cryout">
        <div id="container" className="two-columns-left">
          {sidebar}
          <main id="main" className="main">
            {children}
          </main>
          <div style={{ clear: "both" }} />
        </div>
      </div>
      {isInformationPath(pathname) && <NewsletterBand />}
      {colophon}
      <InstallBanner />
      <AppTabBar />
    </div>
  );
}
