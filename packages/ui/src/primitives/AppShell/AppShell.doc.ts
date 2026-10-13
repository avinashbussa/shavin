import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "AppFrame",
  group: "layout",
  description: "Application shell: a Sidebar plus a main column. The frame measures its own width, so the same markup works on a phone, in a narrow window and in a Studio device preview. When it runs out of room the Sidebar becomes a slide-in drawer, written once, with no breakpoint classes, hamburger state or second copy of the navigation.",
  features: [
    "Wide: the Sidebar sits in flow exactly as written",
    "Compact (frame narrower than compactBelow: md 768px default, lg 1024px): the same Sidebar slides over the content as a drawer",
    "Container-driven, not viewport-driven: responds to the frame's own width, so it is correct inside previews, panels and embeds",
    "SidebarTrigger placed in the TopBar appears automatically (only) in compact mode and opens the drawer",
    "routeKey={pathname} closes the drawer on every route change; SidebarNavItem also closes it on click; custom controls can call useAppFrame().closeNav()",
    "Drawer behaviour: scrim, inert background, focus moves in and returns to the trigger, Escape closes, swipe left to close with the drawer following the finger",
    "A collapsed icon-rail Sidebar is shown in full inside the drawer",
    "Respects prefers-reduced-motion"
  ],
  accessibility: [
    "Native <aside> (Sidebar) and <main> landmarks",
    "In compact mode the navigation is a modal dialog (aria-modal, aria-label from navLabel) and is inert while closed, so off-screen links are never tabbable",
    "The page behind an open drawer is inert",
    "Trigger exposes aria-expanded and aria-controls"
  ],
  keyboard: "Tab to the menu trigger and press Enter/Space to open; focus moves into the navigation; Escape closes and returns focus to the trigger.",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Build app screens as <AppFrame sidebar={<Sidebar>…</Sidebar>}><TopBar><SidebarTrigger />…</TopBar>…</AppFrame>. Write the navigation once."
      },
      {
        guidance: true,
        description: "Pass routeKey={usePathname()} (or your router's equivalent) so the drawer closes after navigation. Put <SidebarTrigger /> in the TopBar. Do not hand-write hidden md:block / md:hidden wrappers, a hamburger IconButton, a navOpen state or a second Drawer copy of the navigation."
      },
      {
        guidance: true,
        description: "Inside the main column, size content with Grid columns=\"auto\" and Flex wrap so it reflows when the sidebar opens, collapses or becomes a drawer."
      },
      {
        guidance: true,
        description: "To show something only when the frame is compact (a logo in the TopBar while the sidebar is a drawer) use className=\"shavin-frame-compact-only\"; to hide it then (a breadcrumb parent), use \"shavin-frame-wide-only\". Both follow the frame width and compactBelow, never the window, so they stay right in a narrow panel or a Studio preview. Do not use md:hidden or hidden md:block inside an AppFrame."
      },
      {
        guidance: false,
        description: "Do not use AppFrame for marketing pages or simple single-column sites."
      }
    ]
  },
  examples: [
    {
      title: "Responsive application shell",
      description: "Resize the frame: below 768px wide the Sidebar becomes a drawer and the menu button appears.",
      code: `function Shell() {
  const [view, setView] = React.useState("overview");
  return (
    <div className="h-[420px] overflow-hidden rounded-[var(--radius-panel)] border border-hairline">
      <AppFrame
        className="h-full"
        sidebar={
          <Sidebar width="w-56">
            <SidebarHeader><Text as="span" weight="semibold">Acme</Text></SidebarHeader>
            <SidebarBody>
              <SidebarSection title="Workspace">
                <SidebarNavItem label="Overview" active={view === "overview"} onClick={() => setView("overview")} />
                <SidebarNavItem label="Reports" active={view === "reports"} onClick={() => setView("reports")} />
              </SidebarSection>
            </SidebarBody>
          </Sidebar>
        }
      >
        <TopBar className="gap-2"><SidebarTrigger /><Text as="span" weight="medium">{view}</Text></TopBar>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <Grid columns="auto" minWidth="sm" gap="3"><Card padding="md">One</Card><Card padding="md">Two</Card><Card padding="md">Three</Card></Grid>
        </div>
      </AppFrame>
    </div>
  );
}`
    }
  ]
};
