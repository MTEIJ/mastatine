/**
 * Light or dark: `<html data-theme>` switches the colour tokens (tokens.css).
 *   - The installed app follows the device setting, live.
 *   - The website is light unless the visitor picked dark with the footer toggle (kept in localStorage).
 * The app and the browser share localStorage, so the stored choice is only read outside the app.
 */
export const THEME_STORAGE_KEY = "theme";
export type Theme = "light" | "dark";

/** Inline in <head>: runs before first paint. `window.__mastatineTheme()` re-applies after the toggle stores a choice. */
export const THEME_SCRIPT = `(function(){var d=document.documentElement,app=matchMedia("(display-mode: standalone)"),dark=matchMedia("(prefers-color-scheme: dark)");function apply(){var t=null;try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}d.dataset.theme=app.matches?(dark.matches?"dark":"light"):(t==="dark"?"dark":"light")}apply();app.addEventListener("change",apply);dark.addEventListener("change",apply);window.__mastatineTheme=apply})()`;

declare global {
  interface Window { __mastatineTheme?: () => void }
}

/** Store the website's theme and apply it at once. */
export function setWebsiteTheme(theme: Theme) {
  try {
    if (theme === "dark") localStorage.setItem(THEME_STORAGE_KEY, "dark");
    else localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {}
  if (window.__mastatineTheme) window.__mastatineTheme();
  else document.documentElement.dataset.theme = theme;
}
