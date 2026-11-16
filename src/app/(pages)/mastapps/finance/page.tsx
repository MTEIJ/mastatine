import Link from "next/link";
import { CATEGORY_VALUES, sealDueEntries, type Category } from "@/lib/finance";
import { requireFinance } from "@/lib/finance-access";
import Notice from "./notices";
import BudgetsView from "./_views/BudgetsView";
import LedgerView from "./_views/LedgerView";
import OverviewView from "./_views/OverviewView";

export const instant = false;

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "ledger", label: "Ledger" },
  { id: "budgets", label: "Budgets" },
] as const;
type ViewId = (typeof VIEWS)[number]["id"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SearchParams {
  view?: string;
  notice?: string;
  year?: string;
  page?: string;
  category?: string;
  activity?: string;
}

/** The whole finance app on one page: the view is a search parameter, so every state has a shareable address and works without scripts. */
export default async function Finance(props: { searchParams: Promise<SearchParams> }) {
  // Layouts do not re-run on client navigation, so each page checks access itself.
  const access = await requireFinance();
  const params = await props.searchParams;
  await sealDueEntries();
  const view: ViewId = VIEWS.find((v) => v.id === params.view)?.id ?? "overview";

  const thisYear = new Date().getFullYear();
  const ledgerYear = Number(params.year) >= 2020 ? Number(params.year) : undefined;
  const statementYear = Math.min(thisYear + 1, Math.max(2020, Number(params.year) || thisYear));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <nav aria-label="Finance sections" className="tabs !mb-0">
          {VIEWS.map((v) => (
            <Link key={v.id} href={v.id === "overview" ? "/mastapps/finance" : `/mastapps/finance?view=${v.id}`} aria-current={v.id === view ? "true" : undefined} className="tab">
              {v.label}
            </Link>
          ))}
        </nav>

        {view === "overview" && (
          <form className="flex items-center gap-2 text-sm">
            <label htmlFor="year" className="text-muted">Year</label>
            <input id="year" name="year" type="number" min={2020} max={thisYear + 1} defaultValue={statementYear} className="input !w-20" />
            <button className="btn btn-secondary btn-sm" type="submit">Show</button>
          </form>
        )}
      </div>

      <Notice code={params.notice} />

      {view === "overview" && <OverviewView year={statementYear} />}
      {view === "ledger" && (
        <LedgerView
          access={access}
          params={{
            page: Math.max(1, Math.min(Number(params.page) || 1, 10_000)),
            year: ledgerYear,
            category: CATEGORY_VALUES.includes(params.category as Category) ? (params.category as Category) : undefined,
            activityId: params.activity && UUID_RE.test(params.activity) ? params.activity : undefined,
          }}
        />
      )}
      {view === "budgets" && <BudgetsView access={access} />}
    </div>
  );
}
