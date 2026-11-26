import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ThemeProvider",
  description: "Global runtime design system theme provider mutating CSS variables on document root for brand colours, radius, and scaling.",
  features: [
    "Configures brand color palette, gray scale, radius preset, scaling, and fonts",
    "Applies CSS variable mutations globally on :root element",
    "Integrates preset themes (e.g. Editorial, Corporate, Modern)",
    "focusRing sets the keyboard focus ring weight for the page: subtle (default, 1px), default (2px) or strong (3px); ScopedThemeProvider takes the same prop and inherits when unset. Tune --focus-width / --focus-offset in CSS for anything else",
    "brandSolid chooses the fill under text on the brand (solid Button, Badge, selected states): \"accessible\" (default) darkens the brand just enough for white text at 4.6:1, \"exact\" keeps the exact brand fill, \"perceptual\" keeps it and picks text by APCA (not WCAG 2 AA on every brand)",
    "Can be used standalone or wrapping application root",
    "touchTargets: \"comfortable\" (default) grows primary controls to 44px on touch; \"compact\" keeps their size (the 24px WCAG 2.5.8 floor stays). Tune with --tap-min and --tap-min-touch",
    "ScopedThemeProvider touchTargets: unset inherits from the nearest parent provider (it is not an explicit \"comfortable\"), so a compact page keeps unset scoped islands compact; pass \"comfortable\" or \"compact\" to override"
  ],
  accessibility: [
    "Text and control-boundary colours meet WCAG 2.2 AA contrast (4.5:1 text, 3:1 UI) across dark and light themes",
    "Target size: meets WCAG 2.2 AA 2.5.8 (24px) at every pointer; 44px on touch is a comfortable default, not a claim",
    "Focus ring colour is the contrast-guaranteed brand text colour (at least 3:1 against page fills for any brand, WCAG 1.4.11) in every focusRing mode. WCAG 2.4.13 Focus Appearance (AAA) is not claimed for the subtle default; use focusRing=\"default\" or \"strong\" if you target it",
    "Brand text and the solid brand fill are contrast-guaranteed for any brand colour: --brand-text >= 4.6:1 on every page surface, --brand-fg >= 4.5:1 on --brand-solid and --brand-solid-hover (brandSolid=\"accessible\", the default)",
    "brandSolid=\"perceptual\" does not meet WCAG 2 AA on 14 of the 24 shipped brand colours; development builds log a one-time warning",
    "Overriding --brand-solid, --brand-solid-hover or --brand-fg in your own CSS bypasses the guarantee; keep --brand-fg at 4.5:1 or more on both fills (shavin doctor checks literal overrides)",
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Mount ThemeProvider once near application root to apply active theme presets."
      },
      {
        guidance: false,
        description: "Do not wrap individual small components in multiple nested ThemeProviders — tokens are global on document root."
      }
    ]
  },
  examples: [
    {
      title: "Keep the exact brand fill under button text",
      code: '<ThemeProvider brandColor="Blue" brandSolid="exact" />'
    },
    {
      title: "Root Theme Initialization",
      code: '<ThemeProvider brandColor="Monochrome" grayColor="Zinc" radius="large" scaling={100} panelBackground="solid" />'
    },
    {
      title: "Compact touch targets (dense product UI)",
      code: '<ThemeProvider touchTargets="compact" />'
    },
    {
      title: "Focus ring weight",
      description: "Thin 1px ring by default (focusRing=\"subtle\"); opt back into the 2px ring or go stronger.",
      code: '<ThemeProvider brandColor="Indigo" focusRing="default" />'
    }
  ]
};
