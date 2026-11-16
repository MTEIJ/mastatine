import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="dash-page admin-compact admin-shell @container">
      <h1 className="sr-only">Admin</h1>
      <AdminNav />
      <div className="admin-shell__content">{children}</div>
    </div>
  );
}
