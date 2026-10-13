"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { cn } from "../../lib/cn";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

export type ToastType = "default" | "success" | "error" | "warning" | "info" | "loading";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastItem {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  type?: ToastType;
  duration?: number;
  action?: { label: string; onClick: () => void };
  render?: React.ReactNode;
}

type ToastOptions = Omit<ToastItem, "id" | "title" | "type" | "render">;

interface ToastContextType {
  toast: (title: React.ReactNode, options?: ToastOptions) => string;
  success: (title: React.ReactNode, options?: ToastOptions) => string;
  error: (title: React.ReactNode, options?: ToastOptions) => string;
  warning: (title: React.ReactNode, options?: ToastOptions) => string;
  info: (title: React.ReactNode, options?: ToastOptions) => string;
  loading: (title: React.ReactNode, options?: ToastOptions) => string;
  custom: (render: React.ReactNode, options?: ToastOptions) => string;
  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: React.ReactNode;
      success: React.ReactNode | ((v: T) => React.ReactNode);
      error: React.ReactNode;
    },
  ) => Promise<T>;
  dismiss: (id?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

let counter = 0;
const nextId = () => `t${++counter}`;

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  /** Default auto-dismiss duration in milliseconds. */
  duration?: number;
}

export function ToastProvider({
  children,
  position = "bottom-right",
  duration = 4000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const upsert = useCallback((item: ToastItem) => {
    setToasts((prev) => {
      const i = prev.findIndex((t) => t.id === item.id);
      if (i === -1) return [...prev, item];
      const next = [...prev];
      next[i] = item;
      return next;
    });
  }, []);

  const dismiss = useCallback((id?: string) => {
    setToasts((prev) => (id ? prev.filter((t) => t.id !== id) : []));
  }, []);

  const make = useCallback(
    (type: ToastType) => (title: React.ReactNode, options?: ToastOptions) => {
      const id = nextId();
      upsert({ id, title, type, ...options });
      return id;
    },
    [upsert],
  );

  const promise = useCallback<ToastContextType["promise"]>(
    (p, msgs) => {
      const id = nextId();
      upsert({ id, title: msgs.loading, type: "loading", duration: Infinity });
      p.then(
        (v) =>
          upsert({
            id,
            title: typeof msgs.success === "function" ? msgs.success(v) : msgs.success,
            type: "success",
          }),
        () => upsert({ id, title: msgs.error, type: "error" }),
      );
      return p;
    },
    [upsert],
  );

  const value: ToastContextType = {
    toast: make("default"),
    success: make("success"),
    error: make("error"),
    warning: make("warning"),
    info: make("info"),
    loading: (title, options) => {
      const id = nextId();
      upsert({ id, title, type: "loading", duration: Infinity, ...options });
      return id;
    },
    custom: (render, options) => {
      const id = nextId();
      upsert({ id, render, type: "default", ...options });
      return id;
    },
    promise,
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onRemove={dismiss} position={position} defaultDuration={duration} />
    </ToastContext.Provider>
  );
}

const PEEK = 14;
const GAP = 14;
const MAX_VISIBLE = 3;
const SWIPE_DISMISS_PX = 80;

const CORNER: Record<ToastPosition, string> = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
};

