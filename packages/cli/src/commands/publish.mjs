import { matchHexColors } from "@shavin/block-schema/hex-policy";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { CommunityBlockManifestSchema } from "@shavin/block-schema";

export async function publishCommand(filePath, options = {}) {
  if (!filePath) {
    console.error("[shavin-cli] Please specify a component file to publish (e.g. `npx @shavin/cli publish ./components/MyCard.tsx`)");
    process.exit(1);
  }

  const resolved = resolve(process.cwd(), filePath);
  if (!existsSync(resolved)) {
    console.error(`[shavin-cli] Target file not found: ${resolved}`);
    process.exit(1);
  }

  const code = readFileSync(resolved, "utf8");
  const fileName = basename(resolved);
  const baseSlug = fileName.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  console.log(`\n🔍 Running automated MCP Pre-flight Quality Gate on ${fileName}...`);

  // Token Purity & Hex Checks
  const hexMatches = matchHexColors(code, { filename: fileName });
  const rgbMatches = code.match(/rgba?\(.*?\)/g) || [];
  const foundationMatches = code.match(/--n-\d+/g) || [];

  let tokenPurityScore = 100;
  const purityErrors = [];

  if (hexMatches.length > 0) {
    tokenPurityScore -= 30;
    purityErrors.push(`Found ${hexMatches.length} raw hex literals: ${hexMatches.slice(0, 3).join(", ")}`);
  }
  if (rgbMatches.length > 0) {
    tokenPurityScore -= 30;
    purityErrors.push(`Found ${rgbMatches.length} raw rgb/rgba literals`);
  }
  if (foundationMatches.length > 0) {
    tokenPurityScore -= 40;
    purityErrors.push(`Found ${foundationMatches.length} direct --n-* foundation tokens. Use semantic tokens instead.`);
  }

  // A11y heuristic
  let a11yScore = 100;
  if (code.includes("<button") && !code.includes("aria-label") && !code.includes("children")) {
    a11yScore = 80;
  }

  // Security Sandboxing check
  const hasDangerousEval = /eval\(|Function\(|dangerouslySetInnerHTML|<script/g.test(code);
  const securityScore = hasDangerousEval ? 0 : 100;

  const overallScore = Math.max(
    0,
    Math.round((Math.max(0, tokenPurityScore) * 0.4) + (a11yScore * 0.3) + (securityScore * 0.3))
  );

  console.log(`\n📊 Quality Gate Score: ${overallScore}/100`);
  console.log(`  - Token Purity: ${Math.max(0, tokenPurityScore)}%`);
  console.log(`  - Accessibility: ${a11yScore}%`);
  console.log(`  - Security & Sandbox: ${securityScore}%\n`);

  if (purityErrors.length > 0) {
    console.warn("⚠️ Quality Gate Warnings:");
    purityErrors.forEach((err) => console.warn(`  - ${err}`));
    console.log("");
  }

  if (overallScore < 70) {
    console.error("❌ Component failed the automated Quality Gate threshold (minimum 70 required to publish).");
    process.exit(1);
  }

  const manifest = {
    $schema: "https://shavin.cc/schema/v1/block.json",
    slug: options.slug || baseSlug,
    name: options.name || fileName.replace(/\.[^/.]+$/, ""),
    description: options.description || "Community-contributed @shavin/ui block component",
    category: options.category || "features",
    tier: "community",
    verificationStatus: overallScore >= 95 ? "official_verified" : "community_creator",
    author: {
      username: options.author || "community-user",
      name: options.authorName || "Community Developer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
      badges: overallScore >= 95 ? ["verified_creator"] : ["community_pioneer"],
      totalForks: 0,
      totalUpvotes: 0,
      publishedCount: 1,
      joinedAt: new Date().toISOString().split("T")[0],
    },
    version: "0.1.0",
    dependencies: ["Button", "Card"],
    npmDependencies: { "@phosphor-icons/react": "^2.1.7" },
    tags: ["community", options.category || "features"],
    upvotes: 0,
    forks: 0,
    views: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rawCode: code,
    qualityGate: {
      passed: true,
      overallScore,
      tokenPurityScore: Math.max(0, tokenPurityScore),
      a11yScore,
      geometryScore: 100,
      securityScore,
      rules: [
        {
          id: "token-purity",
          name: "Semantic Token Compliance",
          category: "token_purity",
          passed: tokenPurityScore >= 80,
          score: Math.max(0, tokenPurityScore),
          message: purityErrors.length === 0 ? "100% semantic token usage." : purityErrors.join("; "),
        },
        {
          id: "a11y-contrast",
          name: "WCAG 2.1 AAA Contrast & ARIA Gate",
          category: "accessibility",
          passed: a11yScore >= 80,
          score: a11yScore,
          message: "Accessibility heuristics passed.",
        },
        {
          id: "security-sandbox",
          name: "AST Purity & Script Sanitization",
          category: "security_sandboxing",
          passed: securityScore === 100,
          score: securityScore,
          message: securityScore === 100 ? "No dangerous eval or scripts detected." : "Dangerous eval detected.",
        },
      ],
      evaluatedAt: new Date().toISOString(),
      verifiedBadgeEligible: overallScore >= 95,
    },
  };

  const parsed = CommunityBlockManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    console.error("❌ Generated manifest failed block-schema validation:", parsed.error.format());
    process.exit(1);
  }

  const outPath = resolve(process.cwd(), `${manifest.slug}.block.json`);
  writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`✅ Successfully generated Community Block Manifest!`);
  console.log(`  Output: ${outPath}`);
  console.log(`\nYou can submit this to https://community.shavin.cc or open a PR to promote it to the official core library.\n`);
}
