import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AppFrame from "@/components/ui/AppFrame";
import CalendarSubscribe from "@/components/CalendarSubscribe";
import GoingCount from "@/components/GoingCount";
import {
  formatParticipants, getActivities, getCommitteeOptions, getPastActivities, hasActivityFilters, parseActivityFilters, subscribeState, type Activity,
} from "@/lib/activities";
import { formatDays, formatDayMonth, formatDayNumber, formatMonthShort, formatWhen } from "@/lib/datetime";
import { getMembership } from "@/lib/membership";
import { getSession } from "@/lib/session";
import { parseSignupGroups, priceLabel } from "@/lib/signup-options";
import { CheckIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Activities", description: "Everything the committees organise." };

/** Show "n left" once the activity is nearly full. */
const FEW_SPOTS = 5;

interface JoinCue {
  text: string;
  /** go: an invitation to join. going: already subscribed. quiet: nothing to do right now. */
  tone: "go" | "going" | "quiet";
}

/** The one-line call to action on a card: invites people to join when they still can. */
function joinCue(a: Activity): JoinCue {
  if (a.subscribed) return { text: "You're going", tone: "going" };
  const state = subscribeState(a);
  if (state === "full") return { text: "Full", tone: "quiet" };
  if (state === "closed") return { text: "Closed", tone: "quiet" };
  if (state === "not-yet" && a.subscription_opens_at) return { text: `Opens ${formatDayMonth(a.subscription_opens_at)}`, tone: "quiet" };
  const left = a.subscription_limit === null ? null : a.subscription_limit - a.participants;
  return { text: left !== null && left <= FEW_SPOTS ? `Join · ${left} left` : "Join", tone: "go" };
}

const CUE_CLASS: Record<JoinCue["tone"], string> = {
  go: "bg-accent text-accent-fg",
  going: "bg-success/10 text-success",
  quiet: "bg-soft text-muted",
};

function MembersBadge() {
  return <span className="badge ml-2 align-middle">Members only</span>;
}

function CueBadge({ cue }: { cue: JoinCue }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-extrabold ${CUE_CLASS[cue.tone]}`}>
      {cue.tone === "going" && <CheckIcon />}
      {cue.text}
    </span>
  );
}

const icon = { viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const SearchIcon = () => (
  <svg {...icon}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
const ClearIcon = () => (
  <svg {...icon}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const PAGE = "/mastapps/activities";
/** A search shows more history than the default list, which only teases the latest. */
const SEARCH_PAST_LIMIT = 200;

export const instant = false;

export default async function ActivitiesPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = parseActivityFilters(await props.searchParams);
  const filtered = hasActivityFilters(filters);
  const session = await getSession();
  const { isMember } = await getMembership();
  const userId = session?.user.id ?? null;
  const [activities, past, committees] = await Promise.all([
    filters.when === "past" ? Promise.resolve([]) : getActivities(userId, isMember, filters),
    filters.when === "upcoming" ? Promise.resolve([]) : getPastActivities(userId, isMember, filters, filtered ? SEARCH_PAST_LIMIT : undefined),
    getCommitteeOptions(),
  ]);

  return (
    <AppFrame
      title="Activities"
      hideTitle
    >
      {/* A full-width M3 search bar (Enter or the magnifier searches); the filters unfold below while it is in use, or whenever a filter is active. */}
      <form action={PAGE} role="search" className="group mb-3">
        <div className="search-bar">
          <button type="submit" className="search-bar__icon" aria-label="Search">
            <SearchIcon />
          </button>
          <label className="sr-only" htmlFor="activity-q">Search activities</label>
          <input id="activity-q" name="q" type="search" enterKeyHint="search" defaultValue={filters.q} placeholder="Search activities" className="search-bar__input" />
          {filtered && (
            <Link href={PAGE} className="search-bar__icon" aria-label="Clear the search and filters">
              <ClearIcon />
            </Link>
          )}
        </div>
        <div className={`mt-2 flex-wrap items-center gap-2 ${filtered ? "flex" : "hidden group-focus-within:flex"}`}>
          <label className="sr-only" htmlFor="activity-committee">Committee</label>
          <select id="activity-committee" name="committee" defaultValue={filters.committeeId} className="input filter-select">
            <option value="">All committees</option>
            {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="sr-only" htmlFor="activity-when">When</label>
          <select id="activity-when" name="when" defaultValue={filters.when} className="input filter-select">
            <option value="">Upcoming and past</option>
            <option value="upcoming">Upcoming only</option>
            <option value="past">Past only</option>
          </select>
          {session && (
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="mine" value="1" defaultChecked={filters.mine} />
              Only mine
            </label>
          )}
        </div>
      </form>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {!session && (
          <p className="text-sm text-muted">
            <Link href="/login?next=%2Fmastapps%2Factivities" className="font-bold text-accent-text underline underline-offset-2">Sign in</Link> to join activities.
          </p>
        )}
        <span className="ml-auto"><CalendarSubscribe className="cal-btn--inline" /></span>
      </div>

      {filtered && activities.length + past.length === 0 && (
        <p className="card p-8 text-center text-muted" role="status">
          No activities found. <Link href={PAGE} className="font-bold text-accent-text underline">Clear the filters</Link>
        </p>
      )}

      {filters.when === "past" ? null : activities.length === 0 ? (
        filtered ? null : <p className="py-2 text-muted">No upcoming activities planned yet. Check back soon.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {activities.map((a) => {
            const cue = joinCue(a);
            const price = priceLabel(a.cost_cents, parseSignupGroups(a.signup_options));
            return (
              <li key={a.id}>
                <Link href={`/mastapps/activities/${a.id}`} className={`card block h-full overflow-hidden text-ink hover:text-ink ${a.subscribed ? "!border-success" : ""}`}>
                  {/* Phones: a compact row with a thumbnail, the essentials and a clear call to action. */}
                  <div className="flex gap-3 p-3 sm:hidden">
                    {a.poster_url ? (
                      <Image src={a.poster_url} alt="" width={176} height={224} sizes="88px" className="h-28 w-[5.5rem] shrink-0 rounded-lg object-cover" />
                    ) : (
                      <time dateTime={a.starts_at.toISOString()} className="agenda__date !h-28 !w-[5.5rem] shrink-0 justify-center">
                        <span className="agenda__day !text-3xl">{formatDayNumber(a.starts_at)}</span>
                        <span className="agenda__month !text-sm">{formatMonthShort(a.starts_at)}</span>
                      </time>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h2 className="text-lg font-extrabold leading-tight">{a.name}{a.members_only && <MembersBadge />}</h2>
                      <p className="mt-0.5 text-sm font-bold text-accent-text">{formatWhen(a.starts_at, a.ends_at)}</p>
                      <p className="text-sm text-muted">{price}{a.location ? ` · ${a.location}` : ""}</p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <CueBadge cue={cue} />
                        <GoingCount activity={a} />
                      </div>
                    </div>
                  </div>

                  {/* Larger screens: poster first, then the essentials and the call to action. */}
                  <div className="hidden h-full flex-col sm:flex">
                    <div className="relative">
                      {a.poster_url ? (
                        <Image
                          src={a.poster_url}
                          alt={`Poster for ${a.name}`}
                          width={800}
                          height={1000}
                          sizes="(max-width: 1280px) 50vw, 400px"
                          className="aspect-[4/5] w-full object-cover object-top"
                        />
                      ) : (
                        <div className="flex aspect-[4/5] w-full items-center justify-center bg-soft text-accent-text">
                          <span className="text-center font-extrabold leading-none">
                            <span className="block text-7xl">{formatDayNumber(a.starts_at)}</span>
                            <span className="block text-2xl uppercase">{formatMonthShort(a.starts_at)}</span>
                          </span>
                        </div>
                      )}
                      {a.subscribed && (
                        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-success text-white shadow" title="You are subscribed">
                          <CheckIcon /><span className="sr-only">You are subscribed</span>
                        </span>
                      )}
                      {a.poster_url && (
                        <time dateTime={a.starts_at.toISOString()} className="absolute left-3 top-3 rounded-xl bg-white/95 px-2.5 py-1 text-center font-extrabold leading-tight text-ink shadow">
                          <span className="block text-xl">{formatDayNumber(a.starts_at)}</span>
                          <span className="block text-xs uppercase text-accent-text">{formatMonthShort(a.starts_at)}</span>
                        </time>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <h2 className="text-lg font-extrabold leading-tight">{a.name}{a.members_only && <MembersBadge />}</h2>
                      <p className="text-sm font-bold text-accent-text">{formatWhen(a.starts_at, a.ends_at)}</p>
                      <p className="text-sm text-muted">{price}{a.location ? ` · ${a.location}` : ""}</p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                        <CueBadge cue={cue} />
                        <GoingCount activity={a} />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {past.length > 0 && (
        <section className="mt-8" aria-labelledby="past-activities">
          <h2 id="past-activities" className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted">Past activities</h2>
          <ul className="card divide-y divide-line overflow-hidden">
            {past.map((a) => (
              <li key={a.id}>
                <Link href={`/mastapps/activities/${a.id}`} className="flex items-center gap-3 px-3 py-2 text-ink hover:bg-soft hover:text-ink">
                  {a.poster_url ? (
                    <Image src={a.poster_url} alt="" width={80} height={100} sizes="40px" className="h-12 w-10 shrink-0 rounded object-cover" />
                  ) : (
                    <time dateTime={a.starts_at.toISOString()} className="flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded bg-soft font-extrabold leading-none text-accent-text">
                      <span className="text-base">{formatDayNumber(a.starts_at)}</span>
                      <span className="text-[0.65rem] uppercase">{formatMonthShort(a.starts_at)}</span>
                    </time>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{a.name}{a.members_only && <MembersBadge />}</span>
                    <time dateTime={a.starts_at.toISOString()} className="block truncate text-sm text-muted">
                      {formatDays(a.starts_at, a.ends_at)}<span className="sm:hidden"> · {a.committee_name}</span>
                    </time>
                  </span>
                  <span className="hidden shrink-0 text-sm text-muted sm:inline">{a.committee_name}</span>
                  <span className="shrink-0 text-xs text-muted">{formatParticipants(a)}<span className="hidden sm:inline"> went</span></span>
                  {a.subscribed && <span className="shrink-0 text-success" title="You went"><CheckIcon /><span className="sr-only">You went</span></span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppFrame>
  );
}
