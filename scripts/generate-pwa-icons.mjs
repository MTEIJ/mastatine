// Draws the app icons (public/icons) and the favicon (public/favicon.svg) in the M.A. Mastatine design language.
// Run again after changing the artwork: bun scripts/generate-pwa-icons.mjs
//
// The mark is drawn bolder than the logo files in brand/logo: thicker rings, braces and electrons, so it still reads
// at 48 px on a home screen. Sky, sun and colours follow brand/GUIDE.md.
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const OUT = "public/icons";
const INK = "#161616";
const ORANGE = "#f57f20";
const CREAM = "#fff4e2";

// Tower lines in logo units (x1, y1, x2, y2, width). Heavier than the logo files so the tower survives small sizes.
const TOWER = [
  [100, 56, 100, 63, 6],
  [82, 68, 118, 68, 5],
  [95, 63, 92, 82, 5],
  [105, 63, 108, 82, 5],
  [95, 64, 108, 80, 3.4],
  [105, 64, 92, 80, 3.4],
  [83, 82, 117, 82, 5],
  [92, 82, 87, 118, 5],
  [108, 82, 113, 118, 5],
  [92, 84, 113, 112, 3.4],
  [108, 84, 87, 112, 3.4],
  [82, 118, 118, 118, 5],
  [87, 118, 82, 135, 5],
  [113, 118, 118, 135, 5],
  [77, 135, 123, 135, 6],
];

const ELECTRONS = Array.from({ length: 7 }, (_, i) => {
  const angle = ((-90 + (360 / 7) * i) * Math.PI) / 180;
  return [100 + 78 * Math.cos(angle), 100 + 78 * Math.sin(angle)];
});

const num = (n) => Number(n.toFixed(2));

const SKY_DEFS =
  `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="#ffb15a"/><stop offset=".55" stop-color="${ORANGE}"/><stop offset="1" stop-color="#e5432a"/>` +
  `</linearGradient></defs>`;

const towerLines = (color, boost = 1) =>
  TOWER.map(([x1, y1, x2, y2, w]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${num(w * boost)}" stroke-linecap="round"/>`).join("");

/** The mark in a 200 x 200 box; `colors` decides ring, electron fill, electron outline and tower. */
function mark({ ring, electron, electronOutline, tower, ringWidth = 5, electronRadius = 12, innerRing = true }) {
  const dots = ELECTRONS.map(
    ([x, y]) =>
      `<circle cx="${num(x)}" cy="${num(y)}" r="${electronRadius}" fill="${electron}"${electronOutline ? ` stroke="${electronOutline}" stroke-width="3"` : ""}/>`,
  ).join("");
  return (
    `<circle cx="100" cy="100" r="78" fill="none" stroke="${ring}" stroke-width="${ringWidth}"/>` +
    (innerRing ? `<circle cx="100" cy="100" r="52" fill="none" stroke="${ring}" stroke-width="${ringWidth}"/>` : "") +
    dots +
    towerLines(tower)
  );
}

/** Full-colour icon: sunset sky, cream sun, ink rings, orange electrons and tower. `radius` rounds the corners. */
function colourIcon({ radius = 0, logoScale = 1.95, sunRadius = 200 }) {
  const logo = `<g transform="translate(256 256) scale(${logoScale}) translate(-100 -100)">${mark({ ring: INK, electron: ORANGE, electronOutline: INK, tower: ORANGE })}</g>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">` +
    SKY_DEFS +
    `<rect width="512" height="512" rx="${radius}" fill="url(#sky)"/>` +
    `<circle cx="256" cy="256" r="${sunRadius}" fill="${CREAM}" fill-opacity=".96"/>` +
    logo +
    `</svg>\n`
  );
}

/** Favicon: only the tower, big and ink-coloured, on the sun; the rings would turn to mush at 16 px. */
function faviconIcon() {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">` +
    SKY_DEFS +
    `<rect width="512" height="512" rx="112" fill="url(#sky)"/>` +
    `<circle cx="256" cy="256" r="214" fill="${CREAM}" fill-opacity=".96"/>` +
    `<g transform="translate(256 256) scale(3.5) translate(-100 -95.5)">${towerLines(INK, 1.5)}</g>` +
    `</svg>
`
  );
}

/** Single-colour silhouette on transparent: Android's badge and themed icons only read the alpha channel. */
function silhouette(color) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">` +
    mark({ ring: color, electron: color, tower: color, ringWidth: 7, electronRadius: 13.5, innerRing: false }) +
    `</svg>\n`
  );
}

async function render(svg, size, file, { flatten = false } = {}) {
  let image = sharp(Buffer.from(svg), { density: 600 }).resize(size, size);
  if (flatten) image = image.flatten({ background: ORANGE });
  await image.png().toFile(`${OUT}/${file}`);
}

const rounded = colourIcon({ radius: 112 });
const fullBleed = colourIcon({ radius: 0 });
const maskable = colourIcon({ radius: 0, logoScale: 1.75, sunRadius: 180 }); // inside the 80% safe circle

await render(rounded, 192, "icon-192.png");
await render(rounded, 512, "icon-512.png");
await render(maskable, 512, "maskable-512.png");
await render(fullBleed, 180, "apple-touch-icon.png", { flatten: true }); // iOS rounds the corners itself and wants no alpha
await render(silhouette("#ffffff"), 96, "badge-96.png");
await render(silhouette("#000000"), 512, "monochrome-512.png");
await writeFile("public/favicon.svg", faviconIcon());

console.log("Icons written to", OUT, "and public/favicon.svg");
