// Dev only: fills the local database with example activities, each with a generated poster.
// Run with the dev database up:  bun scripts/seed-activities.mjs
// Safe to re-run: it replaces the activities it created before (matched by name) and rewrites their posters.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import sharp from "sharp";

const url = process.env.DATABASE_URL ?? "postgresql://mastatine:dev@127.0.0.1:5432/mastatine";
const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
const sql = postgres(url, { max: 1 });

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Today at 20:00 local time, shifted by `days`: a believable evening start. */
const evening = (days) => {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(20, 0, 0, 0);
  return d;
};

// bg: [top, bottom] gradient, ink: text colour, accent: decoration colour. Title lines are wrapped by hand.
const ACTIVITIES = [
  { slug: "board-games-night", name: "Example: Board Games Night", lines: ["Board", "Games", "Night"], tagline: "Bring a game, find a table", days: -34, location: "Clubhouse", cost: 0, limit: 24, bg: ["#1f3a5f", "#0e1c33"], ink: "#ffffff", accent: "#ffb347" },
  { slug: "mast-bbq", name: "Example: Summer Mast BBQ", lines: ["Summer", "Mast", "BBQ"], tagline: "Grill, chill, antennas", days: -21, location: "Park by the old transmitter", cost: 750, limit: 40, bg: ["#ff8a3d", "#c2410c"], ink: "#fff7ed", accent: "#fde68a" },
  { slug: "photo-walk", name: "Example: Tower Photo Walk", lines: ["Tower", "Photo", "Walk"], tagline: "Golden hour on the ridge", days: -9, location: "Meet at the station", cost: 0, limit: null, bg: ["#3b2f63", "#15112b"], ink: "#f5f3ff", accent: "#f0abfc" },
  { slug: "quiz-night", name: "Example: Quiz Night", lines: ["Quiz", "Night"], tagline: "Teams of four, bragging rights", days: 4, location: "Café De Mast", cost: 250, limit: 32, bg: ["#0f766e", "#042f2e"], ink: "#f0fdfa", accent: "#fcd34d" },
  { slug: "film-night", name: "Example: Film Night", lines: ["Film", "Night"], tagline: "Popcorn included", days: 11, location: "Lecture hall B", cost: 0, limit: 60, bg: ["#7f1d1d", "#2a0a0a"], ink: "#fef2f2", accent: "#fca5a5" },
  { slug: "pub-crawl", name: "Example: Autumn Pub Crawl", lines: ["Autumn", "Pub", "Crawl"], tagline: "Five bars, one tower trail", days: 18, location: "Start at the Market Square", cost: 1500, limit: 30, bg: ["#92400e", "#2f1707"], ink: "#fffbeb", accent: "#fbbf24" },
  { slug: "members-dinner", name: "Example: Members Dinner", lines: ["Members", "Dinner"], tagline: "Three courses, members only", days: 27, location: "Restaurant Het Zendstation", cost: 2850, limit: 20, bg: ["#1e293b", "#020617"], ink: "#f8fafc", accent: "#e2c275", membersOnly: true },
  { slug: "winter-hike", name: "Example: Winter Hike", lines: ["Winter", "Hike"], tagline: "Twelve kilometres, one big mast", days: 40, location: "Trailhead car park", cost: 0, limit: null, bg: ["#38bdf8", "#0c4a6e"], ink: "#ffffff", accent: "#e0f2fe" },
];

const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function posterSvg(a, start) {
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(start);
  const lines = a.lines.map((line, i) => `<text x="64" y="${400 + i * 108}" font-size="104" font-weight="900" fill="${a.ink}">${escapeXml(line.toUpperCase())}</text>`).join("");
  // A stylised lattice mast, top right.
  const mast = `<g stroke="${a.accent}" stroke-width="7" fill="none" stroke-linecap="round">
    <path d="M640 90 L590 330 M640 90 L690 330 M600 250 L680 250 M610 200 L670 200 M595 300 L685 300 M600 250 L685 300 M680 250 L595 300"/>
    <circle cx="640" cy="80" r="14" fill="${a.accent}"/>
    <path d="M590 40 Q640 5 690 40 M570 20 Q640 -35 710 20" opacity="0.7"/>
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000" font-family="Arial, Helvetica, sans-serif">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${a.bg[0]}"/><stop offset="1" stop-color="${a.bg[1]}"/></linearGradient></defs>
    <rect width="800" height="1000" fill="url(#g)"/>
    <circle cx="760" cy="900" r="260" fill="${a.accent}" opacity="0.16"/>
    <circle cx="90" cy="980" r="150" fill="${a.accent}" opacity="0.12"/>
    ${mast}
    <text x="64" y="290" font-size="30" font-weight="700" letter-spacing="6" fill="${a.accent}">MASTATINE PRESENTS</text>
    ${lines}
    <rect x="64" y="${400 + a.lines.length * 108 + 10}" width="120" height="8" rx="4" fill="${a.accent}"/>
    <text x="64" y="${400 + a.lines.length * 108 + 80}" font-size="38" fill="${a.ink}" opacity="0.92">${escapeXml(a.tagline)}</text>
    <text x="64" y="900" font-size="40" font-weight="800" fill="${a.accent}">${escapeXml(date)}</text>
    <text x="64" y="948" font-size="32" fill="${a.ink}" opacity="0.85">${escapeXml(a.location)}</text>
  </svg>`;
}

try {
  const committees = await sql`SELECT id, name FROM committees ORDER BY name`;
  if (committees.length === 0) throw new Error("No committees found. Create one in /admin/committees first.");
  await mkdir(uploadDir, { recursive: true });

  await sql`DELETE FROM activities WHERE name = ANY(${ACTIVITIES.map((a) => a.name)})`;

  for (const [i, a] of ACTIVITIES.entries()) {
    const start = evening(a.days);
    const filename = `seed-${a.slug}.webp`;
    await sharp(Buffer.from(posterSvg(a, start))).webp({ quality: 85 }).toFile(path.join(uploadDir, filename));

    await sql`
      INSERT INTO activities (committee_id, name, description, location, cost_cents, subscription_limit, starts_at, ends_at, is_visible, members_only, poster_url)
      VALUES (${committees[i % committees.length].id}, ${a.name}, ${`${a.tagline}. This is a generated example activity for local development.`}, ${a.location},
        ${a.cost || null}, ${a.limit}, ${start}, ${new Date(start.getTime() + 3 * HOUR)}, TRUE, ${Boolean(a.membersOnly)}, ${`/uploads/${filename}`})
    `;
    console.log(`${a.days < 0 ? "past    " : "upcoming"}  ${a.name}`);
  }
  console.log(`\nSeeded ${ACTIVITIES.length} activities with posters in ${uploadDir}`);
} finally {
  await sql.end();
}
