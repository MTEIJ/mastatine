"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SubmitModal from "./SubmitModal";
import type { Tower } from "@/lib/types";
import type { TowerPage } from "@/lib/towers";
import { toKlok } from "@/lib/klok";
import { submitVote, type VoteDirection } from "@/lib/vote";
import { getOrCreateVoterId } from "@/lib/voter-id";
import { MASTS_CHANGED_EVENT } from "@/lib/events";

/** Load the next page once the viewer is this many masts from the end. */
const PREFETCH_DISTANCE = 3;

async function fetchPage(offset: number): Promise<TowerPage> {
  const res = await fetch(`/api/towers?${new URLSearchParams({ sort: "newest", offset: String(offset) })}`);
  if (!res.ok) throw new Error(`Failed to load masts (${res.status})`);
  return res.json();
}

const ArrowUp = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
const ArrowDown = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);
const GridIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);

interface SlideProps {
  tower: Tower;
  index: number;
  vote: VoteDirection | null;
  onVote: (direction: VoteDirection) => void;
  /** Only the first couple of photos load eagerly; the rest load as they come near. */
  eager: boolean;
}

function Slide({ tower, index, vote, onVote, eager }: SlideProps) {
  const [expanded, setExpanded] = useState(false);
  const [burst, setBurst] = useState(0);
  const hasHeight = tower.height != null && tower.height > 0;

  // Double tap the photo to upvote, the way people like a post (it never takes an upvote back).
  function doubleTap() {
    if (vote !== "up") onVote("up");
    setBurst((n) => n + 1);
  }

  return (
    <article className="feed-slide" aria-roledescription="slide" aria-label={`${tower.title}, mast ${index + 1}`} data-index={index}>
      {/* The photo twice: blurred to fill the screen, and whole on top, so landscape photos have no black bars. */}
      <Image src={tower.image_url} alt="" fill sizes="100vw" quality={30} className="feed-slide__fill" preload={eager} />
      <Image src={tower.image_url} alt={tower.title} fill sizes="100vw" quality={75} className="feed-slide__photo" preload={eager} onDoubleClick={doubleTap} />
      {burst > 0 && (
        <span key={burst} className="feed-slide__burst" aria-hidden>
          <ArrowUp />
        </span>
      )}

      <div className="feed-slide__info">
        <h2 className="feed-slide__title">{tower.title}</h2>
        <p className="feed-slide__meta">
          by {tower.submitter_name}
          {hasHeight && (
            <>
              {" · "}
              {tower.height} m · {toKlok(tower.height!).toLocaleString("en-US")} KLOK
            </>
          )}
        </p>
        {tower.description && (
          <button type="button" className={`feed-slide__desc${expanded ? " is-open" : ""}`} onClick={() => setExpanded((open) => !open)} aria-expanded={expanded}>
            {tower.description}
          </button>
        )}
      </div>

      <div className="feed-slide__rail" role="group" aria-label={`Vote on ${tower.title}`}>
        <button type="button" className="feed-vote" aria-pressed={vote === "up"} aria-label="Upvote" onClick={() => onVote("up")}>
          <ArrowUp />
        </button>
        <output className="feed-score" title={`${tower.total_votes} ${tower.total_votes === 1 ? "vote" : "votes"} cast`}>{tower.vote_count}</output>
        <button type="button" className="feed-vote feed-vote--down" aria-pressed={vote === "down"} aria-label="Downvote" onClick={() => onVote("down")}>
          <ArrowDown />
        </button>
      </div>
    </article>
  );
}

/**
 * The masts one at a time, full screen, swiped vertically like Reels: the photo, who found it and how tall it is, with
 * voting on the right. Double tap upvotes. The grid button goes to the page with all masts; + submits one.
 */
export default function MastFeed({ initialPage }: { initialPage: TowerPage }) {
  const [towers, setTowers] = useState<Tower[]>(initialPage.towers);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [votes, setVotes] = useState<Map<string, VoteDirection>>(new Map());
  const [current, setCurrent] = useState(0);
  const loading = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async (offset: number, replace = false) => {
    if (loading.current) return;
    loading.current = true;
    try {
      const page = await fetchPage(offset);
      setTowers((prev) => (replace ? page.towers : [...prev, ...page.towers.filter((t) => !prev.some((p) => p.id === t.id))]));
      setHasMore(page.hasMore);
    } catch (error) {
      console.error(error);
    } finally {
      loading.current = false;
    }
  }, []);

  // Which slide is on screen; near the end, fetch the next page.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          setCurrent(index);
          if (hasMore && index >= towers.length - PREFETCH_DISTANCE) void loadMore(towers.length);
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll(".feed-slide").forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [towers.length, hasMore, loadMore]);

  // When the feed changes size (rotating the phone, the page settling while it loads) browsers may snap to another
  // slide; put the one being looked at back in place.
  const currentRef = useRef(0);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const observer = new ResizeObserver(() => root.scrollTo({ top: currentRef.current * root.clientHeight }));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // A mast was just submitted: start again from the newest, which is the new one.
  useEffect(() => {
    const reload = () => {
      void loadMore(0, true);
      scroller.current?.scrollTo({ top: 0 });
    };
    window.addEventListener(MASTS_CHANGED_EVENT, reload);
    return () => window.removeEventListener(MASTS_CHANGED_EVENT, reload);
  }, [loadMore]);

  useEffect(() => {
    fetch(`/api/votes?voter_id=${getOrCreateVoterId()}`)
      .then((r) => r.json())
      .then((data: { tower_votes: { tower_id: string; direction: VoteDirection }[] }) => {
        setVotes(new Map(data.tower_votes.map((v) => [v.tower_id, v.direction])));
      })
      .catch(() => {});
  }, []);

  const vote = useCallback(async (towerId: string, direction: VoteDirection) => {
    const result = await submitVote(towerId, direction);
    if (!result) return;
    setTowers((prev) => prev.map((t) => (t.id === towerId ? { ...t, vote_count: t.vote_count + result.delta, total_votes: t.total_votes + result.totalDelta } : t)));
    setVotes((prev) => {
      const next = new Map(prev);
      if (result.direction === null) next.delete(towerId);
      else next.set(towerId, result.direction);
      return next;
    });
  }, []);

  return (
    <div className="feed">
      <h1 className="sr-only">Masts</h1>
      <div className="feed__top">
        <span className="feed__brand" aria-hidden>Masts</span>
        <Link href="/masts" className="feed__icon" aria-label="All masts, as a grid">
          <GridIcon />
        </Link>
      </div>

      <div ref={scroller} className="feed__scroller" tabIndex={0} aria-label="Masts, newest first">
        {towers.map((tower, i) => (
          <Slide key={tower.id} tower={tower} index={i} vote={votes.get(tower.id) ?? null} onVote={(d) => void vote(tower.id, d)} eager={i < 2} />
        ))}
        {towers.length === 0 && (
          <div className="feed-slide feed-slide--empty">
            <p>No masts yet. Be the first to add one.</p>
          </div>
        )}
        {!hasMore && towers.length > 0 && (
          <div className="feed-slide feed-slide--end">
            <p className="feed-end__title">You have seen every mast.</p>
            <p>Know one we are missing?</p>
            <Link href="/masts" className="feed-end__link">Browse them all</Link>
          </div>
        )}
      </div>

      <div className="feed__fab">
        <SubmitModal variant="fab" />
      </div>
    </div>
  );
}
