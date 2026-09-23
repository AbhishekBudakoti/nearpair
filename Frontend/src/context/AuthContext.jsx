import { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiClient, { SUSPENDED_EVENT } from "../api/client";

/**
 * AuthContext provides the single source of truth for "who is logged in",
 * backed by GET /auth/me (the httpOnly cookie set on login is what actually
 * authenticates requests; this just tells the UI whether one is present).
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Profile picture, shown in the navbar next to the user's name. Lives on
  // the separate Profile document, not the User — undefined until a profile
  // exists, so the navbar falls back to the name/initial.
  const [avatarUrl, setAvatarUrl] = useState("");
  // Message shown on the login page when the user was signed out by the
  // server (e.g. "Your account is suspended until 2026-09-20").
  const [authNotice, setAuthNotice] = useState("");

  /**
   * Re-fetches just the avatar — call after a profile save so the navbar
   * picks up a new/changed/removed photo without a full auth re-check.
   */
  const refreshAvatar = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/profile/me");
      setAvatarUrl(data.data?.profile?.avatar || "");
    } catch {
      setAvatarUrl("");
    }
  }, []);

  /**
   * Re-checks auth status against the backend. Call after login/register/logout
   * so every consumer (Navbar, ProtectedRoute, pages) re-renders in sync.
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/auth/me");
      const nextUser = data.data?.user || null;
      setUser(nextUser);
      if (nextUser) {
        await refreshAvatar();
      } else {
        setAvatarUrl("");
      }
    } catch {
      setUser(null);
      setAvatarUrl("");
    } finally {
      setLoading(false);
    }
  }, [refreshAvatar]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setUser(null);
      setAvatarUrl("");
    }
  }, []);

  const clearAuthNotice = useCallback(() => setAuthNotice(""), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The API client fires this when any request comes back ACCOUNT_SUSPENDED;
  // dropping the user sends ProtectedRoute back to /login with the reason.
  useEffect(() => {
    const onSuspended = (event) => {
      setUser(null);
      setAuthNotice(event.detail?.message || "Your account is suspended");
    };

    window.addEventListener(SUSPENDED_EVENT, onSuspended);
    return () => window.removeEventListener(SUSPENDED_EVENT, onSuspended);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refresh, logout, authNotice, clearAuthNotice, avatarUrl, refreshAvatar }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
