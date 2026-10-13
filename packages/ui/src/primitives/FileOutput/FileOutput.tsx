"use client";
import React from "react";
import { cn } from "../../lib/cn";
import { Button } from "../Button/Button";
import { Progress } from "../Progress/Progress";
import { Spinner } from "../Spinner/Spinner";
import { Text } from "../Text";
import { Download, File, FileCode, FileImage, FileSpreadsheet, FileText, FileArchive, TriangleAlert, type LucideIcon } from "lucide-react";

export type FileOutputKind = "document" | "spreadsheet" | "image" | "code" | "archive" | "file";
export type FileOutputStatus = "generating" | "ready" | "error";

const ICONS: Record<FileOutputKind, LucideIcon> = {
  document: FileText,
  spreadsheet: FileSpreadsheet,
  image: FileImage,
  code: FileCode,
  archive: FileArchive,
  file: File,
};

export interface FileOutputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** File name with extension. */
  name: string;
  /** Icon family. Default "file". */
  kind?: FileOutputKind;
  /** generating: spinner or progress, ready: download, error. Default "ready". */
  status?: FileOutputStatus;
  /** Size or detail text, e.g. "1.8 MB". */
  meta?: string;
  /** 0-100. Shows a determinate bar while generating. */
  progress?: number;
  /** Download URL. Renders the action as a link. */
  href?: string;
  /** Download handler when there is no href. */
  onDownload?: () => void;
  /** Message shown when status="error". */
  error?: string;
  /** Label for the action. Default "Download". */
  actionLabel?: string;
}

/** A file the assistant produced: generating, ready to download, or failed. */
export function FileOutput({
  name,
  kind = "file",
  status = "ready",
  meta,
  progress,
  href,
  onDownload,
  error,
  actionLabel = "Download",
  className,
  ...props
}: FileOutputProps) {
  const Glyph = status === "error" ? TriangleAlert : ICONS[kind];
  const icon = <Download className="h-3.5 w-3.5" aria-hidden />;
  return (
    <div
      className={cn("flex w-full max-w-md items-center gap-3 rounded-[var(--radius-panel)] border bg-surface p-3", status === "error" ? "border-danger/30" : "border-hairline", className)}
      data-status={status}
      {...props}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-surface-hover", status === "error" ? "text-danger" : "text-fg-muted")}>
        <Glyph className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <Text as="p" size="sm" weight="medium" className="truncate">{name}</Text>
        {status === "generating" && progress != null ? (
          <Progress value={progress} aria-label={`Generating ${name}`} className="mt-1.5" />
        ) : (
          <Text as="p" size="xs" color="subtle" className="truncate">
            {status === "generating" ? "Generating…" : status === "error" ? error ?? "Could not create this file." : meta}
          </Text>
        )}
      </div>
      {status === "generating" && progress == null && <Spinner size="md" aria-label="Generating" />}
      {status === "ready" && (href ? (
        <Button asChild size="sm" variant="outline">
          <a href={href} download={name}>{icon}{actionLabel}</a>
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={onDownload} iconLeft={icon}>{actionLabel}</Button>
      ))}
    </div>
  );
}
