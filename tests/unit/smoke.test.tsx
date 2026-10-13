import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

// Import ONLY from the public barrel — the same surface a consuming app gets.
// This alone catches an export dropped from src/index.ts, a broken re-export,
// or a primitive that throws on a representative render.
import * as UI from "@shavin/ui";

const svg = <svg viewBox="0 0 24 24" aria-hidden="true" />;

// One representative, minimally-valid render per component. Compound pieces
// are mounted inside the parent context they require (Radix children throw
// without their Root). We assert "mounts without throwing", not exact markup.
const cases: Array<[string, () => ReactElement]> = [
  // Buttons
  ["Button", () => <UI.Button>Save</UI.Button>],
  ["IconButton", () => <UI.IconButton aria-label="Delete">{svg}</UI.IconButton>],

  // Overlays / modals (portaled — render open where the API allows)
  ["Dialog", () => <UI.Dialog title="Title" onClose={() => {}}>Body</UI.Dialog>],
  ["CloseButton", () => <UI.CloseButton onClose={() => {}} />],
  [
    "AlertDialog",
    () => (
      <UI.AlertDialog open onOpenChange={() => {}} title="Delete?" onConfirm={() => {}} />
    ),
  ],
  ["Menu", () => <UI.Menu trigger={<UI.MenuTrigger />}><UI.MenuItem>Item</UI.MenuItem></UI.Menu>],
  ["MenuTrigger", () => <UI.MenuTrigger aria-label="More" />],
  [
    "ContextMenu",
    () => (
      <UI.ContextMenu trigger={<div>right-click me</div>}>
        <UI.ContextMenuItem>Item</UI.ContextMenuItem>
      </UI.ContextMenu>
    ),
  ],
  [
    "Popover",
    () => (
      <UI.Popover defaultOpen>
        <UI.PopoverTrigger asChild>
          <button type="button">Open</button>
        </UI.PopoverTrigger>
        <UI.PopoverContent>Panel</UI.PopoverContent>
      </UI.Popover>
    ),
  ],
  [
    "HoverCard",
    () => (
      <UI.HoverCard defaultOpen>
        <UI.HoverCardTrigger asChild>
          <button type="button">Hover</button>
        </UI.HoverCardTrigger>
        <UI.HoverCardContent>Preview</UI.HoverCardContent>
      </UI.HoverCard>
    ),
  ],
  [
    "Tooltip",
    () => (
      <UI.Tooltip content="Tip">
        <button type="button">Trigger</button>
      </UI.Tooltip>
    ),
  ],
  ["ScrollArea", () => <UI.ScrollArea className="h-20">Content</UI.ScrollArea>],

  // Form controls
  [
    "Select",
    () => (
      <UI.Select
        value="a"
        onChange={() => {}}
        ariaLabel="Pick one"
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
      />
    ),
  ],
  [
    "Dropdown",
    () => (
      <UI.Dropdown
        value="a"
        onChange={() => {}}
        ariaLabel="Pick one"
        options={[{ value: "a", label: "Alpha" }]}
      />
    ),
  ],
  ["DatePicker", () => <UI.DatePicker value={new Date(2026, 0, 1)} onChange={() => {}} />],
  ["TimePicker", () => <UI.TimePicker value={new Date(2026, 0, 1, 9, 30)} onChange={() => {}} />],
  ["TimePickerInput", () => <UI.TimePickerInput value={new Date(2026, 0, 1, 9, 30)} onChange={() => {}} />],
  ["TimePickerClock", () => <UI.TimePickerClock value={new Date(2026, 0, 1, 9, 30)} onChange={() => {}} />],
  ["TextField", () => <UI.TextField aria-label="Name" />],
  ["TextArea", () => <UI.TextArea aria-label="Bio" />],
  ["Checkbox", () => <UI.Checkbox aria-label="Accept" />],
  [
    "CheckboxGroup",
    () => (
      <UI.CheckboxGroup>
        <UI.CheckboxGroupItem label="One" checked={false} onCheckedChange={() => {}} />
      </UI.CheckboxGroup>
    ),
  ],
  [
    "CheckboxCards",
    () => (
      <UI.CheckboxCards>
        <UI.CheckboxCardsItem checked={false} onCheckedChange={() => {}}>
          Card
        </UI.CheckboxCardsItem>
      </UI.CheckboxCards>
    ),
  ],
  [
    "RadioGroup",
    () => (
      <UI.RadioGroup aria-label="Choose" defaultValue="a">
        <UI.Radio value="a" label="Alpha" />
        <UI.Radio value="b" label="Beta" />
      </UI.RadioGroup>
    ),
  ],
  [
    "RadioCards",
    () => (
      <UI.RadioGroup variant="cards" aria-label="Choose" defaultValue="a">
        <UI.Radio value="a" label="Alpha" />
      </UI.RadioGroup>
    ),
  ],
  ["Switch", () => <UI.Switch aria-label="Toggle" />],
  ["Slider", () => <UI.Slider defaultValue={[50]} aria-label="Volume" />],
  [
    "SegmentedControl",
    () => (
      <UI.SegmentedControl defaultValue="a" aria-label="View">
        <UI.SegmentedControlItem value="a">A</UI.SegmentedControlItem>
        <UI.SegmentedControlItem value="b">B</UI.SegmentedControlItem>
      </UI.SegmentedControl>
    ),
  ],

  // Typography
  ["Heading", () => <UI.Heading>Heading</UI.Heading>],
  ["Text", () => <UI.Text>Text</UI.Text>],
  ["Em", () => <UI.Em>em</UI.Em>],
  ["Strong", () => <UI.Strong>strong</UI.Strong>],
  ["Quote", () => <UI.Quote>quote</UI.Quote>],
  ["Blockquote", () => <UI.Blockquote>blockquote</UI.Blockquote>],
  ["Code", () => <UI.Code>code</UI.Code>],
  ["Kbd", () => <UI.Kbd>⌘K</UI.Kbd>],
  ["Link", () => <UI.Link href="#">link</UI.Link>],

  // Data display
  ["Card", () => <UI.Card>Card</UI.Card>],
  [
    "CardList",
    () => (
      <UI.CardList>
        <UI.CardListItem>Row</UI.CardListItem>
      </UI.CardList>
    ),
  ],
  ["CardRow", () => <UI.CardRow label="Field">Value</UI.CardRow>],
  ["StatCard", () => <UI.StatCard label="Total" value="42" />],
  ["Badge", () => <UI.Badge>New</UI.Badge>],
  ["Callout", () => <UI.Callout>Note</UI.Callout>],
  ["Avatar", () => <UI.Avatar fallback="AB" />],
  ["Progress", () => <UI.Progress value={60} />],
  ["Spinner", () => <UI.Spinner />],
  ["Skeleton", () => <UI.Skeleton className="h-4 w-20" />],
  [
    "DataList",
    () => (
      <UI.DataList>
        <UI.DataListItem label="Label">Value</UI.DataListItem>
      </UI.DataList>
    ),
  ],
  [
    "List",
    () => (
      <UI.List>
        <UI.ListItem>Item</UI.ListItem>
      </UI.List>
    ),
  ],
  [
    "Table",
    () => (
      <UI.Table>
        <UI.TableHeader>
          <UI.TableRow>
            <UI.TableColumnHeaderCell>Name</UI.TableColumnHeaderCell>
          </UI.TableRow>
        </UI.TableHeader>
        <UI.TableBody>
          <UI.TableRow>
            <UI.TableCell>Cell</UI.TableCell>
          </UI.TableRow>
        </UI.TableBody>
      </UI.Table>
    ),
  ],
  ["Separator", () => <UI.Separator />],
  ["AspectRatio", () => <UI.AspectRatio ratio={16 / 9}><div /></UI.AspectRatio>],
  ["Inset", () => <UI.Inset>Inset</UI.Inset>],

  [
    "Tabs",
    () => (
      <UI.Tabs defaultValue="a">
        <UI.TabsList>
          <UI.TabsTrigger value="a">A</UI.TabsTrigger>
        </UI.TabsList>
        <UI.TabsContent value="a">Panel</UI.TabsContent>
      </UI.Tabs>
    ),
  ],
  ["TabsNav", () => <UI.Tabs as="navigation" items={[{ href: "#", label: "A", active: true }]} />],
  ["Row", () => <UI.Row>Row</UI.Row>],
  ["RowDragHandle", () => <UI.RowDragHandle />],
  ["ColorPicker", () => <UI.ColorPicker value="#46a758" onChange={() => {}} />],
  ["Pagination", () => <UI.Pagination page={1} totalPages={5} onPageChange={() => {}} />],
  [
    "Accordion",
    () => (
      <UI.Accordion type="single" collapsible defaultValue="a">
        <UI.AccordionItem value="a">
          <UI.AccordionTrigger>Title</UI.AccordionTrigger>
          <UI.AccordionContent>Content</UI.AccordionContent>
        </UI.AccordionItem>
      </UI.Accordion>
    ),
  ],

  // Layout / app chrome
  ["AppFrame", () => <UI.AppFrame sidebar={<div>nav</div>}>Main</UI.AppFrame>],
  ["TopBar", () => <UI.TopBar>Bar</UI.TopBar>],

  // Theme
  ["ThemeProvider", () => <UI.ThemeProvider accentColor="grass" />],
];

