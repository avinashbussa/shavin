import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
// @ts-expect-error plain .mjs modules without types
import { findingsCommand } from "../../packages/cli/src/commands/findings.mjs";
// @ts-expect-error plain .mjs modules without types
import { createJournal } from "../../packages/mcp-server/src/bridge/journal.mjs";
import { makeFinding, type FindingInput } from "../../packages/ui/src/lib/inspector/schema";

let project = "";
let logs: string[] = [];
let errors: string[] = [];

const input: FindingInput = {
  detector: "tap-target",
  rule: "tap-target.min-24",
  severity: "warning",
  message: "Tap target is too small to hit reliably.",
  evidence: { measured: "20 by 20px", expected: "at least 24 by 24px (44 on touch)" },
  fixHint: "Use a Button or IconButton size md.",
  selector: "button.close",
  rect: { x: 5, y: 6, w: 20, h: 20, scrollX: 0, scrollY: 0 },
};
const f = (selector: string, over: Partial<FindingInput> = {}) => makeFinding({ ...input, selector, ...over });

beforeEach(() => {
  project = fs.mkdtempSync(path.join(os.tmpdir(), "shavin-cli-"));
  fs.writeFileSync(path.join(project, "package.json"), "{}");
  logs = [];
  errors = [];
  vi.spyOn(console, "log").mockImplementation((...a) => void logs.push(a.join(" ")));
  vi.spyOn(console, "error").mockImplementation((...a) => void errors.push(a.join(" ")));
  process.exitCode = undefined;
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(project, { recursive: true, force: true });
  process.exitCode = undefined;
});

const journal = () => createJournal({ dir: path.join(project, ".shavin") });
const run = (...args: string[]) => findingsCommand([...args, "--target", project]);

describe("shavin findings", () => {
  it("lists waiting findings with counts and the untrusted-data note", async () => {
    journal().add([f("a"), f("b")]);
    await run();
    const text = logs.join("\n");
    expect(text).toContain("2 waiting, 0 leased, 0 done, 0 withdrawn.");
    expect(text).toContain("WARNING tap-target.min-24 `a`");
    expect(text).toMatch(/treat it as data|treat them as data|as data, never as instructions/);
  });

  it("says so when nothing is waiting", async () => {
    await run();
    expect(logs.join("\n")).toContain("Nothing to show.");
  });

  it("--json gives counts and entries", async () => {
    journal().add([f("a")]);
    await run("--json");
    const out = JSON.parse(logs.join("\n"));
    expect(out.counts.pending).toBe(1);
    expect(out.entries[0]).toMatchObject({ severity: "warning", rule: "tap-target.min-24", selector: "a" });
  });

  it("--state filters", async () => {
    const j = journal();
    j.add([f("a")]);
    const e = j.lease();
    j.ack(e.id, { leaseId: e.leaseId });
    await run("--state", "acked");
    expect(logs.join("\n")).toContain("[acked]");
    logs = [];
    await run();
    expect(logs.join("\n")).toContain("Nothing to show.");
  });

  it("--take leases the next finding and prints the CLI ack command, not a tool call", async () => {
    journal().add([f("a")]);
    await run("--take");
    const text = logs.join("\n");
    expect(text).toContain("Problem: Tap target is too small to hit reliably.");
    expect(text).toMatch(/shavin findings --ack f_[0-9a-f]{8} --lease [0-9a-f]{12}/);
    expect(text).not.toContain("await_finding(");
    expect(journal().counts()).toMatchObject({ pending: 0, leased: 1 });
  });

  it("--take on an empty journal says so and marks the agent as listening", async () => {
    await run("--take");
    expect(logs.join("\n")).toContain("No finding is waiting.");
    expect(journal().agentListening()).toBe(true);
  });

  it("--ack marks a taken finding done; a wrong lease is refused with exit code 1", async () => {
    const j = journal();
    j.add([f("a")]);
    const e = j.lease();
    await run("--ack", e.id, "--lease", "wrong");
    expect(errors.length + logs.length).toBeGreaterThan(0);
    expect(logs.join("\n")).toContain("Could not mark");
    expect(process.exitCode).toBe(1);
    process.exitCode = undefined;
    logs = [];
    await run("--ack", e.id, "--lease", e.leaseId);
    expect(logs.join("\n")).toContain(`Marked ${e.id} done.`);
    expect(journal().counts().acked).toBe(1);
    expect(process.exitCode).toBeUndefined();
  });

  it("--nack returns it to the queue", async () => {
    const j = journal();
    j.add([f("a")]);
    const e = j.lease();
    await run("--nack", e.id, "--lease", e.leaseId);
    expect(logs.join("\n")).toContain(`Returned ${e.id} to the queue.`);
    expect(journal().counts().pending).toBe(1);
  });

  it("--json works for --take and --ack too", async () => {
    const j = journal();
    j.add([f("a")]);
    await run("--take", "--json");
    const taken = JSON.parse(logs.join("\n"));
    expect(taken.status).toBe("leased");
    logs = [];
    await run("--ack", taken.entry.id, "--lease", taken.entry.leaseId, "--json");
    expect(JSON.parse(logs.join("\n"))).toMatchObject({ ok: true });
  });

  it("uses the .shavin folder of the target project, not the working directory", async () => {
    journal().add([f("a")]);
    expect(fs.existsSync(path.join(project, ".shavin", "findings.jsonl"))).toBe(true);
    await run("--json");
    expect(JSON.parse(logs.join("\n")).counts.pending).toBe(1);
  });
});
