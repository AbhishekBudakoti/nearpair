import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../api/client";
import MatchCard from "../components/MatchCard";
import PartnersMap from "../components/PartnersMap";

const DAYS = [
  "",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const SKILL_LEVELS = ["", "beginner", "intermediate", "advanced"];

const inputClass =
  "px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500";

const emptyFilters = {
  activity: "",
  city: "",
  day: "",
  startTime: "",
  endTime: "",
  skillLevel: "",
  radiusKm: "",
};

const MatchCardSkeleton = () => (
  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse">
    <div className="flex gap-3.5 items-start">
      <div className="w-11 h-11 rounded-full bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/3 bg-slate-200 rounded" />
        <div className="h-3 w-2/3 bg-slate-100 rounded" />
      </div>
      <div className="h-8 w-12 bg-slate-200 rounded" />
    </div>
    <div className="mt-4 pt-3.5 border-t border-slate-200 space-y-2">
      <div className="h-2 bg-slate-100 rounded-full" />
      <div className="h-2 bg-slate-100 rounded-full" />
      <div className="h-2 bg-slate-100 rounded-full" />
    </div>
  </div>
);

const KNOWN_CITIES = [
  "Gurugram",
  "Gurgaon",
  "Guwahati",
  "Gwalior",
  "Gujarat",
  "Delhi",
  "New Delhi",
  "Noida",
  "Greater Noida",
  "Ghaziabad",
  "Faridabad",
  "Mumbai",
  "Bengaluru",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Chandigarh",
  "Goa",
  "Surat",
  "Lucknow",
  "Kanpur",
  "Patna",
  "Indore",
  "Bhopal",
  "Nagpur",
  "Dehradun",
  "Rishikesh",
  "London",
  "New York",
  "San Francisco",
  "Dubai",
  "Toronto",
  "Singapore",
];

const Discover = () => {
  const [activityOptions, setActivityOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [viewMode, setViewMode] = useState("list");

  const [matches, setMatches] = useState(null);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [userProfileCity, setUserProfileCity] = useState("");
  const [requestStatus, setRequestStatus] = useState({});

  const [availableCities, setAvailableCities] = useState(KNOWN_CITIES);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityWrapperRef = useRef(null);

  const setFilter = (field, value) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const runSearch = async (event, customFilters) => {
    event?.preventDefault();
    setShowSuggestions(false);
    setLoading(true);
    setErrorMsg("");
    const activeFilters = customFilters || filters;
    try {
      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, v]) => v),
      );
      const { data } = await apiClient.get("/matches", { params });
      setMatches(data.data?.matches || []);
      setPersonalized(Boolean(data.data?.personalized));
      setAppliedFilters(activeFilters);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to load matches");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Close city suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityWrapperRef.current && !cityWrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    apiClient
      .get("/activities")
      .then(({ data }) => setActivityOptions(data.data?.activities || []))
      .catch(() => {});
    apiClient
      .get("/categories")
      .then(({ data }) => setCategoryOptions(data.data?.categories || []))
      .catch(() => {});

    // Fetch database cities & combine with known cities list
    apiClient
      .get("/profile/cities")
      .then(({ data }) => {
        const dbCities = data.data?.cities || [];
        const combined = Array.from(new Set([...dbCities, ...KNOWN_CITIES])).sort();
        setAvailableCities(combined);
      })
      .catch(() => {});

    // Load profile to auto-fill user's city if available
    apiClient
      .get("/profile/me")
      .then(({ data }) => {
        const city = data.data?.profile?.location?.city || "";
        if (city) {
          setUserProfileCity(city);
          setFilters((prev) => {
            const updated = { ...prev, city };
            runSearch(null, updated);
            return updated;
          });
        } else {
          runSearch();
        }
      })
      .catch(() => {
        runSearch();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    setErrorMsg("");
    setShowSuggestions(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
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
            if (guessedCity) {
              const updated = { ...filters, city: guessedCity };
              setFilters(updated);
              runSearch(null, updated);
            } else {
              setErrorMsg("Couldn't determine city from location");
            }
          }
        } catch {
          setErrorMsg("Could not fetch location details");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setErrorMsg(err.code === 1 ? "Location permission denied" : "Couldn't detect location");
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  const selectCityChip = (cityName) => {
    const updated = { ...filters, city: cityName };
    setFilters(updated);
    setShowSuggestions(false);
    runSearch(null, updated);
  };

  const citySuggestions = useMemo(() => {
    const query = filters.city.trim().toLowerCase();
    if (!query) return [];
    return availableCities.filter((c) => c.toLowerCase().includes(query)).slice(0, 8);
  }, [filters.city, availableCities]);

  const sendRequest = async (recipientId) => {
    setRequestStatus((prev) => ({ ...prev, [recipientId]: "sending" }));
    try {
      await apiClient.post("/requests", {
        recipient: recipientId,
        message: "Let's team up!",
      });
      setRequestStatus((prev) => ({ ...prev, [recipientId]: "sent" }));
    } catch (err) {
      setRequestStatus((prev) => ({
        ...prev,
        [recipientId]: err.response?.data?.message || "failed",
      }));
    }
  };

  // A blocked user disappears from results immediately; the backend already
  // excludes them from every future search.
  const handleBlocked = (blockedUserId) => {
    setMatches((prev) => prev?.filter((m) => m.profile.user?._id !== blockedUserId) ?? prev);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const activitiesByCategory = categoryOptions
    .map((category) => ({
      ...category,
      activities: activityOptions.filter((a) => (a.category?._id || a.category) === category._id),
    }))
    .filter((category) => category.activities.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 my-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Discover partners</h1>
      <p className="text-sm text-slate-600 mb-5">
        Ranked by a weighted match score across activity, location,
        availability, skill level, and rating.
        {personalized && " Also factoring in what's worked well for you before."}
      </p>

      <form
        onSubmit={runSearch}
        className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-6 flex flex-wrap gap-2 items-center"
      >
        <select
          value={filters.activity}
          onChange={(e) => setFilter("activity", e.target.value)}
          className={inputClass}
        >
          <option value="">Any activity</option>
          {activitiesByCategory.map((category) => (
            <optgroup key={category._id} label={`${category.emoji} ${category.name}`}>
              {category.activities.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="relative" ref={cityWrapperRef}>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="City (e.g. Gurugram)"
              value={filters.city}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setFilter("city", e.target.value);
                setShowSuggestions(true);
              }}
              className={`${inputClass} w-36 sm:w-44`}
            />
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              title="Detect my current location"
              className="px-2 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-yellow-100 hover:text-yellow-900 rounded-lg border border-slate-300 transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {locating ? "📍..." : "📍 Auto"}
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && citySuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-100">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Matching Cities ({citySuggestions.length})
              </div>
              <div className="max-h-56 overflow-y-auto">
                {citySuggestions.map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => selectCityChip(cityName)}
                    className="w-full text-left px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-yellow-50 hover:text-yellow-950 hover:font-semibold cursor-pointer flex items-center justify-between border-b border-slate-100/70 last:border-0 transition-colors"
                  >
                    <span>📍 {cityName}</span>
                    <span className="text-xs text-slate-400 font-normal">Select</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <select
          value={filters.radiusKm}
          onChange={(e) => setFilter("radiusKm", e.target.value)}
          className={inputClass}
        >
          <option value="">Any distance</option>
          <option value="5">5 km</option>
          <option value="10">10 km</option>
          <option value="25">25 km</option>
          <option value="50">50 km</option>
        </select>

        <select
          value={filters.day}
          onChange={(e) => setFilter("day", e.target.value)}
          className={inputClass}
        >
          {DAYS.map((day) => (
            <option key={day} value={day}>
              {day || "Any day"}
            </option>
          ))}
        </select>

        <input
          type="time"
          value={filters.startTime}
          onChange={(e) => setFilter("startTime", e.target.value)}
          className={inputClass}
        />
        <input
          type="time"
          value={filters.endTime}
          onChange={(e) => setFilter("endTime", e.target.value)}
          className={inputClass}
        />

        <select
          value={filters.skillLevel}
          onChange={(e) => setFilter("skillLevel", e.target.value)}
          className={inputClass}
        >
          {SKILL_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level || "Any skill level"}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          Search
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </form>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-600">
          {matches ? `${matches.length} ${matches.length === 1 ? "partner" : "partners"} found` : ""}
        </span>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md cursor-pointer transition-colors ${
              viewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
          >
            📋 List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md cursor-pointer transition-colors ${
              viewMode === "map" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
          >
            🗺️ Map
          </button>
        </div>
      </div>

      {errorMsg && <p className="text-sm text-red-600 mb-3">{errorMsg}</p>}
      {!loading && matches && matches.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-600 m-0">
            No partners found. Try widening your filters or check back later.
          </p>
        </div>
      )}

      {viewMode === "map" ? (
        <PartnersMap matches={matches || []} />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches?.map((match, index) => (
            <MatchCard
              key={match.profile._id}
              rank={index + 1}
              profile={match.profile}
              matchScore={match.matchScore}
              matchQuality={match.matchQuality}
              matchBreakdown={match.matchBreakdown}
              distanceKm={match.distanceKm}
              appliedFilters={appliedFilters}
              personalized={personalized}
              requestState={requestStatus[match.profile.user._id]}
              onSendRequest={() => sendRequest(match.profile.user._id)}
              onBlocked={handleBlocked}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Discover;
