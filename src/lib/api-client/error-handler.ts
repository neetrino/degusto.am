import { ApiError } from "./types";

/** User/effect cleanup or navigation cancelled an in-flight fetch. */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("aborted") || message.includes("AbortError");
}

/**
 * Check if error should be logged (skip 401 and 404 errors)
 * 401 - authentication errors are expected
 * 404 - resource not found is expected (e.g., product doesn't exist)
 */
export function shouldLogError(status: number): boolean {
  return status !== 401 && status !== 404;
}

/**
 * Check if error should be logged as warning (404 Not Found)
 */
export function shouldLogWarning(status: number): boolean {
  return status === 404;
}

/**
 * 422 from cart when quantity exceeds stock — expected; do not log as a client error.
 */
export function isInsufficientStockProblem(errorData: unknown): boolean {
  if (!errorData || typeof errorData !== "object") {
    return false;
  }
  const o = errorData as Record<string, unknown>;
  if (o.title === "Insufficient stock") {
    return true;
  }
  const detail = typeof o.detail === "string" ? o.detail : "";
  return (
    detail.includes("No more stock available") ||
    detail.includes("exceeds available stock")
  );
}

export function isQuietCartStockValidationError(status: number, errorData: unknown): boolean {
  return status === 422 && isInsufficientStockProblem(errorData);
}

/**
 * Checkout 422 means validation/business rule failure (expected user-facing flow).
 * It should surface in form UI, not as a noisy console error.
 */
export function isQuietCheckoutValidationError(status: number, url: string): boolean {
  const isValidationError = status === 422;
  const isCheckoutEndpoint = /\/api\/v1\/orders\/checkout(?:\?|$)/.test(url);
  return isValidationError && isCheckoutEndpoint;
}

/**
 * Cart read is non-critical for page rendering.
 * When backend is temporarily unstable, avoid noisy console errors for this endpoint.
 */
export function isQuietCartReadServerError(status: number, url: string): boolean {
  const isTransientServerError = status === 503 || (status >= 500 && status < 600);
  const isCartEndpoint = /\/api\/v1\/cart(?:\?|$)/.test(url);
  return isTransientServerError && isCartEndpoint;
}

/**
 * Some admin dashboard widgets are non-critical read-only panels.
 * On transient 5xx responses, UI falls back to empty state, so avoid noisy console errors.
 */
export function isQuietAdminDashboardReadServerError(status: number, url: string): boolean {
  const isServerError = status >= 500 && status < 600;
  const isDashboardEndpoint =
    /\/api\/v1\/admin\/dashboard\/top-products(?:\?|$)/.test(url) ||
    /\/api\/v1\/admin\/dashboard\/recent-orders(?:\?|$)/.test(url) ||
    /\/api\/v1\/admin\/dashboard\/user-activity(?:\?|$)/.test(url);

  return isServerError && isDashboardEndpoint;
}

/**
 * Cart line DELETE/PATCH after optimistic UI may target an already-removed row (404).
 */
export function isQuietCartItemNotFoundError(status: number, url: string): boolean {
  return status === 404 && /\/api\/v1\/cart\/items\/[^/]+(?:\?|$)/.test(url);
}

/**
 * Registration can legitimately return 409 when email/phone is already taken.
 * It is an expected validation outcome and should be handled by the form UI.
 */
export function isQuietRegisterConflictError(status: number, url: string): boolean {
  return status === 409 && /\/api\/v1\/auth\/register(?:\?|$)/.test(url);
}

/**
 * Guest-session reads that legitimately return 401 must not trigger global login redirect.
 */
export function isQuietGuestSessionAuthError(status: number, url: string): boolean {
  if (status !== 401) {
    return false;
  }

  return (
    /\/api\/v1\/users\/wishlist(?:\?|$)/.test(url) ||
    /\/api\/v1\/compare(?:\?|$)/.test(url)
  );
}

/**
 * Whether a 401 should clear auth and redirect to /login.
 */
export function shouldRedirectOnUnauthorized(status: number, url: string): boolean {
  if (status !== 401) {
    return false;
  }

  return !isQuietGuestSessionAuthError(status, url);
}

/**
 * Parse error response from API
 */
export async function parseErrorResponse(response: Response): Promise<{
  errorText: string;
  errorData: unknown;
}> {
  let errorText = '';
  let errorData: unknown = null;
  
  try {
    const text = await response.text();
    errorText = text || '';
    
    // Try to parse as JSON
    if (errorText && errorText.trim().startsWith('{')) {
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // If JSON parse fails, use text as is
      }
    }
  } catch {
    // If reading response fails, use empty values
  }
  
  return { errorText, errorData };
}

/**
 * Create API error from response
 */
export function createApiError(
  response: Response,
  errorText: string,
  errorData: unknown
): ApiError {
  const errorMessage = 
    (errorData && typeof errorData === 'object' && 'detail' in errorData ? String(errorData.detail) : '') ||
    (errorData && typeof errorData === 'object' && 'message' in errorData ? String(errorData.message) : '') ||
    (errorText ? String(errorText) : '') ||
    `API Error: ${response.status} ${response.statusText}`;
  
  return new ApiError(
    errorMessage,
    response.status,
    response.statusText || '',
    errorData
  );
}




