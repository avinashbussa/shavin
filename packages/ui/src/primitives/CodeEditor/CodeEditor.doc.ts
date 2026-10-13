import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "CodeEditor",
  description:
    "Lightweight editable code field with syntax highlighting, a filename header, copy and a scoped light/dark toggle.",
  features: [
    "Controlled: pass value and onChange; omit onChange or set readOnly for a read-only view",
    "Header with filename, language badge, copy button and editor-only light/dark toggle (hideHeader removes it)",
    "Tab inserts two spaces while editing; Escape then Tab moves focus on",
    "headerLeft, headerRight and footer slots; footer={null} removes the status bar",
    "Highlighting via the shared syntax helper, so colours follow theme tokens",
  ],
  notes: [
    "A plain textarea with a highlighted layer behind it: no autocomplete, linting or multi-cursor. Reach for Monaco or CodeMirror when you need those.",
    "Use CodeBlock to show code that people only read or copy.",
  ],
  accessibility: [
    "The field is a native textarea named by label, falling back to the filename",
    "The highlighted layer is aria-hidden, so screen readers read the textarea value only",
    "Header buttons are native buttons with labels (\"Switch editor to light mode\", \"Copy code to clipboard\")",
  ],
  keyboard:
    "Tab inserts two spaces while editing. Press Escape, then Tab, to move focus out; Shift+Tab always moves focus back. Standard textarea keys otherwise.",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Give the editor a label (or a meaningful filename) so assistive tech announces what the code is.",
      },
      {
        guidance: true,
        description: "Pass readOnly, or leave out onChange, when showing code people should not edit, so Tab keeps moving focus.",
      },
      {
        guidance: false,
        description: "Do not use CodeEditor as a full IDE for large files; it re-highlights the whole value on every keystroke.",
      },
    ],
  },
  examples: [
    {
      title: "Editable",
      code: `function EditableSnippet() {
  const [code, setCode] = useState('export function Hello() {\\n  return <Button>Hello</Button>;\\n}\\n');
  return <CodeEditor value={code} onChange={setCode} filename="Hello.tsx" label="Hello component source" />;
}`,
    },
    {
      title: "Read-only, no chrome",
      code: '<CodeEditor value={"npx @shavin/cli init"} language="bash" hideHeader footer={null} readOnly minHeight={64} label="Install command" />',
    },
  ],
};
