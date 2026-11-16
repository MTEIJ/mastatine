import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import Modal from "@/components/ui/Modal";
import { CATEGORIES, categoryLabel, listActivityOptions, listEntries, type Category } from "@/lib/finance";
import type { FinanceAccess } from "@/lib/finance-access";
import { formatCents } from "@/lib/finance-money";
import { formatDate } from "@/lib/news";
import { addEntry, deleteEntry, reverseEntry, updateEntry } from "../actions";
import EntryFields from "./EntryFields";

export interface LedgerParams {
  page: number;
  year?: number;
  category?: Category;
  activityId?: string;
}

const shortDate = (d: Date) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default async function LedgerView({ access, params }: { access: FinanceAccess; params: LedgerParams }) {
  const { page, year, category, activityId } = params;
  const [{ entries, hasMore }, activities] = await Promise.all([listEntries({ year, category, activityId }, page), listActivityOptions()]);
  const link = (p: number) =>
    `/mastapps/finance?${new URLSearchParams({ view: "ledger", ...(year && { year: String(year) }), ...(category && { category }), ...(activityId && { activity: activityId }), page: String(p) })}`;

  return (
    <section aria-labelledby="ledger-title" className="space-y-4">
      <div className="section-head !mb-0">
        <div>
          <h2 id="ledger-title">Ledger</h2>
          <p>New entries can be corrected or deleted for 3 days. After that they are sealed and only a reversal can fix them.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/mastapps/finance/export" className="btn btn-secondary btn-sm" download>Download CSV</a>
          {access.canWrite && (
            <Modal label="Add entry" title="Add an entry" description="You can correct or delete it for 3 days; after that it is sealed. Donor names are personal data: only note what you need." triggerClassName="btn btn-primary btn-sm">
              <form action={addEntry} className="space-y-4">
                <EntryFields idPrefix="add" activities={activities} />
                <button type="submit" className="btn btn-primary w-full sm:w-auto">Add to ledger</button>
              </form>
            </Modal>
          )}
        </div>
      </div>

      <form className="grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap" role="search">
        <input type="hidden" name="view" value="ledger" />
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
        <button className="btn btn-secondary btn-sm col-span-2 sm:col-span-1" type="submit">Filter</button>
        {(year || category || activityId) && <Link href="/mastapps/finance?view=ledger" className="col-span-2 self-center text-sm text-muted hover:text-accent-text sm:col-span-1">Clear filters</Link>}
      </form>

      <div className="table-wrap">
        <table className="table table-stack">
          <thead>
            <tr><th>#</th><th>Date</th><th>What</th><th className="text-right">Amount</th><th>Receipts</th>{access.canWrite && <th><span className="sr-only">Actions</span></th>}</tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const cancelled = e.reversed_by_id != null;
              return (
                <tr key={e.id} className={cancelled ? "text-muted line-through decoration-1" : undefined}>
                  <td data-label="No." className="tabular-nums text-muted">{e.seq ?? "–"}</td>
                  <td data-label="Date" className="whitespace-nowrap">{formatDate(e.occurred_on)}</td>
                  <td data-primary>
                    <span className="font-medium">{e.description}</span>
                    <span className="block text-xs text-muted">
                      {categoryLabel(e.category)}
                      {e.counterparty && ` · ${e.counterparty}`}
                      {e.activity_label && <> · <Link href={`/mastapps/finance?view=ledger&activity=${e.activity_id}`} className="hover:text-accent-text">{e.activity_label}</Link></>}
                      {` · by ${e.created_by_name}`}
                    </span>
                    {e.open && <span className="badge mt-1 inline-block !bg-soft !font-medium !text-muted">Open until {shortDate(e.locks_at)}</span>}
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
                        <Modal label="Manage" triggerLabel={`Manage entry ${e.seq ?? "(open)"}`} title={e.seq ? `Entry ${e.seq}` : "Open entry"} description={e.open ? `You can still change this until ${shortDate(e.locks_at)}.` : e.description} triggerClassName="btn btn-secondary btn-sm max-sm:w-full">
                          <div className="space-y-5 text-sm">
                            {e.open && (
                              <form action={updateEntry} className="space-y-4">
                                <input type="hidden" name="id" value={e.id} />
                                <EntryFields idPrefix={`edit-${e.id}`} activities={activities} entry={e} />
                                <button className="btn btn-primary btn-sm" type="submit">Save changes</button>
                              </form>
                            )}
                            <form action="/mastapps/finance/receipts" method="post" encType="multipart/form-data" className={`space-y-2 ${e.open ? "border-t border-line pt-5" : ""}`}>
                              <input type="hidden" name="entry_id" value={e.id} />
                              <label className="label" htmlFor={`file-${e.id}`}>Attach a receipt</label>
                              <input id={`file-${e.id}`} name="file" type="file" required accept="image/*,application/pdf" className="w-full text-sm" />
                              <button className="btn btn-secondary btn-sm" type="submit">Attach</button>
                            </form>
                            {e.open ? (
                              <form action={deleteEntry} className="space-y-2 border-t border-line pt-5">
                                <input type="hidden" name="id" value={e.id} />
                                <p className="text-muted">Deleting removes the entry completely (it stays in the audit log). Entries with receipts cannot be deleted.</p>
                                <ConfirmButton className="btn btn-danger btn-sm" message="Delete this entry? This cannot be undone.">Delete entry</ConfirmButton>
                              </form>
                            ) : (
                              <form action={reverseEntry} className="space-y-2 border-t border-line pt-5">
                                <input type="hidden" name="id" value={e.id} />
                                <label className="label" htmlFor={`why-${e.id}`}>Reverse this entry</label>
                                <input id={`why-${e.id}`} name="reason" className="input" required maxLength={200} placeholder="Reason" />
                                <ConfirmButton className="btn btn-danger btn-sm" message="Reverse this entry? The original stays in the ledger and a cancelling entry is added.">Reverse</ConfirmButton>
                              </form>
                            )}
                          </div>
                        </Modal>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {entries.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted">No entries match.</td></tr>}
          </tbody>
        </table>
      </div>

      {(page > 1 || hasMore) && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pages">
          {page > 1 ? <Link href={link(page - 1)} className="btn btn-secondary btn-sm">Newer</Link> : <span />}
          {hasMore && <Link href={link(page + 1)} className="btn btn-secondary btn-sm">Older</Link>}
        </nav>
      )}
    </section>
  );
}
