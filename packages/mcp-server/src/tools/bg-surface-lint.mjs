/**
 * Warning-level rule for validate_code: a layout (Section, Box, Container, Flex, Grid, Card) whose `bgOverlays`
 * paints a mesh or custom gradient but sets no `surface`. The text then keeps the page's colour, which is
 * unreadable on a dark mesh with dark text, or a pastel mesh on a dark page. The tone of a mesh depends on the
 * page theme, so the library cannot pick for you: choose `surface="dark-always"` or `"light-always"`.
 *
 * Not flagged: photos, video and `fx:` backdrops (the layouts default them to dark-always with a scrim), and
 * `mesh-brand`, `fade-canvas` and `gradient-*`, which follow the theme.
 */
import { scanTags } from "./usage-check.mjs";

const LAYOUTS = new Set(["Section", "Box", "Container", "Flex", "Grid", "Card"]);
const FIXED_MESH = /(?:^|[\s,])mesh-(?:night|mint|dawn|lime|rose|rose-vibrant|peach)(?:-animated)?(?=[\s,/(]|$)/;
const CUSTOM_GRADIENT = /(?:^|[\s,])(?:linear|radial)\(|#[0-9a-fA-F]{3,8}\b/;

function lineOf(code, index) {
  let n = 1;
  for (let i = 0; i < index && i < code.length; i++) if (code.charCodeAt(i) === 10) n++;
  return n;
}

/** @returns {{ rule: string, message: string }[]} */
export function findBgSurfaceWarnings(code) {
  const out = [];
  for (const tag of scanTags(code, LAYOUTS)) {
    const attr = (n) => tag.attrs.find((a) => a.name === n);
    const overlays = attr("bgOverlays");
    if (!overlays || overlays.dynamic || typeof overlays.value !== "string") continue;
    if (attr("surface") || tag.spread) continue;
    if (attr("bgImage") || attr("bgVideo")) continue; // defaulted by the layout
    const v = overlays.value;
    if (/(?:^|[\s,])fx:/.test(v)) continue; // defaulted by the layout
    if (!FIXED_MESH.test(v) && !CUSTOM_GRADIENT.test(v)) continue;
    const idx = code.indexOf(`<${tag.name}`);
    out.push({
      rule: "bg-needs-surface",
      message: `<${tag.name} bgOverlays="${v}"> has no \`surface\`, so the text keeps the page colour and can be unreadable on this backdrop (dark mesh with dark text, pastel mesh on a dark page). Add surface="dark-always" for a dark backdrop or surface="light-always" for a pale one, then check the text contrast. mesh-brand, fade-canvas and gradient-* follow the theme and need none.${idx >= 0 ? ` (line ${lineOf(code, idx)})` : ""}`,
    });
  }
  return out;
}
