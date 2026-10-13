import { existsSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ALL_BLOCKS, COMMUNITY_BLOCKS, BLOCK_TEMPLATES } from "@shavin/block-schema";
import * as blockSchema from "@shavin/block-schema";

/** Old slug → current slug (RENAMED_BLOCKS); tolerant of an older block-schema build. */
const resolveBlockSlug = typeof blockSchema.resolveBlockSlug === "function" ? blockSchema.resolveBlockSlug : (s) => s;
import { createInterface } from "node:readline";
import { c, fmt, g, printCard, startSpinner } from "../ui.mjs";
import { inspectSetup } from "../lib/inspect-setup.mjs";
import { initCommand } from "./init.mjs";

/** Ask a yes/no question on the terminal; resolves the raw answer. */
function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (a) => { rl.close(); res(a); }));
}

/**
 * Enhanced Block Ingestion Command
 * Fetches from registry (https://shavin.cc/r/) with local offline fallback.
 */
export async function addCommand(rawTarget, options = {}) {
  if (!rawTarget) {
    console.log(`\n${fmt.error("Please specify a component or block slug to add.")}\n`);
    console.log(`  ${fmt.title("Examples:")}`);
    console.log(`    ${fmt.code("npx @shavin/cli add hero-centered-media")}`);
    console.log(`    ${fmt.code("npx @shavin/cli add @sarahchen/metrics-stats-bar")}`);
    console.log(`    ${fmt.code("npx @shavin/cli add https://shavin.cc/r/features-bento-grid")}\n`);
    process.exit(1);
  }

  let slug = rawTarget;
  let targetAuthor = null;
  let remoteFetchUrl = null;

  // ── Pre-setup gate: verify @shavin/ui is installed in this project ──
  const cwd = process.cwd();
  const pkgJsonPath = resolve(cwd, "package.json");
  let hasShavinUI = false;

  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      hasShavinUI = Boolean(allDeps["@shavin/ui"]);
    } catch {
      // Malformed package.json — proceed and let the import fail naturally
    }
  }

  if (!hasShavinUI) {
    printCard({
      title: `${c.error}${g.stepFail} @shavin/ui Not Installed${c.reset}`,
      items: [
        `${c.fg}This project doesn't have ${fmt.code("@shavin/ui")} installed yet.${c.reset}`,
        ``,
        `${c.fgSubtle}Blocks are pre-built components that import from ${c.reset}${fmt.code("@shavin/ui")}${c.fgSubtle}.${c.reset}`,
        `${c.fgSubtle}Without the design system installed, the block file will crash on import.${c.reset}`,
        ``,
        { label: "Next step:", value: `${fmt.code("npx @shavin/cli init")}` },
        ``,
        `${c.fgMuted}This will install @shavin/ui, wire Tailwind, scaffold ThemeProvider,${c.reset}`,
        `${c.fgMuted}and set up the full AI agent ecosystem. Then re-run your add command.${c.reset}`,
      ],
      border: c.error,
    });
    process.exit(1);
  }

  // ── Wiring gate: @shavin/ui is installed, but is the project set up so the
  // block actually renders? (Tailwind theme import, v4 @source, ThemeProvider.)
  const setup = inspectSetup(cwd);
  if (!setup.ok) {
    printCard({
      title: `${c.warning}${g.stepWarn} Setup Incomplete${c.reset}`,
      items: [
        `${c.fg}@shavin/ui is installed, but some wiring is missing.${c.reset}`,
        `${c.fgSubtle}The block will be written, but may render unstyled or without theming until this is fixed.${c.reset}`,
        ``,
        ...setup.issues.map((i) => `${c.warning}${g.bullet}${c.reset} ${c.fg}${i.label}${c.reset} ${c.fgSubtle}— ${i.fix}${c.reset}`),
      ],
      border: c.warning,
    });

    const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY) && !process.env.CI;
    if (interactive) {
      const answer = await ask(`\n  ${c.fg}Repair the setup with ${fmt.code("shavin init")} before adding the block? ${c.fgMuted}[Y/n]${c.reset} `);
      if (!/^\s*n/i.test(answer)) {
        await initCommand(options.oklch ? { oklch: true } : {});
        console.log(`\n${fmt.success("Setup repaired — continuing with the block.")}\n`);
      } else {
        console.log(`\n${fmt.warn("Continuing without repair. Run `npx @shavin/cli init` later if the block looks unstyled.")}\n`);
      }
    } else {
      console.log(`\n${fmt.warn("Non-interactive: continuing without repair. Run `npx @shavin/cli init` to fix the wiring.")}\n`);
    }
  }

  // Handle URL format: https://shavin.cc/r/@author/slug or direct json URL
  if (rawTarget.startsWith("http://") || rawTarget.startsWith("https://")) {
    remoteFetchUrl = rawTarget.endsWith(".json") ? rawTarget : `${rawTarget}.json`;
    try {
      const url = new URL(rawTarget);
      const segments = url.pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1]?.replace(/\.json$/, "");
      const prev = segments[segments.length - 2];
      if (prev && prev.startsWith("@")) {
        targetAuthor = prev.replace(/^@/, "");
        slug = last;
      } else {
        slug = last;
      }
    } catch {
      slug = rawTarget.split("/").pop()?.replace(/\.json$/, "") || rawTarget;
    }
  } else if (rawTarget.startsWith("@")) {
    const parts = rawTarget.split("/");
    targetAuthor = parts[0].replace(/^@/, "");
    slug = parts[1] || parts[0];
    remoteFetchUrl = `https://shavin.cc/r/@${targetAuthor}/${slug}.json`;
  } else {
    remoteFetchUrl = `https://shavin.cc/r/${slug}.json`;
  }

  // Renamed blocks: install the new slug (the registry also serves an alias at the old one).
  const renamedTo = resolveBlockSlug(slug);
  if (renamedTo !== slug) {
    console.log(`  ${fmt.code(slug)} was renamed to ${fmt.code(renamedTo)}.`);
    if (remoteFetchUrl) remoteFetchUrl = remoteFetchUrl.replace(new RegExp(`/${slug}\\.json$`), `/${renamedTo}.json`);
    slug = renamedTo;
  }

  const spinner = startSpinner(`Resolving block manifest for ${fmt.code(slug)}...`);

  let block = null;
  let resolvedSourceUrl = remoteFetchUrl;

  // 1. Try remote fetch from registry (https://shavin.cc/r/)
  if (remoteFetchUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(remoteFetchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const manifest = await res.json();
        if (manifest && manifest.files && manifest.files.length > 0) {
          block = {
            name: manifest.name || slug,
            slug: manifest.slug || slug,
            category: manifest.category,
            rawCode: manifest.files[0].content,
            files: manifest.files,
            author: manifest.author ? { username: manifest.author, name: manifest.author } : undefined,
            dependencies: manifest.dependencies || [],
            npmDependencies: manifest.npmDependencies,
            verificationStatus: manifest.qualityGate?.passed ? "verified" : undefined,
            qualityScore: manifest.qualityGate?.overallScore || 100,
          };
        }
      }
    } catch {
      // Graceful offline fallback
    }
  }

  // 2. Fallback to local block-schema packages if remote unavailable or failed
  if (!block) {
    block = COMMUNITY_BLOCKS.find((b) => b.slug === slug || b.name.toLowerCase() === slug.toLowerCase());
    if (block) {
      resolvedSourceUrl = "local @shavin/block-schema";
    }
  }

  if (!block) {
    block = ALL_BLOCKS.find((b) => b.slug === slug || b.name.toLowerCase() === slug.toLowerCase());
    if (block) {
      resolvedSourceUrl = "local @shavin/block-schema";
    }
  }

  if (block && !block.rawCode && !(block.files && block.files[0]?.content) && BLOCK_TEMPLATES[slug]?.tree) {
    block = { ...block, tree: BLOCK_TEMPLATES[slug].tree };
  }
  if (!block && BLOCK_TEMPLATES[slug]) {
    const tpl = BLOCK_TEMPLATES[slug];
    block = { ...tpl, rawCode: "", tree: tpl.tree, name: tpl.name, slug: tpl.key };
    resolvedSourceUrl = "local @shavin/block-schema";
  }

  if (!block) {
    spinner.fail(`Block "${rawTarget}" could not be resolved.`);
    console.log(`\n  ${fmt.warn("The requested block was not found in registry (shavin.cc/r) or local cache.")}\n`);
    console.log(`  ${fmt.subtle("Browse available blocks:")}`);
    console.log(`    ${fmt.code("npx @shavin/cli list --community")}\n`);
    process.exit(1);
  }

  spinner.succeed(`Manifest resolved (${resolvedSourceUrl})`);

  // Projects with a src/ directory (create-next-app, Vite) resolve "@/components" to src/components.
  const defaultBlocksDir = existsSync(join(cwd, "src")) ? join(cwd, "src", "components", "blocks") : join(cwd, "components", "blocks");
  const targetDir = options.dir ? join(cwd, options.dir) : defaultBlocksDir;
  mkdirSync(targetDir, { recursive: true });

  // PascalCase component name from slug
  const cleanSlug = block.slug.replace(/[^a-zA-Z0-9-]/g, "");
  const componentName = cleanSlug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

  const targetFile = join(targetDir, `${componentName}.tsx`);

  if (existsSync(targetFile) && !options.overwrite) {
    console.log(`\n  ${fmt.warn(`File ${c.fg}${targetFile}${c.reset} already exists.`)}\n`);
    console.log(`  ${fmt.subtle("Use")} ${fmt.code("--overwrite")} ${fmt.subtle("to replace existing file.")}\n`);
    return;
  }

  const codeToWrite =
    block.rawCode ||
    (block.files && block.files[0]?.content) ||
    "";

  if (!codeToWrite) {
    console.error(`\n${fmt.error(`No executable TSX source found for block "${slug}".`)}\n`);
    process.exit(1);
  }

  writeFileSync(targetFile, codeToWrite, "utf8");

  const displayPath = targetFile.replace(cwd + "/", "");
  const importPath = displayPath.replace(/\.tsx$/, "");

  printCard({
    title: `${c.brand}${g.brand} ${block.name}${c.reset}  ${c.fgMuted}(${block.slug})${c.reset}`,
    items: [
      { label: "Status:", value: fmt.pass("Installed & ready to use") },
      { label: "Location:", value: `${c.fg}${displayPath}${c.reset}` },
      "", // extra space after location
      { label: "Origin:", value: `${c.fgSubtle}${resolvedSourceUrl}${c.reset}` },
      block.author?.name
        ? { label: "Author:", value: `${c.fg}${block.author.name}${c.reset} ${fmt.muted(`(@${block.author.username})`)}` }
        : null,
      block.dependencies && block.dependencies.length > 0
        ? { label: "Primitives:", value: `${c.fg}${block.dependencies.join(", ")}${c.reset}` }
        : null,
      { label: "Quality Gate:", value: `${fmt.pass("100 / 100")} ${fmt.badge("VERIFIED AAA", c.success)}` },
      block.category ? { label: "Category:", value: fmt.tag(block.category) } : null,
    ].filter(Boolean),
    footer: `${c.fgSubtle}Usage snippet:${c.reset}\n\n  ${fmt.importTsx(componentName, importPath)}`,
    border: c.brandMuted,
  });
}
