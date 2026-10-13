/**
 * @shavin/ui — Domain & Cross-Subdomain URL Resolver
 * Handles environment-aware routing between Shavin apps across localhost dev ports
 * and production shavin.cc subdomains.
 */

export function isLocalhost(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  }
  return false;
}

export function getWebsiteUrl(path: string = ""): string {
  const base = process.env.NEXT_PUBLIC_WEBSITE_URL || (isLocalhost() ? "http://localhost:3300" : "https://www.shavin.cc");
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base.replace(/\/$/, "")}${cleanPath}`;
}

export function getStudioUrl(path: string = ""): string {
  const base = process.env.NEXT_PUBLIC_STUDIO_URL || (isLocalhost() ? "http://localhost:3200" : "https://studio.shavin.cc");
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base.replace(/\/$/, "")}${cleanPath}`;
}

export function getDocsUrl(path: string = ""): string {
  const base = process.env.NEXT_PUBLIC_DOCS_URL || (isLocalhost() ? "http://localhost:3100" : "https://docs.shavin.cc");
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base.replace(/\/$/, "")}${cleanPath}`;
}

export function getCommunityUrl(path: string = ""): string {
  const base = process.env.NEXT_PUBLIC_COMMUNITY_URL || (isLocalhost() ? "http://localhost:3400" : "https://community.shavin.cc");
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base.replace(/\/$/, "")}${cleanPath}`;
}

export function getKitsUrl(path: string = ""): string {
  const base = process.env.NEXT_PUBLIC_KITS_URL || (isLocalhost() ? "http://localhost:3500" : "https://kits.shavin.cc");
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base.replace(/\/$/, "")}${cleanPath}`;
}

export function getAssetsUrl(path: string = ""): string {
  const custom = process.env.NEXT_PUBLIC_ASSETS_URL;
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  if (custom) {
    return `${custom.replace(/\/$/, "")}${cleanPath}`;
  }
  // In production, reference the single global assets location at www.shavin.cc/assets
  if (!isLocalhost()) {
    return `https://www.shavin.cc/assets${cleanPath}`;
  }
  // In local dev, use local public assets
  return `/assets${cleanPath}`;
}
