import { siteUrl } from "@/lib/env";
import { CORAL, INK, LINE, LINK, MUTED, P_STYLE, CAPS_FONT, emailButton, escapeHtml } from "@/lib/email-style";
import { buttonTone } from "@/lib/markdown-button";

/**
 * A small, safe subset of Markdown for emails: # headings, **bold**, *italic*, [links](url), [buttons](url "button")
 * (see markdown-button.ts), "- " and "1. " lists,
 * "> " quotes and "---" rules. Everything is escaped first and only our own inline-styled tags come out, so nothing the
 * author types can inject HTML. Single line breaks are kept; bare web addresses become links.
 */

const SAFE_URL = /^(https?:\/\/|mailto:)/i;
// A link may carry a title ("button", "button orange", ...); the text is already escaped, so its quotes are &quot;.
const INLINE = /\[([^\]\n]+)\]\((\S+?)(?:\s+&quot;([^\n]*?)&quot;)?\)|\*\*(.+?)\*\*|(?<![*\w])\*(?![\s*])(.+?)(?<![\s*])\*(?![*\w])|(?<![\w])_(?![\s_])(.+?)(?<![\s_])_(?!\w)|https?:\/\/[^\s<]+/g;

function link(href: string, label: string): string {
  return `<a href="${href}" style="color:${LINK};font-weight:bold">${label}</a>`;
}

/** Turns an escaped href into an absolute, allowed one, or null when the scheme is not allowed. */
function allowedHref(escaped: string): string | null {
  if (/^\/(?![/\\])/.test(escaped)) return `${siteUrl()}${escaped}`;
  return SAFE_URL.test(escaped) ? escaped : null;
}

function inline(escaped: string): string {
  return escaped.replace(INLINE, (match, text, href, title, bold, italicStar, italicUnderscore) => {
    if (text !== undefined) {
      const target = allowedHref(href);
      if (!target) return match;
      const tone = buttonTone(title?.replace(/&quot;/g, '"'));
      return tone ? emailButton(target, inline(text), tone) : link(target, inline(text));
    }
    if (bold !== undefined) return `<strong>${inline(bold)}</strong>`;
    const italic = italicStar ?? italicUnderscore;
    if (italic !== undefined) return `<em>${inline(italic)}</em>`;
    const trailing = match.match(/[.,;:!?)]+$/)?.[0] ?? "";
    const clean = match.slice(0, match.length - trailing.length);
    return `${link(clean, clean)}${trailing}`;
  });
}

const HEADING_STYLES = [
  `margin:24px 0 10px;font-size:21px;line-height:1.3;color:${INK}`,
  `margin:22px 0 8px;font-size:18px;line-height:1.3;color:${INK}`,
  `margin:20px 0 6px;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;font-family:${CAPS_FONT};color:${MUTED}`,
];
const LIST_STYLE = `margin:0 0 16px;padding-left:22px;font-size:16px;line-height:1.65;color:${INK}`;
const QUOTE_STYLE = `margin:0 0 16px;padding:2px 0 2px 16px;border-left:4px solid ${CORAL};font-size:16px;line-height:1.65;color:${MUTED}`;

const HEADING = /^(#{1,3})\s+(.+)$/;
const BULLET = /^\s*[-*•]\s+(.+)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.+)$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const QUOTE = /^>\s?(.*)$/;

function block(lines: string[]): string {
  const first = lines[0];
  const heading = lines.length === 1 ? first.match(HEADING) : null;
  if (heading) return `<h2 style="${HEADING_STYLES[heading[1].length - 1]}">${inline(escapeHtml(heading[2]))}</h2>`;
  if (lines.length === 1 && RULE.test(first)) return `<hr style="border:0;border-top:1px solid ${LINE};margin:24px 0">`;
  if (lines.every((l) => QUOTE.test(l))) {
    return `<blockquote style="${QUOTE_STYLE}">${lines.map((l) => inline(escapeHtml(l.replace(QUOTE, "$1")))).join("<br>")}</blockquote>`;
  }
  for (const [pattern, tag] of [[BULLET, "ul"], [NUMBERED, "ol"]] as const) {
    if (lines.every((l) => pattern.test(l))) {
      const items = lines.map((l) => `<li style="margin:0 0 4px">${inline(escapeHtml(l.replace(pattern, "$1")))}</li>`).join("");
      return `<${tag} style="${LIST_STYLE}">${items}</${tag}>`;
    }
  }
  return `<p style="${P_STYLE}">${lines.map((l) => inline(escapeHtml(l))).join("<br>")}</p>`;
}

/** Splits into blocks at blank lines; a list or heading typed straight after a paragraph line becomes its own block. */
export function textToHtml(text: string): string {
  const blocks: string[][] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").trim().split(/\n{2,}/)) {
    let current: string[] = [];
    const flush = () => {
      if (current.length) blocks.push(current);
      current = [];
    };
    for (const line of paragraph.split("\n")) {
      const kind = (l: string) => (HEADING.test(l) ? "h" : RULE.test(l) ? "r" : BULLET.test(l) ? "u" : NUMBERED.test(l) ? "o" : QUOTE.test(l) ? "q" : "p");
      if (current.length && (kind(line) !== kind(current[0]) || kind(line) === "h" || kind(line) === "r")) flush();
      current.push(line);
    }
    flush();
  }
  return blocks.map(block).join("");
}

/** The same text without the markup, for the plain-text part of the email and for push notifications. */
export function markdownToPlainText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\[([^\]\n]+)\]\((\S+?)(?:\s+"[^"\n]*")?\)/g, "$1 ($2)")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<![*\w])\*(?![\s*])(.+?)(?<![\s*])\*(?![*\w])/g, "$1")
    .replace(/(?<!\w)_(?![\s_])(.+?)(?<![\s_])_(?!\w)/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .trim();
}
