import PDFDocument from "pdfkit";
import type { DocumentCategory } from "@/lib/documents";

/** A paragraph (string) or a bullet list (string[]). */
export type Block = string | string[];

export interface Section {
  heading?: string;
  blocks: Block[];
}

export interface DocSpec {
  category: DocumentCategory;
  title: string;
  /** One line shown on the documents page. */
  description: string;
  version: string;
  /** ISO date the document was drawn up. */
  date: string;
  visibility: "members" | "public";
  /** Where the document stands, printed under the title (e.g. "Draft, to be adopted by the General Members Meeting"). */
  status: string;
  sections: Section[];
}

const INK = "#1a1a1a";
const MUTED = "#555555";
const ACCENT = "#7a3a00";
const MARGIN = 64;

/** Renders a document as a plain, accessible A4 PDF: real text, a title, numbered pages and a footer. */
export function renderPdf(spec: DocSpec): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: MARGIN + 12, left: MARGIN, right: MARGIN },
      bufferPages: true,
      info: { Title: spec.title, Author: "M.A. Mastatine", Subject: spec.description },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);

    doc.font("Helvetica").fontSize(10).fillColor(ACCENT).text("M.A. MASTATINE · MASTER ASSOCIATION · MAASTRICHT", { characterSpacing: 1 });
    doc.moveDown(1.2);
    doc.font("Helvetica-Bold").fontSize(24).fillColor(INK).text(spec.title);
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(10.5).fillColor(MUTED).text(`${spec.version} · ${spec.date} · ${spec.status}`);
    doc.moveDown(0.6);
    doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + 60, doc.y).lineWidth(3).strokeColor(ACCENT).stroke();
    doc.moveDown(1.2);

    for (const section of spec.sections) {
      if (section.heading) {
        doc.moveDown(0.4);
        doc.font("Helvetica-Bold").fontSize(13).fillColor(INK).text(section.heading);
        doc.moveDown(0.3);
      }
      for (const block of section.blocks) {
        doc.font("Helvetica").fontSize(10.5).fillColor(INK);
        if (typeof block === "string") {
          doc.text(block, { align: "left", lineGap: 2.5 });
        } else {
          doc.list(block, { bulletRadius: 1.6, textIndent: 14, bulletIndent: 4, lineGap: 2.5 });
        }
        doc.moveDown(0.6);
      }
    }

    // Footer on every page. The bottom margin is lifted while writing so the footer does not trigger a new page.
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.page.margins.bottom = 0;
      doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
      doc.text(`M.A. Mastatine · ${spec.title} · page ${i + 1} of ${range.count}`, MARGIN, doc.page.height - 44, {
        width: doc.page.width - MARGIN * 2,
        align: "center",
        lineBreak: false,
      });
    }
    doc.end();
  });
}
