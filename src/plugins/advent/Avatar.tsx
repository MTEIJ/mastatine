import { initials, safePhoto, tokenHue, type Walker } from "./logic";
import { vars } from "./Landmarks";

/**
 * A player's face: their photo when they added one, otherwise their initials on a colour of their own. Used in the
 * list (.ac-token) and on the map (pawns and gravestones). The photo is a CSS background, so it needs no alt text: the
 * name is always next to it or in the title.
 */
export default function Avatar({ walker, className = "ac-token" }: { walker: Pick<Walker, "id" | "name" | "photo">; className?: string }) {
  const photo = safePhoto(walker.photo);
  return (
    <span className={className} style={vars(photo ? { "--hue": tokenHue(walker.id), "--photo": `url("${photo}")` } : { "--hue": tokenHue(walker.id) })} title={walker.name}>
      {photo ? null : initials(walker.name)}
    </span>
  );
}
