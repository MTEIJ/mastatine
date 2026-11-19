import Link from "next/link";
import { getAllEvents } from "@/lib/calendar-events";
import { formatDateTime } from "@/lib/datetime";
import { requireAdmin } from "@/lib/session";
import { buttonClass } from "@/components/ui/classes";

const NOTICES: Record<string, { text: string; tone: "ok" | "bad" }> = {
  created: { text: "Agenda item added.", tone: "ok" },
  saved: { text: "Agenda item saved.", tone: "ok" },
  deleted: { text: "Agenda item deleted.", tone: "ok" },
  invalid: { text: "Not saved: check the title and that the end is after the start.", tone: "bad" },
};

export const instant = false;

export default async function AdminAgenda(props: { searchParams: Promise<{ notice?: string }> }) {
  // Layouts do not re-run on client navigation, so each admin page checks the role itself.
  await requireAdmin();
  const { notice } = await props.searchParams;
  const events = await getAllEvents();
  const message = notice ? NOTICES[notice] : undefined;

  return (
    <div className="space-y-4">
      {message && (
        <p role="status" className={`rounded-md px-4 py-3 text-sm ${message.tone === "ok" ? "bg-accent-soft text-accent-text" : "bg-danger/10 text-danger"}`}>
          {message.text}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold">Agenda items</h2>
          <p className="text-sm text-muted">Things for the calendar that are not activities. They show up in the subscribable calendar feed.</p>
        </div>
        <Link href="/admin/agenda/new" className={buttonClass({ variant: "primary", size: "sm" })}>New item</Link>
      </div>
      <div className="table-wrap">
        <table className="table table-stack">
          <thead><tr><th>Title</th><th>When</th><th>Feed</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td data-primary className="font-medium">{e.title}</td>
                <td data-label="When" className="whitespace-nowrap text-muted">{formatDateTime(e.starts_at)}</td>
                <td data-label="Feed" className="text-muted">{e.is_visible ? "Shown" : "Hidden"}</td>
                <td className="text-right"><Link href={`/admin/agenda/${e.id}`} className={buttonClass({ variant: "secondary", size: "sm" })}>Edit</Link></td>
              </tr>
            ))}
            {events.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted">No agenda items yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
