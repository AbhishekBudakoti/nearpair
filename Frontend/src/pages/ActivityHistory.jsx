import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import apiClient from "../api/client";

// A categorical palette for the activity-mix donut — reused across slices in order.
const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];

const ChartCard = ({ title, empty, children }) => (
  <div className="bg-white border border-slate-200/80 rounded-2xl p-4">
    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
      {title}
    </div>
    {empty ? (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400">
        Not enough data yet
      </div>
    ) : (
      children
    )}
  </div>
);

// Mirrors SESSION_STATUSES in Backend/models/session.model.js (history only
// ever shows these two — upcoming ones live on the Sessions page).
const STATUS_STYLE = {
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const formatWhen = (iso) =>
  new Date(iso).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white border border-slate-200/80 rounded-2xl p-4">
    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
      {label}
    </div>
    <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</div>
    {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
  </div>
);

const Stars = ({ rating }) => (
  <span className="text-amber-500 tracking-tighter" aria-label={`${rating} out of 5 stars`}>
    {"★".repeat(rating)}
    <span className="text-slate-300">{"★".repeat(5 - rating)}</span>
  </span>
);

const TimelineEntry = ({ entry }) => {
  const partnerName = entry.partner?.name || entry.partner?.email || "a partner";

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-900">
              {entry.activity?.name || "Activity"} with {partnerName}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                STATUS_STYLE[entry.status] || "bg-slate-200 text-slate-700"
              }`}
            >
              {entry.status}
            </span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {formatWhen(entry.scheduledAt)} · {entry.durationMinutes} min
          </div>
          {entry.status === "cancelled" && entry.cancelReason && (
            <div className="text-xs text-red-600 mt-1">
              {entry.cancelReason}
              {entry.cancelledBy?.name ? ` — ${entry.cancelledBy.name}` : ""}
            </div>
          )}
        </div>
      </div>

      {entry.status === "completed" && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">You rated:</span>
            {entry.myReview ? (
              <Stars rating={entry.myReview.rating} />
            ) : (
              <span className="text-slate-400">Not reviewed yet</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{partnerName} rated you:</span>
            {entry.partnerReview ? (
              <Stars rating={entry.partnerReview.rating} />
            ) : (
              <span className="text-slate-400">Not reviewed yet</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ActivityHistory = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let ignore = false;

    apiClient
      .get("/sessions/history")
      .then(({ data }) => {
        if (ignore) return;
        setStats(data.data?.stats || null);
        setTrends(data.data?.trends || null);
        setTimeline(data.data?.timeline || []);
      })
      .catch((err) => {
        if (!ignore) setErrorMsg(err.response?.data?.message || "Failed to load activity history");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 my-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Activity history</h1>
      <p className="text-sm text-slate-600 mb-5">
        Everything you've done on NearPair so far.
      </p>

      {errorMsg && <p role="alert" className="text-sm text-red-600 mb-3">{errorMsg}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading history...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Sessions completed" value={stats?.totalCompleted ?? 0} />
            <StatCard label="Hours spent" value={stats?.totalHours ?? 0} />
            <StatCard label="Partners met" value={stats?.uniquePartners ?? 0} />
            <StatCard
              label="Top activity"
              value={stats?.topActivity?.name || "—"}
              sub={stats?.topActivity ? `${stats.topActivity.count} sessions` : undefined}
            />
          </div>

          {timeline.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-600 m-0">
                No history yet — completed and cancelled sessions will show up here.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <ChartCard title="Sessions per month" empty={!stats?.totalCompleted}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={trends?.sessionsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={24} />
                      <Tooltip cursor={{ fill: "#f1f5f9" }} />
                      <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Activity mix" empty={!trends?.activityMix?.length}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={trends?.activityMix}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {(trends?.activityMix || []).map((entry, index) => (
                          <Cell key={entry.id} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                    {(trends?.activityMix || []).map((a, index) => (
                      <span key={a.id} className="flex items-center gap-1 text-[11px] text-slate-600">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        {a.name}
                      </span>
                    ))}
                  </div>
                </ChartCard>

                <ChartCard title="Rating received" empty={!stats?.totalCompleted}>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trends?.ratingTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 5]} allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={24} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="averageRating"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                        name="Avg. rating"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="flex flex-col gap-2.5">
                {timeline.map((entry) => (
                  <TimelineEntry key={entry._id} entry={entry} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityHistory;
