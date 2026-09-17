import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const inputClass =
  "px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500";

const Register = () => {
  const { user, refresh } = useAuth();
  const { connectSocket } = useSocket() || {};
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/discover" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      await apiClient.post("/auth/register", { name, email, password });
      // Registration doesn't set the auth cookie — log the new user straight in.
      await apiClient.post("/auth/login", { email, password });
      await refresh();
      if (connectSocket) connectSocket();
      navigate("/profile", { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 mt-16">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 mt-0 mb-5">Create an account</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
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
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            className={inputClass}
          />

          {errorMsg && (
            <span role="alert" className="text-sm text-red-600">
              {errorMsg}
            </span>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
