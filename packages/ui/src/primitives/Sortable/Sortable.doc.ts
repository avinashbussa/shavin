import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Sortable",
  description: "A list users reorder by dragging items, or by keyboard with screen reader announcements. Items stack, sit in a row or form a grid.",
  features: [
    "Components: Sortable and SortableHandle",
    "Orientations: vertical (list), horizontal (strip), grid",
    "Zero external dnd-kit or react-beautiful-dnd runtime overhead",
    "Uses control radius --radius-lg for item drag targets"
  ],
  accessibility: [
    "Native HTML5 draggable attribute implementation",
    "Provides visual ring indicator when hovering over drop target"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Sortable for kanban card columns, dashboard widget re-ordering, and navigation list prioritization."
      },
      {
        guidance: false,
        description: "Do not use heavy third-party drag-and-drop packages when native HTML5 Sortable provides zero-bundle drag reordering."
      }
    ]
  },
  examples: [
    {
      title: "Task Priority List",
      code: '<Sortable items={["Task A", "Task B"]} getKey={(item) => item} onReorder={() => {}}>{(item) => <div className="p-2 border border-hairline"><SortableHandle /> {item}</div>}</Sortable>'
    }
  ]
};
