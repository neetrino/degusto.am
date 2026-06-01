import {
  clearClientAuthCookies,
  clearLegacyAuthLocalStorage,
  hasClientAuthSession,
} from "@/lib/auth/auth-cookies";

/**
 * JWT is stored in an HttpOnly cookie — not readable from client JS.
 * Same-origin API calls send the cookie via `credentials: 'include'`.
 */
export function getAuthToken(): string | null {
  return null;
}

/**
 * Whether the browser likely has an active auth session.
 */
export function hasAuthSession(): boolean {
  clearLegacyAuthLocalStorage();
  return hasClientAuthSession();
}

/**
 * Clears auth cookies and legacy localStorage keys.
 */
export async function clearAuthSession(): Promise<void> {
  clearClientAuthCookies();
  clearLegacyAuthLocalStorage();
  try {
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Best-effort server cookie clear
  }
}

/**
 * Handle 401 Unauthorized errors — clear auth and redirect
 */
export function handleUnauthorized() {
  if (typeof window === "undefined") return;

  console.warn("⚠️ [API CLIENT] Unauthorized (401) - clearing auth data");
  void clearAuthSession();

  window.dispatchEvent(new Event("auth-updated"));

  if (!window.location.pathname.includes("/login")) {
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = "/login?redirect=" + encodeURIComponent(currentPath);
  }
}
