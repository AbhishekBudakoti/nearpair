import axios from "axios";

/**
 * Base URL of the backend REST API, e.g. "http://localhost:3000/api".
 * Configured via VITE_API_URL so it can differ between dev/staging/prod
 * without touching source.
 */
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Origin the backend's Socket.io server is served from. Prefers an explicit
 * VITE_SOCKET_URL — needed once VITE_API_URL points at a same-origin proxy
 * path like "/api" (see Frontend/vercel.json's rewrite, added to work around
 * iOS Safari/WebKit blocking the cross-site auth cookie) rather than the
 * backend's real origin. Falls back to deriving it from API_URL, which is
 * all local dev needs since API_URL there is still the backend's real origin.
 */
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, "");

/**
 * Event fired on `window` when the backend reports the account is suspended.
 * AuthContext listens for it and signs the user out.
 */
export const SUSPENDED_EVENT = "auth:suspended";

/**
 * Shared Axios instance for all backend requests. Sends cookies with every
 * request so the httpOnly auth cookie set by /auth/login is included.
 */
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  // Without a timeout an unreachable backend leaves requests pending forever,
  // which keeps the app stuck on "Checking auth status...".
  timeout: 10000,
});

// A suspension can land mid-session (an admin acts while the user is browsing),
// so any request may be the one that discovers it.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data } = error.response || {};
    if (status === 403 && data?.code === "ACCOUNT_SUSPENDED") {
      window.dispatchEvent(new CustomEvent(SUSPENDED_EVENT, { detail: { message: data.message } }));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
