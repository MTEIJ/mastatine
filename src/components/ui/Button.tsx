import type { ComponentPropsWithRef } from "react";
import { buttonClass, type ButtonStyle } from "./classes";

export type ButtonProps = ComponentPropsWithRef<"button"> & ButtonStyle;

/**
 * The site's button. `type` keeps the browser default (submit inside a form), so pass type="button" for anything that
 * is not a submit. For a link that looks like a button, use buttonClass() on the Link.
 */
export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={buttonClass({ variant, size }, className)} {...props} />;
}
