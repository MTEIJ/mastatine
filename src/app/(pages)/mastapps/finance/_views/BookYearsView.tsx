import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import Modal from "@/components/ui/Modal";
import { listBookYears } from "@/lib/finance";
import type { FinanceAccess } from "@/lib/finance-access";
import { formatDate } from "@/lib/news";
import { closeBookYear } from "../actions";
import { buttonClass } from "@/components/ui/classes";

/** Book years: open until the treasurer closes them after the year has ended. Closing seals the year's mutations. */
export default async function BookYearsView({ access }: { access: FinanceAccess }) {
  const years = await listBookYears();
  const thisYear = new Date().getFullYear();
  // Years must be closed in order, so only the oldest year that is still open can be closed.
  const oldestOpen = [...years].reverse().find((y) => !y.closed)?.year;

  return (
    <section aria-labelledby="years-title" className="space-y-4">
      <div className="section-head !mb-0">
        <div>
          <h2 id="years-title">Book years</h2>
          <p>
            A book year stays open for the whole year and until it is closed. While it is open its mutations can be corrected or deleted. A year can
            be closed once it has ended; its mutations are then sealed and only a reversal can fix them.
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table table-stack">
          <thead>
            <tr>
              <th>Book year</th><th>Status</th><th className="text-right">Mutations</th><th className="text-right">Still open</th>
              {access.canWrite && <th><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {years.map((y) => {
              const ended = y.year < thisYear;
              const canClose = access.canWrite && !y.closed && ended && y.year === oldestOpen;
              return (
                <tr key={y.year}>
                  <td data-primary className="font-medium">
                    <Link href={`/mastapps/finance?view=mutations&year=${y.year}`} className="hover:text-accent-text">{y.year}</Link>
                  </td>
                  <td data-label="Status">
                    {y.closed ? (
                      <span>Closed<span className="block text-xs text-muted">{y.closed_at && formatDate(new Date(y.closed_at).toISOString().slice(0, 10))} · {y.closed_by_name}</span></span>
                    ) : (
                      <span>Open<span className="block text-xs text-muted">{ended ? "Ended, ready to close" : "Running"}</span></span>
                    )}
                  </td>
                  <td data-label="Mutations" className="text-right tabular-nums">{y.entries}</td>
                  <td data-label="Still open" className="text-right tabular-nums">{y.open_entries}</td>
                  {access.canWrite && (
                    <td>
                      {canClose && (
                        <Modal label="Close year" triggerLabel={`Close book year ${y.year}`} title={`Close book year ${y.year}`} description="This cannot be undone." triggerClassName={buttonClass({ variant: "secondary", size: "sm" }, "max-sm:w-full")}>
                          <form action={closeBookYear} className="space-y-3 text-sm">
                            <input type="hidden" name="year" value={y.year} />
                            <p>
                              All {y.open_entries} open {y.open_entries === 1 ? "mutation" : "mutations"} of {y.year} are sealed into the verified ledger. After that nothing
                              in {y.year} can be edited or deleted; mistakes are fixed with a reversal dated in an open year.
                            </p>
                            <p className="text-muted">Check the statement and the receipts first. Closing is recorded with your name.</p>
                            <ConfirmButton className={buttonClass({ variant: "primary", size: "sm" })} message={`Close book year ${y.year}? This cannot be undone.`}>Close {y.year}</ConfirmButton>
                          </form>
                        </Modal>
                      )}
                      {!y.closed && !canClose && ended && <span className="text-xs text-muted">Close earlier years first</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
