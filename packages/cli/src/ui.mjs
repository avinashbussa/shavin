/**
 * @shavin/cli — Unified Typography, Color & Glyph System
 * Zero-dependency TrueColor (24-bit RGB) & ANSI formatting with boxed option pickers,
 * IDE code syntax highlighting, sequential step fading, full 4-sided boxed cards, and strictly typographic glyphs.
 */

// Shavin Brand TrueColor Palette (Lighter Luminance Hot Pink / Rose & Subtle Hairline Borders)
export const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",

  // Core Brand Colors (Lighter Luminance TrueColor)
  brand: "\x1b[38;2;253;164;175m",        // Lighter Luminous Rose / Pink-300 (#fda4af)
  brandLight: "\x1b[38;2;254;205;211m",   // Pastel Rose Light (#fecdd3)
  brandMuted: "\x1b[38;2;225;29;72m",     // Medium Rose Accent (#e11d48)
  
  // Subtle Hairline Borders (Subtler than subtle text)
  border: "\x1b[38;2;63;63;70m",          // Hairline Zinc Border (#3f3f46)
  borderActive: "\x1b[38;2;113;113;122m", // Zinc-500
  
  // Semantic System Colors
  fg: "\x1b[38;2;250;250;250m",           // Pure White / Zinc-50
  fgSubtle: "\x1b[38;2;161;161;170m",     // Zinc-400 (Subtle copy)
  fgMuted: "\x1b[38;2;100;100;110m",      // Zinc-500 (Dim / Past steps)
  
  // Lighter Luminance Semantic Colors
  success: "\x1b[38;2;134;239;172m",     // Lighter Luminous Emerald-300 (#86efac)
  warning: "\x1b[38;2;253;224;71m",       // Lighter Luminous Yellow-300 (#fde047)
  error: "\x1b[38;2;252;165;165m",        // Lighter Crimson-300 (#fca5a5)
  info: "\x1b[38;2;147;197;253m",         // Soft Sky Blue (#93c5fd)
  
  // IDE Syntax Highlighting Colors
  synKeyword: "\x1b[38;2;197;134;192m",   // VS Code Purple (#c586c0)
  synComponent: "\x1b[38;2;78;201;176m",  // VS Code Teal/Cyan (#4ec9b0)
  synString: "\x1b[38;2;206;145;120m",    // VS Code Orange/Terracotta (#ce9178)
  synPunctuation: "\x1b[38;2;140;140;145m",
};

/**
 * Remove ANSI escape sequences to compute exact visual character width
 */
export function stripAnsi(str = "") {
  return String(str).replace(/\x1b\[[0-9;]*m/g, "").replace(/\x1b\][^\x07]*\x07/g, "");
}

/**
 * Pad string visually taking ANSI color codes into account
 */
export function padEndVisible(str = "", targetLength = 0) {
  const visibleLen = stripAnsi(str).length;
  const paddingNeeded = Math.max(0, targetLength - visibleLen);
  return str + " ".repeat(paddingNeeded);
}

// Typographic Glyphs (No Emojis)
export const g = {
  brand: "▲",
  section: "◆",
  stepActive: "›",
  stepDone: "✔",
  stepFail: "✖",
  stepWarn: "▲",
  bullet: "·",
  arrow: "→",
  lineH: "─",
  lineV: "│",
  cornerTL: "╭",
  cornerTR: "╮",
  cornerBL: "╰",
  cornerBR: "╯",
  crossL: "├",
  crossR: "┤",
  asterisk: "∗",
};

// Formatted Semantic Helpers
export const fmt = {
  brand: (text) => `${c.bold}${c.brand}${text}${c.reset}`,
  title: (text) => `${c.bold}${c.fg}${text}${c.reset}`,
  subtle: (text) => `${c.fgSubtle}${text}${c.reset}`,
  muted: (text) => `${c.fgMuted}${text}${c.reset}`,
  code: (text) => `${c.brand}${text}${c.reset}`,
  
  badge: (text, color = c.brand) => `${color}[${text}]${c.reset}`,
  tag: (text) => `${c.fgMuted}[${text}]${c.reset}`,
  
  // Quality Report / Pass mark: Asterisk is green, text is standard fg
  pass: (text) => `${c.success}∗${c.reset} ${c.fg}${text}${c.reset}`,
  fail: (text) => `${c.error}✖${c.reset} ${c.fg}${text}${c.reset}`,
  warn: (text) => `${c.warning}▲${c.reset} ${c.fg}${text}${c.reset}`,

  success: (text) => `${c.success}${g.stepDone}${c.reset} ${c.fg}${text}${c.reset}`,
  error: (text) => `${c.error}${g.stepFail}${c.reset} ${c.fg}${text}${c.reset}`,
  warning: (text) => `${c.warning}${g.stepWarn}${c.reset} ${c.fg}${text}${c.reset}`,
  info: (text) => `${c.info}ℹ${c.reset} ${c.fg}${text}${c.reset}`,

  // IDE Syntax Highlighted TSX Import
  importTsx: (componentName, importPath) => {
    return (
      `${c.synKeyword}import${c.reset} ${c.synPunctuation}{${c.reset} ` +
      `${c.bold}${c.synComponent}${componentName}${c.reset} ` +
      `${c.synPunctuation}}${c.reset} ` +
      `${c.synKeyword}from${c.reset} ` +
      `${c.synString}"@/${importPath}"${c.reset}${c.synPunctuation};${c.reset}`
    );
  },
};

