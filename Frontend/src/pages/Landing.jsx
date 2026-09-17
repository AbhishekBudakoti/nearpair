import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "🎯",
    title: "Smart matching",
    body: "A weighted score ranks partners by activity, location, availability, skill level, and rating — not just a swipe.",
  },
  {
    icon: "💬",
    title: "Real-time chat",
    body: "Message your partner the moment you're matched, with live typing indicators and instant delivery.",
  },
  {
    icon: "📅",
    title: "Plan real sessions",
    body: "Propose a time and place, track it from requested to completed, and rate how it went.",
  },
  {
    icon: "🛡️",
    title: "Built-in safety",
    body: "Block, report, and moderation tools keep the community accountable.",
  },
];

const Landing = () => {
  return (
    <div>
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-14 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight m-0">
          Find your next activity partner
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Match with people nearby who share your sport, hobby, or skill
          level — then chat, schedule a session, and go do it together.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/register"
            className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors no-underline"
          >
            Get started — it's free
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors no-underline"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs"
            >
              <div className="text-2xl">{f.icon}</div>
              <h2 className="text-sm font-semibold text-slate-900 mt-3 mb-1">
                {f.title}
              </h2>
              <p className="text-xs text-slate-600 m-0 leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Landing;
