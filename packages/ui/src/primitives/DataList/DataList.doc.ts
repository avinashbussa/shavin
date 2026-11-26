import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "DataList",
  description: "Shows labelled values, such as the fields of a record, as a list of label and value pairs. Labels sit above the values or beside them.",
  features: [
    "Orientations: vertical (default stacked) and horizontal (inline justify-between rows)",
    "Semantic <dl> / <dt> / <dd> HTML structure",
    "Uses Text primitive with size='overline' for label formatting"
  ],
  accessibility: [
    "Native HTML5 description list accessibility semantics (<dl>, <dt>, <dd>)",
    "Clean screen reader association between definition terms and values"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use DataList for key-value property summaries in drawer inspectors, detail sidebars, or modal viewports."
      },
      {
        guidance: false,
        description: "Do not use plain <div> or <span> pairs when displaying key-value properties — reach for DataList."
      }
    ]
  },
  examples: [
    {
      title: "Vertical Property DataList",
      code: '<DataList orientation="vertical"><DataListItem label="Status">Active</DataListItem><DataListItem label="Role">Administrator</DataListItem></DataList>'
    }
  ]
};
