import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Backdrop",
  description: "A decorative background that fills its parent: soft mesh, aurora, grid or dots, all drawn from theme tokens. Free and static; for animated shaders see the FX pages.",
  features: [
    "Free variants: mesh, aurora, grid, dots. Colour follows the accent and the theme, so no hex values",
    "Unknown variant names fall back to mesh",
    "Pure CSS, no canvas, no motion, so it is safe under prefers-reduced-motion",
    "Fills the nearest positioned parent; keep real content above it with relative"
  ],
  accessibility: ["Decorative: aria-hidden, never receives pointer events", "Keep text contrast against the surface, not against the backdrop"],
  keyboard: "Not interactive.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Use one backdrop per screen, on a sign-in panel, hero or empty state." },
      { guidance: false, description: "Do not put a backdrop behind dense data such as tables or forms." }
    ]
  },
  examples: [
    { title: "Panel background", code: '<Box className="relative overflow-hidden"><Backdrop variant="mesh" /><Box className="relative">…</Box></Box>' }
  ]
};
