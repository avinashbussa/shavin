import type { Config } from "tailwindcss";

const tok = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

/**
 * Shared Tailwind preset for the Shavin design system. Consuming apps
 * (frontend, playground, future products) extend this via `presets: [preset]`
 * so every app resolves the same semantic color/font tokens defined in
 * `src/styles/global.css`. Never add raw hex/rgb values here — only wire up
 * new `--var` names that also exist in that CSS file.
 */
const preset = {
  darkMode: "class",
  content: [],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", '"Space Grotesk"', "sans-serif"],
        subheading: ["var(--font-subheading, var(--font-body))", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // semantic tokens (preferred) — see src/styles/global.css
        canvas: tok("bg-canvas"),
        surface: tok("bg-surface"),
        "surface-hover": tok("bg-surface-hover"),
        elevated: tok("bg-elevated"),
        hairline: tok("hairline"),
        "hairline-strong": tok("hairline-strong"),
        "border-control": tok("border-control"),
        fg: tok("fg"),
        "fg-muted": tok("fg-muted"),
        "fg-subtle": tok("fg-subtle"),
        accent: tok("accent"),
        "accent-hover": tok("accent-hover"),
        "accent-fg": tok("accent-fg"),
        "accent-contrast": tok("accent-contrast"),
        "accent-text": tok("accent-text"),
        "accent-subtle": "rgb(var(--accent) / 0.12)",
        "accent-subtle-hover": "rgb(var(--accent) / 0.18)",
        success: tok("success"),
        "success-fg": tok("success-fg"),
        warning: tok("warning"),
        "warning-fg": tok("warning-fg"),
        danger: tok("danger"),
        "danger-fg": tok("danger-fg"),
        link: tok("link"),
        tooltip: tok("bg-tooltip"),
        "tooltip-fg": tok("fg-tooltip"),
        // Internal code syntax utility tokens (for CodeBlock & syntax highlights)
        "code-keyword": tok("code-keyword"),
        "code-string": tok("code-string"),
        "code-num": tok("code-number"),
        "code-fn": tok("code-function"),
        "code-comment": tok("code-comment"),
        "code-punct": tok("code-punctuation"),
        "code-prop": tok("code-property"),
        "code-op": tok("code-operator"),
        "code-type": tok("code-type"),
        "code-tag": tok("code-tag"),
        "code-attr": tok("code-attr"),
      },
      boxShadow: {
        // Floating-surface elevation. Both resolve to CSS vars themed per
        // appearance in global.css — use `shadow-panel`/`shadow-modal`, never
        // an inline `shadow-[...rgba(...)]` literal.
        // Semantic roles (ride the elevation scale): card=resting,
        // panel=floating, modal=blocking. Prefer these over raw numbers.
        card: "var(--shadow-card)",
        panel: "var(--shadow-panel)",
        modal: "var(--shadow-modal)",
        // Radix-style 6-step elevation scale → shadow-1 … shadow-6.
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
        4: "var(--shadow-4)",
        5: "var(--shadow-5)",
        6: "var(--shadow-6)",
      },
      maxWidth: {
        // Extends Tailwind's default scale with an 88rem step (1408px) for
        // wide-page layouts. All consumer apps get this via the preset —
        // no manual config or arbitrary values needed.
        // Standard scale (unchanged): xs 20rem … 7xl 80rem.
        "8xl": "88rem",
      },
      borderRadius: {
        panel: "var(--radius-panel)",
        "panel-inner": "var(--radius-panel-inner)",
        "panel-p1": "max(min(var(--radius-lg), calc(var(--radius-panel) / 2)), calc(var(--radius-panel) - 0.25rem))",
        "panel-p2": "max(min(var(--radius-lg), calc(var(--radius-panel) / 2)), calc(var(--radius-panel) - 0.5rem))",
        "panel-p3": "max(min(var(--radius-lg), calc(var(--radius-panel) / 2)), calc(var(--radius-panel) - 0.75rem))",
        "panel-p4": "max(min(var(--radius-lg), calc(var(--radius-panel) / 2)), calc(var(--radius-panel) - 1rem))",
        "panel-p5": "max(min(var(--radius-lg), calc(var(--radius-panel) / 2)), calc(var(--radius-panel) - 1.25rem))",
        "panel-p6": "max(min(var(--radius-lg), calc(var(--radius-panel) / 2)), calc(var(--radius-panel) - 1.5rem))",
        "panel-p8": "max(min(var(--radius-lg), calc(var(--radius-panel) / 2)), calc(var(--radius-panel) - 2rem))",
      },
      // Motion foundation tokens — semantic animation utilities (.animate-*)
      // in global.css bundle these with durations & keyframes. Expose them here
      // so consumers can also use `ease-out`, `ease-in-out`, `ease-drawer` as
      // Tailwind transition-timing-function utilities instead of browser defaults.
      transitionTimingFunction: {
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
        drawer: "var(--ease-drawer)",
      },
      // Motion duration tokens — pair with ease-* above. Use `duration-*`
      // utilities (e.g. `duration-base`) instead of hardcoded ms values.
      // All collapse to 0ms under prefers-reduced-motion (see global.css).
      transitionDuration: {
        instant: "var(--dur-instant)",
        fast: "var(--dur-fast)",
        base: "var(--dur-base)",
        slow: "var(--dur-slow)",
        enter: "var(--dur-enter)",
      },
      // Entrance travel distances — used in entrance presets & parallax.
      // Collapse to 0px under reduced-motion so nothing shifts position.
      distance: {
        xs: "var(--dist-xs)",
        sm: "var(--dist-sm)",
        md: "var(--dist-md)",
        lg: "var(--dist-lg)",
      },
      // Stagger interval between sequentially revealed elements.
      stagger: {
        DEFAULT: "var(--stagger)",
      },
    },
  },
  plugins: [],
} satisfies Partial<Config>;

export default preset;