describe("smoke: every primitive renders without throwing", () => {
  it.each(cases)("%s mounts", (_name, renderComponent) => {
    const { unmount } = render(renderComponent());
    // Reaching here means React committed without throwing during render.
    expect(document.body).toBeTruthy();
    unmount();
  });
});

// Cheap contract on the export surface itself: guards against a rename or a
// dropped `export` in src/index.ts. Includes the compound children that only
// mount inside an open floating parent (Menu/ContextMenu have no `open` prop
// to force in a unit test), so they're covered here as presence checks.
describe("public export surface is intact", () => {
  const expectedExports = [
    "cn",
    "ThemeProvider",
    "Dialog",
    "CloseButton",
    "modalPanelVariants",
    "AlertDialog",
    "Menu",
    "MenuTrigger",
    "MenuItem",
    "ContextMenu",
    "ContextMenuItem",
    "Popover",
    "PopoverTrigger",
    "PopoverContent",
    "HoverCard",
    "HoverCardTrigger",
    "HoverCardContent",
    "Tooltip",
    "ScrollArea",
    "Select",
    "Dropdown",
    "DatePicker",
    "TimePicker",
    "TimePickerInput",
    "TimePickerClock",
    "TextField",
    "TextArea",
    "Checkbox",
    "CheckboxGroup",
    "CheckboxGroupItem",
    "CheckboxCards",
    "CheckboxCardsItem",
    "RadioGroup",
    "Radio",
    "Switch",
    "Slider",
    "SegmentedControl",
    "SegmentedControlItem",
    "Button",
    "IconButton",
    "Heading",
    "Text",
    "Em",
    "Strong",
    "Quote",
    "Blockquote",
    "Code",
    "Kbd",
    "Link",
    "Card",
    "CardList",
    "CardListItem",
    "CardRow",
    "StatCard",
    "Badge",
    "Callout",
    "Avatar",
    "Progress",
    "Spinner",
    "Skeleton",
    "DataList",
    "DataListItem",
    "List",
    "ListItem",
    "Table",
    "TableHeader",
    "TableBody",
    "TableRow",
    "TableColumnHeaderCell",
    "TableCell",
    "Separator",
    "AspectRatio",
    "Inset",
    "Tabs",
    "TabsList",
    "TabsTrigger",
    "TabsContent",
    "Row",
    "RowDragHandle",
    "AppFrame",
    "TopBar",
  ] as const;

  it.each(expectedExports)("exports %s", (name) => {
    expect(UI[name as keyof typeof UI]).toBeDefined();
  });
});
