"use client";

import { useSyncExternalStore } from "react";
import { setWebsiteTheme, type Theme } from "@/lib/theme";

/** Footer switch between the website's light and dark look. The installed app has no footer: it follows the device. */
/** The theme on <html>, watched so the label follows any change (the toggle, or the device setting in the app). */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const readTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const readServerTheme = (): Theme | null => null;

export default function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, readServerTheme);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={theme === "dark"}
      onClick={() => setWebsiteTheme(next)}
      // Rendered before the theme is known on the server; the label settles after mount.
      style={theme === null ? { visibility: "hidden" } : undefined}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
