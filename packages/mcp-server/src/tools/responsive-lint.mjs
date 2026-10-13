/**
 * Responsive lint: hand-written viewport patterns that AppFrame, Grid
 * columns="auto", the frame visibility classes and fluid Heading sizes replace. Shared by
 * check_page({ targetDir }) and audit_source. Warnings only, and only where the
 * pattern is unambiguous, so a marketing header's own menu is left alone.
 */

// A JSX opening tag, allowing `=>` inside attribute expressions.
const TAG = String.raw`(?:=>|[^>])*`;
const lineOf = (src, index) => src.slice(0, index).split("\n").length;
const VIEWPORT_HIDE = /\b(?:max-(?:sm|md|lg):hidden|(?:sm|md|lg):hidden|hidden\s+(?:sm|md|lg):(?:block|flex|grid|inline-flex))\b/;

/** @returns {{ line: number, rule: string, message: string }[]} */
export function findViewportShellPatterns(src) {
  const out = [];
  const hasShell = /<(?:AppFrame|Sidebar)\b/.test(src);
  const inFrame = /<AppFrame\b/.test(src);

  // 1. A sidebar shown or hidden by viewport classes (on the Sidebar or a wrapper just around it).
  if (!inFrame) {
    const SIDEBAR_MSG = "Sidebar hidden or shown with viewport classes. Wrap the app in <AppFrame sidebar={<Sidebar>…</Sidebar>}> and put <SidebarTrigger /> in the TopBar; it becomes a drawer from the frame's own width.";
    for (const m of src.matchAll(new RegExp(String.raw`<Sidebar\b${TAG}>`, "g"))) {
      if (VIEWPORT_HIDE.test(m[0])) out.push({ line: lineOf(src, m.index), rule: "viewport-sidebar", message: SIDEBAR_MSG });
    }
    for (const m of src.matchAll(new RegExp(String.raw`<\w+\b${TAG}>\s*<Sidebar\b`, "g"))) {
      const wrapper = m[0].slice(0, m[0].lastIndexOf("<Sidebar"));
      if (VIEWPORT_HIDE.test(wrapper)) out.push({ line: lineOf(src, m.index), rule: "viewport-sidebar", message: SIDEBAR_MSG });
    }
  }

  // 2. A second copy of the navigation inside a Drawer.
  for (const m of src.matchAll(/<Drawer\b[\s\S]{0,2000}?<\/Drawer>/g)) {
    if (/<(?:Sidebar|SidebarNavItem|SidebarSection)\b/.test(m[0])) {
      out.push({ line: lineOf(src, m.index), rule: "drawer-nav-copy", message: "Navigation duplicated inside a <Drawer> for small screens. AppFrame turns the one Sidebar into the drawer; write the nav once." });
    }
  }

  // 3. JS viewport checks driving a shell.
  if (hasShell) {
    for (const m of src.matchAll(/matchMedia\(\s*["'`]\(\s*(?:max|min)-width/g)) {
      out.push({ line: lineOf(src, m.index), rule: "matchmedia-shell", message: "matchMedia width check next to a Sidebar. Use AppFrame (useAppFrame().compact if you need the state); it follows the frame, not the window." });
    }
  }

  // 4. A hand-made menu button in a sidebar layout.
  if (hasShell) {
    for (const m of src.matchAll(new RegExp(String.raw`<IconButton\b${TAG}>`, "g"))) {
      if (!/aria-label=["'][^"']*\b(?:menu|navigation)\b/i.test(m[0])) continue;
      if (VIEWPORT_HIDE.test(m[0]) || /onClick=\{\(\)\s*=>\s*set\w*(?:Open|Nav)\w*\(/.test(m[0])) {
        out.push({ line: lineOf(src, m.index), rule: "manual-menu-button", message: "Hand-made menu button for the sidebar. Use <SidebarTrigger /> inside AppFrame: it appears only when the frame is compact and opens the drawer." });
      }
    }
  }

  // 5. Viewport show/hide inside an AppFrame (wrong in a narrow panel or a Studio preview).
  if (inFrame) {
    const seen = new Set();
    for (const m of src.matchAll(/className=["'`]([^"'`]*)["'`]/g)) {
      const cls = m[1];
      // Shell show/hide pairs only; max-md:hidden on table columns is a content concern, not the shell's.
      if (!/(?<![\w-])(?:md|lg):hidden\b|\bhidden\s+(?:md|lg):(?:block|flex|grid|inline-flex)\b/.test(cls)) continue;
      const line = lineOf(src, m.index);
      if (seen.has(line)) continue;
      seen.add(line);
      out.push({ line, rule: "viewport-in-frame", message: `"${cls.trim()}" inside an AppFrame follows the window, not the frame. Use className="shavin-frame-compact-only" or "shavin-frame-wide-only".` });
    }
  }

  // 6. Heading sizes stepped by viewport. Display sizes are fluid already.
  for (const m of src.matchAll(new RegExp(String.raw`<Heading\b${TAG}>`, "g"))) {
    if (!/(?<![\w-])(?:sm|md|lg|xl|2xl):text-(?:base|lg|xl|[2-9]xl|\[)/.test(m[0])) continue;
    out.push({ line: lineOf(src, m.index), rule: "viewport-heading-size", message: 'Heading size stepped with sm:/md:/lg:text-* classes. Use size="4xl" or "5xl" (fluid: they grow with the container) or a smaller fixed size; a plain text-* class pins one size if it must not scale.' });
  }

  return out.sort((a, b) => a.line - b.line);
}
