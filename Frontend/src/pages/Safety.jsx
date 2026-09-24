import { Link } from "react-router-dom";

const BEFORE_TIPS = [
  {
    icon: "☕",
    title: "Meet in public, first",
    body: "Pick a busy, public place for a first meetup — a park, a court, a cafe. Save your place for later.",
  },
  {
    icon: "📍",
    title: "Tell someone your plan",
    body: "Let a friend or family member know who you're meeting, where, and when.",
  },
  {
    icon: "🚗",
    title: "Handle your own transport",
    body: "Get yourself there and back. Don't rely on a match you just met to drive you.",
  },
  {
    icon: "🧭",
    title: "Trust your instincts",
    body: "If something feels off before or during a meetup, it's always okay to leave.",
  },
];

const RED_FLAGS = [
  "Asks you for money, gift cards, or financial information",
  "Pressures you to meet somewhere private right away",
  "Refuses a video call or a public first meetup",
  "Gets aggressive or won't take no for an answer",
];

const Safety = () => {
  return (
    <div className="bg-white text-neutral-900">
      {/* HERO */}
      <section className="relative overflow-hidden px-5 py-24 sm:py-32 text-center">
        <img src="/meet-safe.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-400/10 backdrop-blur-sm px-4 py-2 text-xs font-bold tracking-widest text-yellow-400 uppercase font-mono">
            Safety &amp; Trust
          </span>
          <h1
            className="mt-6 m-0 uppercase leading-[0.95] tracking-tight text-5xl sm:text-6xl text-white"
            style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
          >
            Meet smart.
            <span className="block">Meet safe.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-neutral-200 max-w-xl mx-auto">
            NearPair gives you tools to match and message safely, but no app can
            guarantee what happens when two people meet up. Here's how we help,
            and what's on you.
          </p>
        </div>
      </section>

      {/* BEFORE YOU MEET */}
      <section className="max-w-6xl mx-auto px-5 pb-16 sm:pb-24">
        <h2
          className="m-0 mb-8 uppercase leading-[0.95] tracking-tight text-2xl sm:text-3xl"
          style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
        >
          Before you meet
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {BEFORE_TIPS.map((t) => (
            <div key={t.title} className="rounded-2xl border border-neutral-200 p-6">
              <span className="w-11 h-11 rounded-xl bg-yellow-400 flex items-center justify-center text-xl shrink-0">
                {t.icon}
              </span>
              <h3 className="mt-4 mb-1.5 text-base font-extrabold text-neutral-900">{t.title}</h3>
              <p className="m-0 text-sm text-neutral-600 leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ON THE APP */}
      <section className="bg-neutral-950 text-white px-5 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-yellow-400" />
            <span className="text-xs font-bold tracking-[0.3em] text-yellow-400 uppercase font-mono">
              What NearPair does
            </span>
          </div>
          <h2
            className="mt-4 m-0 uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl"
            style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
          >
            Tools built in, not bolted on.
          </h2>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide mb-2">Block &amp; report</h3>
              <p className="m-0 text-sm text-neutral-400 leading-relaxed">
                Every profile has a menu to block or report someone, right from
                Discover or a chat — no digging through settings.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide mb-2">Real moderation</h3>
              <p className="m-0 text-sm text-neutral-400 leading-relaxed">
                Reports go to a moderation queue, not a void. Accounts that
                break the rules can be warned or suspended.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide mb-2">Approximate location</h3>
              <p className="m-0 text-sm text-neutral-400 leading-relaxed">
                Matches only ever see a rounded location, never your exact
                coordinates or address.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RED FLAGS */}
      <section className="max-w-3xl mx-auto px-5 py-16 sm:py-24">
        <h2
          className="m-0 mb-6 uppercase leading-[0.95] tracking-tight text-2xl sm:text-3xl"
          style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
        >
          Red flags to watch for
        </h2>
        <ul className="list-none p-0 m-0 flex flex-col gap-3">
          {RED_FLAGS.map((flag) => (
            <li key={flag} className="flex items-start gap-3 text-sm text-neutral-700">
              <span className="mt-0.5 shrink-0">🚩</span>
              {flag}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-neutral-600">
          If you see any of these, end the conversation and report the account
          — use the report option on their profile, or{" "}
          <Link to="/contact" className="text-neutral-900 font-semibold underline decoration-yellow-400 decoration-2">
            contact us
          </Link>{" "}
          directly for anything urgent.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-yellow-400 text-neutral-950 px-5 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center sm:items-end justify-between gap-10 text-center sm:text-left">
          <h2
            className="m-0 uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl"
            style={{ fontFamily: "'Anton', Impact, sans-serif", fontWeight: 400 }}
          >
            <span className="block">Questions about</span>
            <span className="block">staying safe?</span>
          </h2>
          <Link
            to="/contact"
            className="px-8 py-4 text-sm font-bold uppercase tracking-widest text-yellow-300 bg-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors no-underline shrink-0"
          >
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Safety;
