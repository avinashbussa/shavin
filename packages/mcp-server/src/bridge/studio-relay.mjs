/**
 * StudioRelay — AI-side Supabase Realtime client for live Studio canvas control.
 *
 * This class is used by the MCP server's `connect_studio`, `compose_to_canvas`,
 * `inject_blocks`, `set_studio_theme`, `get_studio_state`, `clear_studio_canvas`,
 * and `disconnect_studio` tools.
 *
 * Lifecycle:
 *   1. `connect(code)` — joins a Studio session by pairing code, subscribes
 *      to the Supabase Realtime channel, and waits for the Studio's
 *      `studio_ready` event confirming the connection is live.
 *   2. `inject(blocks, mode)` — broadcasts `canvas_inject` to the Studio,
 *      which replaces or appends blocks on the canvas.
 *   3. `setTheme(theme)` — broadcasts `canvas_theme` to update theme config.
 *   4. `getState()` — requests `canvas_state_request` and waits for the
 *      Studio to reply with `canvas_state`.
 *   5. `clearCanvas()` — broadcasts `canvas_clear` to remove all blocks.
 *   6. `disconnect()` — sends `agent_disconnect` and cleans up the channel.
 *
 * The relay uses a request-response pattern for `getState` with a
 * configurable timeout (default 5 seconds).
 */

// Lazy import — @supabase/supabase-js may not be installed in the MCP package.
// The MCP server passes env vars from the consumer project.
import { randomUUID } from "node:crypto";

let createClientFn = null;

/** Agent → Studio heartbeat cadence. Studio treats 150s of silence as "agent gone". */
const HEARTBEAT_INTERVAL_MS = 10_000;
/**
 * Studio now beats every 20s while open. If we hear nothing at all for this
 * long, the Studio tab is closed or the machine slept. Deliberately generous:
 * we only flag it (tools then report "Studio is not responding"), we never
 * tear the session down, so coming back resumes work without a new code.
 */
const STUDIO_SILENT_MS = 2 * 60 * 60 * 1000;

async function getSupabaseClient() {
  if (!createClientFn) {
    const mod = await import("@supabase/supabase-js");
    createClientFn = mod.createClient;
  }
  return createClientFn;
}

/**
 * @typedef {Object} StudioBlock
 * @property {string} id - Unique node id
 * @property {string} type - Component type (e.g. "Container", "Heading", "Button")
 * @property {Record<string, any>} props - Component props
 * @property {StudioBlock[]} [children] - Child blocks
 */

/**
 * @typedef {Object} StudioTheme
 * @property {string} [accent] - Accent color preset name
 * @property {string} [gray] - Gray color preset name
 * @property {string} [radius] - Radius preset name
 * @property {boolean} [dark] - Dark mode toggle
 * @property {string} [scaling] - Scaling percentage (e.g. "95%")
 * @property {string} [panelBackground] - Panel background style
 */

