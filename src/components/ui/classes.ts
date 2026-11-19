/**
 * The class names of the design-system controls (styled in src/app/controls.css). Components use them through
 * Button, Card, Badge and the field components; reach for these helpers only when the element is something else, such
 * as a Link styled as a button or a <section> that is a card. ESLint rejects the raw class names anywhere else.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

export interface ButtonStyle {
  /** primary: the one main action. secondary (default): tonal. ghost: text only. danger: destructive. */
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Joins class names, skipping empty ones. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function buttonClass({ variant = "secondary", size = "md" }: ButtonStyle = {}, className?: string): string {
  return cx("btn", `btn-${variant}`, size === "sm" && "btn-sm", className);
}

export function cardClass(className?: string): string {
  return cx("card", className);
}

export function badgeClass(className?: string): string {
  return cx("badge", className);
}

/** For <input>, <select> and <textarea>. */
export function inputClass(className?: string): string {
  return cx("input", className);
}

export function labelClass(className?: string): string {
  return cx("label", className);
}

/** Help text under a field. */
export function hintClass(className?: string): string {
  return cx("hint", className);
}
