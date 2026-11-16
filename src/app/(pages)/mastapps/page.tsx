import type { Metadata } from "next";
import { connection } from "next/server";
import AdminAppTile from "@/components/AdminAppTile";
import AppTile from "@/components/AppTile";
import FinanceAppTile from "@/components/FinanceAppTile";
import { getApps } from "@/content/apps";
import { getCachedUpcomingActivities } from "@/lib/activities-cached";
import { formatDayMonth, formatTime } from "@/lib/datetime";
import { getMembership } from "@/lib/membership";

export const metadata: Metadata = {
  title: "MastApps",
  description: "Small apps for mast enthusiasts.",
};

export const instant = false;

/** "Next: Quiz Night · 19 November 20:00" for the Activities hero tile, or nothing when none is planned. */
async function nextActivityLine(): Promise<string | null> {
  // Request-time data. Outside the try on purpose: the bail-out Next throws during the build must not be caught.
  await connection();
  try {
    const { isMember } = await getMembership();
    const [next] = await getCachedUpcomingActivities(1, isMember);
    return next ? `Next: ${next.name} · ${formatDayMonth(next.starts_at)} ${formatTime(next.starts_at)}` : null;
  } catch (error) {
    console.error("Failed to load the next activity:", (error as Error).message);
    return null;
  }
}

export default async function MastAppsPage() {
  const apps = getApps();
  const next = await nextActivityLine();

  return (
    <>
      {/* No visible title: the page is the launcher itself. The heading stays for screen readers. */}
      <h1 className="sr-only">MastApps</h1>
      <div className="container-page pt-6 sm:pt-10">
        <ul className="app-grid">
          {apps.map((app) => (
            <li key={app.slug}>
              <AppTile app={app} detail={app.slug === "activities" ? next : undefined} />
            </li>
          ))}
          <FinanceAppTile />
          <AdminAppTile />
        </ul>
      </div>
    </>
  );
}
