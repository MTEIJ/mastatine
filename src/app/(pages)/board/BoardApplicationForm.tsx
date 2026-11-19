"use client";

import { useActionState, useEffect, useState } from "react";
import { BOARD, BOARD_CALL } from "@/content/site";
import { applyForBoard, type BoardApplicationState } from "./actions";

/** What the person sent earlier, so the form opens filled in. */
export interface SavedApplication {
  first_choice: string;
  second_choice: string | null;
  motivation: string;
  ambitions: string;
  study: string;
  hours_per_week: string;
  mast_photo: string;
  mast_location: string;
  superpower: string;
}

interface BoardApplicationFormProps {
  saved: SavedApplication | null;
}

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export default function BoardApplicationForm({ saved }: BoardApplicationFormProps) {
  const [state, action, pending] = useActionState<BoardApplicationState, FormData>(applyForBoard, {});
  const [preview, setPreview] = useState<string | null>(null);

  // Free the object URL of the previous preview.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const shownPhoto = preview ?? saved?.mast_photo ?? null;

  return (
    <form action={action} className="space-y-8">
      <fieldset>
        <legend className="text-lg font-bold">1. Which function do you want?</legend>
        <p className="hint">Pick your dream job. A second choice is optional but makes the puzzle easier.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="first_choice">First choice</label>
            <select id="first_choice" name="first_choice" className="input" required defaultValue={saved?.first_choice ?? ""}>
              <option value="" disabled>Choose a function</option>
              {BOARD.map((role) => <option key={role.key} value={role.key}>{role.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="second_choice">Second choice</label>
            <select id="second_choice" name="second_choice" className="input" defaultValue={saved?.second_choice ?? ""}>
              <option value="">No second choice</option>
              {BOARD.map((role) => <option key={role.key} value={role.key}>{role.title}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold">2. The serious part</legend>
        <div>
          <label className="label" htmlFor="motivation">Motivation</label>
          <textarea
            id="motivation"
            name="motivation"
            className="input min-h-40"
            required
            minLength={30}
            maxLength={4000}
            defaultValue={saved?.motivation}
            aria-describedby="motivation-hint"
          />
          <p id="motivation-hint" className="hint">Why do you want to be on the board, and what would you bring to Mastatine?</p>
        </div>
        <div>
          <label className="label" htmlFor="ambitions">Ambitions</label>
          <textarea
            id="ambitions"
            name="ambitions"
            className="input min-h-32"
            required
            minLength={20}
            maxLength={4000}
            defaultValue={saved?.ambitions}
            aria-describedby="ambitions-hint"
          />
          <p id="ambitions-hint" className="hint">What do you want to achieve in your board year of M.A. Mastatine? What are your ambitions?</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="study">Study and year <span className="font-normal text-muted">(optional)</span></label>
            <input id="study" name="study" className="input" maxLength={120} placeholder="e.g. European Studies, year 2" defaultValue={saved?.study} />
          </div>
          <div>
            <label className="label" htmlFor="hours_per_week">Time per week</label>
            <select id="hours_per_week" name="hours_per_week" className="input" required defaultValue={saved?.hours_per_week ?? ""}>
              <option value="" disabled>How much time do you have?</option>
              {BOARD_CALL.hoursPerWeek.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold">3. The actually important part</legend>
        <div>
          <label className="label" htmlFor="mast_photo">Your favourite mast</label>
          <input
            id="mast_photo"
            name="mast_photo"
            type="file"
            accept={IMAGE_TYPES}
            className="input"
            required={!saved}
            aria-describedby="mast-photo-hint"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          <p id="mast-photo-hint" className="hint">
            Non-negotiable. A photo you took yourself, without recognisable people. {saved && "Leave empty to keep your current mast."}
          </p>
          {shownPhoto && (
            // eslint-disable-next-line @next/next/no-img-element -- local preview (blob URL) or an /uploads image
            <img src={shownPhoto} alt="Your favourite mast" className="mt-3 max-h-64 rounded-xl border border-line object-contain" />
          )}
        </div>
        <div>
          <label className="label" htmlFor="mast_location">Where does this beauty stand? <span className="font-normal text-muted">(optional)</span></label>
          <input id="mast_location" name="mast_location" className="input" maxLength={120} placeholder="e.g. next to the A2, the one with the red light" defaultValue={saved?.mast_location} />
        </div>

        <div>
          <label className="label" htmlFor="superpower">Your board superpower <span className="font-normal text-muted">(optional)</span></label>
          <input id="superpower" name="superpower" className="input" maxLength={150} placeholder="e.g. I can find 4G in a basement" defaultValue={saved?.superpower} />
        </div>

        <label className="flex items-start gap-2 text-sm font-semibold">
          <input type="checkbox" name="promise" required defaultChecked={Boolean(saved)} className="mt-1" />
          <span>{BOARD_CALL.promise}</span>
        </label>
      </fieldset>

      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.sent && !pending && (
        <p role="status" className="rounded-xl bg-soft px-4 py-3 text-sm font-semibold">
          Received loud and clear. The admins have been notified. You can change your answers and send them again until the board is chosen.
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Transmitting…" : saved ? "Update my application" : "Send my application"}
      </button>
    </form>
  );
}
