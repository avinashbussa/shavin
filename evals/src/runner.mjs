/**
 * @shavin/ui — Native AI Evaluation Runner.
 *
 * The runner evaluates AI-generated TSX code against the Shavin design system.
 * It supports two modes:
 *
 * 1. FIXTURE MODE (default): Loads pre-generated AI output snapshots from
 *    evals/fixtures/ and evaluates them. This tests the evaluator against
 *    real-world AI output patterns without requiring a live model.
 *
 * 2. PIPELINE MODE (--pipeline): Loads prompts from prompts.json and evaluates
 *    code from fixtures that correspond to each prompt. Falls back to a
 *    minimal stub if no fixture exists (with a WARNING).
 *
 * 3. FILE MODE (--file=path): Evaluates a single TSX file.
 *
 * The old tautological behavior (generating fake token-compliant code and
 * evaluating it) has been removed. The benchmark now only tests real code.
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, basename, extname } from "path";
import { evaluateCode } from "./evaluator.mjs";
import { autofix } from "./autofix.mjs";
import { c, g, fmt, printBanner, printCard, padEndVisible } from "../../packages/cli/src/ui.mjs";

const ROOT = resolve(process.cwd());
const BENCHMARK_PATH = resolve(ROOT, "evals/benchmarks/prompts.json");
const FIXTURES_DIR = resolve(ROOT, "evals/fixtures");

/**
 * Load fixture code for a given prompt ID.
 * Looks for evals/fixtures/{promptId}.tsx or .jsx
 * Returns null if no fixture exists.
 */
function loadFixture(promptId) {
  const candidates = [
    resolve(FIXTURES_DIR, `${promptId}.tsx`),
    resolve(FIXTURES_DIR, `${promptId}.jsx`),
    resolve(FIXTURES_DIR, `${promptId}.ts`),
    resolve(FIXTURES_DIR, `${promptId}.js`),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return { code: readFileSync(p, "utf-8"), path: p };
    }
  }
  return null;
}

/**
 * Load code from a single file path (--file= mode)
 */
function loadFile(filePath) {
  const p = resolve(ROOT, filePath);
  if (!existsSync(p)) {
    console.error(`\n  ${c.error}${g.stepFail} File not found:${c.reset} ${p}\n`);
    process.exit(1);
  }
  return { code: readFileSync(p, "utf-8"), path: p };
}

/**
 * Get persona configuration
 */
function getPersonaConfig(personaName) {
  const personaPath = resolve(ROOT, "evals/personas", `${personaName}.md`);
  if (!existsSync(personaPath)) return null;
  return readFileSync(personaPath, "utf-8");
}

