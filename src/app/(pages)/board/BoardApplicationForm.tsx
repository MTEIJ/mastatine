"use client";

import { useActionState, useEffect, useState } from "react";
import { BOARD, BOARD_CALL } from "@/content/site";
import { applyForBoard, type BoardApplicationState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Hint, Input, Label, Select, Textarea } from "@/components/ui/Field";

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
        <Hint>Pick your dream job. A second choice is optional but makes the puzzle easier.</Hint>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="first_choice">First choice</Label>
            <Select id="first_choice" name="first_choice" required defaultValue={saved?.first_choice ?? ""}>
              <option value="" disabled>Choose a function</option>
              {BOARD.map((role) => <option key={role.key} value={role.key}>{role.title}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="second_choice">Second choice</Label>
            <Select id="second_choice" name="second_choice" defaultValue={saved?.second_choice ?? ""}>
              <option value="">No second choice</option>
              {BOARD.map((role) => <option key={role.key} value={role.key}>{role.title}</option>)}
            </Select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold">2. The serious part</legend>
        <div>
          <Label htmlFor="motivation">Motivation</Label>
          <Textarea
            id="motivation"
            name="motivation"
            className="min-h-40"
            required
            minLength={30}
            maxLength={4000}
            defaultValue={saved?.motivation}
            aria-describedby="motivation-hint"
          />
          <Hint id="motivation-hint">Why do you want to be on the board, and what would you bring to Mastatine?</Hint>
        </div>
        <div>
          <Label htmlFor="ambitions">Ambitions</Label>
          <Textarea
            id="ambitions"
            name="ambitions"
            className="min-h-32"
            required
            minLength={20}
            maxLength={4000}
            defaultValue={saved?.ambitions}
            aria-describedby="ambitions-hint"
          />
          <Hint id="ambitions-hint">What do you want to achieve in your board year of M.A. Mastatine? What are your ambitions?</Hint>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="study">Study and year <span className="font-normal text-muted">(optional)</span></Label>
            <Input id="study" name="study" maxLength={120} placeholder="e.g. European Studies, year 2" defaultValue={saved?.study} />
          </div>
          <div>
            <Label htmlFor="hours_per_week">Time per week</Label>
            <Select id="hours_per_week" name="hours_per_week" required defaultValue={saved?.hours_per_week ?? ""}>
              <option value="" disabled>How much time do you have?</option>
              {BOARD_CALL.hoursPerWeek.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </Select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold">3. The actually important part</legend>
        <div>
          <Label htmlFor="mast_photo">Your favourite mast</Label>
          <Input
            id="mast_photo"
            name="mast_photo"
            type="file"
            accept={IMAGE_TYPES}
            required={!saved}
            aria-describedby="mast-photo-hint"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          <Hint id="mast-photo-hint">
            Non-negotiable. A photo you took yourself, without recognisable people. {saved && "Leave empty to keep your current mast."}
          </Hint>
          {shownPhoto && (
            // eslint-disable-next-line @next/next/no-img-element -- local preview (blob URL) or an /uploads image
            <img src={shownPhoto} alt="Your favourite mast" className="mt-3 max-h-64 rounded-md border border-line object-contain" />
          )}
        </div>
        <div>
          <Label htmlFor="mast_location">Where does this beauty stand? <span className="font-normal text-muted">(optional)</span></Label>
          <Input id="mast_location" name="mast_location" maxLength={120} placeholder="e.g. next to the A2, the one with the red light" defaultValue={saved?.mast_location} />
        </div>

        <div>
          <Label htmlFor="superpower">Your board superpower <span className="font-normal text-muted">(optional)</span></Label>
          <Input id="superpower" name="superpower" maxLength={150} placeholder="e.g. I can find 4G in a basement" defaultValue={saved?.superpower} />
        </div>

        <label className="flex items-start gap-2 text-sm font-semibold">
          <input type="checkbox" name="promise" required defaultChecked={Boolean(saved)} className="mt-1" />
          <span>{BOARD_CALL.promise}</span>
        </label>
      </fieldset>

      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.sent && !pending && (
        <p role="status" className="rounded-md bg-soft px-4 py-3 text-sm font-semibold">
          Received loud and clear. The admins have been notified. You can change your answers and send them again until the board is chosen.
        </p>
      )}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Transmitting…" : saved ? "Update my application" : "Send my application"}
      </Button>
    </form>
  );
}
