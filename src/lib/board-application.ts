import { z } from "zod";
import { BOARD, BOARD_CALL } from "@/content/site";

const keysOf = (items: readonly { value: string }[]) => items.map((item) => item.value) as [string, ...string[]];

const roleKey = z.enum(BOARD.map((role) => role.key) as [string, ...string[]], { error: "Pick a function from the list." });

const schema = z
  .object({
    first_choice: roleKey,
    second_choice: z.preprocess((v) => (v === "" || v == null ? null : v), roleKey.nullable()),
    motivation: z.string().trim().min(30, "Tell us a bit more about why you want this (at least 30 characters).").max(4000),
    ambitions: z.string().trim().min(20, "Dream a little bigger: tell us what you want to achieve (at least 20 characters).").max(4000),
    study: z.string().trim().max(120),
    hours_per_week: z.enum(keysOf(BOARD_CALL.hoursPerWeek), { error: "Pick how much time you have." }),
    mast_location: z.string().trim().max(120),
    superpower: z.string().trim().max(150),
    promise: z.literal("on", { error: "You have to swear the oath. Tick the box." }),
  })
  .refine((d) => d.second_choice !== d.first_choice, { message: "Your second choice has to differ from your first.", path: ["second_choice"] });

export type BoardApplicationInput = Omit<z.infer<typeof schema>, "promise">;

export type ParseResult = { ok: true; data: BoardApplicationInput } | { ok: false; error: string };

/** Validates the text fields of the form. The mast photo is checked separately, because it is a file. */
export function parseBoardApplication(formData: FormData): ParseResult {
  const fields = Object.fromEntries([...formData.entries()].filter(([, value]) => typeof value === "string"));
  const result = schema.safeParse(fields);
  if (!result.success) return { ok: false, error: result.error.issues[0]?.message ?? "Something in the form is not right." };
  const { first_choice, second_choice, motivation, ambitions, study, hours_per_week, mast_location, superpower } = result.data;
  return { ok: true, data: { first_choice, second_choice, motivation, ambitions, study, hours_per_week, mast_location, superpower } };
}

/** The current title of a role key; old keys that no longer exist are shown as they are. */
export function roleTitle(key: string): string {
  return BOARD.find((role) => role.key === key)?.title ?? key;
}

/** The label of a stored answer from one of the BOARD_CALL option lists. */
export function choiceLabel(items: readonly { value: string; label: string }[], value: string): string {
  return items.find((item) => item.value === value)?.label ?? value;
}
