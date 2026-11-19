import Link from "next/link";
import { formatDateTime } from "@/lib/datetime";
import { STATUS_LABEL } from "@/lib/minutes-format";
import type { Meeting } from "@/lib/meetings";
import { Badge } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/classes";

/** One meeting in a list: title, time and place, minutes status and the three ways into it. */
export default function MeetingRow({ meeting }: { meeting: Meeting }) {
  const base = `/mastapps/minutes/meetings/${meeting.id}`;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="font-bold">{meeting.title} <Badge className="ml-1">{meeting.committee_name}</Badge></p>
        <p className="text-sm text-muted">
          {formatDateTime(meeting.starts_at)}{meeting.location && ` @${meeting.location}`} · {STATUS_LABEL[meeting.minutes_status]}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href={base} className={buttonClass({ variant: "secondary", size: "sm" })}>View</Link>
        {meeting.minutes_status !== "locked" && (
          <details className="row-menu">
            <summary className={buttonClass({ variant: "secondary", size: "sm" })} aria-label={`Edit ${meeting.title}`}>Edit ▾</summary>
            <div className="row-menu__list">
              <Link href={`${base}/agenda`}>Agenda</Link>
              <Link href={`${base}/minutes`}>Minutes</Link>
              <Link href={`${base}/edit`}>Details</Link>
            </div>
          </details>
        )}
      </div>
    </li>
  );
}