/**
 * Branded Header Banner (4-sided boxed)
 */
export function printBanner(title = "@shavin/ui", subtitle = "UI Primitives, Block Registry & Agent Ecosystem", width = 78) {
  const top = g.lineH.repeat(width - 2);
  const titleLine = `  ${c.bold}${c.brand}${g.brand} ${title}${c.reset}  ${c.fgMuted}${g.bullet}  ${subtitle}${c.reset}`;
  const innerWidth = width - 2;

  console.log(`\n\n${c.border}${g.cornerTL}${top}${g.cornerTR}${c.reset}`);
  console.log(`${c.border}${g.lineV}${c.reset}${padEndVisible(titleLine, innerWidth)}${c.border}${g.lineV}${c.reset}`);
  console.log(`${c.border}${g.cornerBL}${top}${g.cornerBR}${c.reset}\n`);
}

/**
 * Standard Full 4-Sided Structured Card with Generous Internal Breathing Room & Auto-Fitting Width
 */
export function printCard({ title, items = [], footer = null, border = c.border, width = 78 }) {
  // Collect all lines to determine precise needed width
  const sampleLines = [];
  if (title) sampleLines.push(` ▲ ${title} `);
  for (const item of items) {
    if (typeof item === "string") {
      sampleLines.push(item);
    } else if (item && item.label) {
      sampleLines.push(`${item.label.padEnd(20)} ${item.value}`);
    } else if (item && item.sectionTitle) {
      sampleLines.push(`◆ ${item.sectionTitle}`);
    }
  }
  if (footer) {
    for (const fl of footer.split("\n")) {
      sampleLines.push(fl);
    }
  }

  const maxLen = sampleLines.reduce((acc, l) => Math.max(acc, stripAnsi(l).length), 0);
  const cardWidth = Math.max(width, maxLen + 6);
  const innerWidth = cardWidth - 6;

  // Top border with optional embedded title
  if (title) {
    const titleVisual = ` ${title} `;
    const titleLen = stripAnsi(titleVisual).length;
    const remaining = Math.max(0, cardWidth - 3 - titleLen);
    console.log(`\n\n${border}${g.cornerTL}${g.lineH}${c.reset}${titleVisual}${border}${g.lineH.repeat(remaining)}${g.cornerTR}${c.reset}`);
  } else {
    console.log(`\n\n${border}${g.cornerTL}${g.lineH.repeat(cardWidth - 2)}${g.cornerTR}${c.reset}`);
  }

  // Top empty row inside card
  console.log(`${border}${g.lineV}${c.reset}${" ".repeat(cardWidth - 2)}${border}${g.lineV}${c.reset}`);

  // Helper to wrap any line into a full boxed row
  const printRow = (content = "") => {
    console.log(`${border}${g.lineV}${c.reset}  ${padEndVisible(content, innerWidth)}  ${border}${g.lineV}${c.reset}`);
  };

  const printDivider = () => {
    console.log(`${border}${g.lineV}${c.reset}${" ".repeat(cardWidth - 2)}${border}${g.lineV}${c.reset}`);
    console.log(`${border}${g.crossL}${g.lineH.repeat(cardWidth - 2)}${g.crossR}${c.reset}`);
    console.log(`${border}${g.lineV}${c.reset}${" ".repeat(cardWidth - 2)}${border}${g.lineV}${c.reset}`);
  };

  // Render items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item && item.separator) {
      printDivider();
    } else if (item && item.sectionTitle) {
      if (i > 0 && !items[i - 1]?.separator) {
        printDivider();
      }
      printRow(`${c.brand}${g.section}${c.reset} ${c.bold}${c.fg}${item.sectionTitle}${c.reset}`);
    } else if (typeof item === "string") {
      printRow(item);
      const clean = stripAnsi(item).trim();
      if (clean.startsWith("#")) {
        printRow(""); // Extra empty line space after comments starting with #
      }
    } else if (item && item.label) {
      const labelFormatted = `${c.fgSubtle}${item.label.padEnd(20)}${c.reset}`;
      printRow(`${labelFormatted} ${item.value}`);
    }
  }

  // Bottom empty row before footer / end
  console.log(`${border}${g.lineV}${c.reset}${" ".repeat(cardWidth - 2)}${border}${g.lineV}${c.reset}`);

  // Footer section if provided
  if (footer) {
    console.log(`${border}${g.crossL}${g.lineH.repeat(cardWidth - 2)}${g.crossR}${c.reset}`);
    console.log(`${border}${g.lineV}${c.reset}${" ".repeat(cardWidth - 2)}${border}${g.lineV}${c.reset}`);
    
    const footerLines = footer.split("\n");
    for (const fl of footerLines) {
      printRow(fl);
    }
    
    console.log(`${border}${g.lineV}${c.reset}${" ".repeat(cardWidth - 2)}${border}${g.lineV}${c.reset}`);
  }

  // Bottom closing border
  console.log(`${border}${g.cornerBL}${g.lineH.repeat(cardWidth - 2)}${g.cornerBR}${c.reset}\n\n`);
}

