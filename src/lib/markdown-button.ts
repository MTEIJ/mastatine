/**
 * Buttons in Markdown. A button is an ordinary link whose title says "button", optionally with a colour:
 *
 *   [Sign up](https://example.com "button")          black
 *   [Sign up](https://example.com "button orange")   brand orange
 *   [Join](https://chat.whatsapp.com/… "button green") WhatsApp green
 *
 * Because it is plain Markdown, anything that does not know about buttons still shows a working link. Pure and free of
 * Node imports: the editor, the site renderer and the email renderer all use it.
 */

export const BUTTON_TONES = ["dark", "orange", "green"] as const;
export type ButtonTone = (typeof BUTTON_TONES)[number];

export const BUTTON_TONE_LABELS: Record<ButtonTone, string> = { dark: "Black", orange: "Orange", green: "WhatsApp green" };

/** The colour of a button for a link title, or null when the link is not a button. */
export function buttonTone(title: string | null | undefined): ButtonTone | null {
  const match = title?.trim().toLowerCase().match(/^button(?:\s+(orange|green))?$/);
  if (!match) return null;
  return (match[1] as ButtonTone | undefined) ?? "dark";
}

/** The link title that makes a button of this colour. */
export function buttonTitle(tone: ButtonTone): string {
  return tone === "dark" ? "button" : `button ${tone}`;
}

/** Colours shared by the site and the emails. Dark text on the bright ones: white on them is hard to read. */
export const BUTTON_COLOURS: Record<ButtonTone, { bg: string; fg: string }> = {
  dark: { bg: "#161616", fg: "#ffffff" },
  orange: { bg: "#f57f20", fg: "#161616" },
  green: { bg: "#25d366", fg: "#161616" },
};
