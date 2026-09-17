import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const inputClass =
  "px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500";

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

  return (
    <div className="max-w-sm mx-auto px-4 mt-16">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 mt-0 mb-5">Log in</h1>

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
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          No account?{" "}
          <Link to="/register" className="text-blue-600 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
