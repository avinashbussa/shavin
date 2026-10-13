/**
 * Supabase JWT Bearer Token Auth Middleware
 *
 * Validates Supabase access tokens sent by AI agents in the
 * Authorization: Bearer <token> header.
 *
 * Flow:
 *   1. AI agent gets 401 from MCP server → discovers auth metadata
 *   2. User authenticates via shavin.cc (Supabase OAuth: GitHub/Google)
 *   3. User copies their session token to the AI agent config
 *   4. Agent sends token in Authorization header
 *   5. This middleware validates via Supabase auth.getUser() API
 *
 * For Phase 3b we use direct JWT validation. A full OAuth 2.1 discovery
 * + token exchange flow can be layered on top in Phase 4.
 */

/**
 * OAuth metadata returned at /.well-known/oauth-authorization-server
 * This tells MCP clients how to authenticate.
 */
export function getOAuthMetadata(origin) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/api/auth/callback`,
    token_endpoint: `${origin}/api/auth/token`,
    registration_endpoint: `${origin}/api/auth/register`,
    revocation_endpoint: `${origin}/api/auth/revoke`,
    scopes_supported: ["studio:read", "studio:write", "studio:compose"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    code_challenge_methods_supported: ["S256"],
  };
}

/**
 * Validate a Supabase JWT access token.
 * Uses the Supabase auth.getUser() API which verifies the JWT server-side.
 *
 * @param {string} token - The JWT access token
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseAnonKey - Supabase anon key
 * @returns {Promise<{valid: boolean, user?: object, error?: string}>}
 */
export async function validateSupabaseToken(token, supabaseUrl, supabaseAnonKey) {
  if (!token) {
    return { valid: false, error: "No token provided" };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { valid: false, error: "Token expired or invalid" };
      }
      return { valid: false, error: `Supabase auth returned ${response.status}` };
    }

    const user = await response.json();
    return { valid: true, user };
  } catch (err) {
    return {
      valid: false,
      error: `Failed to validate token: ${err instanceof Error ? err.message : "network error"}`,
    };
  }
}

/**
 * Extract bearer token from Authorization header.
 *
 * @param {string|undefined} authHeader
 * @returns {string|null}
 */
export function extractBearerToken(authHeader) {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Check if the HTTP request path is the MCP endpoint.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isMcpEndpoint(url) {
  const pathname = new URL(url, "http://localhost").pathname;
  return pathname === "/mcp" || pathname === "/api/mcp";
}

/**
 * Check if the request is for OAuth discovery metadata.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isOAuthDiscovery(url) {
  const pathname = new URL(url, "http://localhost").pathname;
  return (
    pathname === "/.well-known/oauth-authorization-server" ||
    pathname === "/.well-known/oauth-protected-resource"
  );
}
