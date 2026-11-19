import { EDIT_MODES, EDIT_MODE_LABELS, numberField } from "../scoreboard/logic";
import AutoRefresh from "../scoreboard/AutoRefresh";
import AdventScreen from "./AdventScreen";
import { definePlugin } from "../types";
import AdventMap from "./AdventMap";
import AdventPage from "./AdventPage";
import { DEFAULT_CONFIG, MAX_DAYS, adventConfigSchema, currentDay, placeWalkers, progressDay, type AdventConfig } from "./logic";
import Manage from "./Manage";
import { todayInAmsterdam } from "./today";
import { addSubscriber, getWalkers, importSubscribers } from "./store";


/** Where the calendar stands today, and everyone placed on the map accordingly (see placeWalkers). */
async function load(instanceId: string, config: AdventConfig) {
  const todayIso = todayInAmsterdam();
  const progress = progressDay(config.startDate, todayIso, config.days);
  const walkers = placeWalkers(await getWalkers(instanceId), config, progress);
  return { walkers, progress, today: currentDay(config.startDate, todayIso, config.days) };
}

export default definePlugin({
  id: "advent-calendar",
  name: "Adtventcalendar",
  description: "A board-game map of all the days. Everyone walks along the path day by day (automatically, or stepped by hand), and someone who fails gets a grave on the day they failed. Has a public full-screen page and a screen view for a TV, without login.",
  configSchema: adventConfigSchema,
  defaultConfig: DEFAULT_CONFIG,
  configFromForm: (form) => {
    const startDate = form.get("startDate");
    return {
      title: form.get("title"),
      days: numberField(form.get("days")),
      startDate: typeof startDate === "string" && startDate !== "" ? startDate : null,
      editMode: form.get("editMode"),
      autoAddSubscribers: form.get("autoAddSubscribers") === "on",
      movement: form.get("movement"),
    };
  },

  ConfigFields: ({ config }) => (
    <div className="space-y-5">
      <label className="block">
        <span className="label">Title</span>
        <input className="input" name="title" defaultValue={config.title} maxLength={60} required />
      </label>

      <div className="flex flex-wrap gap-3">
        <label className="block">
          <span className="label">Number of days</span>
          <input className="input w-28" type="number" name="days" defaultValue={config.days} min={1} max={MAX_DAYS} step={1} required />
        </label>
        <label className="block">
          <span className="label">Date of day 1 (optional)</span>
          <input className="input" type="date" name="startDate" defaultValue={config.startDate ?? ""} />
        </label>
      </div>
      <p className="text-sm text-muted">With a date, today&apos;s tile is marked on the map. Automatic movement needs it.</p>

      <fieldset className="space-y-2">
        <legend className="label">Movement</legend>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="movement" value="auto" defaultChecked={config.movement === "auto"} className="mt-1" />
          <span><strong>Automatic.</strong> Everyone still in the game moves to the next day by themselves, following the date of day 1. You only record who failed, and on which day.</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="movement" value="manual" defaultChecked={config.movement === "manual"} className="mt-1" />
          <span><strong>By hand.</strong> Players are stepped forward and back one day at a time.</span>
        </label>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="label">Who may update players (mark as failed, or step them)?</legend>
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

  // Names are first names of people who signed up. The activity page only shows "Who is going" to signed-in visitors,
  // so the map follows the same rule there. (The public link is deliberately open to whoever has it.)
  ActivitySection: async ({ instance, config, viewer }) => {
    if (viewer.userId === null && !viewer.isManager) return null;
    const { walkers, progress, today } = await load(instance.id, config);
    return (
      <section className="card space-y-3 p-5 sm:p-6">
        <h2 className="text-xl font-extrabold">{config.title}</h2>
        <AdventMap
          token={instance.public_token}
          config={config}
          walkers={walkers}
          viewer={viewer}
          playerKey={null}
          interactive={viewer.isManager}
          today={today}
          progress={progress}
        />
      </section>
    );
  },

  PublicPage: async ({ instance, config, viewer, search, activityName }) => {
    const { walkers, progress, today } = await load(instance.id, config);
    // For a screen on the wall: read-only, unbranded, refreshes itself.
    if (search.view === "screen") {
      return (
        <>
          <AutoRefresh seconds={20} />
          <AdventScreen title={config.title} days={config.days} walkers={walkers} today={today} />
        </>
      );
    }
    return (
      <AdventPage title={config.title} activityName={activityName} walkers={walkers} days={config.days}>
        <AutoRefresh />
        <AdventMap
          token={instance.public_token}
          config={config}
          walkers={walkers}
          viewer={viewer}
          playerKey={search.p ?? null}
          interactive
          today={today}
          progress={progress}
        />
      </AdventPage>
    );
  },
});
