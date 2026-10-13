import * as React from "react";
import { transform } from "sucrase";
import * as UI from "@shavin/ui";
import * as Lucide from "lucide-react";
import { createPortal } from "react-dom";
import { Button, Callout, Icon, Text } from "@shavin/ui";

/**
 * Renders an example's `code` string from a .doc.ts file. The code is
 * compiled in the browser with every @shavin/ui export, the Lucide icons and
 * the React hooks in scope. Only code from your own working tree runs here.
 */

const RESERVED = new Set(
  "await break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof let new null return super switch this throw true try typeof var void while with yield".split(" "),
);
// Lucide icons first, so a @shavin/ui export with the same name wins.
const SCOPE: Record<string, unknown> = Object.create(null);
for (const source of [Lucide, UI] as Record<string, unknown>[]) {
  for (const [k, v] of Object.entries(source)) {
    if (/^[A-Za-z_$][\w$]*$/.test(k) && !RESERVED.has(k)) SCOPE[k] = v;
  }
}
Object.assign(SCOPE, {
  React,
  Fragment: React.Fragment,
  useState: React.useState,
  useEffect: React.useEffect,
  useRef: React.useRef,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  useId: React.useId,
});

type Compiled =
  | { kind: "component"; Component: React.ComponentType }
  | { kind: "snippet"; reason: string }
  | { kind: "error"; message: string };

const cache = new Map<string, Compiled>();

function build(source: string): React.ComponentType {
  const js = transform(source, { transforms: ["jsx", "typescript"], jsxRuntime: "classic", production: true }).code;
  // Pass in only the names the example mentions; the full scope runs to thousands.
  const names = [...new Set(js.match(/[A-Za-z_$][\w$]*/g) ?? [])].filter((n) => n in SCOPE);
  if (!names.includes("React")) names.push("React");
  return new Function(...names, `${js}\nreturn __Example;`)(...names.map((n) => SCOPE[n]));
}

export function compileExample(code: string): Compiled {
  const hit = cache.get(code);
  if (hit) return hit;
  let result: Compiled;
  const src = code.trim();
  try {
    if (/^[<{]/.test(src)) {
      // JSX: one element or several siblings.
      result = { kind: "component", Component: build(`function __Example() { return (<>\n${code}\n</>); }`) };
    } else if (/^function\s+([A-Z]\w*)\s*\(/.test(src)) {
      // A whole component (`function DeleteProject() { … }`): render it.
      const name = src.match(/^function\s+([A-Z]\w*)/)![1];
      result = { kind: "component", Component: build(`${code}\nfunction __Example() { return <${name} />; }`) };
    } else if (/\breturn\b/.test(src)) {
      // A component body that ends in `return (...)`.
      result = { kind: "component", Component: build(`function __Example() {\n${code}\n}`) };
    } else {
      result = { kind: "snippet", reason: "This example is a code snippet, not JSX, so it is shown without a preview." };
    }
  } catch (e) {
    result = { kind: "error", message: (e as Error).message };
  }
  cache.set(code, result);
  return result;
}

class Boundary extends React.Component<
  { children: React.ReactNode; onError: (message: string) => void },
  { error: string | null }
> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message || String(e) };
  }
  componentDidCatch(e: Error) {
    this.props.onError(e.message || String(e));
  }
  render() {
    if (this.state.error) return <RenderError message={this.state.error} />;
    return this.props.children;
  }
}

function RenderError({ message }: { message: string }) {
  return (
    <Callout color="danger" title="This example does not render" className="w-full max-w-xl">
      <Text size="sm" className="font-mono break-words">{message}</Text>
    </Callout>
  );
}

export type ExampleStatus = "ok" | "snippet" | "error";

export function LiveExample({ code, onStatus }: { code: string; onStatus?: (s: ExampleStatus) => void }) {
  const compiled = compileExample(code);
  const [failedFor, setFailedFor] = React.useState<string | null>(null);
  const status: ExampleStatus = failedFor === code ? "error" : compiled.kind === "component" ? "ok" : compiled.kind;

  React.useEffect(() => {
    onStatus?.(status);
  }, [status, onStatus]);

  if (compiled.kind === "error") return <RenderError message={compiled.message} />;
  if (compiled.kind === "snippet") {
    return (
      <Text size="sm" color="subtle">
        {compiled.reason}
      </Text>
    );
  }
  const { Component } = compiled;
  const preview = (
    <Boundary key={code} onError={() => setFailedFor(code)}>
      <Component />
    </Boundary>
  );
  return OVERLAY.test(code) ? <OverlayGate>{preview}</OverlayGate> : preview;
}

/**
 * Modal surfaces (Dialog, Drawer, Spotlight …) are open as soon as they mount,
 * and their examples pass a no-op onClose. Mount them on demand instead, with
 * a way back out: the floating button or Escape.
 */
const OVERLAY = /\bonClose=\{|\bopen=\{true\}|\bopen[\s/>]/;

function OverlayGate({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  if (!open) {
    return (
      <Button variant="soft" size="sm" iconLeft={<Icon name="Maximize2" size="xs" />} onClick={() => setOpen(true)}>
        Open preview
      </Button>
    );
  }
  return (
    <>
      <Text size="sm" color="subtle">
        Preview open. Press Esc to close it.
      </Text>
      {children}
      {createPortal(
        <div className="fixed inset-x-0 top-4 z-[2147483647] flex justify-center pointer-events-none">
          <Button
            variant="solid"
            size="sm"
            className="pointer-events-auto shadow-panel"
            iconLeft={<Icon name="X" size="xs" />}
            onClick={() => setOpen(false)}
          >
            Close preview
          </Button>
        </div>,
        document.body,
      )}
    </>
  );
}
