import Link from "next/link";
import FileManager from "@/components/documents/FileManager";
import { getAllDocuments, missingCategories } from "@/lib/documents";
import { requireAdmin } from "@/lib/session";
import { cardClass } from "@/components/ui/classes";

export const instant = false;

export default async function AdminDocuments() {
  // Layouts do not re-run on client navigation, so each admin page checks the role itself.
  await requireAdmin();
  const docs = await getAllDocuments();
  const missing = missingCategories(docs);

  return (
    <div className="space-y-4">
      <section aria-labelledby="checklist-title" className={cardClass("space-y-1 p-4")}>
        <h2 id="checklist-title" className="text-base font-extrabold">Checklist</h2>
        {missing.length === 0 ? (
          <p className="text-sm text-muted">Every standard document is in place.</p>
        ) : (
          <p className="text-sm text-muted">
            Still missing ({missing.length}): {missing.map((c) => c.label).join(", ")}.
          </p>
        )}
        <p className="text-xs text-muted">
          Members see these files at <Link href="/documents" className="underline">/documents</Link>. Set a file to “Anyone” in its details to make it public.
        </p>
      </section>
      <FileManager files={docs} canManage />
    </div>
  );
}
