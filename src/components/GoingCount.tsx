import { formatParticipants, type ParticipantCount } from "@/lib/activities";

/** "2 / ∞ going": how many have signed up out of how many can (∞ when there is no limit). Turns red when the activity is full. */
export default function GoingCount({ activity, className = "" }: { activity: ParticipantCount; className?: string }) {
  const full = activity.subscription_limit !== null && activity.participants >= activity.subscription_limit;
  return (
    <span className={`inline-flex items-baseline gap-1 whitespace-nowrap text-sm ${className}`}>
      <strong className={`text-base font-black tabular-nums ${full ? "text-danger" : "text-ink"}`}>{formatParticipants(activity)}</strong>
      <span className="font-semibold text-muted">{full ? "going · full" : "going"}</span>
    </span>
  );
}
