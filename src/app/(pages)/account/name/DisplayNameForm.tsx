"use client";

import { useActionState } from "react";
import { saveDisplayName, type DisplayNameState } from "../actions";
import { NAME_MAX } from "@/lib/profile";
import { Button } from "@/components/ui/Button";
import { Hint, Input, Label } from "@/components/ui/Field";

interface DisplayNameFormProps {
  initialName: string;
  next: string;
}

export default function DisplayNameForm({ initialName, next }: DisplayNameFormProps) {
  const [state, action, pending] = useActionState<DisplayNameState, FormData>(saveDisplayName, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div>
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          name="name"
          defaultValue={initialName}
          maxLength={NAME_MAX}
          autoComplete="name"
          autoCapitalize="words"
          required
          aria-describedby="display-name-hint"
        />
        <Hint id="display-name-hint">Your first name or a nickname is fine. Your email address is never shown to other people.</Hint>
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="primary" className="w-full py-3" disabled={pending}>{pending ? "Saving…" : "Continue"}</Button>
    </form>
  );
}
