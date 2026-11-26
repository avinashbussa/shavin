import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../../packages/mcp-server/src/server.mjs";
import { SHAVIN_META } from "../../packages/ui/src/lib/meta";

const ROOT = path.resolve(__dirname, "../..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

/** Every tool the registry can list (a plain install lists fewer until a Studio session or bridge tab connects). */
async function registryTools(): Promise<string[]> {
  const before = process.env.SHAVIN_MCP_ALL_TOOLS;
  process.env.SHAVIN_MCP_ALL_TOOLS = "1";
  try {
    const server = createMcpServer();
    const [a, b] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "readme-tools-test", version: "0.0.0" });
    await Promise.all([server.connect(b), client.connect(a)]);
    const { tools } = await client.listTools();
    await client.close();
    return tools.map((t) => t.name).sort();
  } finally {
    if (before === undefined) delete process.env.SHAVIN_MCP_ALL_TOOLS;
    else process.env.SHAVIN_MCP_ALL_TOOLS = before;
  }
}

describe("the tool lists in the READMEs", () => {
  let tools: string[] = [];
  afterAll(() => void (tools = []));

  it("the registry size is SHAVIN_META.mcpToolCount", async () => {
    tools = await registryTools();
    expect(tools.length).toBe(SHAVIN_META.mcpToolCount);
  });

  for (const file of ["packages/mcp-server/README.md", "README.md"]) {
    it(`${file} names every tool in the registry`, async () => {
      tools = tools.length ? tools : await registryTools();
      const text = read(file);
      const missing = tools.filter((t) => !text.includes(`\`${t}\``));
      expect(missing, `tools missing from ${file}`).toEqual([]);
    });
  }

  it("the mcp-server README heading states the registry size", () => {
    expect(read("packages/mcp-server/README.md")).toContain(`## Tools (${SHAVIN_META.mcpToolCount})`);
  });
});
