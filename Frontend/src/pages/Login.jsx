import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import AuthLayout from "../components/AuthLayout";
import GoogleSignInButton, { isGoogleSignInEnabled } from "../components/GoogleSignInButton";

const inputClass =
  "px-3 py-2 text-sm rounded-lg border border-neutral-300 bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-500";

const Login = () => {
  const { user, refresh, authNotice, clearAuthNotice } = useAuth();
  const { connectSocket } = useSocket() || {};
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in — nothing to do here.
  if (user) {
    const redirectTo = location.state?.from?.pathname || "/discover";
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    clearAuthNotice();
    setSubmitting(true);

    try {
      await apiClient.post("/auth/login", { email, password });
      await refresh();
      if (connectSocket) connectSocket();
      navigate(location.state?.from?.pathname || "/discover", { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async () => {
    setErrorMsg("");
    clearAuthNotice();
    await refresh();
    if (connectSocket) connectSocket();
    navigate(location.state?.from?.pathname || "/discover", { replace: true });
  };

  return (
    <AuthLayout>
      <div className="max-w-sm w-full">
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
        <span className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 px-3 py-1 text-[11px] font-bold tracking-widest text-yellow-700 uppercase font-mono">
          Welcome back
        </span>
        <h1
          className="mt-3 mb-5 uppercase text-3xl text-neutral-950"
          style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
        >
          Log in
        </h1>

        {isGoogleSignInEnabled && (
          <div className="mb-4">
            <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={setErrorMsg} />
            <div className="flex items-center gap-3 mt-4">
              <span className="flex-1 h-px bg-neutral-200" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Or continue with email
              </span>
              <span className="flex-1 h-px bg-neutral-200" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />

          {/* A failed login and a server sign-out can carry the same message, so show one. */}
          {(errorMsg || authNotice) && (
            <span role="alert" className="text-sm text-red-600">
              {errorMsg || authNotice}
            </span>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-bold text-neutral-950 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-neutral-600">
          No account?{" "}
          <Link to="/register" className="text-neutral-900 font-semibold hover:text-yellow-600 underline decoration-yellow-400 decoration-2 underline-offset-2">
            Register
          </Link>
        </p>
      </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
