import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { runRenderCheck, scoreRender } from "../../packages/cli/src/lib/render-check.mjs";

const byId = (r: { checks: { id: string; status: string }[] }, id: string) => r.checks.find((c) => c.id === id)?.status;

describe("render check scoring", () => {
  it("passes a page where tokens, utilities and a Shavin component are styled", () => {
    const r = scoreRender({ loaded: true, status: 200, tokens: true, utilities: true, component: true });
    expect(r.ok).toBe(true);
    expect(byId(r, "component")).toBe("pass");
  });

  it("fails an unstyled page with a fix per gap (files can all exist and the page still render bare)", () => {
    const r = scoreRender({ loaded: true, status: 200, tokens: false, utilities: false, component: false });
    expect(r.ok).toBe(false);
    for (const id of ["tokens", "utilities", "component"]) expect(byId(r, id)).toBe("fail");
    expect(r.checks.filter((c: { status: string; fix?: string }) => c.status === "fail").every((c: { fix?: string }) => !!c.fix)).toBe(true);
  });

  it("does not fail a page that has no Shavin component to probe", () => {
    const r = scoreRender({ loaded: true, status: 200, tokens: true, utilities: true, component: null });
    expect(r.ok).toBe(true);
    expect(byId(r, "component")).toBe("info");
  });

  it("fails when the page does not load or returns an error status", () => {
    expect(scoreRender({ loaded: false, error: "Could not load" }).ok).toBe(false);
    expect(scoreRender({ loaded: true, status: 500, tokens: true, utilities: true, component: true }).ok).toBe(false);
  });
});

describe("runRenderCheck", () => {
  const fakeBrowser = (probe: object, status = 200) => ({
    launch: async () => ({
      newPage: async () => ({ goto: async () => ({ status: () => status }), evaluate: async () => probe }),
      close: async () => {},
    }),
  });

  it("runs the probe in the page and scores it", async () => {
    const ok = await runRenderCheck("http://localhost:3000/", { launch: fakeBrowser({ tokens: true, utilities: true, component: true }) });
    expect(ok.status).toBe("pass");
    const bad = await runRenderCheck("http://localhost:3000/", { launch: fakeBrowser({ tokens: true, utilities: false, component: false }) });
    expect(bad.status).toBe("fail");
    expect(byId(bad, "utilities")).toBe("fail");
  });

  it("reports a page that cannot be reached as a failure, not a crash", async () => {
    const launch = { launch: async () => ({ newPage: async () => ({ goto: async () => { throw new Error("net::ERR_CONNECTION_REFUSED"); } }), close: async () => {} }) };
    const r = await runRenderCheck("http://localhost:1/", { launch });
    expect(r.ok).toBe(false);
  });
});