export class StudioRelay {
  constructor({ supabaseUrl, supabaseKey, logger = console } = {}) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "StudioRelay requires supabaseUrl and supabaseKey. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the environment."
      );
    }
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.logger = logger;

    /** @type {ReturnType<Awaited<ReturnType<typeof getSupabaseClient>>>|null} */
    this.supabase = null;
    this.channel = null;
    this.pairingCode = null;
    this.connected = false;
    this.agentName = "Shavin MCP Agent";
    this.capabilities = ["compose", "inject", "audit", "theme"];

    // Internal state for request-response pattern
    this._stateResolve = null;
    this._stateTimeout = null;
    this._lastCanvasState = null;
    this._renderResolve = null;

    // Liveness tracking — updated whenever we receive ANY event from Studio
    this._lastStudioEventTs = null;

    // Idle disconnect — if Studio hasn't sent any event in 15 min, the session
    // is abandoned. The agent sends heartbeats but if nobody's listening...
    this._idleCheckInterval = null;

    // Bound handlers
    this._onBroadcast = this._onBroadcast.bind(this);
  }

  /**
   * Connect to a Studio session by pairing code.
   * Waits for the Studio's `studio_ready` event before resolving.
   *
   * @param {string} pairingCode - 6-char pairing code from Studio's "Connect AI" modal
   * @param {Object} [opts]
   * @param {string} [opts.agentName] - Override agent display name
   * @param {number} [opts.timeoutMs=10000] - Max wait for studio_ready
   * @returns {Promise<{connected: boolean, session: Object, pairingCode: string}>}
   */
  async connect(pairingCode, opts = {}) {
    if (this.connected) {
      throw new Error("Already connected. Call disconnect() first.");
    }
    if (!pairingCode || pairingCode.length !== 6) {
      throw new Error(`Invalid pairing code: "${pairingCode}". Must be 6 characters.`);
    }

    const { agentName, timeoutMs = 10000, subscribeTimeoutMs = 8000 } = opts;
    if (agentName) this.agentName = agentName;

    // Initialize Supabase client
    const createClient = await getSupabaseClient();
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.pairingCode = pairingCode;

    // Join the session via RPC
    this.logger.error(`[StudioRelay] Joining session ${pairingCode}...`);
    const { data: session, error } = await this.supabase.rpc("join_studio_session", {
      p_code: pairingCode,
      p_agent_name: this.agentName,
      p_capabilities: this.capabilities,
    });

    if (error) {
      throw new Error(`Failed to join session: ${error.message}`);
    }

    if (!session || session.status === "expired") {
      throw new Error(`Session not found or expired. Ask the user for a fresh pairing code from Studio.`);
    }

    // Subscribe to Realtime channel
    const channelName = `studio-session:${pairingCode}`;
    this.channel = this.supabase.channel(channelName);

    // Listen for all broadcast events from Studio
    this.channel.on("broadcast", { event: "*" }, this._onBroadcast);

    // Wait for studio_ready with timeout
    const readyPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timed out waiting for Studio ready after ${timeoutMs}ms. Is Studio open with pairing code ${pairingCode}?`));
      }, timeoutMs);

      this._readyResolve = (data) => {
        clearTimeout(timeout);
        resolve(data);
      };
    });

    // Subscribe — with its own timeout so a channel that keeps retrying (e.g. a
    // relay auth failure) can't hang the connect forever; tear it down on failure
    // so it stops reconnecting in the background.
    await new Promise((resolve, reject) => {
      const fail = async (err) => {
        try { await this.channel?.unsubscribe(); } catch {}
        this.channel = null;
        reject(err);
      };
      const subTimeout = setTimeout(
        () => fail(new Error(`Realtime connection did not establish within ${Math.round(subscribeTimeoutMs / 1000)}s — the channel kept retrying without connecting.`)),
        subscribeTimeoutMs,
      );
      this.channel.subscribe((status) => {
        if (status === "SUBSCRIBED") { clearTimeout(subTimeout); resolve(); }
        else if (status === "CHANNEL_ERROR") { clearTimeout(subTimeout); fail(new Error("Realtime channel error — the Studio relay rejected the connection.")); }
        else if (status === "TIMED_OUT") { clearTimeout(subTimeout); fail(new Error("Realtime channel timed out connecting to the Studio relay.")); }
      });
    });

    // Send agent_join
    this._send({
      type: "agent_join",
      payload: {
        agentName: this.agentName,
        capabilities: this.capabilities,
      },
    });

    // Wait for Studio to confirm
    const readyData = await readyPromise;
    this.connected = true;
    this.logger.error(`[StudioRelay] Connected to Studio. Session: ${session.status}`);

    // Phase 4: Start heartbeat interval (every 15s)
    this._startHeartbeat();

    return {
      connected: true,
      session,
      pairingCode,
      studioInfo: readyData,
    };
  }

  /**
   * Inject blocks into the Studio canvas.
   *
   * @param {StudioBlock[]} blocks - Block tree to inject
   * @param {"replace"|"append"} [mode="replace"] - Injection mode
   * @param {object} [frame] - Optional frame metadata; when provided a new
   *   spatial frame is created on the canvas and blocks are placed in it.
   * @param {string} [frame.title] - Frame title (default: "AI Frame N")
   * @param {"desktop"|"mobile"|"tablet"|"auto"|"block"} [frame.device] - Device preset
   * @param {number} [frame.width] - Frame width in px (default: 800)
   * @param {number} [frame.height] - Frame height in px (default: 600)
   * @returns {Promise<{injected: boolean, blockCount: number, mode: string, frame?: object}>}
   */
  async inject(blocks, mode = "replace", frame = undefined) {
    await this._ensureLive();

    if (!Array.isArray(blocks)) {
      throw new Error("blocks must be an array of BlockNode objects");
    }

    const payload = {
      type: "canvas_inject",
      payload: frame ? { blocks, mode, frame } : { blocks, mode },
    };

    this._send(payload);

    return {
      injected: true,
      blockCount: blocks.length,
      mode,
      ...(frame ? { frame } : {}),
    };
  }

  /**
   * Set the Studio canvas theme.
   *
   * @param {StudioTheme} theme - Theme configuration
   * @returns {Promise<{applied: boolean, theme: StudioTheme}>}
   */
  async setTheme(theme) {
    await this._ensureLive();

    this._send({
      type: "canvas_theme",
      payload: theme,
    });

    return {
      applied: true,
      theme,
    };
  }

  /**
   * Request current canvas state from Studio.
   * Uses request-response pattern with timeout.
   *
   * @param {number} [timeoutMs=5000] - Max wait for response
   * @returns {Promise<{blocks: StudioBlock[], theme: StudioTheme}>}
   */
  async getState(timeoutMs = 5000) {
    this._requireConnected();

    const statePromise = new Promise((resolve, reject) => {
      this._stateTimeout = setTimeout(() => {
        this._stateResolve = null;
        reject(new Error(`Timed out waiting for canvas state after ${timeoutMs}ms`));
      }, timeoutMs);

      this._stateResolve = (data) => {
        clearTimeout(this._stateTimeout);
        this._stateResolve = null;
        resolve(data);
      };
    });

    this._send({
      type: "canvas_state_request",
      payload: {},
    });

    const state = await statePromise;
    this._lastCanvasState = state;
    return state;
  }

  /**
   * Wait for Studio to confirm that the last inject has been rendered.
   * Studio sends a "canvas_rendered" event after React commits the blocks.
   *
   * @param {number} [timeoutMs=10000] - Max wait for render confirmation
   * @returns {Promise<{blockCount: number, renderTime: number}>}
   */
  async awaitRender(timeoutMs = 10000) {
    this._requireConnected();

    const renderPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._renderResolve = null;
        reject(new Error(`Timed out waiting for render confirmation after ${timeoutMs}ms`));
      }, timeoutMs);

      this._renderResolve = (data) => {
        clearTimeout(timeout);
        this._renderResolve = null;
        resolve(data);
      };
    });

    return renderPromise;
  }

  /**
   * Clear all blocks from the Studio canvas.
   *
   * @returns {Promise<{cleared: boolean}>}
   */
  async clearCanvas() {
    await this._ensureLive();

    this._send({
      type: "canvas_clear",
      payload: {},
    });

    return { cleared: true };
  }

  /**
   * Disconnect from the Studio session.
   * Sends agent_disconnect event and cleans up the channel.
   *
   * @returns {Promise<{disconnected: boolean}>}
   */
  async disconnect() {
    if (!this.connected && !this.channel) {
      return { disconnected: true };
    }

    // Send disconnect event
    if (this.connected) {
      this._send({
        type: "agent_disconnect",
        payload: {},
      });
    }

    // Unsubscribe channel
    if (this.channel) {
      try {
        await this.channel.unsubscribe();
      } catch {
        // Ignore
      }
    }

    // Mark the session disconnected in the DB. Must go through the RPC: the
    // anonymous agent has no UPDATE policy, so a direct update is silently refused.
    if (this.supabase && this.pairingCode) {
      try {
        await this.supabase.rpc("leave_studio_session", { p_code: this.pairingCode });
      } catch {
        // Non-fatal
      }
    }

    // Cleanup state
    this._stopHeartbeat();
    this.connected = false;
    this.channel = null;
    this.pairingCode = null;
    this.supabase = null;
    this._lastCanvasState = null;

    if (this._stateTimeout) {
      clearTimeout(this._stateTimeout);
      this._stateTimeout = null;
    }

    this.logger.error("[StudioRelay] Disconnected.");
    return { disconnected: true };
  }

  // -----------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------

  /**
   * @private
   * Per-action liveness check. Skips the ping if we received an event from
   * Studio in the last 20s (zero latency during active sessions). Otherwise
   * sends a canvas_state_request with a 3s timeout. If Studio does not
   * respond, marks the connection as dead and throws a clear error so the
   * agent can tell the user to get a fresh pairing code.
   */
  async _ensureLive() {
    this._requireConnected();

    // Fast path: if we received any event from Studio recently, skip the ping
    if (this._lastStudioEventTs && Date.now() - this._lastStudioEventTs < 20_000) {
      return;
    }

    // Active probe: reuse the canvas_state_request -> canvas_state round-trip
    const pingPromise = new Promise((resolve, reject) => {
      this._stateTimeout = setTimeout(() => {
        this._stateResolve = null;
        reject(new Error("Studio did not respond to liveness check"));
      }, 3000);

      this._stateResolve = (data) => {
        clearTimeout(this._stateTimeout);
        this._stateResolve = null;
        resolve(data);
      };
    });

    this._send({
      type: "canvas_state_request",
      payload: {},
    });

    try {
      await pingPromise;
    } catch {
      this.connected = false;
      throw new Error(
        "Studio connection lost. The page may have been refreshed or closed. " +
        "Call connect_studio again with a fresh pairing code from Studio's 'Connect AI' modal."
      );
    }
  }

  /** @private */
  _requireConnected() {
    if (!this.connected || !this.channel) {
      throw new Error("Not connected to Studio. Call connect_studio first with a valid pairing code.");
    }
  }

  /** @private — Phase 4: Send periodic heartbeats so Studio knows we're alive */
  _startHeartbeat() {
    this._stopHeartbeat();
    this._heartbeatInterval = setInterval(() => {
      try {
        if (this.connected && this.channel) this._sendHeartbeat();
      } catch (err) {
        this.logger.error(`[StudioRelay] heartbeat failed: ${err?.message || err}`);
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Silence check. Never throws and never ends the session.
    this._idleCheckInterval = setInterval(() => {
      try {
        if (this.connected && this._lastStudioEventTs) {
          const silentMs = Date.now() - this._lastStudioEventTs;
          const wasSilent = this.studioSilent === true;
          this.studioSilent = silentMs > STUDIO_SILENT_MS;
          if (this.studioSilent && !wasSilent) {
            this.logger.error(
              `[StudioRelay] No events from Studio for ${Math.round(silentMs / 1000)}s. Keeping the session open; Studio may be closed.`
            );
          }
        }
      } catch (err) {
        this.logger.error(`[StudioRelay] silence check failed: ${err?.message || err}`);
      }
    }, 60_000);
  }

  /** @private */
  _sendHeartbeat() {
    this._send({
      type: "agent_heartbeat",
      payload: { agentName: this.agentName, ts: Date.now() },
    });
  }

  /** @private */
  _stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
    if (this._idleCheckInterval) {
      clearInterval(this._idleCheckInterval);
      this._idleCheckInterval = null;
    }
  }

  /** @private */
  _send(event) {
    if (!this.channel) return;
    // Commands get a unique id so Studio can ignore an accidental repeat.
    if (typeof event.type === "string" && event.type.startsWith("canvas_") && event.payload && !event.payload.eventId) {
      event = { ...event, payload: { ...event.payload, eventId: randomUUID() } };
    }
    this.channel.send({
      type: "broadcast",
      event: "relay_event",
      payload: event,
    });
  }

  /** @private */
  _onBroadcast(msg) {
    const event = msg.payload;
    if (!event || !event.type) return;

    // Track last event timestamp for per-action liveness checks
    this._lastStudioEventTs = Date.now();
    this.studioSilent = false;

    switch (event.type) {
      case "studio_hello":
        // Studio reloaded / rejoined and is verifying us: answer immediately
        // instead of making it wait for the next 10s beat.
        try { if (this.connected && this.channel) this._sendHeartbeat(); } catch {}
        break;

      case "studio_heartbeat":
        // Passive: updating _lastStudioEventTs above is the point.
        break;

      case "studio_ready":
        if (this._readyResolve) {
          this._readyResolve(event.payload || {});
          this._readyResolve = null;
        }
        break;

      case "canvas_state":
        this._lastCanvasState = event.payload || {};

        // During connect phase, the first canvas_state acts as studio_ready
        if (this._readyResolve) {
          this._readyResolve(event.payload || {});
          this._readyResolve = null;
        }

        // Response to explicit state request
        if (this._stateResolve) {
          this._stateResolve(event.payload || {});
        }
        break;

      case "canvas_rendered":
        // Studio confirmed that the injected blocks have been rendered.
        // This is the render verification signal — the agent now knows
        // the design is visible on the canvas.
        this.logger.error(
          `[StudioRelay] Canvas rendered: ${event.payload?.blockCount || 0} blocks, ${event.payload?.renderTime || 0}ms`
        );
        if (this._renderResolve) {
          this._renderResolve(event.payload || {});
          this._renderResolve = null;
        }
        break;

      case "selection_change":
        // Passive — no action needed by relay itself
        this.logger.error(
          `[StudioRelay] Selection changed: ${event.payload?.id || "null"}`
        );
        break;

      case "audit_result":
        // Passive — stored for potential retrieval
        this.logger.error(
          `[StudioRelay] Audit result: ${event.payload?.violations?.length || 0} violations, score ${event.payload?.score}`
        );
        break;

      case "agent_disconnect":
        // Studio initiated disconnect
        this.logger.error("[StudioRelay] Studio initiated disconnect.");
        this.connected = false;
        break;

      default:
        this.logger.error(`[StudioRelay] Unknown event: ${event.type}`);
    }
  }
}

/**
 * Global relay instance — reused across MCP tool calls within a session.
 * The first `connect_studio` call creates it; subsequent tools use it.
 */
let globalRelay = null;

/**
 * Get or create the global StudioRelay instance.
 *
 * @param {Object} env - Environment variables
 * @returns {Promise<StudioRelay>}
 */
// Defaults point at the hosted studio.shavin.cc Supabase project so that
// `connect_studio` works out-of-the-box for end users who installed @shavin/mcp
// (e.g. from a private Verdaccio registry) without manually provisioning keys.
// These are publishable (anon) keys — public by design, embedded in the hosted
// Studio's client bundle, protected by RLS. Override via env to self-host.
const DEFAULT_SUPABASE_URL = "https://hiahexcutplsrijyjozs.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_6fBMDK1uJIHwxI2yLUBmXQ_r6RILnt-";

export async function getGlobalRelay(env = process.env) {
  if (!globalRelay) {
    globalRelay = new StudioRelay({
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
      supabaseKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY,
    });
  }
  return globalRelay;
}

/**
 * Get the current global relay (without creating one).
 * Returns null if not connected.
 */
export function getActiveRelay() {
  if (globalRelay && globalRelay.connected) {
    return globalRelay;
  }
  return null;
}

/**
 * Clear the global relay (called on disconnect).
 */
export function clearGlobalRelay() {
  globalRelay = null;
}
