import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../../packages/mcp-server/src/server.mjs";
import { createServerWithTools } from "../../packages/mcp-server/src/remote/server.mjs";
import { MCP_VERSION } from "../../packages/mcp-server/src/version.mjs";

const MCP = path.resolve(__dirname, "../../packages/mcp-server");
const pkg = JSON.parse(fs.readFileSync(path.join(MCP, "package.json"), "utf8"));

async function serverVersion(server: any) {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "version-test", version: "0.0.0" });
  await Promise.all([server.connect(b), client.connect(a)]);
  const info = client.getServerVersion();
  await client.close();
  return info;
}

describe("MCP serverInfo version", () => {
  it("is read from the package's own package.json", () => {
    expect(MCP_VERSION).toBe(pkg.version);
  });
  it("the stdio server reports it", async () => {
    expect(await serverVersion(createMcpServer())).toMatchObject({ name: "shavin", version: pkg.version });
  });
  it("the remote server reports it", async () => {
    expect(await serverVersion(createServerWithTools("remote"))).toMatchObject({ name: "shavin", version: pkg.version });
  });
  it("package.json is in the published package, and no version literal is left in the sources", () => {
    expect(pkg.files.some((f: string) => f === "src")).toBe(true); // src/version.mjs reads ../package.json, which npm always packs
    for (const f of ["src/server.mjs", "src/remote/server.mjs"]) {
      expect(fs.readFileSync(path.join(MCP, f), "utf8"), f).not.toMatch(/version: "\d+\.\d+\.\d+"/);
    }
  });
});
