import Link from "next/link";
import type { ReactNode } from "react";
import ShapeIcon from "@/components/ui/ShapeIcon";
import type { MastApp } from "@/content/apps";
import { Badge } from "@/components/ui/Card";

function Arrow({ external }: { external?: boolean }) {
  return (
    <svg className="app-tile__arrow" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {external ? <path d="M7 17 17 7M8 7h9v9" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
    </svg>
  );
}

interface AppTileProps {
  app: MastApp;
  /** A live line under the description, such as the next activity on the hero tile. */
  detail?: ReactNode;
}

/** A Material 3 Expressive tile: tonal container, shaped icon, and a corner that morphs when pressed. */
export default function AppTile({ app, detail }: AppTileProps) {
  const content = (
    <>
      <ShapeIcon shape={app.shape} tone={app.tone} size={app.slug === "activities" ? "lg" : "md"}>{app.icon}</ShapeIcon>
      <span className="app-tile__body">
        <span className="app-tile__head">
          <h2 className="app-tile__name">{app.name}</h2>
          {app.access && <Badge>{app.access} only</Badge>}
        </span>
        <span className="app-tile__text">{app.description}</span>
        {detail && <span className="app-tile__detail">{detail}</span>}
      </span>
      <Arrow external={app.external} />
    </>
  );
  if (app.external) {
    return (
      <a href={app.href} target="_blank" rel="noopener noreferrer" className={`app-tile tone-${app.tone}`} data-app={app.slug}>
        {content}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={app.href} className={`app-tile tone-${app.tone}`} data-app={app.slug}>
      {content}
    </Link>
  );
}
