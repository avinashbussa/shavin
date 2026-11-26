"use client";
import {
  cloneElement,
  isValidElement,
  use,
  useId,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Lock } from "lucide-react";
import { cn } from "../../lib/cn";
import { useFieldErrorAnnouncement } from "../../lib/useFieldErrorAnnouncement";
import { Select } from "../Select/Select";
import { Combobox } from "../Combobox/Combobox";
import { DatePicker } from "../DatePicker/DatePicker";
import { TimePicker, TimePickerInput } from "../TimePicker/TimePicker";
import { TextArea } from "../TextArea/TextArea";
import { Checkbox } from "../Checkbox/Checkbox";
import { Switch } from "../Switch/Switch";
import { RadioGroup } from "../RadioGroup/RadioGroup";
import { CheckboxGroup } from "../CheckboxGroup/CheckboxGroup";

export const formFieldVariants = cva("flex w-full gap-1.5", {
  variants: {
    orientation: {
      vertical: "flex-col",
      // Settings rows: label left, control right from md up; stacked below md.
      horizontal: "flex-col md:flex-row md:items-start md:justify-between md:gap-6",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

// Same label and message styles as TextField, so mixed forms look uniform.
const LABEL = "inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted";
const MESSAGE = "flex items-start gap-1 text-xs";

export interface FormFieldProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof formFieldVariants> {
  /** Visible label. Omit it for a single Checkbox or Switch that has its own `label`. Never use a placeholder as the label. */
  label?: string;
  /** Helper text below the control. Give the reason here when the field is disabled. */
  hint?: string;
  /** Error message: marks the control invalid (aria-invalid), replaces the hint, icon + text. */
  error?: string;
  /** `success` shows a check icon and the hint in the success colour ("Email verified"). Use sparingly. */
  status?: "default" | "success";
  /**
   * Default true (false for a single Checkbox or Switch, where required means "must be on").
   * Optional fields (false) show "Optional" after the label; required ones get no asterisk.
   */
  required?: boolean;
  /** Passes `disabled` to the control (and the fieldset for a group). Say why in `hint`. */
  disabled?: boolean;
  /** Only for TextArea (and TextField): focusable, selectable, submitted; shows a lock icon by the label. */
  readOnly?: boolean;
  /** Announce `error` (polite) once when it first appears. Default true. */
  announceError?: boolean;
  /** One size for every field in a row; passed to Select and Combobox, ignored by the others. */
  size?: "sm" | "md" | "lg";
  /** id for the control (default generated). Links the label and the FormErrorSummary item. */
  id?: string;
  /** Exactly one Shavin control: TextArea, Select, Combobox, DatePicker, TimePicker, Checkbox, Switch, RadioGroup or CheckboxGroup. */
  children: ReactElement;
}

const LAZY = Symbol.for("react.lazy");
type Lazy = { $$typeof: symbol; _payload: unknown; _init: (p: unknown) => unknown };
const isLazy = (x: unknown): x is Lazy => !!x && typeof x === "object" && (x as Lazy).$$typeof === LAZY;
const isThenable = (x: unknown): x is PromiseLike<unknown> => !!x && typeof (x as PromiseLike<unknown>).then === "function";

/**
 * Children passed from a Server Component arrive as lazy references (RSC chunks), and a client
 * component's `type` can be lazy until its module loads. Resolve both so the child can be
 * identified and cloned; `use` suspends until the chunk is ready, like React itself does.
 */
function resolveLazy<T>(node: unknown): T {
  let cur = node;
  for (let i = 0; i < 8 && isLazy(cur); i++) {
    cur = isThenable(cur._payload) ? use(cur._payload) : cur._init(cur._payload);
  }
  return cur as T;
}

const isDev = typeof process !== "undefined" && process.env?.NODE_ENV !== "production";

/**
 * FormField — label, hint and error for any Shavin control (TextField has its own; use it alone).
 * Creates the ids, renders `<label htmlFor>` (or `<fieldset><legend>` for RadioGroup and
 * CheckboxGroup) and injects `id`, `aria-describedby`, `aria-invalid`, `aria-required`,
 * `required`, `disabled` and `readOnly` into its single child with `cloneElement`.
 */
export function FormField({
  label,
  hint,
  error,
  status = "default",
  required: requiredProp,
  disabled,
  readOnly,
  announceError = true,
  size,
  orientation,
  id: customId,
  className,
  children,
  ...props
}: FormFieldProps) {
  const autoId = useId();
  const child = resolveLazy<ReactElement>(Array.isArray(children) && children.length === 1 ? children[0] : children);
  if (!isValidElement(child)) {
    throw new Error("[shavin] FormField needs exactly one Shavin control as its child (TextArea, Select, Combobox, DatePicker, TimePicker, Checkbox, Switch, RadioGroup or CheckboxGroup).");
  }
  const childProps = child.props as Record<string, unknown>;
  const controlId = customId ?? (childProps.id as string | undefined) ?? `${autoId}-control`;
  const labelId = `${autoId}-label`;
  const hintId = `${autoId}-hint`;
  const errorId = `${autoId}-error`;
  useFieldErrorAnnouncement(error, announceError);

  const type = resolveLazy<unknown>(child.type);
  const isGroup = type === RadioGroup || type === CheckboxGroup;
  const isToggle = type === Checkbox || type === Switch;
  const isSelectLike = type === Select || type === Combobox;
  const isPicker = type === DatePicker || type === TimePicker || type === TimePickerInput;
  const supportsReadOnly = type === TextArea;
  // Required by default, except a single Checkbox/Switch: there "required" means "must be on",
  // which is rarely meant, so it applies only when set explicitly.
  const required = requiredProp ?? !isToggle;

  if (isDev && label && isToggle && childProps.label) {
    console.warn(
      "[shavin] FormField: the child Checkbox/Switch has its own `label`, so the FormField `label` names it twice. " +
        "Fix: remove the FormField `label` and keep only hint/error.",
    );
  }

  const message = error ? errorId : hint ? hintId : undefined;
  const describedBy = [childProps["aria-describedby"] as string | undefined, message].filter(Boolean).join(" ") || undefined;

  const inject: Record<string, unknown> = { "aria-describedby": describedBy };
  if (!isGroup || type === RadioGroup) {
    if (!isGroup) inject.id = controlId;
    if (error) inject["aria-invalid"] = true;
    if (required && type !== Select) inject["aria-required"] = true;
  }
  if (required && !isPicker) inject.required = true;
  if (disabled !== undefined) inject.disabled = disabled;
  if (readOnly && supportsReadOnly) inject.readOnly = true;
  if (error && type === TextArea) inject.invalid = true;
  if (size && isSelectLike) inject.size = type === Combobox && size === "lg" ? "md" : size;
  if (label && (type === Select || isPicker || type === RadioGroup || type === Combobox)) inject["aria-labelledby"] = labelId;
  if (isGroup && type === RadioGroup && label) inject["aria-labelledby"] = labelId;

  const control = cloneElement(child as ReactElement<Record<string, unknown>>, inject);

  const optional = !required && !isToggle ? <span className="font-normal text-fg-subtle">Optional</span> : null;
  const lock = readOnly ? <Lock aria-hidden="true" className="h-3 w-3 text-fg-subtle" /> : null;

  const messageNode = error ? (
    <span id={errorId} className={cn(MESSAGE, "text-danger")}>
      <CircleAlert aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
      {error}
    </span>
  ) : hint ? (
    <span id={hintId} className={cn(MESSAGE, status === "success" ? "text-success" : "text-fg-subtle")}>
      {status === "success" && <CircleCheck aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />}
      {hint}
    </span>
  ) : null;

  const horizontal = orientation === "horizontal";

  if (isGroup) {
    return (
      <fieldset
        disabled={disabled}
        aria-describedby={message}
        className={cn("m-0 min-w-0 border-0 p-0", formFieldVariants({ orientation }), className)}
        {...(props as HTMLAttributes<HTMLFieldSetElement>)}
      >
        {label && (
          <legend id={labelId} className={cn(LABEL, "mb-1.5 p-0")}>
            {label}
            {optional}
          </legend>
        )}
        {control}
        {messageNode}
      </fieldset>
    );
  }

  const labelNode: ReactNode = label ? (
    <label id={labelId} htmlFor={controlId} className={LABEL}>
      {label}
      {optional}
      {lock}
    </label>
  ) : null;

  return (
    <div data-form-field="" className={cn(formFieldVariants({ orientation }), className)} {...props}>
      {horizontal ? (
        <>
          <div className="flex min-w-0 flex-col gap-1 md:max-w-[50%]">
            {labelNode}
            {messageNode}
          </div>
          <div className="shrink-0">{control}</div>
        </>
      ) : (
        <>
          {labelNode}
          {control}
          {messageNode}
        </>
      )}
    </div>
  );
}