function Toaster({
  toasts,
  onRemove,
  position,
  defaultDuration,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  position: ToastPosition;
  defaultDuration: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const isTop = position.startsWith("top");
  const ordered = [...toasts].reverse();

  const reportHeight = useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  const dir = isTop ? 1 : -1;

  return (
    <div
      className={cn("pointer-events-none fixed z-[100] w-[356px] max-w-[calc(100vw-2rem)]", CORNER[position])}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="relative h-0 w-full">
        {ordered.map((t, i) => {
          let cum = 0;
          for (let j = 0; j < i; j++) cum += (heights[ordered[j].id] ?? 64) + GAP;
          const ty = expanded ? dir * cum : dir * i * PEEK;
          const scale = expanded ? 1 : Math.max(1 - i * 0.05, 0.9);
          const hidden = !expanded && i >= MAX_VISIBLE;
          return (
            <ToastCard
              key={t.id}
              toast={t}
              onRemove={onRemove}
              reportHeight={reportHeight}
              isTop={isTop}
              anchor={position}
              translateY={ty}
              scale={scale}
              zIndex={ordered.length - i}
              hidden={hidden}
              autoClose={i === 0 && !expanded}
              defaultDuration={defaultDuration}
            />
          );
        })}
      </div>
    </div>
  );
}

const ICON: Record<ToastType, React.ReactNode> = {
  default: null,
  success: <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />,
  error: <AlertCircle className="h-4 w-4 shrink-0 text-danger" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />,
  info: <Info className="h-4 w-4 shrink-0 text-accent" />,
  loading: <Loader2 className="h-4 w-4 shrink-0 animate-spin text-fg-muted" />,
};

function ToastCard({
  toast,
  onRemove,
  reportHeight,
  isTop,
  translateY,
  scale,
  zIndex,
  hidden,
  autoClose,
  defaultDuration,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
  reportHeight: (id: string, h: number) => void;
  isTop: boolean;
  anchor: ToastPosition;
  translateY: number;
  scale: number;
  zIndex: number;
  hidden: boolean;
  autoClose: boolean;
  defaultDuration: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const removeRef = useRef(onRemove);
  removeRef.current = onRemove;
  const [enter, setEnter] = useState(false);
  const [swipe, setSwipe] = useState(0);
  const drag = useRef<{ startX: number; active: boolean } | null>(null);

  useLayoutEffect(() => {
    if (ref.current) reportHeight(toast.id, ref.current.offsetHeight);
  }, [toast.id, toast.title, toast.description, toast.render, reportHeight]);

  useEffect(() => {
    const id = setTimeout(() => setEnter(true), 20);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const d = toast.duration ?? defaultDuration;
    if (!autoClose || !Number.isFinite(d)) return;
    const timer = setTimeout(() => removeRef.current(toast.id), d);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, toast.type, autoClose, defaultDuration]);

  const dismissing = useRef(false);
  const dismiss = () => {
    if (dismissing.current) return;
    dismissing.current = true;
    removeRef.current(toast.id);
  };

  const enterY = isTop ? -20 : 20;
  const y = enter ? translateY : translateY + enterY;
  const edgeClass = isTop ? "top-0" : "bottom-0";
  const dragging = drag.current?.active;
  const icon = ICON[toast.type ?? "default"];

  return (
    <div
      ref={ref}
      role="status"
      style={{
        transform: `translateY(${y}px) translateX(${swipe}px) scale(${enter ? scale : 0.95})`,
        opacity: hidden ? 0 : enter ? 1 - Math.min(Math.abs(swipe) / 220, 0.8) : 0,
        zIndex,
        willChange: "transform, opacity",
        transition: dragging
          ? "none"
          : "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
      }}
      className={cn("pointer-events-auto absolute left-0 right-0 touch-none", edgeClass)}
      onPointerDown={(e) => {
        drag.current = { startX: e.clientX, active: true };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current?.active) return;
        setSwipe(e.clientX - drag.current.startX);
      }}
      onPointerUp={() => {
        const dx = swipe;
        drag.current = null;
        if (Math.abs(dx) > SWIPE_DISMISS_PX) dismiss();
        else setSwipe(0);
      }}
    >
      <div
        data-panel
        className="flex w-full items-start gap-3 rounded-[var(--radius-panel)] border border-hairline p-3.5 shadow-panel"
      >
        {toast.render ?? (
          <>
            {icon}
            <div className="min-w-0 flex-1">
              {toast.title && (
                <div className="text-sm font-medium leading-snug text-fg">{toast.title}</div>
              )}
              {toast.description && (
                <div className="mt-0.5 text-xs leading-relaxed text-fg-muted">{toast.description}</div>
              )}
            </div>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  dismiss();
                }}
                className="shrink-0 rounded-[var(--radius-lg)] border border-hairline px-2.5 py-1 text-xs font-medium text-fg transition hover:bg-surface-hover active:scale-[0.97]"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 rounded-[var(--radius-lg)] p-0.5 text-fg-muted transition hover:bg-surface-hover hover:text-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
