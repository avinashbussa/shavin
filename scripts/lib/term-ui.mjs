/**
 * @shavin/ui — Shared Terminal UI & Runner Utilities for Scripts
 * Leverages the Shavin TrueColor palette, subtle hairline borders,
 * typographic glyphs (zero emojis), progress states, animated spinners, and structured cards.
 */

import { spawn } from "node:child_process";
import { c, g, fmt, printBanner, printCard, padEndVisible, stripAnsi } from "../../packages/cli/src/ui.mjs";

export { c, g, fmt, printBanner, printCard, padEndVisible, stripAnsi };

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const isTTY = Boolean(process.stdout.isTTY);

// Restore cursor automatically on unexpected exit
if (isTTY) {
  process.on("exit", () => process.stdout.write("\x1b[?25h"));
  process.on("SIGINT", () => {
    process.stdout.write("\x1b[?25h\n");
    process.exit(130);
  });
}

/**
 * Format milliseconds into human-readable duration
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Print a visually grouped pipeline stage header
 */
export function printStage(number, title, subtitle = "") {
  console.log(`\n${c.bold}${c.brand}${g.section} STAGE ${number}:${c.reset} ${c.bold}${c.fg}${title}${c.reset}`);
  if (subtitle) {
    console.log(`  ${c.fgSubtle}${subtitle}${c.reset}`);
  }
  console.log("");
}

/**
 * Print a section header for task groups
 */
export function printSectionHeader(title) {
  console.log(`\n${c.bold}${c.fg}${title}${c.reset}`);
  console.log(`${c.border}${g.lineH.repeat(50)}${c.reset}`);
}

function getTerminalCols() {
  return (process.stdout.columns && process.stdout.columns > 20) ? process.stdout.columns : 80;
}

/**
 * Format a task status line to strictly fit within terminal width, preventing line wraps
 */
function formatTaskLine({ glyph, prefix = "", name, desc = "", suffix = "" }) {
  const maxCols = getTerminalCols() - 1; // Strict margin against terminal auto-wrap
  const glyphLen = stripAnsi(glyph).length + 1; // glyph + space
  const prefixLen = prefix ? `${stripAnsi(prefix).trim()} `.length : 0;
  const suffixLen = suffix ? ` ${stripAnsi(suffix).trim()}`.length : 0;
  const fixedLen = 2 + glyphLen + prefixLen + suffixLen; // indent 2 + glyph + prefix + suffix

  let avail = Math.max(10, maxCols - fixedLen);
  let displayName = name;
  let displayDesc = desc;

  if (displayName.length > avail) {
    displayName = displayName.slice(0, Math.max(5, avail - 1)) + "…";
    displayDesc = "";
  } else if (displayDesc) {
    const remainingForDesc = avail - displayName.length - 3; // " — "
    if (remainingForDesc > 4) {
      if (displayDesc.length > remainingForDesc) {
        displayDesc = displayDesc.slice(0, remainingForDesc - 1) + "…";
      }
    } else {
      displayDesc = "";
    }
  }

  const prefixStr = prefix ? `${c.fgMuted}${prefix}${c.reset} ` : "";
  const descStr = displayDesc ? ` ${c.fgMuted}— ${displayDesc}${c.reset}` : "";
  const suffixStr = suffix ? ` ${suffix}` : "";

  return `  ${glyph} ${prefixStr}${c.fg}${displayName}${c.reset}${descStr}${suffixStr}`;
}

/**
 * Creates an animated loader with real-time timer in place
 */
