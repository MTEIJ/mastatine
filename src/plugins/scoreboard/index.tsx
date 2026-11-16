import { definePlugin } from "../types";
import AutoRefresh from "./AutoRefresh";
import { DEFAULT_CONFIG, EDIT_MODES, EDIT_MODE_LABELS, scoreboardConfigSchema } from "./logic";
import Manage from "./Manage";
import ScoreboardView from "./ScoreboardView";
import { getPlayers } from "./store";


export default definePlugin({
  id: "scoreboard",
  name: "Scoreboard",
  description: "Keep score per person, like last year's advent calendar sheet. Has a public page without login, and can be set so everyone ticks their own row.",
  configSchema: scoreboardConfigSchema,
  defaultConfig: DEFAULT_CONFIG,
  configFromForm: (form) => ({ title: form.get("title"), editMode: form.get("editMode") }),

  ConfigFields: ({ config }) => (
    <div className="space-y-4">
      <label className="block">
        <span className="label">Title</span>
        <input className="input" name="title" defaultValue={config.title} maxLength={60} required />
      </label>
      <fieldset className="space-y-2">
        <legend className="label">Who may add marks?</legend>
        {EDIT_MODES.map((mode) => (
          <label key={mode} className="flex items-start gap-2 text-sm">
            <input type="radio" name="editMode" value={mode} defaultChecked={config.editMode === mode} className="mt-1" />
            <span><strong>{EDIT_MODE_LABELS[mode].label}.</strong> {EDIT_MODE_LABELS[mode].help}</span>
          </label>
        ))}
      </fieldset>
    </div>
  ),

  Manage,

  // Player names are first names of people who signed up. The activity page only shows "Who is going" to signed-in
  // visitors, so the board follows the same rule there. (The public link is deliberately open to whoever has it.)
  ActivitySection: async ({ instance, config, viewer }) =>
    viewer.userId === null && !viewer.isManager ? null : (
    <section className="card space-y-3 p-5 sm:p-6">
      <h2 className="text-xl font-extrabold">{config.title}</h2>
      <ScoreboardView token={instance.public_token} config={config} players={await getPlayers(instance.id)} viewer={viewer} playerKey={null} interactive={viewer.isManager} />
    </section>
    ),

  PublicPage: async ({ instance, config, viewer, search }) => (
    <>
      <AutoRefresh />
      <ScoreboardView token={instance.public_token} config={config} players={await getPlayers(instance.id)} viewer={viewer} playerKey={search.p ?? null} interactive />
    </>
  ),
});
