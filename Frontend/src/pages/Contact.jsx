import { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";

const SUPPORT_EMAIL = "help@nearpair.com";

const inputClass =
  "px-3 py-2 text-sm rounded-lg border border-neutral-300 bg-white w-full box-border " +
  "focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-500";
const labelClass = "text-xs font-medium text-neutral-600";

const InfoCard = ({ icon, title, children }) => (
  <div className="rounded-2xl border border-neutral-200 p-6">
    <span className="w-11 h-11 rounded-xl bg-yellow-400 flex items-center justify-center text-xl shrink-0">
      {icon}
    </span>
    <h3 className="mt-4 mb-1.5 text-base font-extrabold text-neutral-900">{title}</h3>
    <div className="text-sm text-neutral-600 leading-relaxed">{children}</div>
  </div>
);

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      await apiClient.post("/contact", { name, email, subject, message });
      setSent(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Couldn't send that — try again in a moment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-14">
      <span className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-2 text-xs font-bold tracking-widest text-yellow-700 uppercase font-mono">
        Contact
      </span>
      <h1
        className="mt-5 mb-3 uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl text-neutral-950"
        style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
      >
        Get in touch.
      </h1>
      <p className="text-base text-neutral-600 mb-10">
        Questions, feedback, or a safety concern that needs attention — reach
        us either way below.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14">
        <InfoCard icon="📧" title="Email us">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-neutral-900 font-semibold underline decoration-yellow-400 decoration-2"
          >
            {SUPPORT_EMAIL}
          </a>
          <p className="mt-1 mb-0">We typically respond within a day or two.</p>
        </InfoCard>

        <InfoCard icon="🛡️" title="Safety concerns">
          <p className="m-0">
            For anything urgent, report or block directly from their profile
            or chat — it goes straight to moderation. See{" "}
            <Link to="/safety" className="text-neutral-900 font-semibold underline decoration-yellow-400 decoration-2">
              Safety &amp; Trust
            </Link>{" "}
            for more.
          </p>
        </InfoCard>
      </div>

      <h2
        className="m-0 mb-5 uppercase leading-[0.95] tracking-tight text-2xl sm:text-3xl text-neutral-950"
        style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
      >
        Raise an issue
      </h2>

      {sent ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center">
          <span className="text-4xl">✅</span>
          <h3 className="mt-4 mb-1.5 text-lg font-extrabold text-neutral-900">Message sent</h3>
          <p className="m-0 text-sm text-neutral-600">
            Thanks — we'll get back to you at {email}.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={labelClass}>
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={`${inputClass} mt-1`}
                />
              </label>

              <label className={labelClass}>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`${inputClass} mt-1`}
                />
              </label>
            </div>

            <label className={labelClass}>
              Subject
              <input
                type="text"
                placeholder="e.g. Trouble signing in"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className={`${inputClass} mt-1`}
              />
            </label>

            <label className={labelClass}>
              Description
              <textarea
                placeholder="Describe your issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={2000}
                rows={5}
                className={`${inputClass} mt-1 resize-y`}
              />
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
              {submitting ? "Sending..." : "Submit issue"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Contact;
