# Merch designs

Source files for print-on-demand products (Printify/Spreadshop), in the M.A. Mastatine design language
(see `../brand/GUIDE.md`). Each design has an `.svg` (vector source) and a `.png` (2400 x 2400, pre-rasterized, ready to
upload). Lettering is the Astatine typeface converted to outlines, so the SVGs need no fonts. Colours: orange
`#f57f20`, ink `#161616`, cream `#fff4e2`, coral `#e5432a`.

- `logo/` the brand lockup (MAS + logo + ATINE), in four forms:
  - `lockup-transparent.svg` / `.png` ink and orange, no background: for light garments and anything light.
  - `lockup-white-transparent.svg` / `.png` white and orange, no background: for dark garments.
  - `accent-block-orange.svg` / `.png` the lockup on a solid orange block, with a cream sun behind the logo.
  - `footer-band-ink.svg` / `.png` the lockup on a solid ink block (replaces the old navy band).
- `quotes/` four quote and joke designs on a transparent background so the garment colour shows through:
  Certified Mastende Engineer, Eat. Sleep. Masten. Repeat., I (heart) Masten, World's Okayest Mastatine Member.

## Regenerating PNGs

If an `.svg` changes, re-export its `.png` with any SVG rasterizer at 300 DPI (about 2400 px on a side). This repo has
`sharp` as a dependency, so from the project root:

```js
require("sharp")("designs/quotes/example.svg", { density: 300 })
  .resize(2400, 2400)
  .png()
  .toFile("designs/quotes/example.png");
```

Transparency is preserved automatically for files with no background rect.
