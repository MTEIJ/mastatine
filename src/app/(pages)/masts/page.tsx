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

/** The masts to browse and rate. The website shows them on its homepage; the installed app has no homepage, so they live here. */
export default async function MastsPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const q = parseQuery((await props.searchParams)?.s);
  const firstPage = await getFirstPage(q);

  return (
    <section id="lp-posts">
      <div className="lp-posts-inside">
        <div id="towers" style={{ scrollMarginTop: "2rem" }} />
        <TowerGrid initialPage={firstPage} initialQuery={q}>
          <article className="post hentry news-card">
            <div className="news-card__top">
              <span className="news-card__label">Masts</span>
            </div>
            <p style={{ flex: 1, marginBottom: "0.5rem" }}>Rate the masts, or add one of your own.</p>
            <SubmitModal />
          </article>
        </TowerGrid>
      </div>
    </section>
  );
}
