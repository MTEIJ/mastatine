import type { ReactNode } from "react";

/** Material 3 Expressive container shapes (see the shape masks in m3.css). */
export type ShapeName = "cookie4" | "cookie6" | "cookie9" | "clover4" | "flower";
/** Which colour role fills the shape. */
export type Tone = "primary" | "secondary" | "tertiary" | "neutral";

interface ShapeIconProps {
  shape: ShapeName;
  tone: Tone;
  size?: "md" | "lg";
  children: ReactNode;
}

/** An icon on an organic shape. The shape turns with a spring when its card is hovered or pressed; the icon stays upright. */
export default function ShapeIcon({ shape, tone, size = "md", children }: ShapeIconProps) {
  return (
    <span className={`shape-icon shape-icon--${size} tone-${tone}`} data-shape={shape}>
      <span className="shape-icon__bg" aria-hidden />
      <span className="shape-icon__glyph">{children}</span>
    </span>
  );
}
