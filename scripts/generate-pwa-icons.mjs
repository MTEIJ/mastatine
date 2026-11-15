// Renders the app icons in public/icons from public/favicon.svg. Run again after changing the logo: bun scripts/generate-pwa-icons.mjs
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile("public/favicon.svg", "utf8");
const OUT = "public/icons";

/** The logo centred on a white square; `scale` is the share of the edge the logo takes up. */
async function onWhite(size, scale, file) {
  const logo = await sharp(Buffer.from(svg), { density: 600 }).resize(Math.round(size * scale)).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#ffffff" } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`${OUT}/${file}`);
}

await onWhite(192, 0.84, "icon-192.png");
await onWhite(512, 0.84, "icon-512.png");
// Maskable: launchers crop to a circle or squircle, so the logo stays inside the central safe zone.
await onWhite(512, 0.62, "maskable-512.png");
await onWhite(180, 0.8, "apple-touch-icon.png");

// Android's status-bar badge only uses the alpha channel: a white silhouette on transparent.
const mono = svg.replace(/#1a1a1a|#f57f20/gi, "#ffffff");
await sharp(Buffer.from(mono), { density: 600 }).resize(96).png().toFile(`${OUT}/badge-96.png`);

console.log("Icons written to", OUT);
