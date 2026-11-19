const NOTICES: Record<string, { text: string; tone: "ok" | "bad" }> = {
  added: { text: "Mutation booked.", tone: "ok" },
  updated: { text: "Mutation updated. The change is in the audit log.", tone: "ok" },
  deleted: { text: "Mutation deleted. The deletion is in the audit log.", tone: "ok" },
  locked: { text: "Nothing changed. That mutation is sealed, or is a reversal. Use a reversal to correct it.", tone: "bad" },
  "year-closed": { text: "Nothing changed. The book year of that date is closed. Book a reversal in the current year instead.", tone: "bad" },
  "year-closed-ok": { text: "Book year closed. Its mutations are now sealed.", tone: "ok" },
  "year-not-ended": { text: "A book year can only be closed after it has ended.", tone: "bad" },
  "year-close-failed": { text: "The year was not closed: it is already closed, or an earlier year is still open.", tone: "bad" },
  "has-receipts": { text: "Not deleted: this mutation has receipts attached. Correct it instead, or reverse it once it is sealed.", tone: "bad" },
  reversed: { text: "Mutation reversed. The original stays, cancelled by a new mutation dated today.", tone: "ok" },
  "budget-saved": { text: "Budget saved.", tone: "ok" },
  "receipt-added": { text: "Receipt attached.", tone: "ok" },
  invalid: { text: "Nothing was saved. Check the amount (like 12,50), the date and the description.", tone: "bad" },
  "category-direction": { text: "Nothing was saved. That category does not match money in or money out.", tone: "bad" },
  "reason-needed": { text: "Nothing was reversed. Give a short reason.", tone: "bad" },
  "already-reversed": { text: "That entry was already reversed.", tone: "bad" },
  "receipt-invalid": { text: "The receipt was not saved. Choose an entry and a file.", tone: "bad" },
  "receipt-too-big": { text: "That file is too large (max 10 MB).", tone: "bad" },
  "receipt-type": { text: "Only photos (JPG, PNG, WebP, GIF) and PDF files can be attached.", tone: "bad" },
};

/** The result of the last action, passed in the URL by the server actions. */
export default function Notice({ code }: { code?: string }) {
  const message = code ? NOTICES[code] : undefined;
  if (!message) return null;
  return (
    <p role="status" className={`mb-4 rounded-md px-4 py-3 text-sm ${message.tone === "ok" ? "bg-accent-soft text-accent-text" : "bg-danger/10 text-danger"}`}>
      {message.text}
    </p>
  );
}
