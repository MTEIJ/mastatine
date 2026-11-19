/** Small "On" / "Off" pill for an installed plugin. */
export default function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${enabled ? "bg-accent-soft text-accent-text" : "bg-soft text-muted"}`}>
      {enabled ? "On" : "Off"}
    </span>
  );
}
