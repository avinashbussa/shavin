import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  detectPackageManager,
  importedPackages,
  installCommand,
  minVersion,
  planDependencies,
  satisfiesMinimum,
} from "../packages/cli/src/lib/package-manager.mjs";

describe("cli package-manager helpers", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "shavin-pm-"));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const writePkg = (deps: Record<string, string>, devDeps: Record<string, string> = {}) =>
    fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: deps, devDependencies: devDeps }));

  it("detects the package manager from the lockfile", () => {
    expect(detectPackageManager(dir)).toBe("npm");
    fs.writeFileSync(path.join(dir, "bun.lock"), "");
    expect(detectPackageManager(dir)).toBe("bun");
    fs.writeFileSync(path.join(dir, "pnpm-lock.yaml"), "");
    expect(detectPackageManager(dir)).toBe("pnpm");
  });

  it("builds install commands and quotes ranges", () => {
    expect(installCommand("npm", ["@shavin/ui@^0.2.0"])).toBe('npm install "@shavin/ui@^0.2.0"');
    expect(installCommand("pnpm", ["recharts"], { dev: true })).toBe("pnpm add -D recharts");
  });

  it("reads the lowest version of a range", () => {
    expect(minVersion("^0.2.1")).toEqual([0, 2, 1]);
    expect(minVersion("~1.4")).toEqual([1, 4, 0]);
    expect(minVersion(">=2")).toEqual([2, 0, 0]);
    expect(minVersion("workspace:*")).toBeNull();
    expect(minVersion("latest")).toBeNull();
  });

  it("compares a declared range against a block's minimum", () => {
    expect(satisfiesMinimum("^0.1.0", "^0.1.0")).toBe(true);
    expect(satisfiesMinimum("^0.2.0", "^0.1.0")).toBe(true);
    expect(satisfiesMinimum("^0.0.5", "^0.1.0")).toBe(false);
    expect(satisfiesMinimum("workspace:*", "^9.0.0")).toBe(true);
    expect(satisfiesMinimum("file:../ui", "^0.1.0")).toBe(true);
  });

  it("lists imported npm packages, skipping react and relative imports", () => {
    const code = [
      'import { Button } from "@shavin/ui";',
      'import { useState } from "react";',
      'import { LineChart } from "recharts/es6";',
      'import { helper } from "./helper";',
    ].join("\n");
    expect(importedPackages(code)).toEqual({ "@shavin/ui": "latest", recharts: "latest" });
  });

  it("plans missing and outdated packages", () => {
    writePkg({ "@shavin/ui": "^0.0.5" }, { typescript: "5.6.3" });
    const plan = planDependencies(dir, { "@shavin/ui": "^0.1.0", recharts: "^2.12.0", typescript: "latest" });
    expect(plan.missing).toEqual(["recharts@^2.12.0"]);
    expect(plan.outdated).toEqual([{ spec: "@shavin/ui@^0.1.0", have: "^0.0.5", need: "^0.1.0" }]);
  });

  it("plans nothing when the project already has everything", () => {
    writePkg({ "@shavin/ui": "^0.3.0" });
    expect(planDependencies(dir, { "@shavin/ui": "^0.1.0" })).toEqual({ missing: [], outdated: [] });
  });
});