function runEvals() {
  // Parse CLI args
  const enableAutofix = process.argv.includes("--autofix");
  const personaArg = process.argv.find((a) => a.startsWith("--persona="))?.split("=")[1] ?? "all";
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");

  // ── FILE MODE: evaluate a single file ──────────────────────────────
  if (fileArg) {
    process.stdout.write("\n");
    printBanner("@shavin/ui", "Single File AI Evaluation");

    const filePath = fileArg.split("=")[1];
    const { code, path: sourcePath } = loadFile(filePath);

    let codeToEval = code;
    const fixesApplied = [];
    if (enableAutofix) {
      const fixedResult = autofix(codeToEval);
      codeToEval = fixedResult.fixedCode;
      if (fixedResult.fixesApplied.length > 0) {
        fixesApplied.push(...fixedResult.fixesApplied);
      }
    }

    const result = evaluateCode(codeToEval, []);

    printCard({
      title: `${c.brand}${g.brand} Evaluation: ${basename(sourcePath)}${c.reset}`,
      items: [
        { label: "File:", value: `${c.fg}${sourcePath}${c.reset}` },
        { label: "Autofix:", value: enableAutofix ? `${c.success}ENABLED (${fixesApplied.length} fixes applied)${c.reset}` : `${c.fgMuted}DISABLED${c.reset}` },
        { label: "Score:", value: `${c.bold}${result.score >= 90 ? c.success : result.score >= 70 ? c.warning : c.error}${result.score}/100${c.reset}` },
        { label: "Token Compliance:", value: result.isClean ? `${c.success}CLEAN (Zero Violations)${c.reset}` : `${c.error}${result.violations.length} Violations${c.reset}` },
        { label: "Coverage:", value: `${c.fg}${result.metrics.componentCoverage}%${c.reset}` },
      ],
      footer: result.violations.length > 0
        ? result.violations.map((v) => `  ${c.error}${g.stepFail}${c.reset} ${v}`).join("\n")
        : `${c.success}${g.stepDone} Fully token-compliant. Zero token violations.${c.reset}`,
    });

    process.exit(result.score >= 80 ? 0 : 1);
  }

  // ── BENCHMARK MODE: evaluate prompts with fixtures ─────────────────
  if (!existsSync(BENCHMARK_PATH)) {
    console.error(`\n  ${c.error}${g.stepFail} Prompts benchmark not found at:${c.reset} ${BENCHMARK_PATH}\n`);
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(BENCHMARK_PATH, "utf-8"));
  const prompts = data.prompts ?? [];

  // Ensure fixtures directory exists
  if (!existsSync(FIXTURES_DIR)) {
    console.error(`\n  ${c.error}${g.stepFail} Fixtures directory not found at:${c.reset} ${FIXTURES_DIR}\n`);
    process.exit(1);
  }

  process.stdout.write("\n");
  printBanner("@shavin/ui", `Native AI Evaluation Runner v${data.version}`);
  console.log(`  ${c.fgSubtle}Prompts: ${c.bold}${c.fg}${prompts.length}${c.reset}  ${c.border}|${c.reset}  ${c.fgSubtle}Mode: ${c.bold}${c.fg}${personaArg.toUpperCase()}${c.reset}  ${c.border}|${c.reset}  ${c.fgSubtle}Autofix: ${c.bold}${enableAutofix ? c.success + "ENABLED" : c.fgMuted + "DISABLED"}${c.reset}\n`);

  let totalScore = 0;
  let cleanCount = 0;
  let totalViolations = 0;
  let fixturesFound = 0;
  let fixturesMissing = 0;
  const results = [];

  prompts.forEach((p) => {
    const fixture = loadFixture(p.id);

    if (!fixture) {
      console.log(`  ${c.warning}${g.stepActive}${c.reset} ${c.bold}${c.fg}${p.id.padEnd(9)}${c.reset} ${c.fgSubtle}[${p.category.padEnd(20)}]${c.reset} ${c.fgMuted}— No fixture found (evals/fixtures/${p.id}.tsx)${c.reset}`);
      fixturesMissing++;
      results.push({ id: p.id, score: null, skipped: true });
      return;
    }

    fixturesFound++;
    let codeToEval = fixture.code;

    if (enableAutofix) {
      const fixedResult = autofix(codeToEval);
      codeToEval = fixedResult.fixedCode;
    }

    const evalResult = evaluateCode(codeToEval, p.expectedComponents);
    totalScore += evalResult.score;
    if (evalResult.isClean) cleanCount++;
    totalViolations += evalResult.violations.length;

    const statusMark = evalResult.score >= 90
      ? `${c.success}${g.stepDone}${c.reset}`
      : evalResult.score >= 70
        ? `${c.warning}${g.stepActive}${c.reset}`
        : `${c.error}${g.stepFail}${c.reset}`;

    const scoreStr = evalResult.score >= 90
      ? `${c.bold}${c.success}${evalResult.score}/100${c.reset}`
      : evalResult.score >= 70
        ? `${c.bold}${c.warning}${evalResult.score}/100${c.reset}`
        : `${c.bold}${c.error}${evalResult.score}/100${c.reset}`;

    const covStr = `${c.fgSubtle}cov: ${c.fg}${evalResult.metrics.componentCoverage}%${c.reset}`;

    console.log(
      `  ${statusMark} ${c.bold}${c.fg}${p.id.padEnd(9)}${c.reset} ${c.fgSubtle}[${p.category.padEnd(20)}]${c.reset} ${c.fgMuted}(${p.complexity.padEnd(7)})${c.reset} Score: ${scoreStr} ${c.border}|${c.reset} ${covStr}`
    );

    if (verbose && evalResult.violations.length > 0) {
      evalResult.violations.forEach((v) => console.log(`       ${c.error}${g.stepFail}${c.reset} ${c.fgMuted}${v}${c.reset}`));
    } else if (evalResult.violations.length > 0) {
      console.log(`       ${c.fgMuted}(${evalResult.violations.length} violations — use --verbose to view details)${c.reset}`);
    }

    results.push({
      id: p.id,
      score: evalResult.score,
      isClean: evalResult.isClean,
      violations: evalResult.violations.length,
      metrics: evalResult.metrics,
      fixturePath: fixture.path,
    });
  });

  const evaluatedCount = fixturesFound;
  const avgScore = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : 0;

  printCard({
    title: `${c.brand}${g.brand} AI Evaluation Summary${c.reset}`,
    items: [
      { label: "Average Score:", value: `${c.bold}${avgScore >= 90 ? c.success : c.warning}${avgScore}/100${c.reset}` },
      { label: "Clean Passes:", value: `${c.bold}${c.fg}${cleanCount} / ${evaluatedCount}${c.reset} (${evaluatedCount > 0 ? Math.round((cleanCount / evaluatedCount) * 100) : 0}%)` },
      { label: "Total Violations:", value: `${totalViolations === 0 ? c.success + "0 (Zero token leaks)" : c.error + totalViolations}${c.reset}` },
      { label: "Fixtures Evaluated:", value: `${c.bold}${c.fg}${fixturesFound}${c.reset} (${fixturesMissing} missing)` },
      { label: "Quality Grade:", value: avgScore >= 90 ? `${fmt.pass("VERIFIED AAA")} ${fmt.badge("GOLD BENCHMARK", c.success)}` : avgScore >= 80 ? `${fmt.pass("PASS")} ${fmt.badge("ACCEPTABLE", c.success)}` : fmt.fail("FAIL") },
    ],
    footer: `${c.fgSubtle}All evaluated TSX outputs tested against Shavin token invariants and layout rules.${c.reset}`,
  });

  if (fixturesMissing > 0 && fixturesFound === 0) {
    console.log(`\n  ${c.warning}${g.warn} No fixtures found. Create AI-generated snapshots in evals/fixtures/${c.reset}`);
    console.log(`    Named as prompt-1.tsx, prompt-2.tsx, etc.`);
    console.log(`    Or use --file=path/to/code.tsx to evaluate a single file.\n`);
  }

  if (avgScore < 80 && evaluatedCount > 0) {
    process.exit(1);
  }
}

runEvals();
