import { useEffect, useState } from "react";
import apiClient from "../api/client";
import BlockedUsers from "../components/BlockedUsers";
import { useAuth } from "../context/AuthContext";
import { resizeImageToDataUrl } from "../utils/resizeImage";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};
const WEEKDAYS = DAYS.slice(0, 5);
const WEEKEND = DAYS.slice(5);
const DAY_PRESETS = [
  { label: "Every day", days: DAYS },
  { label: "Weekdays", days: WEEKDAYS },
  { label: "Weekend", days: WEEKEND },
];
const SKILL_LEVELS = ["beginner", "intermediate", "advanced"];

const inputClass =
  "px-3 py-2 text-sm rounded-lg border border-neutral-300 bg-white w-full box-border " +
  "focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-500";
const labelClass = "text-xs font-medium text-neutral-600";
const chipClass = (active) =>
  `px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
    active
      ? "bg-yellow-400 border-neutral-950 text-neutral-950"
      : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
  }`;

const emptySlot = () => ({ startTime: "", endTime: "" });

const sameDays = (a, b) => a.length === b.length && a.every((d) => b.includes(d));

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [activityOptions, setActivityOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());

  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState([]);
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([emptySlot()]);

  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      const { data } = await apiClient.get("/profile/me");
      const profile = data.data?.profile;
      if (profile) {
        setHasProfile(true);
        setAvatar(profile.avatar || "");
        setBio(profile.bio || "");
        setSkills(
          (profile.skills || []).map((s) => ({
            activity: s.activity?._id || s.activity,
            level: s.level,
          }))
        );
        setCity(profile.location?.city || "");
        if (profile.location?.point?.coordinates) {
          const [lng, lat] = profile.location.point.coordinates;
          setCoords({ lat, lng });
        }

        if (profile.availability?.length) {
          setSelectedDays([...new Set(profile.availability.map((a) => a.day))]);
          const seen = new Set();
          const slots = [];
          profile.availability.forEach((a) => {
            const key = `${a.startTime}|${a.endTime}`;
            if (!seen.has(key)) {
              seen.add(key);
              slots.push({ startTime: a.startTime, endTime: a.endTime });
            }
          });
          setTimeSlots(slots.length ? slots : [emptySlot()]);
        } else {
          setSelectedDays([]);
          setTimeSlots([emptySlot()]);
        }
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setErrorMsg("Failed to load profile");
      }
      setHasProfile(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [activitiesRes, categoriesRes] = await Promise.all([
          apiClient.get("/activities"),
          apiClient.get("/categories"),
        ]);
        setActivityOptions(activitiesRes.data.data?.activities || []);
        setCategoryOptions(categoriesRes.data.data?.categories || []);
      } catch {
        // Non-fatal — the form still works, just without activity chips populated.
      }

      await loadProfile();
      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        setLocationCaptured(true);
        setErrorMsg("");

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            const guessedCity =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              "";
            if (guessedCity) setCity(guessedCity);
          }
        } catch {
          // Best-effort — coordinates are already captured; city stays editable either way.
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setErrorMsg(err.code === 1 ? "Location permission denied" : "Couldn't get location");
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setAvatar(await resizeImageToDataUrl(file));
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err.message || "Couldn't process that image");
    }
  };

  const handleRemoveAvatar = () => setAvatar("");

  const toggleSkill = (activityId) => {
    setSkills((prev) =>
      prev.some((s) => s.activity === activityId)
        ? prev.filter((s) => s.activity !== activityId)
        : [...prev, { activity: activityId, level: "beginner" }]
    );
  };

  const updateSkillLevel = (activityId, level) => {
    setSkills((prev) => prev.map((s) => (s.activity === activityId ? { ...s, level } : s)));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const updateSlot = (index, field, value) => {
    setTimeSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)));
  };

  const addSlot = () => setTimeSlots((prev) => [...prev, emptySlot()]);
  const removeSlot = (index) => setTimeSlots((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setSaving(true);

    const availability = selectedDays.flatMap((day) =>
      timeSlots
        .filter((slot) => slot.startTime && slot.endTime)
        .map((slot) => ({ day, startTime: slot.startTime, endTime: slot.endTime }))
    );

    const payload = {
      avatar,
      bio,
      skills,
      location: { city, ...(coords && coords) },
      availability,
    };

    try {
      if (hasProfile) {
        await apiClient.patch("/profile/me", payload);
        setStatusMsg("Profile updated");
      } else {
        await apiClient.post("/profile", payload);
        setStatusMsg("Profile created");
        // Re-fetch so the page reflects exactly what the server persisted,
        // rather than trusting the client's own copy of what it just sent.
        await loadProfile();
      }
      setLocationCaptured(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-sm text-neutral-500 py-16">Loading profile...</div>;
  }

  const unselectedActivities = activityOptions.filter(
    (activity) => !skills.some((s) => s.activity === activity._id)
  );

  const categoriesWithActivities = categoryOptions
    .map((category) => ({
      ...category,
      activities: unselectedActivities.filter((a) => (a.category?._id || a.category) === category._id),
    }))
    .filter((category) => category.activities.length > 0);

  return (
    <div className="max-w-xl mx-auto px-4 my-6">
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
        <span className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 px-3 py-1 text-[11px] font-bold tracking-widest text-yellow-700 uppercase font-mono">
          {hasProfile ? "Your profile" : "Almost there"}
        </span>
        <h1
          className="mt-3 mb-5 uppercase text-3xl text-neutral-950"
          style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
        >
          {hasProfile ? "Your profile" : "Create your profile"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-yellow-50 text-yellow-700 flex items-center justify-center font-bold text-xl shrink-0">
                {(user?.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col items-start gap-1.5">
              <label className="px-3 py-1.5 text-xs font-semibold text-neutral-700 border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer">
                {avatar ? "Change photo" : "Add photo (optional)"}
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs text-red-600 hover:text-red-700 cursor-pointer"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

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

          <div>
            <span className={labelClass}>Your skills</span>

            {skills.length > 0 && (
              <div className="flex flex-col gap-2 mt-1.5">
                {skills.map((skill) => {
                  const activity = activityOptions.find((a) => a._id === skill.activity);
                  return (
                    <div
                      key={skill.activity}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50"
                    >
                      <span className="text-sm font-semibold text-neutral-900 flex-1 min-w-0 truncate">
                        {activity?.name || "Unknown activity"}
                      </span>
                      <select
                        value={skill.level}
                        onChange={(e) => updateSkillLevel(skill.activity, e.target.value)}
                        className="px-2 py-1 text-xs rounded-md border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-500"
                      >
                        {SKILL_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => toggleSkill(skill.activity)}
                        className="text-sm text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-2 mt-2">
              {categoriesWithActivities.length === 0 && skills.length === 0 && (
                <span className="text-xs text-neutral-400">No activities available yet.</span>
              )}
              {categoriesWithActivities.map((category) => {
                const isOpen = expandedCategories.has(category._id);
                return (
                  <div key={category._id}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category._id)}
                      aria-expanded={isOpen}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold rounded-lg border cursor-pointer transition-colors ${
                        isOpen
                          ? "bg-yellow-50 border-yellow-400 text-neutral-900"
                          : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <span>
                        {category.emoji} {category.name}
                        <span className="ml-1.5 text-xs font-normal text-neutral-400">
                          {category.activities.length}
                        </span>
                      </span>
                      <span className={`text-xs transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
                    </button>

                    {isOpen && (
                      <div className="flex flex-wrap gap-2 mt-2 pl-1">
                        {category.activities.map((activity) => (
                          <button
                            key={activity._id}
                            type="button"
                            onClick={() => toggleSkill(activity._id)}
                            className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-dashed border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer"
                          >
                            + {activity.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <label className={labelClass}>
            City
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city"
              className={`${inputClass} mt-1`}
            />
          </label>

          <div>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-700 border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100 disabled:opacity-60 cursor-pointer"
            >
              {locating ? "📍 Locating..." : "📍 Use my current location"}
            </button>
            {locationCaptured && (
              <span className="text-xs text-emerald-600 ml-2.5">
                📍 Location captured — city filled in below, edit if needed
              </span>
            )}
          </div>

          <div>
            <span className={labelClass}>Availability</span>

            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {DAY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setSelectedDays(preset.days)}
                  className={chipClass(sameDays(selectedDays, preset.days))}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedDays([])}
                className={chipClass(selectedDays.length === 0)}
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={chipClass(selectedDays.includes(day))}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <span className="text-xs text-neutral-500">Time slots (apply to every day selected above)</span>
              {timeSlots.map((slot, index) => (
                <div key={index} className="flex flex-wrap gap-2 mt-2 items-center">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                    className={`${inputClass} w-28`}
                  />
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                    className={`${inputClass} w-28`}
                  />
                  {timeSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="text-sm text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSlot}
                className="mt-2 px-3 py-1.5 text-sm font-medium text-neutral-600 border border-dashed border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer"
              >
                + Add time slot
              </button>
            </div>
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
            className="px-4 py-2 text-sm font-bold text-neutral-950 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-60 cursor-pointer"
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
