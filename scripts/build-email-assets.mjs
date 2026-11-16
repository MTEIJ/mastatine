// Builds the skyline banner used at the bottom of the email hero (public/email/skyline.png) from the primary sticker:
// the sun rising behind the masts, standing on the black "M.A. MASTATINE" band. The big lettering and the logo are cut out,
// so the banner joins the orange hero above it. Run: bun scripts/build-email-assets.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(root, "brand/stickers/primary/mastatine-sticker-85x55-preview.svg"), "utf8");

const svg = source
  .replace(/<path transform="translate\([^"]*\) scale\(0\.0443[^"]*\)"[^>]*\/>/g, "") // big MAS / ATINE lettering
  .replace(/<g transform="translate\(510 282\)[\s\S]*?<\/g>/, "") // logo mark
  // The sky is exactly the hero orange at the crop edge; fade the sun in from it so there is no hard seam.
  .replace(
    /(<circle cx="510" cy="282" r="240"[^>]*\/>)/,
    '$1<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f57f20"/><stop offset="1" stop-color="#f57f20" stop-opacity="0"/></linearGradient></defs><rect x="-24" y="330" width="1068" height="150" fill="url(#fade)"/>',
  )
  .replace(/viewBox="0 0 1020 660" width="85mm" height="55mm"/, 'viewBox="0 330 1020 330" width="1160" height="375"');

if (svg === source || !svg.includes('viewBox="0 330 1020 330"')) throw new Error("The sticker SVG changed shape; update this script.");

const out = path.join(root, "public/email");
await mkdir(out, { recursive: true });
await sharp(Buffer.from(svg), { density: 96 }).resize(1160).png({ compressionLevel: 9, palette: true }).toFile(path.join(out, "skyline.png"));
console.log("Wrote public/email/skyline.png");
