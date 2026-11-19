import type { ComponentPropsWithRef } from "react";
import { hintClass, inputClass, labelClass } from "./classes";

export function Label({ className, ...props }: ComponentPropsWithRef<"label">) {
  return <label className={labelClass(className)} {...props} />;
}

/** Help text under a field. */
export function Hint({ className, ...props }: ComponentPropsWithRef<"p">) {
  return <p className={hintClass(className)} {...props} />;
}

export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return <input className={inputClass(className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentPropsWithRef<"textarea">) {
  return <textarea className={inputClass(className)} {...props} />;
}

export function Select({ className, ...props }: ComponentPropsWithRef<"select">) {
  return <select className={inputClass(className)} {...props} />;
}
