import type { Metadata } from "next";
import { requireFinance } from "@/lib/finance-access";

export const metadata: Metadata = { title: "Finance", robots: { index: false, follow: false } };

export const instant = false;

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  await requireFinance();
  return <div className="dash-page admin-compact @container">{children}</div>;
}
