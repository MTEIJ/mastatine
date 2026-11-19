import { BUTTON_COLOURS, type ButtonTone } from "@/lib/markdown-button";

// Brand colours, see brand/GUIDE.md. Shared by the email shell and the Markdown formatter.
export const BRAND_ORANGE = "#f57f20";
export const CORAL = "#e5432a";
export const CREAM = "#fff4e2";
export const INK = "#161616";
export const MUTED = "#5f5648";
export const LINE = "#ece8e1";
/** Orange darkened enough to stay readable as link text on white. */
export const LINK = "#b8460b";
export const PAGE_BG = "#fbeeda";
export const FONT = "Lato,'Helvetica Neue',Helvetica,Arial,sans-serif";
export const CAPS_FONT = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";

export const P_STYLE = `margin:0 0 14px;font-size:16px;line-height:1.6;color:${INK}`;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * An email button: a rounded link with an arrow. `href` and `labelHtml` must already be escaped (the Markdown formatter
 * passes formatted text). Inline-block, so two in one paragraph sit side by side and wrap on a narrow screen.
 */
export function emailButton(href: string, labelHtml: string, tone: ButtonTone = "dark"): string {
  const c = BUTTON_COLOURS[tone];
  const arrow = tone === "dark" ? BRAND_ORANGE : c.fg;
  return `<a href="${href}" bgcolor="${c.bg}" style="display:inline-block;margin:0 8px 10px 0;background:${c.bg};color:${c.fg};text-decoration:none !important;border-radius:999px;font-size:16px;font-weight:700;padding:15px 30px">${labelHtml} <span style="color:${arrow}">&rarr;</span></a>`;
}

/** Shown under every text box whose content goes into an email. Kept here so client forms can import it. */
export const FORMAT_HINT =
  'Formatting: **bold**, *italic*, [link text](https://…), [button text](https://… "button"), # heading, - list, > quote, --- line. Buttons can be "button orange" or "button green".';
