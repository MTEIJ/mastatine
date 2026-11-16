import Link from "next/link";
import { CATEGORY_VALUES, listBookYears, type Category } from "@/lib/finance";
import { requireFinance } from "@/lib/finance-access";
import Notice from "./notices";
import BudgetsView from "./_views/BudgetsView";
import BookYearsView from "./_views/BookYearsView";
import MutationsView from "./_views/MutationsView";
import OverviewView from "./_views/OverviewView";

export const instant = false;

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "mutations", label: "Mutations" },
  { id: "budgets", label: "Budgets" },
  { id: "years", label: "Book years" },
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
  // Old links used view=ledger.
  const requested = params.view === "ledger" ? "mutations" : params.view;
  const view: ViewId = VIEWS.find((v) => v.id === requested)?.id ?? "overview";

  const thisYear = new Date().getFullYear();
  const years = await listBookYears();
  const allYears = params.year === "all" && view === "mutations";
  const bookYear = Math.min(thisYear + 1, Math.max(2020, Number(params.year) || thisYear));

  const yearScoped = view === "overview" || view === "mutations";
  const tabHref = (id: ViewId) => {
    const query = new URLSearchParams();
    if (id !== "overview") query.set("view", id);
    if (params.year && (id === "overview" || id === "mutations")) query.set("year", params.year === "all" && id === "overview" ? String(thisYear) : params.year);
    const text = query.toString();
    return text ? `/mastapps/finance?${text}` : "/mastapps/finance";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <nav aria-label="Finance sections" className="tabs !mb-0">
          {VIEWS.map((v) => (
            <Link key={v.id} href={tabHref(v.id)} aria-current={v.id === view ? "true" : undefined} className="tab">
              {v.label}
            </Link>
          ))}
        </nav>

        {yearScoped && (
          <form className="flex items-center gap-2 text-sm">
            {view !== "overview" && <input type="hidden" name="view" value={view} />}
            <label htmlFor="year" className="text-muted">Book year</label>
            <select id="year" name="year" className="input !w-auto" defaultValue={allYears ? "all" : String(bookYear)}>
              {view === "mutations" && <option value="all">All years</option>}
              {[...new Set([...years.map((y) => y.year), bookYear])].sort((x, y) => y - x).map((y) => (
                <option key={y} value={y}>{y}{years.find((b) => b.year === y)?.closed ? " (closed)" : ""}</option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" type="submit">Show</button>
          </form>
        )}
      </div>

      <Notice code={params.notice} />

      {view === "overview" && <OverviewView year={bookYear} />}
      {view === "mutations" && (
        <MutationsView
          access={access}
          params={{
            page: Math.max(1, Math.min(Number(params.page) || 1, 10_000)),
            year: allYears ? undefined : bookYear,
            category: CATEGORY_VALUES.includes(params.category as Category) ? (params.category as Category) : undefined,
            activityId: params.activity && UUID_RE.test(params.activity) ? params.activity : undefined,
          }}
        />
      )}
      {view === "budgets" && <BudgetsView access={access} />}
      {view === "years" && <BookYearsView access={access} />}
    </div>
  );
}
