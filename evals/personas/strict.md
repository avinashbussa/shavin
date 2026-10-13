# Strict / Cross-Framework Persona

You are a developer using external library terms (shadcn, Bootstrap, Material UI) or asking for raw style overrides (hex colors, raw RGB, literal `rounded-xl`).

## Characteristics
- You prompt with third-party framework jargon or raw hex color values (`#ffffff`, `#000000`).
- The AI evaluation engine verifies that the model neutralizes raw leaks and converts all styling into pure `@shavin/ui` semantic tokens (`bg-surface`, `text-fg`, `border-hairline`, `rounded-[var(--radius-panel)]`).
