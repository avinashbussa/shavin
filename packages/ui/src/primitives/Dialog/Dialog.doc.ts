import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Dialog",
  description:
    "Modal dialog on Radix Dialog: a titled panel with body and footer slots, focus trapping, Escape and backdrop dismiss, and entry/exit animation.",
  features: [
    "Open it from a trigger (`trigger`), control it (`open` + `onOpenChange`), or render it to show it (`onClose` fires after the exit animation)",
    "Sizes: sm (384px), md (448px), lg (672px)",
    "title and description accept any node; DialogClose closes it from a footer button",
    "layout: default (left title row + close button, hairlines), centered (centred title and description, no hairlines, footer centred) or bare (title above content, no header row). divided turns the hairlines on or off; footerAlign sets start/center/end/between/stretch",
    "Pick the layout from the moment: forms and settings use default; invites, success and confirmations use centered; pickers and composers that lead with their content use bare divided={false}",
    "dismissible={false} keeps backdrop clicks from closing it",
  ],
  accessibility: [
    "Radix Dialog: focus is trapped inside while open and returns to the trigger on close; the page behind is inert and does not scroll",
    "title names the dialog and description describes it (role=dialog, aria-labelledby, aria-describedby)",
    "The close button is labelled \"Close\"",
  ],
  keyboard: "Escape closes the dialog. Tab and Shift+Tab move focus within it.",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Give every dialog a clear title and one primary action in the footer.",
      },
      {
        guidance: true,
        description: "Build bigger flows (settings, profile, onboarding) by composing Dialog with Tabs, forms and Grid inside the body.",
      },
      {
        guidance: false,
        description: "Do not use Dialog for confirmations of destructive actions; use AlertDialog, which requires an explicit choice.",
      },
      {
        guidance: false,
        description: "Do not use Dialog for quick non-blocking notifications — reach for Toast instead.",
      },
    ],
  },
  examples: [
    {
      title: "Centered, no dividers",
      description: "For a short moment with one decision. Stretch the footer so the buttons fill the row.",
      code: `<Dialog
  open={open}
  onOpenChange={setOpen}
  layout="centered"
  title="Invite your team"
  description="Teammates get edit access to this workspace."
  footerAlign="stretch"
  footer={
    <>
      <Button variant="outline" onClick={() => setOpen(false)}>Not now</Button>
      <Button onClick={() => setOpen(false)}>Send invites</Button>
    </>
  }
/>`,
    },
    {
      title: "Bare form",
      description: "No header row or hairlines; the form leads, the footer sits below it.",
      code: `<Dialog open={open} onOpenChange={setOpen} layout="bare" size="md" title="New project" footer={<Button>Create</Button>}>
  <TextField label="Project name" />
</Dialog>`,
    },
    {
      title: "Opened from a trigger",
      code: `<Dialog
  trigger={<Button>Export data</Button>}
  title="Export data"
  description="Download every project as a CSV file."
  footer={
    <DialogClose asChild>
      <Button>Export</Button>
    </DialogClose>
  }
/>`,
    },
    {
      title: "Controlled",
      description: "Keep the open state yourself when something else needs to open or close the dialog.",
      code: `function RenameProject() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>Rename project</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="md"
        title="Rename project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        <TextField label="Project name" defaultValue="Website redesign" />
      </Dialog>
    </>
  );
}`,
    },
  ],
};
