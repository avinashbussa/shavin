import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "FileOutput",
  description: "Card for a file an assistant produced: generating (spinner or progress), ready (download) or failed.",
  features: [
    "kind picks the icon: document, spreadsheet, image, code, archive, file",
    "status: generating (optional determinate progress), ready, error",
    "Download is a link when href is set, a button otherwise"
],
  accessibility: [
    "Progress has an aria-label naming the file",
    "Error state uses a warning icon and a text message"
],
  keyboard: "Tab to the download action.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Show the real file name and size once ready." },
      { guidance: false, description: "Do not use FileOutput for user uploads, use the Files list pattern for those." }
    ]
  },
  examples: [
    { title: "FileOutput example", code: "<FileOutput name=\"q3-summary.xlsx\" kind=\"spreadsheet\" meta=\"1.8 MB\" href=\"/files/q3-summary.xlsx\" />" }
  ]
};
