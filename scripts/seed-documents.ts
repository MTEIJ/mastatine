// Renders the official documents as PDFs, stores them in the private documents folder and registers them.
// Idempotent: a document whose category and title already exist is left alone, so edits made in the admin survive.
// Run it with DATABASE_URL (and, for the Docker volume, DOCUMENTS_DIR) set: `bun scripts/seed-documents.ts`.
import sql from "@/lib/db";
import { removeDocumentFile, storeDocument } from "@/lib/documents";
import { getLegalIdentity } from "@/lib/legal";
import { CODE_OF_CONDUCT } from "./documents/conduct";
import { complaintsProcedure } from "./documents/complaints";
import { HOUSE_RULES } from "./documents/house-rules";
import { POLICY_PLAN } from "./documents/policy-plan";
import { privacyStatement } from "./documents/privacy";
import { renderPdf, type DocSpec } from "./documents/render";
import { STATUTES } from "./documents/statutes";

const legal = getLegalIdentity();
const SPECS: DocSpec[] = [STATUTES, HOUSE_RULES, privacyStatement(legal), CODE_OF_CONDUCT, complaintsProcedure(legal), POLICY_PLAN];

async function seed(spec: DocSpec): Promise<string> {
  const [existing] = await sql`SELECT 1 FROM documents WHERE category = ${spec.category} AND title = ${spec.title}`;
  if (existing) return "exists";

  const stored = await storeDocument(await renderPdf(spec));
  if (!stored) throw new Error(`Could not render ${spec.title} as a PDF.`);
  try {
    await sql`
      INSERT INTO documents (category, title, description, version_label, document_date, visibility,
                             filename, original_name, size_bytes, sha256)
      VALUES (${spec.category}, ${spec.title}, ${spec.description}, ${spec.version}, ${spec.date}, ${spec.visibility},
              ${stored.filename}, ${`${spec.title}.pdf`}, ${stored.sizeBytes}, ${stored.sha256})
    `;
  } catch (error) {
    await removeDocumentFile(stored.filename);
    throw error;
  }
  return "added";
}

try {
  for (const spec of SPECS) console.log(`${(await seed(spec)).padEnd(7)} ${spec.title}`);
} catch (error) {
  console.error("seeding documents failed:", error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
