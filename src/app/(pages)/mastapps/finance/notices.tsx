const NOTICES: Record<string, { text: string; tone: "ok" | "bad" }> = {
  added: { text: "Entry added to the ledger.", tone: "ok" },
  reversed: { text: "Entry reversed. The original stays in the ledger, cancelled by a new entry.", tone: "ok" },
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
    <p role="status" className={`mb-4 rounded-xl px-4 py-3 text-sm ${message.tone === "ok" ? "bg-accent-soft text-accent-text" : "bg-danger/10 text-danger"}`}>
      {message.text}
    </p>
  );
}
