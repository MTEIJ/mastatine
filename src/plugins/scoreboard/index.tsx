import { definePlugin } from "../types";
import AutoRefresh from "./AutoRefresh";
import {
  DEFAULT_CONFIG,
  EDIT_MODES,
  EDIT_MODE_LABELS,
  SCORE_LIMIT,
  THEMES,
  THEME_LABELS,
  numberField,
  scoreboardConfigSchema,
} from "./logic";
import Manage from "./Manage";
import ScoreboardPage from "./ScoreboardPage";
import ScoreboardView from "./ScoreboardView";
import { addSubscriber, getPlayers, importSubscribers } from "./store";
import { Input } from "@/components/ui/Field";
import { cardClass, labelClass } from "@/components/ui/classes";

export default definePlugin({
  id: "scoreboard",
  name: "Scoreboard",
  description: "Keep score per person, like last year's advent calendar sheet. Choose a theme, a start score and a minimum and maximum. Has a public page without login, and can be set so everyone only changes their own row.",
  configSchema: scoreboardConfigSchema,
  defaultConfig: DEFAULT_CONFIG,
  configFromForm: (form) => ({
    title: form.get("title"),
    editMode: form.get("editMode"),
    autoAddSubscribers: form.get("autoAddSubscribers") === "on",
    theme: form.get("theme"),
    startScore: numberField(form.get("startScore")),
    minScore: numberField(form.get("minScore")),
    // Blank means no maximum.
    maxScore: numberField(form.get("maxScore")) ?? null,
  }),

  ConfigFields: ({ config }) => (
    <div className="space-y-5">
      <label className="block">
        <span className={labelClass()}>Title</span>
        <Input name="title" defaultValue={config.title} maxLength={60} required />
      </label>

      <fieldset className="space-y-2">
        <legend className={labelClass()}>Theme</legend>
        {THEMES.map((theme) => (
          <label key={theme} className="flex items-start gap-2 text-sm">
            <input type="radio" name="theme" value={theme} defaultChecked={config.theme === theme} className="mt-1" />
            <span><strong>{THEME_LABELS[theme].label}.</strong> {THEME_LABELS[theme].help}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={labelClass()}>Scores</legend>
        <div className="flex flex-wrap gap-3">
          <label className="block">
            <span className={labelClass()}>Start</span>
            <Input className="w-28" type="number" name="startScore" defaultValue={config.startScore} min={-SCORE_LIMIT} max={SCORE_LIMIT} step={1} required />
          </label>
          <label className="block">
            <span className={labelClass()}>Minimum</span>
            <Input className="w-28" type="number" name="minScore" defaultValue={config.minScore} min={-SCORE_LIMIT} max={SCORE_LIMIT} step={1} required />
          </label>
          <label className="block">
            <span className={labelClass()}>Maximum</span>
            <Input className="w-28" type="number" name="maxScore" defaultValue={config.maxScore ?? ""} min={-SCORE_LIMIT} max={SCORE_LIMIT} step={1} placeholder="none" />
          </label>
        </div>
        <p className="text-sm text-muted">
          Everyone starts on the start score. A score never goes below the minimum or above the maximum. Leave the maximum empty for no limit;
          with a maximum, the bars show progress towards it. The start score must lie between the two.
        </p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={labelClass()}>Who may change scores?</legend>
        {EDIT_MODES.map((mode) => (
          <label key={mode} className="flex items-start gap-2 text-sm">
            <input type="radio" name="editMode" value={mode} defaultChecked={config.editMode === mode} className="mt-1" />
            <span><strong>{EDIT_MODE_LABELS[mode].label}.</strong> {EDIT_MODE_LABELS[mode].help}</span>
          </label>
        ))}
      </fieldset>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="autoAddSubscribers" defaultChecked={config.autoAddSubscribers} className="mt-1" />
        <span><strong>Add everyone who subscribes.</strong> People who subscribe now and later are added by first name. Someone you remove stays off, unless they subscribe again.</span>
      </label>
    </div>
  ),

  Manage,

  onEvent: async ({ instance, config, event, userId }) => {
    if (config.autoAddSubscribers && event === "subscribed" && userId) await addSubscriber(instance.id, userId);
  },

  // Switching the option on picks up the people who subscribed before.
  onSaved: async ({ instance, config, previous }) => {
    if (config.autoAddSubscribers && !previous.autoAddSubscribers) await importSubscribers(instance.id, instance.activity_id, "subscription");
  },

  // Player names are first names of people who signed up. The activity page only shows "Who is going" to signed-in
  // visitors, so the board follows the same rule there. (The public link is deliberately open to whoever has it.)
  ActivitySection: async ({ instance, config, viewer }) =>
    viewer.userId === null && !viewer.isManager ? null : (
      <section className={cardClass("space-y-3 p-5 sm:p-6")}>
        <h2 className="text-xl font-extrabold">{config.title}</h2>
        <ScoreboardView
          token={instance.public_token}
          config={config}
          players={await getPlayers(instance.id, config.startScore)}
          viewer={viewer}
          playerKey={null}
          interactive={viewer.isManager}
        />
      </section>
    ),

  PublicPage: async ({ instance, config, viewer, search, activityName }) => {
    const players = await getPlayers(instance.id, config.startScore);
    return (
      <ScoreboardPage
        title={config.title}
        activityName={activityName}
        config={config}
        playerCount={players.length}
        totalScore={players.reduce((sum, p) => sum + p.marks, 0)}
      >
        <AutoRefresh />
        <ScoreboardView token={instance.public_token} config={config} players={players} viewer={viewer} playerKey={search.p ?? null} interactive />
      </ScoreboardPage>
    );
  },
});
