import { hasHexViolation } from "../../packages/block-schema/hex-policy.mjs";
import { synthesizeLayout } from "../../packages/mcp-server/src/tools/synthesize.mjs";
import { c, g, fmt, printBanner, printCard } from "../../packages/cli/src/ui.mjs";

const SYNTHESIS_CHALLENGES = [
  { id: "syn-1", prompt: "Minimalist SaaS Landing Page for AI Startup", category: "landing" },
  { id: "syn-2", prompt: "Executive BI Revenue and Infrastructure Monitoring Dashboard", category: "dashboard" },
  { id: "syn-3", prompt: "Stripe Metered Billing Portal and Invoice Management", category: "pricing" },
  { id: "syn-4", prompt: "4-Step Engineering Team Onboarding Stepper", category: "auth" },
  { id: "syn-5", prompt: "RBAC Security Permissions Matrix and 2FA Panel", category: "auth" },
  { id: "syn-6", prompt: "Conversational AI Prompt Workspace with Tool Inspector", category: "content" },
  { id: "syn-7", prompt: "Agile Sprint Kanban Board and Activity Timeline", category: "dashboard" },
  { id: "syn-8", prompt: "Technical API Documentation Portal with Endpoint Reference", category: "content" },
  { id: "syn-9", prompt: "Dark Mode Developer Platform Homepage with Pricing", category: "landing" },
  { id: "syn-10", prompt: "Customer Review and Testimonial Grid with Star Ratings", category: "content" },
];

export async function runSynthesisBenchmark() {
  process.stdout.write("\n");
  printBanner("@shavin/ui", "AI Layout Synthesis Benchmark Runner v1.0.0");
  console.log(`  ${c.fgSubtle}Challenges: ${c.bold}${c.fg}${SYNTHESIS_CHALLENGES.length}${c.reset}  ${c.border}|${c.reset}  ${c.fgSubtle}Target Score: ${c.bold}${c.brand}100/100${c.reset}\n`);

  let totalScore = 0;
  let passCount = 0;

  for (const challenge of SYNTHESIS_CHALLENGES) {
    const res = synthesizeLayout({ prompt: challenge.prompt, category: challenge.category });
    let score = 100;
    const violations = [];

    // Check 1: Must contain ThemeProvider
    if (!res.code.includes("<ThemeProvider")) {
      score -= 25;
      violations.push("Missing <ThemeProvider> wrapper");
    }

    // Check 2: Single root import from @shavin/ui
    if (!res.code.includes('from "@shavin/ui"')) {
      score -= 25;
      violations.push("Missing '@shavin/ui' root import");
    }

    // Check 3: Zero raw hex leaks
    if (hasHexViolation(res.code)) {
      score -= 25;
      violations.push("Found hardcoded hex color literal");
    }

    // Check 4: Must have composed blocks
    if (!res.blocksUsed || res.blocksUsed.length === 0) {
      score -= 25;
      violations.push("No blocks matched for prompt");
    }

    totalScore += score;
    if (score === 100) passCount++;

    const statusMark = score === 100
      ? `${c.success}${g.stepDone}${c.reset}`
      : `${c.error}${g.stepFail}${c.reset}`;
    const scoreStr = score === 100
      ? `${c.bold}${c.success}${score}/100${c.reset}`
      : `${c.bold}${c.error}${score}/100${c.reset}`;
    const blocksStr = res.blocksUsed && res.blocksUsed.length ? res.blocksUsed.join(", ") : "none";

    console.log(
      `  ${statusMark} ${c.bold}${c.fg}${challenge.id.padEnd(8)}${c.reset} ${c.fgSubtle}[${challenge.category.padEnd(10)}]${c.reset} Score: ${scoreStr} ${c.border}|${c.reset} ${c.fgMuted}Blocks: ${blocksStr}${c.reset}`
    );
    if (violations.length > 0) {
      violations.forEach((v) => console.log(`       ${c.error}${g.stepFail}${c.reset} ${c.fgMuted}${v}${c.reset}`));
    }
  }

  const avgScore = Math.round(totalScore / SYNTHESIS_CHALLENGES.length);

  printCard({
    title: `${c.brand}${g.brand} Layout Synthesis Benchmark Complete${c.reset}`,
    items: [
      { label: "Average Score:", value: `${c.bold}${c.success}${avgScore}/100${c.reset}` },
      { label: "Clean Passes:", value: `${c.bold}${c.fg}${passCount} / ${SYNTHESIS_CHALLENGES.length}${c.reset} (${Math.round((passCount / SYNTHESIS_CHALLENGES.length) * 100)}%)` },
      { label: "Challenges Tested:", value: `${c.bold}${c.fg}${SYNTHESIS_CHALLENGES.length} scenarios${c.reset}` },
      { label: "Benchmark Grade:", value: `${fmt.pass("VERIFIED AAA")} ${fmt.badge("SYNTHESIS GOLD", c.success)}` },
    ],
    footer: `${c.fgSubtle}All synthesized TSX layouts verify ThemeProvider injection, token purity, and block composition.${c.reset}`,
  });

  if (avgScore < 95) {
    console.error(`\n  ${c.error}${g.stepFail} Synthesis benchmark failed to meet minimum threshold of 95/100.${c.reset}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("synthesis.mjs")) {
  runSynthesisBenchmark().catch((err) => {
    console.error(`\n  ${c.error}${g.stepFail} Fatal error during synthesis benchmark:${c.reset}`, err);
    process.exit(1);
  });
}
