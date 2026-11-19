"use client";

import { useActionState } from "react";
import { addQuote, type QuoteFormState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { cardClass } from "@/components/ui/classes";

export default function QuoteForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<QuoteFormState, FormData>(addQuote, {});

  return (
    <form action={action} className={cardClass("space-y-5 p-6 sm:p-8")}>
      <div>
        <Label htmlFor="body">Quote</Label>
        <Textarea id="body" name="body" className="min-h-32" required minLength={3} maxLength={1000} placeholder="Reality is a burden" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="author">Said by</Label>
          <Input id="author" name="author" required maxLength={80} />
        </div>
        <div>
          <Label htmlFor="said_on">Date</Label>
          <Input id="said_on" name="said_on" type="date" required defaultValue={today} max={today} />
        </div>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state.error && <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</p>}
      <p className="text-sm text-muted">
        The quote and the name of the person who said it are shown publicly. Keep it friendly, and remove it if they ask. See the{" "}
        <a href="/privacy" className="underline">privacy page</a> and <a href="/terms" className="underline">site rules</a>.
      </p>
      <Button type="submit" variant="primary" disabled={pending}>{pending ? "Adding…" : "Add quote"}</Button>
    </form>
  );
}
