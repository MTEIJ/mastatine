import ConfirmButton from "@/components/admin/ConfirmButton";
import { formatGrade, formatQuoteDate, type Quote } from "@/lib/quotes";
import { deleteQuote, voteQuote } from "./actions";
import { TrashIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { cardClass } from "@/components/ui/classes";

interface QuoteCardProps {
  quote: Quote;
  canDelete: boolean;
}

export default function QuoteCard({ quote, canDelete }: QuoteCardProps) {
  return (
    <article className={cardClass("!border-2 !border-outline !shadow-(--shadow-md) px-4 py-3")}>
      <header className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <strong className="font-extrabold text-accent-text">{quote.author}</strong> · {formatQuoteDate(quote.said_on)}
        </p>
        {canDelete && (
          <form action={deleteQuote}>
            <input type="hidden" name="id" value={quote.id} />
            <ConfirmButton message="Delete this quote?" className="!inline-flex !min-h-0 cursor-pointer items-center gap-1 !rounded-sm !border-0 !bg-transparent !px-2 !py-1 !text-sm !font-bold !text-muted !shadow-none transition-colors hover:!bg-danger/10 hover:!text-danger">
              <TrashIcon />
              Delete
            </ConfirmButton>
          </form>
        )}
      </header>
      <blockquote className="mt-1 whitespace-pre-line text-lg font-medium leading-snug text-ink">{quote.body}</blockquote>
      <footer className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Grade <Badge className="!bg-accent !text-accent-fg text-sm">{formatGrade(quote.average)}</Badge>
          {quote.votes > 0 && <span> · {quote.votes} {quote.votes === 1 ? "vote" : "votes"}</span>}
        </p>
        <form action={voteQuote} className="flex items-center gap-2">
            <input type="hidden" name="quote_id" value={quote.id} />
            <label htmlFor={`grade-${quote.id}`} className="text-sm font-bold text-ink">Your grade</label>
            <Select id={`grade-${quote.id}`} name="score" aria-label={`Your grade for the quote by ${quote.author}`} defaultValue={quote.my_score ?? 8} className="!w-auto !min-h-0 !border-outline !py-1 !text-sm">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
            <Button type="submit" variant="primary" className="!min-h-0 !px-3 !py-1 !text-sm">{quote.my_score ? "Update vote" : "Vote"}</Button>
        </form>
      </footer>
    </article>
  );
}
