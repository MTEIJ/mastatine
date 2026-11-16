import type { Metadata } from "next";
import Link from "next/link";
import FileManager from "@/components/documents/FileManager";
import PageHeader from "@/components/ui/PageHeader";
import { getDocuments } from "@/lib/documents";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Documents",
  description: "Statutes, house rules, policies and reports of M.A. Mastatine.",
  robots: { index: false },
};

export const instant = false;

export default async function DocumentsPage() {
  const signedIn = Boolean(await getSession());
  const docs = await getDocuments(signedIn).catch((error: unknown) => {
    console.error("Failed to load documents:", (error as Error).message);
    return [];
  });

  return (
    <>
      <PageHeader
        title="Documents"
        intro="The official papers of the association: what we are founded on, how we work and what we have done."
      />
      <div className="container-page pb-12">
        {!signedIn && (
          <p className="card mb-6 p-4 text-base">
            Most documents are for members only.{" "}
            <Link href="/login?next=/documents" className="font-semibold text-accent-text underline underline-offset-2">Sign in</Link> to see them all.
          </p>
        )}
        <FileManager files={docs} canManage={false} />
        <p className="mt-8 text-base text-muted">
          Missing something or found a mistake? <Link href="/contact" className="font-semibold text-accent-text underline underline-offset-2">Tell the board</Link>.
        </p>
      </div>
    </>
  );
}
