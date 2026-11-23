import type { Metadata } from "next";
import { describeDbError } from "@/lib/db";
import { PAGE_SIZE, listTowers, parseQuery, type TowerPage } from "@/lib/towers";
import TowerGrid from "@/classic/TowerGrid";
import SubmitModal from "@/classic/SubmitModal";

export const metadata: Metadata = { title: "Masts", description: "Browse and rate the finest masts." };

export const instant = false;

async function getFirstPage(q: string): Promise<TowerPage> {
  try {
    return await listTowers({ sort: "rating", q, offset: 0, limit: PAGE_SIZE });
  } catch (error) {
    console.error(`Failed to load towers: ${describeDbError(error)}`);
    return { towers: [], hasMore: false };
  }
}

/**
 * The masts to browse and rate. The website shows them on its homepage; the installed app has no homepage, so they live
 * here: a search field, sort chips and the submit button above a plain grid (no orange website band, no intro card).
 */
export default async function MastsPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const q = parseQuery((await props.searchParams)?.s);
  const firstPage = await getFirstPage(q);

  return (
    <div className="masts-page">
      <h1 className="sr-only">Masts</h1>
      <div id="towers" />
      <TowerGrid initialPage={firstPage} initialQuery={q} variant="page" toolbarAction={<SubmitModal variant="compact" />} />
    </div>
  );
}
