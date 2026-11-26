import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, ToastProvider } from "@shavin/ui";
import "./styles.css";

/**
 * Renders one authored block exactly as a consumer's page does: the block component alone, at the browser's own width,
 * inside the app providers. `?block=<file name>` picks it; no parameter lists them (window.__blocks). The responsive
 * block suite (tests/a11y/blocks-responsive.spec.ts) drives it at phone, tablet and desktop widths.
 */
const modules = import.meta.glob("../../packages/block-schema/blocks/**/*.tsx", { eager: true }) as Record<string, Record<string, unknown>>;

const blocks: Record<string, ComponentType> = {};
for (const [path, mod] of Object.entries(modules)) {
  const slug = path.split("/").pop()!.replace(/\.tsx$/, "");
  const component = Object.values(mod).find((v) => typeof v === "function" && /^[A-Z]/.test((v as { name?: string }).name ?? ""));
  if (component) blocks[slug] = component as ComponentType;
}
(window as unknown as { __blocks: string[] }).__blocks = Object.keys(blocks).sort();

document.documentElement.classList.remove("dark");

const root = createRoot(document.getElementById("root")!);
function show(slug: string | null) {
  const Block = slug ? blocks[slug] : null;
  root.render(
    <StrictMode>
      <ThemeProvider devTools={false}>
        <ToastProvider>{Block ? <Block key={slug} /> : <p>{Object.keys(blocks).length} blocks</p>}</ToastProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
// The suite swaps blocks in place (window.__show), which is much faster than a page load per block.
(window as unknown as { __show: typeof show }).__show = show;
show(new URLSearchParams(window.location.search).get("block"));
(window as unknown as { __ready: boolean }).__ready = true;