export function startTaskSpinner({ prefix = "", name, desc = "" }) {
  let frameIdx = 0;
  const startTime = Date.now();

  const render = () => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const spinFrame = `${c.brand}${SPINNER_FRAMES[frameIdx]}${c.reset}`;
    const timerStr = `${c.brandLight}(${elapsed}s)${c.reset}`;
    const line = formatTaskLine({
      glyph: spinFrame,
      prefix,
      name,
      desc,
      suffix: timerStr,
    });
    process.stdout.write(`\r\x1b[2K${line}`);
  };

  if (isTTY) {
    process.stdout.write("\x1b[?25l"); // Hide cursor during spinner
    render();
  } else {
    const prefixStr = prefix ? `${prefix} ` : "";
    const descStr = desc ? ` — ${desc}` : "";
    console.log(`  ${g.stepActive} ${prefixStr}${name}${descStr}...`);
  }

  const timer = isTTY
    ? setInterval(() => {
        frameIdx = (frameIdx + 1) % SPINNER_FRAMES.length;
        render();
      }, 80)
    : null;

  return {
    succeed: (detail = "") => {
      if (timer) clearInterval(timer);
      if (isTTY) process.stdout.write("\x1b[?25h");
      const totalElapsed = Date.now() - startTime;
      const timeStr = `${c.fgMuted}[${formatDuration(totalElapsed)}]${c.reset}`;
      const clearPrefix = isTTY ? "\r\x1b[2K" : "";
      const line = formatTaskLine({
        glyph: `${c.success}${g.stepDone}${c.reset}`,
        prefix,
        name,
        desc: detail,
        suffix: timeStr,
      });
      process.stdout.write(`${clearPrefix}${line}\n`);
      return totalElapsed;
    },
    fail: (errorMsg = "") => {
      if (timer) clearInterval(timer);
      if (isTTY) process.stdout.write("\x1b[?25h");
      const totalElapsed = Date.now() - startTime;
      const errSuffix = errorMsg
        ? `${c.error}(${errorMsg}) [FAILED - ${formatDuration(totalElapsed)}]${c.reset}`
        : `${c.error}[FAILED - ${formatDuration(totalElapsed)}]${c.reset}`;
      const clearPrefix = isTTY ? "\r\x1b[2K" : "";
      const line = formatTaskLine({
        glyph: `${c.error}${g.stepFail}${c.reset}`,
        prefix,
        name,
        desc: "",
        suffix: errSuffix,
      });
      process.stdout.write(`${clearPrefix}${line}\n`);
      return totalElapsed;
    },
    stop: () => {
      if (timer) clearInterval(timer);
      if (isTTY) {
        process.stdout.write("\x1b[?25h");
        process.stdout.write(`\r\x1b[2K`);
      }
    },
  };
}

/**
 * Runs an asynchronous shell command with a live animated spinner & live timer
 */
export function runTask({ prefix = "", name, desc = "", cmd, cwd, verbose = false }) {
  return new Promise((resolve, reject) => {
    let frameIdx = 0;
    const startTime = Date.now();

    const render = () => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const spinFrame = `${c.brand}${SPINNER_FRAMES[frameIdx]}${c.reset}`;
      const timerStr = `${c.brandLight}(${elapsed}s)${c.reset}`;
      const line = formatTaskLine({
        glyph: spinFrame,
        prefix,
        name,
        desc,
        suffix: timerStr,
      });
      process.stdout.write(`\r\x1b[2K${line}`);
    };

    if (verbose) {
      console.log(`\n  ${c.brand}${g.stepActive}${c.reset} Running: ${cmd}\n`);
    } else if (isTTY) {
      process.stdout.write("\x1b[?25l"); // Hide cursor
      render();
    } else {
      const prefixStr = prefix ? `${prefix} ` : "";
      const descStr = desc ? ` — ${desc}` : "";
      console.log(`  ${g.stepActive} ${prefixStr}${name}${descStr}...`);
    }

    const timer = (!verbose && isTTY)
      ? setInterval(() => {
          frameIdx = (frameIdx + 1) % SPINNER_FRAMES.length;
          render();
        }, 80)
      : null;

    let stdout = "";
    let stderr = "";

    const child = spawn(cmd, {
      shell: true,
      cwd,
      stdio: verbose ? "inherit" : ["ignore", "pipe", "pipe"],
    });

    if (!verbose) {
      child.stdout?.on("data", (d) => { stdout += d.toString(); });
      child.stderr?.on("data", (d) => { stderr += d.toString(); });
    }

    child.on("close", (code) => {
      if (timer) clearInterval(timer);
      if (isTTY) process.stdout.write("\x1b[?25h"); // Restore cursor
      const totalElapsed = Date.now() - startTime;
      const clearPrefix = isTTY ? "\r\x1b[2K" : "";

      if (code === 0) {
        const timeStr = `${c.fgMuted}[${formatDuration(totalElapsed)}]${c.reset}`;
        const line = formatTaskLine({
          glyph: `${c.success}${g.stepDone}${c.reset}`,
          prefix,
          name,
          desc: "",
          suffix: timeStr,
        });
        process.stdout.write(`${clearPrefix}${line}\n`);
        resolve({ name, elapsed: totalElapsed, stdout, stderr });
      } else {
        const errSuffix = `${c.error}[FAILED - ${formatDuration(totalElapsed)}]${c.reset}`;
        const line = formatTaskLine({
          glyph: `${c.error}${g.stepFail}${c.reset}`,
          prefix,
          name,
          desc: "",
          suffix: errSuffix,
        });
        process.stdout.write(`${clearPrefix}${line}\n`);
        const err = new Error(`Command "${cmd}" exited with code ${code}`);
        err.code = code;
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      }
    });

    child.on("error", (err) => {
      if (timer) clearInterval(timer);
      if (isTTY) process.stdout.write("\x1b[?25h");
      const clearPrefix = isTTY ? "\r\x1b[2K" : "";
      process.stdout.write(`${clearPrefix}  ${c.error}${g.stepFail}${c.reset} ${name} ${c.error}[ERROR]${c.reset}\n`);
      reject(err);
    });
  });
}
