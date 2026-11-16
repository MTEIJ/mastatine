import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { CATEGORIES, CATEGORY_VALUES, categoryLabel, listActivityOptions, listEntries, type Category } from "@/lib/finance";
import { requireFinance } from "@/lib/finance-access";
import { formatCents } from "@/lib/finance-money";
import { formatDate } from "@/lib/news";
import Notice from "../notices";
import { addEntry, reverseEntry } from "../actions";

export const instant = false;

interface SearchParams {
  notice?: string;
  page?: string;
  year?: string;
  category?: string;
  activity?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const today = () => new Date().toISOString().slice(0, 10);

export default async function Ledger(props: { searchParams: Promise<SearchParams> }) {
  const access = await requireFinance();
  const params = await props.searchParams;
  const page = Math.max(1, Math.min(Number(params.page) || 1, 10_000));
  const year = Number(params.year) >= 2020 ? Number(params.year) : undefined;
  const category = CATEGORY_VALUES.includes(params.category as Category) ? (params.category as Category) : undefined;
  const activityId = params.activity && UUID_RE.test(params.activity) ? params.activity : undefined;

  const [{ entries, hasMore }, activities] = await Promise.all([listEntries({ year, category, activityId }, page), listActivityOptions()]);
  const link = (p: number) =>
    `/mastapps/finance/ledger?${new URLSearchParams({ ...(year && { year: String(year) }), ...(category && { category }), ...(activityId && { activity: activityId }), page: String(p) })}`;

  return (
    <div className="space-y-5">
      <Notice code={params.notice} />

      {access.canWrite && (
        <details className="card !p-0">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5">
            <span className="font-semibold">Add an entry</span>
            <span className="btn btn-primary btn-sm pointer-events-none">New entry</span>
          </summary>
          <form action={addEntry} className="grid gap-3 border-t border-line p-4 @xl:grid-cols-6">
            <div>
              <label className="label" htmlFor="direction">Money</label>
              <select id="direction" name="direction" className="input" defaultValue="in">
                <option value="in">In</option>
                <option value="out">Out</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="amount">Amount (€)</label>
              <input id="amount" name="amount" className="input" inputMode="decimal" required placeholder="12,50" />
            </div>
            <div>
              <label className="label" htmlFor="occurred_on">Date</label>
              <input id="occurred_on" name="occurred_on" type="date" className="input" required defaultValue={today()} max={today()} />
            </div>
            <div className="@xl:col-span-3">
              <label className="label" htmlFor="category">Category</label>
              <select id="category" name="category" className="input" defaultValue="donation">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.direction === "either" ? "in or out" : c.direction})</option>)}
              </select>
            </div>
            <div className="@xl:col-span-2">
              <label className="label" htmlFor="counterparty">From / to (optional)</label>
              <input id="counterparty" name="counterparty" className="input" maxLength={120} placeholder="Donor or supplier" />
            </div>
            <div className="@xl:col-span-2">
              <label className="label" htmlFor="description">What for</label>
              <input id="description" name="description" className="input" required maxLength={300} />
            </div>
            <div className="@xl:col-span-2">
              <label className="label" htmlFor="activity_id">Activity (optional)</label>
              <select id="activity_id" name="activity_id" className="input" defaultValue="">
                <option value="">Not tied to an activity</option>
                {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="@xl:col-span-6 flex flex-wrap items-center gap-3">
              <button type="submit" className="btn btn-primary">Add to ledger</button>
              <span className="text-xs text-muted">Entries cannot be edited or deleted later; a mistake is fixed with a reversal. Donor names are personal data: only note what you need.</span>
            </div>
          </form>
        </details>
      )}

      <section aria-labelledby="ledger-title">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 id="ledger-title" className="text-base font-semibold">Ledger</h2>
          <a href="/mastapps/finance/export" className="btn btn-secondary btn-sm" download>Download CSV</a>
        </div>
        <form className="mb-3 grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap" role="search">
          <div>
            <label className="label" htmlFor="f-year">Year</label>
            <input id="f-year" name="year" type="number" min={2020} className="input !w-24" defaultValue={year} />
          </div>
          <div>
            <label className="label" htmlFor="f-category">Category</label>
            <select id="f-category" name="category" className="input" defaultValue={category ?? ""}>
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-activity">Activity</label>
            <select id="f-activity" name="activity" className="input" defaultValue={activityId ?? ""}>
              <option value="">All</option>
              {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary col-span-2 sm:col-span-1" type="submit">Filter</button>
        </form>

        <div className="table-open">
          <table className="table table-stack">
            <thead>
              <tr><th>#</th><th>Date</th><th>What</th><th className="text-right">Amount</th><th>Receipts</th>{access.canWrite && <th><span className="sr-only">Actions</span></th>}</tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const cancelled = e.reversed_by_id != null;
                return (
                  <tr key={e.id} className={cancelled ? "text-muted line-through decoration-1" : undefined}>
                    <td data-label="No." className="tabular-nums text-muted">{e.seq}</td>
                    <td data-label="Date" className="whitespace-nowrap">{formatDate(e.occurred_on)}</td>
                    <td data-primary>
                      <span className="font-medium">{e.description}</span>
                      <span className="block text-xs text-muted">
                        {categoryLabel(e.category)}
                        {e.counterparty && ` · ${e.counterparty}`}
                        {e.activity_label && <> · <Link href={`/mastapps/finance/ledger?activity=${e.activity_id}`} className="hover:text-accent-text">{e.activity_label}</Link></>}
                        {` · by ${e.created_by_name}`}
                      </span>
                    </td>
                    <td data-label="Amount" className={`whitespace-nowrap text-right font-medium tabular-nums ${e.amount_cents < 0 ? "" : "text-accent-text"}`}>{formatCents(e.amount_cents)}</td>
                    <td data-label="Receipts" className="no-underline">
                      {e.receipts.length > 0 ? (
                        <ul className="flex flex-wrap justify-end gap-x-3 gap-y-1 sm:justify-start">
                          {e.receipts.map((r, i) => (
                            <li key={r.id}><a href={`/mastapps/finance/receipts/${r.id}`} target="_blank" rel="noopener" className="text-sm underline" title={r.original_name}>Receipt {i + 1}</a></li>
                          ))}
                        </ul>
                      ) : <span className="text-muted">–</span>}
                    </td>
                    {access.canWrite && (
                      <td>
                        {cancelled && <span className="text-xs">reversed</span>}
                        {e.reverses_id != null && <span className="text-xs">reversal</span>}
                        {!cancelled && e.reverses_id == null && (
                          <details className="popover max-sm:w-full">
                            <summary className="btn btn-secondary btn-sm max-sm:w-full" aria-label={`Manage entry ${e.seq}`}>Manage</summary>
                            <div className="popover__panel space-y-3 text-sm">
                              <form action="/mastapps/finance/receipts" method="post" encType="multipart/form-data" className="space-y-1.5">
                                <input type="hidden" name="entry_id" value={e.id} />
                                <label className="label" htmlFor={`file-${e.id}`}>Attach a receipt</label>
                                <input id={`file-${e.id}`} name="file" type="file" required accept="image/*,application/pdf" className="w-full text-xs" />
                                <button className="btn btn-secondary btn-sm" type="submit">Attach</button>
                              </form>
                              <form action={reverseEntry} className="space-y-1.5 border-t border-line pt-3">
                                <input type="hidden" name="id" value={e.id} />
                                <label className="label" htmlFor={`why-${e.id}`}>Reverse this entry</label>
                                <input id={`why-${e.id}`} name="reason" className="input" required maxLength={200} placeholder="Reason" />
                                <ConfirmButton className="btn btn-danger btn-sm" message="Reverse this entry? The original stays in the ledger and a cancelling entry is added.">Reverse</ConfirmButton>
                              </form>
                            </div>
                          </details>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {entries.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-muted">No entries match.</td></tr>}
            </tbody>
          </table>
        </div>

        {(page > 1 || hasMore) && (
          <nav className="mt-3 flex items-center justify-between text-sm" aria-label="Pages">
            {page > 1 ? <Link href={link(page - 1)} className="btn btn-secondary btn-sm">Newer</Link> : <span />}
            {hasMore && <Link href={link(page + 1)} className="btn btn-secondary btn-sm">Older</Link>}
          </nav>
        )}
      </section>
    </div>
  );
}
