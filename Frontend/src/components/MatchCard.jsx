import { useState } from "react";
import { Link } from "react-router-dom";
import OnlineStatus from "./OnlineStatus";
import UserActionsMenu from "./UserActionsMenu";
import UserProfileModal from "./UserProfileModal";

// matchQuality -> Tailwind badge classes
const QUALITY_STYLE = {
  "Excellent match": "bg-emerald-600 text-white",
  "Good match": "bg-blue-600 text-white",
  "Fair match": "bg-amber-400 text-slate-900",
  "Low match": "bg-red-600 text-white",
};

// Mirrors MATCH_WEIGHT in Backend/services/matching.service.js.
const BREAKDOWN_CATEGORIES = [
  { key: "activity", label: "Activity", max: 30, appliesWhen: (f) => !!f.activity },
  { key: "location", label: "Location", max: 20, appliesWhen: (f) => !!f.city || !!f.radiusKm },
  { key: "availability", label: "Availability", max: 25, appliesWhen: (f) => !!f.day },
  { key: "skill", label: "Skill level", max: 15, appliesWhen: (f) => !!f.skillLevel },
  { key: "history", label: "Your history", max: 15, appliesWhen: (f, personalized) => !!personalized },
  { key: "rating", label: "Rating", max: 10, appliesWhen: () => true },
];

// Per-category severity bg color
const severityBg = (ratio) => {
  if (ratio >= 0.75) return "bg-emerald-600";
  if (ratio >= 0.5) return "bg-amber-400";
  if (ratio >= 0.25) return "bg-orange-500";
  return "bg-red-600";
};

const HISTORY_HINT =
  "Complete a few sessions and rate them so we can factor your history in";

const Meter = ({ label, value, max, applicable, hint }) => {
  const ratio = applicable ? Math.min(value / max, 1) : 0;

  return (
    <div className="flex items-center gap-2.5 py-1" title={applicable ? undefined : hint}>
      <span className="w-23 text-xs text-slate-600 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
        {applicable && (
          <div
            className={`h-full rounded-full ${severityBg(ratio)}`}
            style={{ width: `${ratio * 100}%` }}
          />
        )}
      </div>
      <span
        className={`w-12 text-right text-xs shrink-0 tabular-nums ${
          applicable ? "text-slate-600" : "text-slate-400"
        }`}
      >
        {applicable ? `${value}/${max}` : "n/a"}
      </span>
    </div>
  );
};

const MatchCard = ({ rank, profile, matchScore, matchQuality, matchBreakdown, distanceKm, appliedFilters, personalized, requestState, onSendRequest, onBlocked }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const qualityClass = QUALITY_STYLE[matchQuality] || "bg-slate-200 text-slate-900";
  const name = profile.user?.name || profile.user?.email || "Unknown";
  const initial = name.charAt(0).toUpperCase();
  const userId = profile.user?._id;
  const dist = distanceKm ?? profile.location?.distanceKm;
  const historyRatio = personalized ? (matchBreakdown?.history || 0) / 15 : 0;
  const showHistoryBadge = historyRatio >= 0.67;

  return (
    <div className="relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
      {rank <= 3 && (
        <span className="absolute top-4 right-5 text-[11px] font-bold text-slate-400">
          #{rank}
        </span>
      )}

      <div className="flex gap-3.5 items-start">
        <button
          type="button"
          onClick={() => setShowProfileModal(true)}
          className="shrink-0 p-0 border-0 bg-transparent cursor-pointer group focus:outline-none"
          title="Click to view profile"
        >
          {profile.avatar ? (
            <img src={profile.avatar} alt={name} className="w-11 h-11 rounded-full object-cover group-hover:ring-2 group-hover:ring-yellow-400 transition-all" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base group-hover:bg-yellow-100 group-hover:text-yellow-900 transition-all">
              {initial}
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="font-semibold text-sm text-slate-900 hover:text-amber-600 hover:underline cursor-pointer bg-transparent border-0 p-0 text-left"
              title="Click to view profile"
            >
              {name}
            </button>
            {showHistoryBadge && (
              <span
                title="Similar to activities you've completed and rated well"
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700"
              >
                ✨ Recommended
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            {profile.location?.city || "city not set"}
            {dist !== undefined && dist !== null ? ` · ${dist} km away` : ""} ·{" "}
            {(profile.skills || [])
              .map((s) => `${s.activity?.name} (${s.level})`)
              .join(", ") || "no skills listed"}
          </div>
          <div className="mt-1">
            <OnlineStatus userId={userId} />
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-3xl font-bold text-slate-900 leading-none">
            {matchScore}
            <span className="text-base font-semibold text-slate-400">%</span>
          </div>
          <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${qualityClass}`}>
            {matchQuality}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Match breakdown
          </span>
          <button
            type="button"
            onClick={() => setShowAnalysis((prev) => !prev)}
            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-amber-200"
          >
            {showAnalysis ? "Hide Analysis ▲" : "⚡ Analyse Match ▼"}
          </button>
        </div>

        {showAnalysis && (
          <div className="mb-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 space-y-1.5 animate-in fade-in duration-150">
            <p className="font-bold m-0 text-amber-900">📊 Compatibility Insight for {name}:</p>
            <ul className="m-0 pl-4 space-y-1 list-disc text-amber-800">
              <li>
                <strong>Activity Alignment:</strong> {matchBreakdown?.activity || 0}/30 score weight.
              </li>
              <li>
                <strong>Proximity Factor:</strong> {dist !== undefined ? `${dist} km distance` : "Location matching"} ({matchBreakdown?.location || 0}/20 pts).
              </li>
              <li>
                <strong>Schedule Fit:</strong> {matchBreakdown?.availability || 0}/25 points for availability overlap.
              </li>
              <li>
                <strong>Overall Quality:</strong> Rated as <strong>{matchQuality}</strong> ({matchScore}% fit).
              </li>
            </ul>
          </div>
        )}

        {BREAKDOWN_CATEGORIES.map((cat) => (
          <Meter
            key={cat.key}
            label={cat.label}
            value={matchBreakdown?.[cat.key] || 0}
            max={cat.max}
            applicable={cat.appliesWhen(appliedFilters, personalized)}
            hint={
              cat.key === "history"
                ? HISTORY_HINT
                : `Add a ${cat.label.toLowerCase()} filter to compare on this`
            }
          />
        ))}
      </div>

      <div className="mt-4 flex gap-2 justify-end items-center">
        <div className="mr-auto">
          <UserActionsMenu userId={userId} userName={name} onBlocked={onBlocked} />
        </div>
        <button
          type="button"
          onClick={() => setShowProfileModal(true)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
        >
          👤 Profile
        </button>
        <Link
          to={`/chat/${userId}?name=${encodeURIComponent(name)}`}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors no-underline"
        >
          Message
        </Link>
        <button
          type="button"
          onClick={onSendRequest}
          disabled={requestState === "sending" || requestState === "sent"}
          className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed ${
            requestState === "sent"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : requestState === "sending"
              ? "bg-blue-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {requestState === "sent" ? "Request sent" : requestState === "sending" ? "Sending..." : "Send request"}
        </button>
      </div>

      {requestState && !["sending", "sent"].includes(requestState) && (
        <div className="mt-1.5 text-right text-xs text-red-600">{requestState}</div>
      )}

      {showProfileModal && (
        <UserProfileModal
          userId={userId}
          userName={name}
          initialProfile={profile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default MatchCard;
