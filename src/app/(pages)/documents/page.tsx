import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { DOCUMENT_CATEGORIES, formatSize, getDocuments } from "@/lib/documents";
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
      <div className="container-prose">
        {!signedIn && (
          <p className="card mb-8 p-4 text-base">
            Most documents are for members only.{" "}
            <Link href="/login?next=/documents" className="font-semibold text-accent-text underline underline-offset-2">Sign in</Link> to see them all.
          </p>
        )}

        {DOCUMENT_CATEGORIES.map((category) => {
          const items = docs.filter((d) => d.category === category.value);
          if (items.length === 0) return null;
          return (
            <section key={category.value} aria-labelledby={`cat-${category.value}`} className="mb-8">
              <h2 id={`cat-${category.value}`} className="text-2xl font-bold">{category.label}</h2>
              <ul className="card mt-3 divide-y divide-line">
                {items.map((doc) => (
                  <li key={doc.id}>
                    <a href={`/documents/${doc.id}`} target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-soft">
                      <span className="font-bold">{doc.title}</span>
                      {doc.version_label && <span className="badge ml-2">{doc.version_label}</span>}
                      {doc.visibility === "members" && <span className="badge ml-2">members</span>}
                      <span className="block text-sm text-muted">
                        {doc.document_date} · PDF, {formatSize(doc.size_bytes)}
                      </span>
                      {doc.description && <span className="mt-1 block text-base text-muted">{doc.description}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {docs.length === 0 && <p className="text-muted">{signedIn ? "No documents have been published yet." : "No public documents yet."}</p>}

        <p className="mt-10 text-base text-muted">
          Missing something or found a mistake? <Link href="/contact" className="font-semibold text-accent-text underline underline-offset-2">Tell the board</Link>.
        </p>
      </div>
    </>
  );
}
