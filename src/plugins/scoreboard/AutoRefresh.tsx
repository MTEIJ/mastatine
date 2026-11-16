"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches the page now and then so everyone sees the latest marks. Pauses while the tab is hidden. */
export default function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
