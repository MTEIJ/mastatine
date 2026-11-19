import type { Metadata } from "next";
import Link from "next/link";
import AppFrame from "@/components/ui/AppFrame";
import { getCommitteesFor } from "@/lib/committees";
import { hasMeetingFilters, parseMeetingFilters, searchMeetings, type MeetingFilters } from "@/lib/meetings";
import { requireUser } from "@/lib/session";
import MeetingRow from "../MeetingRow";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { buttonClass, cardClass } from "@/components/ui/classes";

export const metadata: Metadata = { title: "Meetings", robots: { index: false } };

const PAGE = "/mastapps/minutes/meetings";
const MAX_RESULTS = 200;

/** Filters beyond the search box: when any is set, the panel starts open so it is clear why the list is short. */
const hasAdvanced = (f: MeetingFilters): boolean => Boolean(f.committeeId || f.status || f.from || f.to || f.when || f.openActions || f.sort !== "newest");

export const instant = false;

export default async function MeetingsPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { user } = await requireUser();
  const filters = parseMeetingFilters(await props.searchParams);
  const [meetings, committees] = await Promise.all([searchMeetings(user, filters, MAX_RESULTS), getCommitteesFor(user)]);
  const filtered = hasMeetingFilters(filters);

  return (
    <AppFrame title="Meetings" hideTitle>
      <Link href="/mastapps/minutes/meetings/new" className={buttonClass({ variant: "primary" }, "mb-4")}>New meeting</Link>

      <form action={PAGE} role="search" className={cardClass("admin-compact mb-4 p-3")}>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="meeting-q">Search meetings</label>
          <Input id="meeting-q" name="q" defaultValue={filters.q} placeholder="Search title, place, agenda or minutes" className="min-w-0 flex-1 basis-60" />
          <Button type="submit" variant="primary" size="sm">Search</Button>
        </div>

        <details className="mt-2" open={hasAdvanced(filters)}>
          <summary className="cursor-pointer text-sm font-bold text-accent-text">Advanced filters</summary>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="meeting-committee">Committee</Label>
              <Select id="meeting-committee" name="committee" defaultValue={filters.committeeId}>
                <option value="">All committees</option>
                {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="meeting-status">Minutes status</Label>
              <Select id="meeting-status" name="status" defaultValue={filters.status}>
                <option value="">Any status</option>
                <option value="open">Open</option>
                <option value="done">Done</option>
                <option value="locked">Locked</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="meeting-when">When</Label>
              <Select id="meeting-when" name="when" defaultValue={filters.when}>
                <option value="">Past and upcoming</option>
                <option value="upcoming">Today and upcoming</option>
                <option value="past">Past only</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="meeting-from">From</Label>
              <Input id="meeting-from" name="from" type="date" defaultValue={filters.from} />
            </div>
            <div>
              <Label htmlFor="meeting-to">Until</Label>
              <Input id="meeting-to" name="to" type="date" defaultValue={filters.to} />
            </div>
            <div>
              <Label htmlFor="meeting-sort">Order</Label>
              <Select id="meeting-sort" name="sort" defaultValue={filters.sort}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </Select>
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="actions" value="open" defaultChecked={filters.openActions} />
            Only meetings with open action points
          </label>
          <div className="mt-3 flex gap-2">
            <Button type="submit" variant="primary" size="sm">Apply filters</Button>
            {filtered && <Link href={PAGE} className={buttonClass({ variant: "ghost", size: "sm" })}>Clear all</Link>}
          </div>
        </details>
      </form>

      <p className="mb-2 text-sm text-muted" role="status">
        {meetings.length === 0 ? "No meetings found." : `${meetings.length}${meetings.length === MAX_RESULTS ? "+" : ""} meeting${meetings.length === 1 ? "" : "s"}`}
        {filtered && meetings.length === 0 && <> <Link href={PAGE} className="font-bold text-accent-text underline">Clear the filters</Link></>}
      </p>
      {meetings.length > 0 && <ul className={cardClass("divide-y divide-line")}>{meetings.map((m) => <MeetingRow key={m.id} meeting={m} />)}</ul>}
    </AppFrame>
  );
}
