/**
 * studio-relay.test.ts — Integration tests for the StudioRelay class.
 *
 * Tests the StudioRelay lifecycle (connect, inject, setTheme, getState,
 * clearCanvas, disconnect) using a mocked Supabase client. No live
 * WebSocket or relay server needed.
 *
 * The mock simulates:
 * - join_studio_session RPC (returns a session object)
 * - channel subscribe/unsubscribe
 * - broadcast send/receive
 * - studio_ready event after connect
 * - canvas_state event after state request
 * - canvas_rendered event after inject
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const RELAY_PATH = resolve(ROOT, "packages/mcp-server/src/bridge/studio-relay.mjs");

// ── Mock Supabase client ──────────────────────────────────────────────
//
// The StudioRelay lazily imports @supabase/supabase-js. We mock it
// before importing the relay module so the import resolves to our mock.

let mockChannel;
let mockSupabase;
let relayModule;

// Event handlers registered by the relay
let registeredHandlers = {};

function createMockChannel() {
  const handlers = {};
  const sentMessages = [];
  let subscribeCallback = null;

  return {
    on: vi.fn((event, filter, callback) => {
      // Register handler for broadcast events
      handlers[event] = handlers[event] || [];
      handlers[event].push(callback);
      return this;
    }),
    subscribe: vi.fn((cb) => {
      subscribeCallback = cb;
      // Simulate successful subscription
      setTimeout(() => cb("SUBSCRIBED"), 0);
    }),
    send: vi.fn((msg) => {
      sentMessages.push(msg);
    }),
    unsubscribe: vi.fn(() => Promise.resolve()),
    // Test helpers
    _handlers: handlers,
    _sentMessages: sentMessages,
    _simulateEvent: (eventType, payload) => {
      const callbacks = handlers["broadcast"] || [];
      for (const cb of callbacks) {
        cb({ payload: { type: eventType, payload } });
      }
    },
  };
}

function createMockSupabase() {
  mockChannel = createMockChannel();
  return {
    rpc: vi.fn(async (fnName, params) => {
      if (fnName === "join_studio_session") {
        return {
          data: {
            status: "active",
            session_id: "test-session-123",
            pairing_code: params.p_code,
          },
          error: null,
        };
      }
      return { data: null, error: { message: `Unknown RPC: ${fnName}` } };
    }),
    channel: vi.fn(() => mockChannel),
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  };
}

// Mock the @supabase/supabase-js module before importing relay
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => createMockSupabase()),
}));

beforeAll(async () => {
  relayModule = await import(RELAY_PATH);
});

beforeEach(() => {
  // Reset the global relay between tests
  relayModule.clearGlobalRelay();
  registeredHandlers = {};
  mockChannel = null;
  mockSupabase = null;
});

afterEach(() => {
  relayModule.clearGlobalRelay();
});

// ── Tests ─────────────────────────────────────────────────────────────

describe("StudioRelay: construction", () => {
  it("constructs with supabaseUrl and supabaseKey", () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    expect(relay.supabaseUrl).toBe("https://test.supabase.co");
    expect(relay.supabaseKey).toBe("test-key");
    expect(relay.connected).toBe(false);
    expect(relay.pairingCode).toBeNull();
  });

  it("throws without supabaseUrl", () => {
    expect(() => new relayModule.StudioRelay({ supabaseKey: "test-key" })).toThrow(
      "supabaseUrl and supabaseKey"
    );
  });

  it("throws without supabaseKey", () => {
    expect(() => new relayModule.StudioRelay({ supabaseUrl: "https://test.supabase.co" })).toThrow(
      "supabaseUrl and supabaseKey"
    );
  });

  it("uses custom logger when provided", () => {
    const customLogger = { error: vi.fn(), log: vi.fn(), warn: vi.fn() };
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
      logger: customLogger,
    });
    expect(relay.logger).toBe(customLogger);
  });

  it("defaults agentName to 'Shavin MCP Agent'", () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    expect(relay.agentName).toBe("Shavin MCP Agent");
  });

  it("defaults capabilities to compose, inject, audit, theme", () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    expect(relay.capabilities).toEqual(["compose", "inject", "audit", "theme"]);
  });
});

describe("StudioRelay: connect", () => {
  it("throws on invalid pairing code (too short)", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    await expect(relay.connect("ABC")).rejects.toThrow("Invalid pairing code");
  });

  it("throws on invalid pairing code (too long)", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    await expect(relay.connect("ABCDEFG")).rejects.toThrow("Invalid pairing code");
  });

  it("throws on empty pairing code", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    await expect(relay.connect("")).rejects.toThrow("Invalid pairing code");
  });

  it("throws if already connected", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    // Manually set connected state to simulate an existing connection
    relay.connected = true;
    await expect(relay.connect("K7M2X9")).rejects.toThrow("Already connected");
  });

  it("connects successfully with valid code and receives studio_ready", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    // Start connect (returns a promise that waits for studio_ready)
    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });

    // Simulate studio_ready event after a brief delay
    setTimeout(() => {
      mockChannel._simulateEvent("studio_ready", { blocks: [], theme: { accent: "grass" } });
    }, 50);

    const result = await connectPromise;

    expect(result.connected).toBe(true);
    expect(result.pairingCode).toBe("K7M2X9");
    expect(result.session).toBeDefined();
    expect(result.session.status).toBe("active");
    expect(relay.connected).toBe(true);
    expect(relay.pairingCode).toBe("K7M2X9");
  });

  it("overrides agentName when provided in opts", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { agentName: "Claude Agent", timeoutMs: 5000 });
    setTimeout(() => {
      mockChannel._simulateEvent("studio_ready", {});
    }, 50);

    await connectPromise;
    expect(relay.agentName).toBe("Claude Agent");
  });

  it("sends agent_join event after subscription", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => {
      mockChannel._simulateEvent("studio_ready", {});
    }, 50);

    await connectPromise;

    // Check that at least one message was sent (agent_join)
    const joinMessages = mockChannel._sentMessages.filter(
      (m) => m.payload?.type === "agent_join"
    );
    expect(joinMessages.length).toBeGreaterThanOrEqual(1);
    expect(joinMessages[0].payload.payload.agentName).toBe("Shavin MCP Agent");
  });

  it("handles expired session from RPC", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    // Override the mock to return expired status
    const { createClient } = await import("@supabase/supabase-js");
    createClient.mockImplementationOnce(() => ({
      ...createMockSupabase(),
      rpc: vi.fn(async () => ({
        data: { status: "expired" },
        error: null,
      })),
      channel: vi.fn(() => createMockChannel()),
    }));

    await expect(relay.connect("K7M2X9")).rejects.toThrow("expired");
  });

  it("handles RPC error from join_studio_session", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const { createClient } = await import("@supabase/supabase-js");
    createClient.mockImplementationOnce(() => ({
      ...createMockSupabase(),
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: "Session not found" },
      })),
      channel: vi.fn(() => createMockChannel()),
    }));

    await expect(relay.connect("K7M2X9")).rejects.toThrow("Failed to join session");
  });
});

describe("StudioRelay: inject", () => {
  it("throws when not connected", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    await expect(relay.inject([])).rejects.toThrow("Not connected");
  });

  it("injects blocks in replace mode", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    // Connect first
    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;

    // Simulate recent event to skip liveness check
    relay._lastStudioEventTs = Date.now();

    const blocks = [
      { id: "1", type: "Container", props: {}, children: [] },
      { id: "2", type: "Heading", props: { children: "Hello" }, children: [] },
    ];

    const result = await relay.inject(blocks, "replace");
    expect(result.injected).toBe(true);
    expect(result.blockCount).toBe(2);
    expect(result.mode).toBe("replace");

    // Verify the inject event was sent
    const injectMessages = mockChannel._sentMessages.filter(
      (m) => m.payload?.type === "canvas_inject"
    );
    expect(injectMessages.length).toBeGreaterThanOrEqual(1);
    expect(injectMessages[0].payload.payload.blocks).toEqual(blocks);
  });

  it("injects blocks in append mode", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;
    relay._lastStudioEventTs = Date.now();

    const blocks = [{ id: "1", type: "Button", props: {}, children: [] }];
    const result = await relay.inject(blocks, "append");
    expect(result.mode).toBe("append");

    const injectMessages = mockChannel._sentMessages.filter(
      (m) => m.payload?.type === "canvas_inject"
    );
    expect(injectMessages[injectMessages.length - 1].payload.payload.mode).toBe("append");
  });

  it("injects blocks with frame metadata", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;
    relay._lastStudioEventTs = Date.now();

    const blocks = [{ id: "1", type: "Box", props: {}, children: [] }];
    const frame = { title: "Mobile Hero", device: "mobile", width: 375, height: 667 };
    const result = await relay.inject(blocks, "replace", frame);
    expect(result.frame).toEqual(frame);

    const injectMessages = mockChannel._sentMessages.filter(
      (m) => m.payload?.type === "canvas_inject"
    );
    expect(injectMessages[injectMessages.length - 1].payload.payload.frame).toEqual(frame);
  });

  it("throws on non-array blocks", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;
    relay._lastStudioEventTs = Date.now();

    await expect(relay.inject("not an array")).rejects.toThrow("blocks must be an array");
  });
});

describe("StudioRelay: setTheme", () => {
  it("throws when not connected", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    await expect(relay.setTheme({})).rejects.toThrow("Not connected");
  });

  it("broadcasts canvas_theme event", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;
    relay._lastStudioEventTs = Date.now();

    const theme = { accent: "blue", dark: true, radius: "large" };
    const result = await relay.setTheme(theme);
    expect(result.applied).toBe(true);
    expect(result.theme).toEqual(theme);

    const themeMessages = mockChannel._sentMessages.filter(
      (m) => m.payload?.type === "canvas_theme"
    );
    expect(themeMessages.length).toBe(1);
    expect(themeMessages[0].payload.payload).toEqual({ ...theme, eventId: expect.any(String) });
  });
});

describe("StudioRelay: getState", () => {
  it("throws when not connected", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    await expect(relay.getState()).rejects.toThrow("Not connected");
  });

  it("receives canvas state from Studio", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;

    // Start state request
    const statePromise = relay.getState(5000);

    // Simulate Studio responding with canvas_state
    setTimeout(() => {
      mockChannel._simulateEvent("canvas_state", {
        blocks: [{ id: "1", type: "Card", props: {}, children: [] }],
        theme: { accent: "grass" },
      });
    }, 50);

    const state = await statePromise;
    expect(state.blocks).toBeDefined();
    expect(state.blocks.length).toBe(1);
    expect(state.theme.accent).toBe("grass");
  });
});

describe("StudioRelay: clearCanvas", () => {
  it("throws when not connected", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    await expect(relay.clearCanvas()).rejects.toThrow("Not connected");
  });

  it("broadcasts canvas_clear event", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;
    relay._lastStudioEventTs = Date.now();

    const result = await relay.clearCanvas();
    expect(result.cleared).toBe(true);

    const clearMessages = mockChannel._sentMessages.filter(
      (m) => m.payload?.type === "canvas_clear"
    );
    expect(clearMessages.length).toBe(1);
  });
});

describe("StudioRelay: disconnect", () => {
  it("returns disconnected:true when already disconnected", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    const result = await relay.disconnect();
    expect(result.disconnected).toBe(true);
  });

  it("sends agent_disconnect and cleans up after connect", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;

    expect(relay.connected).toBe(true);

    const result = await relay.disconnect();
    expect(result.disconnected).toBe(true);
    expect(relay.connected).toBe(false);
    expect(relay.pairingCode).toBeNull();
    expect(relay.channel).toBeNull();

    const disconnectMessages = mockChannel._sentMessages.filter(
      (m) => m.payload?.type === "agent_disconnect"
    );
    expect(disconnectMessages.length).toBe(1);
  });
});

describe("StudioRelay: event handling", () => {
  it("handles canvas_rendered event", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;

    // Start awaitRender
    const renderPromise = relay.awaitRender(5000);

    // Simulate canvas_rendered event
    setTimeout(() => {
      mockChannel._simulateEvent("canvas_rendered", { blockCount: 5, renderTime: 120 });
    }, 50);

    const result = await renderPromise;
    expect(result.blockCount).toBe(5);
    expect(result.renderTime).toBe(120);
  });

  it("handles agent_disconnect event from Studio side", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;

    expect(relay.connected).toBe(true);

    // Simulate Studio initiating disconnect
    mockChannel._simulateEvent("agent_disconnect", {});
    expect(relay.connected).toBe(false);
  });

  it("updates _lastStudioEventTs on any event", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;

    const tsBefore = relay._lastStudioEventTs;
    // Wait a bit then send another event
    await new Promise((r) => setTimeout(r, 10));
    mockChannel._simulateEvent("selection_change", { id: "test-node" });
    expect(relay._lastStudioEventTs).toBeGreaterThan(tsBefore);
  });
});

describe("StudioRelay: global relay management", () => {
  it("getGlobalRelay creates a new relay instance", async () => {
    relayModule.clearGlobalRelay();
    // Set env vars for relay construction
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

    const relay = await relayModule.getGlobalRelay();
    expect(relay).toBeInstanceOf(relayModule.StudioRelay);
    expect(relay.supabaseUrl).toBe("https://test.supabase.co");

    // Restore env
    if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (origKey) process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = origKey;
    else delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("getGlobalRelay returns same instance on subsequent calls", async () => {
    relayModule.clearGlobalRelay();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

    const relay1 = await relayModule.getGlobalRelay();
    const relay2 = await relayModule.getGlobalRelay();
    expect(relay1).toBe(relay2);

    relayModule.clearGlobalRelay();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("getActiveRelay returns null when not connected", () => {
    relayModule.clearGlobalRelay();
    expect(relayModule.getActiveRelay()).toBeNull();
  });

  it("getActiveRelay returns relay when connected", async () => {
    relayModule.clearGlobalRelay();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

    const relay = await relayModule.getGlobalRelay();
    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;

    const active = relayModule.getActiveRelay();
    expect(active).toBe(relay);
    expect(active.connected).toBe(true);

    await relay.disconnect();
    relayModule.clearGlobalRelay();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("clearGlobalRelay resets the global instance", async () => {
    relayModule.clearGlobalRelay();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

    await relayModule.getGlobalRelay();
    relayModule.clearGlobalRelay();
    expect(relayModule.getActiveRelay()).toBeNull();

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });
});

describe("StudioRelay: liveness check (_ensureLive)", () => {
  it("skips ping when recent event was received", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;

    // Set recent event timestamp
    relay._lastStudioEventTs = Date.now();

    const sentBefore = mockChannel._sentMessages.length;
    // Call a method that triggers _ensureLive
    await relay.inject([{ id: "1", type: "Box", props: {}, children: [] }], "replace");

    // No extra state_request should have been sent (only canvas_inject)
    const stateRequests = mockChannel._sentMessages.filter(
      (m) => m.payload?.type === "canvas_state_request"
    );
    // Only the one from connect phase (if any) — no new ones
    expect(stateRequests.length).toBe(0);
  });

  it("throws when Studio does not respond to liveness check", async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });

    const connectPromise = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 50);
    await connectPromise;

    // Set old event timestamp so liveness check is triggered
    relay._lastStudioEventTs = Date.now() - 30_000; // 30s ago

    // Don't simulate any response — the liveness check should time out
    // Use a short timeout
    await expect(
      relay.inject([{ id: "1", type: "Box", props: {}, children: [] }], "replace")
    ).rejects.toThrow("Studio connection lost");

    expect(relay.connected).toBe(false);
  });
});

describe("StudioRelay: session stays alive (regression)", () => {
  const make = async () => {
    const relay = new relayModule.StudioRelay({
      supabaseUrl: "https://test.supabase.co",
      supabaseKey: "test-key",
    });
    const p = relay.connect("K7M2X9", { timeoutMs: 5000 });
    setTimeout(() => mockChannel._simulateEvent("studio_ready", {}), 20);
    await p;
    return relay;
  };

  afterEach(() => vi.useRealTimers());

  it("idle check never throws (IDLE_DISCONNECT_MS used to be undefined) and keeps the session open", async () => {
    const relay = await make();
    relay._stopHeartbeat();
    vi.useFakeTimers();
    relay._lastStudioEventTs = Date.now();
    relay._startHeartbeat();
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000); // 10 idle minutes
    expect(relay.connected).toBe(true);
    const beats = mockChannel._sentMessages.filter((m) => m.payload?.type === "agent_heartbeat");
    expect(beats.length).toBeGreaterThanOrEqual(50); // every 10s
    relay._stopHeartbeat();
  });

  it("only flags Studio as silent after a very long silence, and never disconnects", async () => {
    const relay = await make();
    relay._stopHeartbeat();
    vi.useFakeTimers();
    relay._lastStudioEventTs = Date.now();
    relay._startHeartbeat();
    await vi.advanceTimersByTimeAsync(3 * 60 * 60 * 1000);
    expect(relay.studioSilent).toBe(true);
    expect(relay.connected).toBe(true);
    // any Studio event clears the flag
    mockChannel._simulateEvent("studio_heartbeat", { ts: Date.now() });
    expect(relay.studioSilent).toBe(false);
    relay._stopHeartbeat();
  });

  it("answers studio_hello with an immediate heartbeat", async () => {
    const relay = await make();
    const before = mockChannel._sentMessages.filter((m) => m.payload?.type === "agent_heartbeat").length;
    mockChannel._simulateEvent("studio_hello", { ts: Date.now() });
    const after = mockChannel._sentMessages.filter((m) => m.payload?.type === "agent_heartbeat").length;
    expect(after).toBe(before + 1);
    relay._stopHeartbeat();
  });

  it("stamps every canvas command with a unique eventId so Studio can drop repeats", async () => {
    const relay = await make();
    await relay.inject([{ id: "a", type: "Text", props: {}, children: [] }], "replace");
    await relay.inject([{ id: "b", type: "Text", props: {}, children: [] }], "append");
    const ids = mockChannel._sentMessages
      .filter((m) => m.payload?.type === "canvas_inject")
      .map((m) => m.payload.payload.eventId);
    expect(ids).toHaveLength(2);
    expect(ids.every((i) => typeof i === "string" && i.length > 8)).toBe(true);
    expect(new Set(ids).size).toBe(2);
    relay._stopHeartbeat();
  });
});
