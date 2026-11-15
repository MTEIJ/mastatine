"use client";

import { useEffect } from "react";
import { startPwa } from "@/lib/pwa-client";

/** Mounted once in the root layout: registers the service worker and catches the install prompt. Renders nothing. */
export default function PwaBoot() {
  useEffect(() => {
    startPwa();
  }, []);
  return null;
}
