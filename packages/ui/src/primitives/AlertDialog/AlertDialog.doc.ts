import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "AlertDialog",
  description: "Explicit destructive confirmation dialog requiring intentional user action. Built on Radix AlertDialog primitive without outside-click dismissal.",
  features: [
    "Intents: info, warning, success, danger, default",
    "Layouts: default (left-aligned), centered (hero icon visual tile)",
    "Traps focus on Cancel action by default for maximum accessibility safety",
    "Disables backdrop dismiss and ESC dismiss to force explicit user decision"
  ],
  accessibility: [
    "Focus defaults to Cancel button on open to prevent accidental destructive confirmation",
    "Omits outside-click and ESC key dismiss to enforce explicit decision contract",
    "Exposes role='alertdialog' with aria-labelledby and aria-describedby"
  ],
  keyboard: "Tab/Shift+Tab to navigate between Cancel and Confirm buttons",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use AlertDialog for irreversible destructive actions like deleting accounts or dropping database records."
      },
      {
        guidance: false,
        description: "Do not use AlertDialog for casual dismissible dialogs — use standard Dialog instead."
      }
    ]
  },
  examples: [
    {
      title: "Confirm a destructive action",
      description: "Keep the open state in the parent and open the dialog from a trigger.",
      code: `function DeleteProject() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="soft" tone="danger" onClick={() => setOpen(true)}>Delete project</Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete project?"
        description="This action cannot be undone."
        intent="danger"
        confirmLabel="Delete"
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}`,
    },
  ]
};
