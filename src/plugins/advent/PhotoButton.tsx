"use client";

import { useState, useTransition } from "react";
import Avatar from "./Avatar";
import { changeWalkerPhoto } from "./actions";
import type { Walker } from "./logic";

const MAX_BYTES = 10 * 1024 * 1024;

interface PhotoButtonProps {
  token: string;
  walker: Pick<Walker, "id" | "name" | "photo">;
  /** The personal key from the page address, only when it belongs to this walker. */
  playerKey: string | null;
}

/** The avatar in the list, for someone who may change it: tap it to pick a photo; the small cross removes it. */
export default function PhotoButton({ token, walker, playerKey }: PhotoButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send(op: "set" | "remove", file?: File) {
    if (file && file.size > MAX_BYTES) {
      setError("That photo is too big (max 10 MB).");
      return;
    }
    const form = new FormData();
    form.set("token", token);
    form.set("walker", walker.id);
    form.set("op", op);
    if (playerKey) form.set("key", playerKey);
    if (file) form.set("photo", file);
    setError(null);
    startTransition(async () => {
      try {
        const result = await changeWalkerPhoto(form);
        setError(result.error);
      } catch {
        setError("The photo could not be sent. Check your connection and try again.");
      }
    });
  }

  return (
    <span className={`ac-photo${pending ? " ac-photo--busy" : ""}`}>
      <label className="ac-photo-pick" title={walker.photo ? `Change ${walker.name}'s photo` : `Add a photo of ${walker.name}`}>
        <Avatar walker={walker} />
        <span className="ac-photo-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M9 4 7.2 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.2L15 4H9Zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" /></svg>
        </span>
        <input
          className="ac-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={pending}
          aria-label={walker.photo ? `Change ${walker.name}'s photo` : `Add a photo of ${walker.name}`}
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (file) send("set", file);
          }}
        />
      </label>
      {walker.photo && (
        <button type="button" className="ac-photo-remove" disabled={pending} onClick={() => send("remove")} aria-label={`Remove ${walker.name}'s photo`}>
          ×
        </button>
      )}
      {error && (
        <span className="ac-photo-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
