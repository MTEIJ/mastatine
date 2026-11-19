import type { ReactNode } from "react";
import CopyField from "./CopyField";

interface LinkRowProps {
  label: string;
  value: string;
  /** One short line under the link. */
  hint?: string;
  /** Extra controls after the copy button, such as "New link". */
  children?: ReactNode;
}

/** A labelled address on one line: label on the left, the link with its copy button on the right. */
export default function LinkRow({ label, value, hint, children }: LinkRowProps) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:items-center sm:gap-3">
      <p className="text-sm font-bold">{label}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <CopyField value={value} label={label} />
        {children}
      </div>
      {hint && <p className="text-sm text-muted sm:col-start-2">{hint}</p>}
    </div>
  );
}
