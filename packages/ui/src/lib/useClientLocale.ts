"use client";
import { useEffect, useState } from "react";

/**
 * Locale for date text that is rendered on the server too (accessible names of
 * calendar days, for example). The server cannot know the reader's locale, so the
 * first render uses a fixed one and the browser's default takes over after mount;
 * that keeps hydration consistent. An explicit `locale` always wins.
 */
export function useClientLocale(locale?: string): string | undefined {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (locale) return locale;
  return mounted ? undefined : "en-US";
}
