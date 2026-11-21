import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module without types
import { findViewportShellPatterns } from "../../packages/mcp-server/src/tools/responsive-lint.mjs";

type Hit = { line: number; rule: string; message: string };
const rules = (src: string) => (findViewportShellPatterns(src) as Hit[]).map((h) => h.rule);

describe("responsive shell lint", () => {
  it("flags a sidebar hidden by viewport classes, on the Sidebar or its wrapper", () => {
    expect(rules('<Sidebar className="max-md:hidden"><SidebarBody /></Sidebar>')).toEqual(["viewport-sidebar"]);
    expect(rules('<Box className="hidden md:block">\n  <Sidebar><SidebarBody /></Sidebar>\n</Box>')).toEqual(["viewport-sidebar"]);
  });

  it("flags a second copy of the navigation in a Drawer", () => {
    expect(rules('<Sidebar /><Drawer open={open}><Sidebar><SidebarNavItem label="Home" /></Sidebar></Drawer>')).toContain("drawer-nav-copy");
  });

  it("flags matchMedia width checks and hand-made menu buttons next to a Sidebar", () => {
    expect(rules('<Sidebar />; window.matchMedia("(max-width: 767px)")')).toEqual(["matchmedia-shell"]);
    expect(rules('<Sidebar /><IconButton aria-label="Open menu" onClick={() => setNavOpen(true)} />')).toEqual(["manual-menu-button"]);
  });

  it("flags viewport show/hide inside an AppFrame and reports the line", () => {
    const src = '<AppFrame sidebar={<Sidebar />}>\n  <TopBar>\n    <Box className="md:hidden"><Logo /></Box>\n  </TopBar>\n</AppFrame>';
    const hits = findViewportShellPatterns(src) as Hit[];
    expect(hits.map((h) => [h.rule, h.line])).toEqual([["viewport-in-frame", 3]]);
  });

  it("flags Heading sizes stepped by viewport, but not a fixed size or the size prop", () => {
    expect(rules('<Heading as="h2" size="2xl" className="md:text-5xl">Title</Heading>')).toEqual(["viewport-heading-size"]);
    expect(rules('<Heading as="h1" size="5xl" className="text-6xl">Title</Heading>')).toEqual([]);
    expect(rules('<Heading as="h1" size="5xl">Title</Heading>')).toEqual([]);
  });

  it("leaves the intended patterns alone", () => {
    expect(rules('<AppFrame sidebar={<Sidebar />}><TopBar><SidebarTrigger /><Box className="shavin-frame-compact-only" /></TopBar></AppFrame>')).toEqual([]);
    // A marketing header's own menu button (no sidebar) is not this lint's business.
    expect(rules('<nav><IconButton aria-label="Open menu" className="md:hidden" /></nav>')).toEqual([]);
    // Table columns hidden on narrow screens are a content concern, not the shell's.
    expect(rules('<AppFrame sidebar={<Sidebar />}><TableCell className="max-md:hidden" /></AppFrame>')).toEqual([]);
    expect(rules('<Grid columns="auto" minWidth="sm" maxColumns="3" />')).toEqual([]);
  });
});
