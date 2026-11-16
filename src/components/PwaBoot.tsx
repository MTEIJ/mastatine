"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { APP_HOME } from "@/lib/paths";
import { startPwa } from "@/lib/pwa-client";

/**
 * Mounted once in the root layout: registers the service worker and catches the install prompt. In the installed app
 * the website's homepage is never shown: opening `/` (an install from before the app had its own start page, say) goes
 * to the app's Today screen. Renders nothing.
 */
export default function PwaBoot() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    startPwa();
  }, []);

  useEffect(() => {
    if (pathname === "/" && window.matchMedia("(display-mode: standalone)").matches) router.replace(APP_HOME);
  }, [pathname, router]);

  return null;
}
