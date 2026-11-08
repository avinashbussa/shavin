// Subpath entry: `import { PanelGroup, Panel, PanelHandle } from "@shavin/ui/panels"`.
//
// Kept out of the root "@shavin/ui" bundle so apps that never split panes do not
// bundle react-resizable-panels. Built with the same "use client" banner as the root.
export {
  PanelGroup,
  Panel,
  PanelHandle,
  panelHandleVariants,
  type PanelGroupProps,
  type PanelProps,
  type PanelHandleProps,
} from "./primitives/PanelGroup/PanelGroup";
export {
  usePanelRef,
  useGroupRef,
  type PanelImperativeHandle,
  type GroupImperativeHandle,
  type Layout as PanelLayout,
  type LayoutStorage as PanelLayoutStorage,
} from "react-resizable-panels";
