import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
// @ts-expect-error — plain .mjs modules without types
import { createServerWithTools } from "../../packages/mcp-server/src/remote/server.mjs";
// @ts-expect-error — plain .mjs modules without types
import { getEnabledTools } from "../../packages/mcp-server/src/remote/transport.mjs";

async function listTools(transport: "remote" | "rest") {
  const server = createServerWithTools(transport);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientSide);
  const { tools } = await client.listTools();
  await client.close();
  return tools.map((t) => t.name).sort();
}

describe("remote MCP transport", () => {
  it("registers every tool its transport filter enables, including plan_page and check_page", async () => {
    const names = await listTools("remote");
    expect(names).toEqual([...getEnabledTools("remote")].sort());
    expect(names).toContain("plan_page");
    expect(names).toContain("check_page");
  });
});
