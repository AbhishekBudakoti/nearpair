import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { checkPasswordStrength } from "../utils/password";
import AuthLayout from "../components/AuthLayout";
import GoogleSignInButton, { isGoogleSignInEnabled } from "../components/GoogleSignInButton";

const inputClass =
  "px-3 py-2 text-sm rounded-lg border border-neutral-300 bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-500";

const STRENGTH_CHECKS = [
  { key: "length", label: "At least 8 characters" },
  { key: "upper", label: "An uppercase letter" },
  { key: "lower", label: "A lowercase letter" },
  { key: "number", label: "A number" },
  { key: "special", label: "A special character" },
];

const GENDERS = [
  { value: "", label: "Gender (optional)" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const Register = () => {
  const { user, refresh } = useAuth();
  const { connectSocket } = useSocket() || {};
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/profile" replace />;
  }

  const strength = checkPasswordStrength(password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    if (!strength.valid) {
      setPasswordTouched(true);
      setErrorMsg("Please choose a stronger password");
      return;
    }

    setSubmitting(true);

    try {
      await apiClient.post("/auth/register", {
        name,
        email,
        password,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        phone: phone ? `+91${phone}` : undefined,
      });
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

  const handleGoogleSuccess = async () => {
    setErrorMsg("");
    await refresh();
    if (connectSocket) connectSocket();
    navigate("/profile", { replace: true });
  };

  return (
    <AuthLayout>
      <div className="max-w-sm w-full">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
          <span className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 px-3 py-1 text-[11px] font-bold tracking-widest text-yellow-700 uppercase font-mono">
            Join NearPair
          </span>
          <h1
            className="mt-3 mb-5 uppercase text-3xl text-neutral-950"
            style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
          >
            Create an account
          </h1>

          {isGoogleSignInEnabled && (
            <div className="mb-4">
              <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={setErrorMsg} />
              <div className="flex items-center gap-3 mt-4">
                <span className="flex-1 h-px bg-neutral-200" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                  Or register with email
                </span>
                <span className="flex-1 h-px bg-neutral-200" />
              </div>
            </div>
          )}

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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              required
              className={inputClass}
            />

            {(passwordTouched || password) && (
              <ul className="flex flex-col gap-0.5 -mt-1 mb-1">
                {STRENGTH_CHECKS.map(({ key, label }) => (
                  <li
                    key={key}
                    className={`text-xs flex items-center gap-1.5 ${
                      strength[key] ? "text-emerald-700" : "text-neutral-400"
                    }`}
                  >
                    <span>{strength[key] ? "✓" : "○"}</span>
                    {label}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-3 my-1">
              <span className="flex-1 h-px bg-neutral-200" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Optional
              </span>
              <span className="flex-1 h-px bg-neutral-200" />
            </div>

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={inputClass}
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>

            <label className="text-xs font-medium text-neutral-600">
              Date of birth
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className={`${inputClass} mt-1 w-full`}
              />
            </label>

            <label className="text-xs font-medium text-neutral-600">
              Phone number
              <div className="flex mt-1">
                <span className="px-3 py-2 text-sm rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-50 text-neutral-500">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={`${inputClass} rounded-l-none flex-1`}
                />
              </div>
            </label>

            {errorMsg && (
              <span role="alert" className="text-sm text-red-600">
                {errorMsg}
              </span>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-bold text-neutral-950 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-4 text-sm text-neutral-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-neutral-900 font-semibold hover:text-yellow-600 underline decoration-yellow-400 decoration-2 underline-offset-2"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
