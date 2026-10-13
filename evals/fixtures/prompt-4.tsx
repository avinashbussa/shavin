// Fixture: prompt-4 — dirty code with common AI agent issues
// This fixture intentionally has violations for the evaluator to catch:
// - hex color leak
// - raw Tailwind color scale
// - literal radius
// - glyph instead of <Icon>
// - raw HTML <p> instead of <Text>

import { Callout, IconButton } from "@shavin/ui";

export function ServerStatusBanner() {
  return (
    <div className="bg-amber-50 rounded-lg p-4 border border-[#fbbf24]">
      <p className="text-sm text-amber-900">
        ✓ Maintenance scheduled for 02:00 UTC
      </p>
      <IconButton variant="ghost" size="sm" aria-label="Dismiss">
        ✕
      </IconButton>
    </div>
  );
}
