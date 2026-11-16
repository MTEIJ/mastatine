# M.A. Mastatine design language

Short reference so every sticker, shirt and page looks like it comes from the same place.

## Name

- **M.A. Mastatine** (short form: *Mastatine*). **M.A.** stands for **Master Association**.
- Write "Master Association" in full where there is room (footers, About, legal pages). Never "S.A.": that is the real
  S.A. Astatine, which this project parodies.

## Colour

| Role | Hex | Notes |
|---|---|---|
| Orange (brand) | `#f57f20` | electrons, tower, "M.A.", backgrounds |
| Ink | `#161616` | text, rings, masts, the name band |
| Cream | `#fff4e2` | the sun, cards, light surfaces |
| Coral red | `#e5432a` | horizon tint, thin accent lines, ribbons |
| Peach | `#ffb15a` | top of the sky gradient |

Retired: navy `#0f2254` (old merch and the current website theme; the site has not been restyled yet).
Sky gradient on the primary sticker: peach, then orange, then coral at the horizon.

## Logo

- The mark is an atom: two rings, seven electrons (astatine has seven valence electrons) and a lattice tower.
- The tower's top cross-arm is wider than the other arms (74 to 126 in logo units, 2.7 thick) so the top reads a little like
  a T. The tower stays orange. Skyline pylons keep the original narrow arm.
- On a light sun or light surface give the electrons an ink outline; never put white electrons on cream.
- Keep hairlines at or above about 0.27 mm in print (the build thickens the thin tower braces automatically).
- Files: `brand/logo/` (colour, mono, white).

## Lettering

- Display lettering is the **Astatine** typeface, always **converted to outlines** in artwork, so no font file is needed.
- The typeface was made for S.A. Astatine and is used with their permission. Say so: the credit is on the About page
  and in the site footer. Keep it there.
- The TTF is not stored in this repository (its licence is for promo use, not redistribution). Keep it in the shared
  drive and regenerate outlines from there.
- Astatine is hard to read at small sizes (the S, E, N, C and R are stylised). Use it only for big brand words such as
  MASTATINE, MAST and ENGINEER.
- Companion typeface for everything small or long (taglines, "Master Association", numbers, neck labels):
  **Barlow Condensed SemiBold** (SIL Open Font License), capitals with wide tracking (about 0.2 to 0.3 em). Like
  Astatine it is converted to outlines in artwork. The font is not stored in this repository.
- Body text on the website stays Lato.

## The lockup

- **MAS + logo + ATINE**: the mark stands in for the T, the way the real astatine sticker puts "At" in the middle.
- The mark is a ring and a tower, not a T, so people may read "MAS-ATINE". Whenever the lockup is the only wordmark,
  spell the name out nearby ("M.A. MASTATINE" in the black band, or under the lockup).
- Keep the logo centred on the sticker. Leave a small gap between the letters and the electrons.

## Motifs

- **Skyline**: pylons, guyed radio masts, a GSM pole and a TV tower in ink, standing on the band.
- **Sun**: a cream disc behind the logo.
- **Name band**: black band along the bottom with orange "M.A." and white "MASTATINE".
- Use at most one extra flourish at a time (rings, wires, stripes, dots).

## Print

- Stickers 85 x 55 mm, square corners, no cut line, 2 mm bleed, keep everything 2 mm inside the trim.
- Artwork is vector with all text as outlines. Colours are screen RGB: ask the printer for a proof and match orange
  `#f57f20` and the coral `#e5432a`.
- Files: `brand/stickers/primary/` (the main sticker), `brand/stickers/extras/` (postcard stamp, name tag,
  Mast of the Month, pixel world), `designs/` (merch: lockups and quotes).

## Parked ideas (not built)

- Hidden details: the seven electrons as binary 85 (`1010101`), Morse in the mast wires, microtext in a ring.
- Tilt reveal: spot gloss on matte, or stretched text that reads when tilted; lenticular or holographic foil if budget allows.
- Glow-in-the-dark sun, thermochromic sun, a message printed on the backing paper.

## Still open

- Restyle the website (navy and Lato to ink, orange, cream, coral) as its own step.
- Confirm the exact wording of the typeface credit with S.A. Astatine.
- The About page still says M.A. Mastatine is "not affiliated with, endorsed by or connected to" S.A. Astatine.
  Decide whether that still reads as true now that the board overlaps.
