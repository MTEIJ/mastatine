import ConfirmButton from "@/components/admin/ConfirmButton";
import { formatGrade, formatQuoteDate, type Quote } from "@/lib/quotes";
import { deleteQuote, voteQuote } from "./actions";
import { TrashIcon } from "@/components/ui/icons";

interface QuoteCardProps {
  quote: Quote;
  canDelete: boolean;
}

export default function QuoteCard({ quote, canDelete }: QuoteCardProps) {
  return (
    <article className="card !border-2 !border-[#6f655b] !bg-white !shadow-[0_4px_14px_rgba(0,0,0,0.3)] px-4 py-3">
      <header className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#3d3935]">
          <strong className="font-extrabold text-accent-text">{quote.author}</strong> · {formatQuoteDate(quote.said_on)}
        </p>
        {canDelete && (
          <form action={deleteQuote}>
            <input type="hidden" name="id" value={quote.id} />
            <ConfirmButton message="Delete this quote?" className="!inline-flex !min-h-0 cursor-pointer items-center gap-1 !rounded-md !border-0 !bg-transparent !px-2 !py-1 !text-sm !font-bold !text-[#5c5650] !shadow-none transition-colors hover:!bg-danger/10 hover:!text-danger">
              <TrashIcon />
              Delete
            </ConfirmButton>
          </form>
        )}
      </header>
      <blockquote className="mt-1 whitespace-pre-line text-lg font-medium leading-snug text-black">{quote.body}</blockquote>
      <footer className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[#3d3935]">
          Grade <span className="badge !bg-accent !text-white text-sm">{formatGrade(quote.average)}</span>
          {quote.votes > 0 && <span> · {quote.votes} {quote.votes === 1 ? "vote" : "votes"}</span>}
        </p>
        <form action={voteQuote} className="flex items-center gap-2">
            <input type="hidden" name="quote_id" value={quote.id} />
            <label htmlFor={`grade-${quote.id}`} className="text-sm font-bold text-black">Your grade</label>
            <select id={`grade-${quote.id}`} name="score" aria-label={`Your grade for the quote by ${quote.author}`} defaultValue={quote.my_score ?? 8} className="input !w-auto !min-h-0 !border-[#8a837b] !py-1 !text-sm">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <button type="submit" className="btn btn-primary !min-h-0 !px-3 !py-1 !text-sm">{quote.my_score ? "Update vote" : "Vote"}</button>
        </form>
      </footer>
    </article>
  );
}
