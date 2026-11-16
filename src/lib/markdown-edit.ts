export type Edit = { text: string; start: number; end: number };

/** Wraps the selection (or a placeholder) in a marker pair, or removes the markers when it is already wrapped. */
export function wrap(text: string, start: number, end: number, marker: string, placeholder: string): Edit {
  const selected = text.slice(start, end);
  if (selected.length >= marker.length * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(marker.length, selected.length - marker.length);
    return { text: text.slice(0, start) + inner + text.slice(end), start, end: start + inner.length };
  }
  const body = selected || placeholder;
  const next = text.slice(0, start) + marker + body + marker + text.slice(end);
  return { text: next, start: start + marker.length, end: start + marker.length + body.length };
}

/** Puts a prefix on every selected line, or takes it off when all of them already have it. */
export function prefixLines(text: string, start: number, end: number, prefix: (index: number) => string, pattern: RegExp): Edit {
  const from = start === 0 ? 0 : text.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = text.indexOf("\n", end);
  const to = lineEnd === -1 ? text.length : lineEnd;
  const lines = text.slice(from, to).split("\n");
  const allPrefixed = lines.every((line) => pattern.test(line));
  const next = lines.map((line, i) => (allPrefixed ? line.replace(pattern, "") : prefix(i) + line.replace(/^(#{1,6} |[-*] |\d+\. )/, ""))).join("\n");
  return { text: text.slice(0, from) + next + text.slice(to), start: from, end: from + next.length };
}

/** Inserts a Markdown link around the selection and selects the placeholder address. */
export function link(text: string, start: number, end: number): Edit {
  const label = text.slice(start, end) || "link text";
  const next = `${text.slice(0, start)}[${label}](https://)${text.slice(end)}`;
  const urlStart = start + label.length + 3;
  return { text: next, start: urlStart, end: urlStart + 8 };
}

/** Plain text for places that cannot show formatting (calendar files): drops the Markdown markers. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]*)\)/g, "$1 ($2)")
    .replace(/^#{1,6} /gm, "")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2");
}
