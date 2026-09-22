import { useEffect, useRef } from "react";
import apiClient from "../api/client";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// Whether Login/Register should offer Google at all — false until the user
// sets VITE_GOOGLE_CLIENT_ID, so the rest of the form still works without it.
export const isGoogleSignInEnabled = Boolean(GOOGLE_CLIENT_ID);

let gsiScriptPromise = null;
const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
        return;
      }
      const script = document.createElement("script");
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google script"));
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
};

/**
 * Renders Google's own "Sign in with Google" button (Google Identity
 * Services) and exchanges the resulting ID token for our own session cookie
 * via POST /auth/google — the same httpOnly cookie a password login sets.
 */
const GoogleSignInButton = ({ onSuccess, onError }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isGoogleSignInEnabled) return;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              await apiClient.post("/auth/google", { credential });
              onSuccess?.();
            } catch (err) {
              onError?.(err.response?.data?.message || "Google sign-in failed");
            }
          },
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: "300",
          text: "continue_with",
        });
      })
      .catch(() => {
        // Best-effort — the email/password form still works without it.
      });

    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError]);

  if (!isGoogleSignInEnabled) return null;

  return <div ref={containerRef} className="flex justify-center" />;
};

export default GoogleSignInButton;
