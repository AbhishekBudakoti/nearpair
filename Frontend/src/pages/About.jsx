import { Link } from "react-router-dom";

const VALUES = [
  {
    icon: "🎯",
    title: "Real activities, not endless chat",
    body: "No profile-swiping loop. You match on the sport, hobby, or skill you actually want to do, then move to planning a real session.",
  },
  {
    icon: "📍",
    title: "Nearby and available, not just compatible",
    body: "Matches are ranked by activity, distance, availability, and skill level together — someone great two time zones away isn't a match.",
  },
  {
    icon: "🛡️",
    title: "Built-in safety tools",
    body: "Block and report are one tap away, and reported accounts go through moderation — not left for the community to sort out alone.",
  },
  {
    icon: "⭐",
    title: "Ratings that mean something",
    body: "Reviews are left after a real session with a real match, so a rating reflects someone who actually showed up.",
  },
];

const STEPS = [
  { n: "01", title: "Build your profile", body: "Skills, availability, and where you're based." },
  { n: "02", title: "Get matched", body: "Ranked by fit, on a list or a map." },
  { n: "03", title: "Chat and lock a plan", body: "Message, then agree a time and place." },
  { n: "04", title: "Show up and rate it", body: "Meet up, then rate it so matching keeps improving." },
];

const About = () => {
  return (
    <div className="bg-white text-neutral-900">
      {/* HERO */}
      <section className="max-w-3xl mx-auto px-5 pt-14 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-2 text-xs font-bold tracking-widest text-yellow-700 uppercase font-mono">
          About NearPair
        </span>

        <h1
          className="mt-6 m-0 uppercase leading-[0.95] tracking-tight text-5xl sm:text-6xl"
          style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
        >
          Never go
          <span className="inline-block -rotate-1 bg-yellow-400 text-neutral-950 px-3 my-1 mx-1 rounded-md">
            solo.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-neutral-600 max-w-xl mx-auto">
          NearPair exists for one simple reason: it's hard to find people nearby who
          actually want to do the same thing you do, at a time that works, without
          a dozen back-and-forth messages first. So we built a matcher for that,
          not another feed to scroll.
        </p>

        <img
          src="/about.jpg"
          alt="Partners meeting up through NearPair"
          className="mt-10 w-full max-w-2xl mx-auto h-64 sm:h-80 object-cover rounded-2xl"
        />
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-neutral-950 text-white px-5 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-yellow-400" />
            <span className="text-xs font-bold tracking-[0.3em] text-yellow-400 uppercase font-mono">
              How it works
            </span>
          </div>

          <h2
            className="mt-4 m-0 uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl"
            style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
          >
            From profile to plan.
          </h2>

          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-4 gap-10 sm:gap-4">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-1/2 w-[calc(100%+1rem)] border-t-2 border-dashed border-neutral-700" />
                )}
                <div className="relative z-10 mx-auto w-16 h-16 rounded-full border-2 border-dashed border-neutral-700 bg-neutral-950 flex items-center justify-center">
                  <span className="font-mono text-lg font-bold text-yellow-400">{s.n}</span>
                </div>
                <h3 className="mt-6 mb-2 text-sm sm:text-base font-extrabold uppercase tracking-wide">
                  {s.title}
                </h3>
                <p className="m-0 text-sm text-neutral-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="max-w-6xl mx-auto px-5 py-16 sm:py-24">
        <div className="text-center max-w-xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-2 text-xs font-bold tracking-widest text-yellow-700 uppercase font-mono">
            What matters to us
          </span>
          <h2
            className="mt-5 m-0 uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl"
            style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
          >
            Built around showing up.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-neutral-200 p-6 hover:border-yellow-400 transition-colors"
            >
              <span className="w-11 h-11 rounded-xl bg-yellow-400 flex items-center justify-center text-xl shrink-0">
                {v.icon}
              </span>
              <h3 className="mt-4 mb-1.5 text-base font-extrabold text-neutral-900">{v.title}</h3>
              <p className="m-0 text-sm text-neutral-600 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-yellow-400 text-neutral-950 px-5 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center sm:items-end justify-between gap-10 text-center sm:text-left">
          <h2
            className="m-0 uppercase leading-[0.95] tracking-tight text-4xl sm:text-6xl"
            style={{ fontFamily: "'Anton', Impact, sans-serif", fontWeight: 400 }}
          >
            <span className="block">Ready to find</span>
            <span className="block">your partner?</span>
          </h2>

          <div className="flex flex-col items-center sm:items-end gap-3 shrink-0">
            <Link
              to="/register"
              className="px-8 py-4 text-sm font-bold uppercase tracking-widest text-yellow-300 bg-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors no-underline"
            >
              Get started now
            </Link>
            <p className="m-0 text-xs font-mono uppercase tracking-widest text-neutral-800">
              Free to join · No app required
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
