import { redirect } from "next/navigation";

export const instant = false;

/** The ledger now lives inside the single Finance page; old links keep working. */
export default async function LedgerRedirect(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await props.searchParams;
  const next = new URLSearchParams({ view: "mutations" });
  for (const key of ["notice", "year", "category", "activity", "page"]) {
    const value = params[key];
    if (value) next.set(key, value);
  }
  redirect(`/mastapps/finance?${next}`);
}
