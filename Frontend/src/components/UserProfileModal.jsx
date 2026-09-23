import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import Modal from "./Modal";

const DAY_LABELS = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const SKILL_BADGE_STYLE = {
  beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  intermediate: "bg-blue-50 text-blue-700 border-blue-200",
  advanced: "bg-amber-50 text-amber-700 border-amber-200",
};

const UserProfileModal = ({ userId, userName, initialProfile, onClose }) => {
  const [profile, setProfile] = useState(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!userId || initialProfile) return;

    let mounted = true;
    setLoading(true);
    setErrorMsg("");

    apiClient
      .get(`/profile/user/${userId}`)
      .then(({ data }) => {
        if (mounted) {
          setProfile(data.data?.profile || null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setErrorMsg(err.response?.data?.message || "Could not load user profile");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [userId, initialProfile]);

  const name = profile?.user?.name || userName || profile?.user?.email || "User Profile";
  const initial = name.charAt(0).toUpperCase();

  return (
    <Modal title={`Profile: ${name}`} onClose={onClose}>
      {loading ? (
        <div className="py-8 text-center animate-pulse space-y-3">
          <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto" />
          <div className="h-4 w-32 bg-slate-200 rounded mx-auto" />
          <div className="h-3 w-48 bg-slate-100 rounded mx-auto" />
        </div>
      ) : errorMsg ? (
        <div className="py-6 text-center">
          <p role="alert" className="text-sm text-red-600 font-medium m-0">
            {errorMsg}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* User Header */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={name}
                className="w-16 h-16 rounded-full object-cover shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-neutral-950 font-bold text-2xl flex items-center justify-center shrink-0 shadow-sm">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-slate-900 m-0 truncate">{name}</h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>📍 {profile?.location?.city || "City not specified"}</span>
              </p>
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">About</h4>
              <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed m-0">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Activities & Skills */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Activities & Skill Levels</h4>
            {profile?.skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s, idx) => {
                  const actName = s.activity?.name || s.activity || "Activity";
                  const level = s.level || "beginner";
                  const badgeStyle = SKILL_BADGE_STYLE[level] || "bg-slate-100 text-slate-700";
                  return (
                    <div
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${badgeStyle}`}
                    >
                      <span>⚡ {actName}</span>
                      <span className="opacity-70 text-[10px] uppercase font-mono">({level})</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic m-0">No activities listed yet.</p>
            )}
          </div>

          {/* Availability */}
          {profile?.availability?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Availability</h4>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(profile.availability.map((a) => a.day))).map((day) => (
                  <span
                    key={day}
                    className="px-2.5 py-1 bg-yellow-100 text-yellow-900 border border-yellow-300/60 rounded-lg text-xs font-bold"
                  >
                    📅 {DAY_LABELS[day] || day}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Modal Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <Link
              to={`/chat/${userId}?name=${encodeURIComponent(name)}`}
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-950 bg-yellow-400 rounded-xl hover:bg-yellow-300 transition-colors no-underline shadow-xs flex items-center gap-1.5"
            >
              💬 Message {name.split(" ")[0]}
            </Link>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default UserProfileModal;
