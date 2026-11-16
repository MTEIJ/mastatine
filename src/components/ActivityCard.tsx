import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "@/components/ui/icons";
import type { UpcomingActivityCard } from "@/lib/activities";
import { formatDayMonth, formatDayNumber, formatMonthShort, formatTime } from "@/lib/datetime";

interface ActivityCardProps {
  activity: UpcomingActivityCard;
  /** The viewer is subscribed: the card is marked "You're going". */
  going: boolean;
}

/** A compact activity: poster (or the date), name, when and where. Used by the homepage and the app's Today screen. */
export default function ActivityCard({ activity: a, going }: ActivityCardProps) {
  return (
    <Link href={`/mastapps/activities/${a.id}`} className={`hub-act${going ? " is-going" : ""}`}>
      {a.poster_url ? (
        <Image src={a.poster_url} alt="" width={128} height={160} sizes="64px" className="hub-act__thumb" />
      ) : (
        <time dateTime={a.starts_at.toISOString()} className="hub-act__thumb hub-act__date">
          <span>{formatDayNumber(a.starts_at)}</span>
          <span>{formatMonthShort(a.starts_at)}</span>
        </time>
      )}
      <span className="hub-act__body">
        <span className="hub-act__name">{a.name}</span>
        <span className="hub-act__when">{formatDayMonth(a.starts_at)} · {formatTime(a.starts_at)}</span>
        {a.location && <span className="hub-act__where">{a.location}</span>}
        {(going || a.members_only) && (
          <span className="hub-act__tags">
            {going && <span className="hub-tag hub-tag--going"><CheckIcon />You&rsquo;re going</span>}
            {a.members_only && <span className="hub-tag">Members only</span>}
          </span>
        )}
      </span>
    </Link>
  );
}
