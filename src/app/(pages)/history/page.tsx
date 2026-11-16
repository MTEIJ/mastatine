import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import { HISTORY } from "@/content/site";

export const metadata: Metadata = {
  title: "History",
  description: "The history of M.A. Mastatine, from a rented room in Wyck in 2006 to our 4th lustrum.",
};

export const instant = false;

export default function HistoryPage() {
  return (
    <>
      <PageHeader
        title="History"
        intro="Twenty years of Mastatine, from a rented room in Wyck to our 4th lustrum."
      />
      <div className="container-prose">
        <ol className="relative space-y-10 border-l border-line pl-8">
          {HISTORY.map((m) => (
            <li key={m.year} className="relative">
              <span className="absolute -left-[2.45rem] top-1.5 size-3 rounded-full bg-accent ring-4 ring-bg" aria-hidden />
              <p className="text-lg font-bold text-accent-text">{m.year}</p>
              <h2 className="mt-1 text-xl font-bold">{m.title}</h2>
              <p className="mt-2 text-muted">{m.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
