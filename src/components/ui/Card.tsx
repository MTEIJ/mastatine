import type { ComponentPropsWithRef } from "react";
import { badgeClass, cardClass } from "./classes";

/** A bordered surface for one piece of content. For a card that is a link or a <section>, use cardClass(). */
export function Card({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div className={cardClass(className)} {...props} />;
}

/** A small status chip ("Member", "Draft", "3 going"). */
export function Badge({ className, ...props }: ComponentPropsWithRef<"span">) {
  return <span className={badgeClass(className)} {...props} />;
}
