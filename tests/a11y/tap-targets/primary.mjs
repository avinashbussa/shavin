/**
 * The primary controls: the ones that grow to 44x44 under a coarse pointer (comfortable touch targets).
 * One list, shared by the tap-target suite (per primitive page) and the adherence scorer (any page, by DOM
 * role). Everything else is a secondary control and is held to the 24px WCAG 2.5.8 floor at every pointer.
 *
 * Secondary controls (24px by default; opt in with hitArea="touch" or the `hit-area-touch` class): Calendar
 * days, ColorPicker swatches, Rating stars, Pagination, menu rows, BottomNav, Carousel arrows, Link, Reasoning,
 * Sortable handle, Resizable handles.
 */

/** Page of the primitive (playground slug) -> selector of its controls that must reach 44px on touch. */
export const PRIMARY_BY_PAGE = {
  Button: "button",
  IconButton: "button",
  TextField: 'input:not([type="checkbox"]):not([type="radio"]), button',
  Switch: '[role="switch"]',
  Checkbox: '[role="checkbox"]',
  RadioGroup: '[role="radio"]',
  Tabs: '[role="tab"]',
  SegmentedControl: '[role="radio"]',
  Select: '[role="combobox"]',
  Sidebar: 'button[aria-label$="navigation"], button[aria-label$="sidebar"]',
  ThemeSwitcher: 'button, [role="switch"], [role="radio"]',
  CodeBlock: "button",
};

/** Containers whose controls are secondary even when they are buttons or radios. */
export const SECONDARY_CONTEXT = [
  '[role="grid"]', // Calendar days
  'nav[aria-label="Pagination"]',
  '[aria-roledescription="carousel"]',
  '[role="radiogroup"][aria-label="Colors"]', // ColorPicker swatches
  '[role="menu"]',
  '[role="listbox"]',
].join(", ");

/**
 * A page-agnostic selector for the primary controls, for pages that are not one primitive's page (the scorer).
 * Native `select` and non-checkbox inputs are included: they grow by min-height rather than a hit area.
 */
export const PRIMARY_SELECTOR = [
  "button",
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]):not([type="file"]):not([type="color"])',
  "select",
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="combobox"]',
].join(", ");