/**
 * Live Spinner with full-line wipe
 */
export function startSpinner(text) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  
  process.stdout.write(`\r\x1b[2K\r${c.brand}${frames[0]}${c.reset} ${c.fg}${text}${c.reset}`);
  
  const interval = setInterval(() => {
    i = (i + 1) % frames.length;
    process.stdout.write(`\r\x1b[2K\r${c.brand}${frames[i]}${c.reset} ${c.fg}${text}${c.reset}`);
  }, 80);

  return {
    succeed: (msg = text) => {
      clearInterval(interval);
      process.stdout.write(`\r\x1b[2K\r${c.success}${g.stepDone}${c.reset} ${c.fg}${msg}${c.reset}\n`);
    },
    fail: (msg = text) => {
      clearInterval(interval);
      process.stdout.write(`\r\x1b[2K\r${c.error}${g.stepFail}${c.reset} ${c.fg}${msg}${c.reset}\n`);
    },
    warn: (msg = text) => {
      clearInterval(interval);
      process.stdout.write(`\r\x1b[2K\r${c.warning}${g.stepWarn}${c.reset} ${c.fg}${msg}${c.reset}\n`);
    },
    stop: () => {
      clearInterval(interval);
      process.stdout.write(`\r\x1b[2K\r`);
    },
  };
}

/**
 * Interactive Option Selector Rendered Inside a Clean Boxed Card
 */
export function renderSelectPrompt({ question, help = null, options = [], selectedIndex = 0, width = 78 }) {
  console.log(`${c.bold}${c.fg}${question}${c.reset}\n`);
  if (help) {
    console.log(`${c.fgSubtle}${help}${c.reset}\n`);
  }

  // Calculate width for options card
  const optLines = options.map((opt, idx) => {
    const isSelected = idx === selectedIndex;
    const prefix = isSelected ? "› " : "  ";
    const hint = opt.hint ? ` (${opt.hint})` : "";
    return `${prefix}${opt.label}${hint}`;
  });

  const maxLen = optLines.reduce((acc, l) => Math.max(acc, stripAnsi(l).length), 0);
  const cardWidth = Math.max(width, maxLen + 6);
  const innerWidth = cardWidth - 6;

  // Render options card
  console.log(`${c.border}${g.cornerTL}${g.lineH.repeat(cardWidth - 2)}${g.cornerTR}${c.reset}`);
  console.log(`${c.border}${g.lineV}${c.reset}${" ".repeat(cardWidth - 2)}${c.border}${g.lineV}${c.reset}`);

  options.forEach((opt, idx) => {
    const isSelected = idx === selectedIndex;
    if (isSelected) {
      const hint = opt.hint ? ` ${c.fgMuted}(${opt.hint})${c.reset}` : "";
      const text = `${c.brand}${c.bold}› ${opt.label}${c.reset}${hint}`;
      console.log(`${c.border}${g.lineV}${c.reset}  ${padEndVisible(text, innerWidth)}  ${c.border}${g.lineV}${c.reset}`);
    } else {
      const hint = opt.hint ? ` ${c.fgMuted}(${opt.hint})${c.reset}` : "";
      const text = `  ${c.fgSubtle}${opt.label}${c.reset}${hint}`;
      console.log(`${c.border}${g.lineV}${c.reset}  ${padEndVisible(text, innerWidth)}  ${c.border}${g.lineV}${c.reset}`);
    }
  });

  console.log(`${c.border}${g.lineV}${c.reset}${" ".repeat(cardWidth - 2)}${c.border}${g.lineV}${c.reset}`);
  console.log(`${c.border}${g.cornerBL}${g.lineH.repeat(cardWidth - 2)}${g.cornerBR}${c.reset}\n\n`);
}
