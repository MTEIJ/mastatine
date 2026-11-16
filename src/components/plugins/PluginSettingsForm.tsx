"use client";

import { useActionState, type ReactNode } from "react";
import { saveSettings, type SettingsState } from "@/app/(pages)/mastapps/activities/[id]/plugins/actions";

/** Wraps a plugin's own settings fields in a form with a save button and feedback. The fields come from the plugin, rendered on the server. */
export default function PluginSettingsForm({ instanceId, children }: { instanceId: string; children: ReactNode }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="instance" value={instanceId} />
      {children}
      {state.error && <p role="alert" className="text-sm font-bold text-danger">{state.error}</p>}
      {state.saved && !pending && <p role="status" className="text-sm font-bold text-success">Saved.</p>}
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
