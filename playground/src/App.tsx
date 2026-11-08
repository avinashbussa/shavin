import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Icon, Separator, Sidebar, TextField } from "@shavin/ui";
import { CATEGORY_ORDER, loadPrimitives, passing, required } from "./data";
import { Overview } from "./pages/Overview";
import { PrimitivePage } from "./pages/PrimitivePage";
import { MotionPlayground } from "./pages/MotionPlayground";
import { Wordmark } from "./Wordmark";

/** Hash routes: #/ (overview) and #/<Folder> (one primitive). No router needed. */
function useRoute() {
  const read = () => decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

// Same class string as the docs sidebar headings.
const sectionLabelCls = "px-2 pt-2 pb-1 text-[10px] font-normal uppercase tracking-[0.1em] text-fg-subtle";

export function App() {
  const primitives = loadPrimitives();
  const route = useRoute();
  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const current = primitives.find((p) => p.slug === route);
  const isMotion = route === "motion";

  useEffect(() => {
    document.title = isMotion ? "Motion | Shavin Playground" : current ? `${current.name} | Shavin Playground` : "Shavin Playground";
    document.getElementById("main")?.scrollTo({ top: 0 });
    setMobileNav(false);
  }, [route, current?.name]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = primitives.filter((p) => !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    return CATEGORY_ORDER.map((cat) => ({ cat, items: hits.filter((p) => p.category === cat) })).filter((g) => g.items.length);
  }, [primitives, query]);

  const linkCls = (active: boolean) =>
    `flex items-center justify-between gap-2 truncate rounded-[var(--radius-lg)] px-2 py-1 my-0.5 text-sm transition ${
      active ? "bg-surface-hover font-semibold text-fg" : "text-fg-muted hover:bg-surface-hover hover:text-fg"
    }`;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center shrink-0 border-b border-hairline bg-surface/80 backdrop-blur-md px-3 sm:px-4 md:px-5 h-14 w-full fixed top-0 left-0 right-0 z-50">
        <div className="flex flex-1 items-center justify-start gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-hairline text-fg-muted transition hover:bg-surface-hover md:hidden cursor-pointer"
          >
            <Icon name="Menu" size="sm" />
          </button>
          <a href="#/" title="Shavin | Playground" className="flex items-center gap-2.5 transition opacity-95 hover:opacity-100 shrink-0">
            <Wordmark className="h-6 sm:h-7 w-auto text-fg shrink-0" />
            <div className="flex items-center gap-1.5 border-l border-hairline pl-2">
              <span className="text-xs sm:text-sm font-medium text-fg-muted tracking-tight">Playground</span>
            </div>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2 min-w-0">
          <span className="hidden sm:inline text-xs text-fg-subtle">Local preview of your working tree</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 relative">
        {mobileNav && (
          <div className="fixed inset-0 z-40 bg-canvas/70 backdrop-blur-xs md:hidden" onClick={() => setMobileNav(false)} aria-hidden />
        )}
        <Sidebar
          side="left"
          className={`pg-scroll fixed inset-y-0 left-0 top-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-r border-hairline bg-surface p-3 transition-transform duration-300 md:static md:top-0 md:z-auto md:w-56 md:shrink-0 md:translate-x-0 md:pt-[68px] ${
            mobileNav ? "translate-x-0 shadow-panel" : "-translate-x-full"
          }`}
        >
          {/* One wrapper so the aside's flex column never squashes the links. */}
          <nav aria-label="Primitives" className="shrink-0">
            <div className="px-1 pb-2">
              <TextField
                size="sm"
                placeholder="Filter primitives"
                aria-label="Filter primitives"
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                leadingIcon={<Icon name="Search" size="xs" />}
              />
            </div>
            <a href="#/" className={linkCls(!current && !isMotion)}>
              Overview
            </a>
            <a href="#/motion" className={linkCls(isMotion)}>
              Motion
            </a>
            {groups.map((g) => (
              <div key={g.cat} className="my-0.5">
                <Separator className="my-1.5" />
                <div className={sectionLabelCls}>{g.cat}</div>
                {g.items.map((p) => {
                  const todo = required(p).length - passing(p);
                  return (
                    <a key={p.slug} href={`#/${p.slug}`} className={linkCls(p.slug === route)} title={p.name}>
                      <span className="truncate">{p.name}</span>
                      {todo > 0 && (
                        <span className="shrink-0 text-[10px] tabular-nums text-warning" title={`${todo} doc check(s) to fix`}>
                          {todo}
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            ))}
          </nav>
        </Sidebar>

        <main id="main" className="pg-scroll min-w-0 flex-1 overflow-y-auto bg-canvas pt-14">
          {current ? (
            <PrimitivePage key={current.slug} primitive={current} />
          ) : isMotion ? (
            <MotionPlayground />
          ) : (
            <Overview primitives={primitives} missing={route || null} />
          )}
        </main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("shavin-appearance", next ? "dark" : "light");
    } catch {
      // storage unavailable — the toggle still works for this visit
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-hairline text-fg-muted transition hover:bg-surface-hover hover:text-fg hover:border-hairline-strong cursor-pointer"
    >
      <Icon name={dark ? "Sun" : "Moon"} size="sm" className="text-fg" />
    </button>
  );
}
