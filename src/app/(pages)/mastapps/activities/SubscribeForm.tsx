"use client";

import { useActionState } from "react";
import { formatAdjustment, type SignupGroup } from "@/lib/signup-options";
import { subscribe, type SubscribeState } from "./actions";
import { Button } from "@/components/ui/Button";
import { cardClass, labelClass } from "@/components/ui/classes";

/** The join form: radio choices per group, and an inline message when subscribing fails. */
export default function SubscribeForm({ id, groups }: { id: string; groups: SignupGroup[] }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      {groups.map((group) => (
        <fieldset key={group.id} className={cardClass("space-y-1 p-3")}>
          <legend className={labelClass("px-1")}>{group.label}{group.required ? "" : " (optional)"}</legend>
          {!group.required && (
            <label className="choice-row"><input type="radio" name={`opt_${group.id}`} value="" defaultChecked /> None</label>
          )}
          {group.choices.map((choice) => (
            <label key={choice.id} className="choice-row">
              <input type="radio" name={`opt_${group.id}`} value={choice.id} required={group.required} />
              <span>{choice.label}</span>
              {choice.price_cents !== 0 && <span className="ml-auto text-sm text-muted">{formatAdjustment(choice.price_cents)}</span>}
            </label>
          ))}
        </fieldset>
      ))}
      {state.error && <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</p>}
      <Button variant="primary" className="w-full py-3 text-base" type="submit" disabled={pending}>{pending ? "Joining…" : "Join this activity"}</Button>
    </form>
  );
}
