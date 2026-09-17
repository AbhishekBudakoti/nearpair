import { useEffect, useState } from "react";
import apiClient from "../api/client";
import BlockedUsers from "../components/BlockedUsers";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SKILL_LEVELS = ["beginner", "intermediate", "advanced"];

const inputClass =
  "px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white w-full box-border " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500";
const labelClass = "text-xs font-medium text-slate-600";

const emptyRow = () => ({ day: "monday", startTime: "", endTime: "" });

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [activityOptions, setActivityOptions] = useState([]);

  const [bio, setBio] = useState("");
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [activities, setActivities] = useState([]);
  const [availability, setAvailability] = useState([emptyRow()]);

  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("/activities");
        setActivityOptions(data.data?.activities || []);
      } catch {
        // Non-fatal — the form still works, just without activity checkboxes populated.
      }

      try {
        const { data } = await apiClient.get("/profile/me");
        const profile = data.data?.profile;
        if (profile) {
          setHasProfile(true);
          setBio(profile.bio || "");
          setSkillLevel(profile.skillLevel || "beginner");
          setCity(profile.location?.city || "");
          if (profile.location?.point?.coordinates) {
            const [lng, lat] = profile.location.point.coordinates;
            setCoords({ lat, lng });
          }
          setActivities((profile.activities || []).map((a) => a._id || a));
          setAvailability(
            profile.availability?.length
              ? profile.availability.map((a) => ({ day: a.day, startTime: a.startTime, endTime: a.endTime }))
              : [emptyRow()]
          );
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          setErrorMsg("Failed to load profile");
        }
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationCaptured(true);
        setErrorMsg("");
        setLocating(false);
      },
      (err) => {
        setErrorMsg(err.code === 1 ? "Location permission denied" : "Couldn't get location");
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  const toggleActivity = (id) => {
    setActivities((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const updateRow = (index, field, value) => {
    setAvailability((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => setAvailability((prev) => [...prev, emptyRow()]);
  const removeRow = (index) => setAvailability((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setSaving(true);

    const payload = {
      bio,
      skillLevel,
      activities,
      location: { city, ...(coords && coords) },
      availability: availability.filter((row) => row.startTime && row.endTime),
    };

    try {
      if (hasProfile) {
        await apiClient.patch("/profile/me", payload);
        setStatusMsg("Profile updated");
      } else {
        await apiClient.post("/profile", payload);
        setHasProfile(true);
        setStatusMsg("Profile created");
      }
      setLocationCaptured(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-sm text-slate-500 py-16">Loading profile...</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 my-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 mt-0 mb-5">
          {hasProfile ? "Your profile" : "Create your profile"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className={labelClass}>
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className={`${inputClass} mt-1 resize-y`}
            />
          </label>

          <label className={labelClass}>
            Skill level
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className={`${inputClass} mt-1`}
            >
              {SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            City
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>

          <div>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-60 cursor-pointer"
            >
              {locating ? "📍 Locating..." : "📍 Use my current location"}
            </button>
            {locationCaptured && (
              <span className="text-xs text-emerald-600 ml-2.5">
                📍 Location captured, click Save to apply
              </span>
            )}
          </div>

          <div>
            <span className={labelClass}>Activities</span>
            <div className="flex flex-wrap gap-3 mt-1.5">
              {activityOptions.length === 0 && (
                <span className="text-xs text-slate-400">No activities available yet.</span>
              )}
              {activityOptions.map((activity) => (
                <label
                  key={activity._id}
                  className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={activities.includes(activity._id)}
                    onChange={() => toggleActivity(activity._id)}
                  />
                  {activity.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className={labelClass}>Availability</span>
            {availability.map((row, index) => (
              <div key={index} className="flex flex-wrap gap-2 mt-2 items-center">
                <select
                  value={row.day}
                  onChange={(e) => updateRow(index, "day", e.target.value)}
                  className={`${inputClass} w-32`}
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) => updateRow(index, "startTime", e.target.value)}
                  className={`${inputClass} w-28`}
                />
                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) => updateRow(index, "endTime", e.target.value)}
                  className={`${inputClass} w-28`}
                />
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="text-sm text-red-600 hover:text-red-700 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRow}
              className="mt-2 px-3 py-1.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              + Add time slot
            </button>
          </div>

          {errorMsg && (
            <span role="alert" className="text-sm text-red-600">
              {errorMsg}
            </span>
          )}
          {statusMsg && <span className="text-sm text-emerald-700">{statusMsg}</span>}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving..." : hasProfile ? "Save changes" : "Create profile"}
          </button>
        </form>
      </div>

      <div className="mt-6">
        <BlockedUsers />
      </div>
    </div>
  );
};

export default Profile;
