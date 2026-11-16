// Brand colours, see brand/GUIDE.md. Shared by the email shell and the Markdown formatter.
export const BRAND_ORANGE = "#f57f20";
export const CORAL = "#e5432a";
export const CREAM = "#fff4e2";
export const INK = "#161616";
export const MUTED = "#5f5648";
export const LINE = "#ece8e1";
/** Orange darkened enough to stay readable as link text on white. */
export const LINK = "#b8460b";
export const PAGE_BG = "#f5f3ef";
export const FONT = "Lato,'Helvetica Neue',Helvetica,Arial,sans-serif";
export const CAPS_FONT = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";

export const P_STYLE = `margin:0 0 16px;font-size:16px;line-height:1.65;color:${INK}`;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Shown under every text box whose content goes into an email. Kept here so client forms can import it. */
export const FORMAT_HINT = "Formatting: **bold**, *italic*, [link text](https://…), # heading, - list, > quote, --- line.";
