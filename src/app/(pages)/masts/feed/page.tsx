import type { Metadata } from "next";
import { describeDbError } from "@/lib/db";
import { PAGE_SIZE, listTowers, type TowerPage } from "@/lib/towers";
import MastFeed from "@/classic/MastFeed";

export const metadata: Metadata = { title: "Masts", description: "The masts, one at a time.", robots: { index: false } };

export const instant = false;

async function getFirstPage(): Promise<TowerPage> {
  try {
    return await listTowers({ sort: "newest", q: "", offset: 0, limit: PAGE_SIZE });
  } catch (error) {
    console.error(`Failed to load towers: ${describeDbError(error)}`);
    return { towers: [], hasMore: false };
  }
}

/** The installed app's Masts tab: a full-screen vertical feed, newest first. The grid of all masts stays at /masts. */
export default async function MastFeedPage() {
  return <MastFeed initialPage={await getFirstPage()} />;
}
