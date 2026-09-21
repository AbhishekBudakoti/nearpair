import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const CATEGORIES = [
  "Sports",
  "Hobbies",
  "Study buddies",
  "Gym",
  "Music",
  "Games",
  "Outdoors",
  "NearPair",
];

const STEPS = [
  { n: "01", title: "Set up your profile", body: "Pick your activities, skill level, availability and where you're based." },
  { n: "02", title: "Get matched nearby", body: "See partners ranked by how well they fit you, on a list or a map." },
  { n: "03", title: "Chat and lock a plan", body: "Send a request, chat once matched, then propose a time and place." },
  { n: "04", title: "Show up and rate it", body: "Meet, do the thing, and leave a rating so the community stays great." },
];

// Decorative activity icons scattered around the phone mockup (desktop only).
// `from` says which side each one slides in from when the section scrolls into view.
const FLOATING_ICONS = [
  { emoji: "⚽", className: "top-0 left-0 -rotate-12 text-5xl", from: "left" },
  { emoji: "🏸", className: "top-36 left-6 rotate-6 text-4xl", from: "left" },
  { emoji: "🏊", className: "bottom-44 left-0 -rotate-6 text-5xl", from: "left" },
  { emoji: "♟️", className: "bottom-6 left-16 rotate-3 text-4xl", from: "left" },
  { emoji: "🚴", className: "top-4 right-0 rotate-6 text-5xl", from: "right" },
  { emoji: "🏀", className: "top-1/2 right-2 -rotate-6 text-5xl", from: "right" },
  { emoji: "🎾", className: "bottom-20 right-10 rotate-12 text-4xl", from: "right" },
];

// Collage tiles: original gradient + emoji cards (no third-party imagery).
const TILES = [
  { emoji: "🏸", label: "Badminton", bg: "from-amber-400 to-orange-500", h: "h-40" },
  { emoji: "🏃", label: "Running", bg: "from-emerald-400 to-teal-600", h: "h-56" },
  { emoji: "🎸", label: "Jam session", bg: "from-fuchsia-500 to-purple-700", h: "h-48" },
  { emoji: "🧗", label: "Climbing", bg: "from-sky-400 to-blue-600", h: "h-56" },
  { emoji: "♟️", label: "Chess", bg: "from-slate-500 to-slate-800", h: "h-40" },
  { emoji: "🚴", label: "Cycling", bg: "from-rose-400 to-red-600", h: "h-48" },
];

const Landing = () => {
  // Toggles the icon slide-in/out as the app-preview section scrolls in and
  // out of view — re-fires both ways, unlike a typical one-shot scroll reveal.
  const iconsRef = useRef(null);
  const [iconsInView, setIconsInView] = useState(false);

  useEffect(() => {
    const el = iconsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIconsInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white text-neutral-900 -mb-10">
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-5 pt-14 pb-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-2 text-xs font-bold tracking-widest text-yellow-700 uppercase font-mono">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            Partners near you
          </span>

          <h1
            className="mt-6 m-0 uppercase leading-[0.95] tracking-tight text-5xl sm:text-7xl lg:text-8xl"
            style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
          >
            <span className="block">Find your</span>
            <span className="inline-block -rotate-1 bg-yellow-400 text-neutral-950 px-3 my-1 rounded-md">
              Partner.
            </span>
            <span className="block">Never go</span>
            <span className="block">Solo.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-600 max-w-lg">
            Match with people nearby who share your sport, hobby, or skill
            level — then chat, schedule a session, and go do it together.
          </p>

          <div className="mt-8 flex items-center gap-3 flex-wrap">
            <Link
              to="/register"
              className="px-6 py-3 text-sm font-bold text-neutral-950 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors no-underline"
            >
              Get started — it's free
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 text-sm font-semibold text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors no-underline"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* COLLAGE */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-3">
            {[TILES.slice(0, 2), TILES.slice(2, 4), TILES.slice(4, 6)].map((col, i) => (
              <div key={i} className={`flex flex-col gap-3 ${i === 1 ? "mt-8" : ""}`}>
                {col.map((t, ti) => (
                  <div
                    key={t.label}
                    className={`${t.h} card-in`}
                    style={{ animationDelay: `${(i * 2 + ti) * 0.08}s` }}
                  >
                    <div
                      className={`h-full rounded-2xl bg-gradient-to-br ${t.bg} p-3 flex flex-col justify-between border border-black/5 shadow-lg transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl relative hover:z-10 cursor-default`}
                    >
                      <span className="text-4xl sm:text-5xl">{t.emoji}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                        {t.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div
            className="absolute -left-2 sm:-left-6 top-1/2 -translate-y-1/2 rounded-xl border-2 border-dashed border-yellow-500 bg-white px-4 py-3 shadow-xl fade-in transition-transform duration-300 hover:scale-105"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              Match score
            </div>
            <div className="text-3xl font-extrabold text-yellow-600 leading-tight">92%</div>
            <div className="text-xs text-neutral-500">activity · distance · level</div>
          </div>
        </div>
      </section>

      {/* APP PREVIEW */}
      <section className="max-w-6xl mx-auto px-5 py-16 sm:py-24">
        <div className="text-center max-w-xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-2 text-xs font-bold tracking-widest text-yellow-700 uppercase font-mono">
            ✨ Inside the app
          </span>
          <h2
            className="mt-5 m-0 uppercase leading-[0.95] tracking-tight text-3xl sm:text-5xl"
            style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
          >
            Find, chat, and meet up — all in one place
          </h2>
          <p className="mt-4 mb-0 text-sm sm:text-base text-neutral-600">
            Discover partners nearby, message the second you match, then lock in a time and place — no group chats, no flaking.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-3xl">
          {/* Decorative icons spread across the wide canvas, desktop only */}
          <div ref={iconsRef} className="hidden lg:block">
            {FLOATING_ICONS.map((f, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`absolute select-none drop-shadow-lg ${f.className}`}
              >
                {/* Slide-in/out layer, driven by scroll visibility */}
                <span
                  className={`block transition-all duration-700 ease-out ${
                    iconsInView
                      ? "translate-x-0 opacity-90"
                      : `opacity-0 ${f.from === "left" ? "-translate-x-20" : "translate-x-20"}`
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  {/* Continuous gentle bob, independent of the slide transform above */}
                  <span
                    className="inline-block floating-icon"
                    style={{
                      animationDuration: `${3.5 + (i % 3) * 0.6}s`,
                      animationDelay: `${i * 0.25}s`,
                    }}
                  >
                    {f.emoji}
                  </span>
                </span>
              </span>
            ))}
          </div>

          {/* Phone + proof cards, centered */}
          <div className="relative z-10 mx-auto w-full max-w-[260px] sm:max-w-[300px] h-[520px]">
            <div className="hidden md:block absolute z-20 -right-36 top-8 w-44 rounded-xl bg-white border border-neutral-200 shadow-xl px-4 py-3 -rotate-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-sm">
                  💚
                </span>
                <span className="text-xs font-bold text-neutral-900">It's a match!</span>
              </div>
              <p className="mt-1 mb-0 text-[11px] text-neutral-500">You and Maya both play badminton</p>
            </div>

            <div className="hidden md:block absolute z-20 -left-36 bottom-20 w-44 rounded-xl bg-white border border-neutral-200 shadow-xl px-4 py-3 rotate-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 shrink-0 rounded-full bg-yellow-100 flex items-center justify-center text-sm">
                  📍
                </span>
                <span className="text-xs font-bold text-neutral-900">3 partners nearby</span>
              </div>
              <p className="mt-1 mb-0 text-[11px] text-neutral-500">Within 2km, free tonight</p>
            </div>

            {/* Phone frame */}
            <div className="relative w-full h-full rounded-[2.5rem] border-4 border-neutral-900 bg-white shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-900 rounded-b-2xl z-10" />

              <div className="h-full pt-10 px-4 pb-6 flex flex-col">
                <p className="m-0 text-[11px] text-neutral-500">Good evening 👋</p>
                <h3 className="mt-1 mb-5 text-lg font-bold text-neutral-900">Ready for your next match?</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-neutral-100 p-3">
                    <span className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center text-sm">
                      🎯
                    </span>
                    <p className="mt-2 mb-0 text-xs font-semibold text-neutral-900">Discover</p>
                    <p className="m-0 text-[10px] text-neutral-500">Find partners</p>
                  </div>
                  <div className="rounded-xl bg-neutral-100 p-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-400 flex items-center justify-center text-sm">
                      💬
                    </span>
                    <p className="mt-2 mb-0 text-xs font-semibold text-neutral-900">Chat</p>
                    <p className="m-0 text-[10px] text-neutral-500">Message & plan</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-50 p-3">
                  <p className="m-0 text-[10px] font-mono uppercase tracking-widest text-yellow-700">Upcoming</p>
                  <p className="mt-1 mb-0.5 text-sm font-bold text-neutral-900">Badminton · Court 3</p>
                  <p className="m-0 text-[11px] text-neutral-500">Today, 6:00 PM · 3 going</p>
                  <div className="flex -space-x-2 mt-2">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-white"
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4 flex justify-center gap-6 text-neutral-400 text-lg">
                  <span>🏠</span>
                  <span>🔍</span>
                  <span>💬</span>
                  <span>👤</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-neutral-950 text-white px-5 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-yellow-400" />
            <span className="text-xs font-bold tracking-[0.3em] text-yellow-400 uppercase font-mono">
              The process
            </span>
          </div>

          <h2
            className="mt-4 m-0 uppercase leading-[0.95] tracking-tight text-5xl sm:text-7xl"
            style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
          >
            <span className="block">How it</span>
            <span className="block text-yellow-400">Works.</span>
          </h2>

          <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-4 gap-12 sm:gap-4">
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

      {/* CATEGORY STRIP */}
      <div className="bg-yellow-400 text-neutral-950 py-4 overflow-hidden">
        <div className="flex marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex shrink-0">
              {CATEGORIES.map((c) => (
                <span
                  key={c}
                  className="flex items-center shrink-0 mx-4 text-xs sm:text-sm font-bold uppercase tracking-[0.2em]"
                >
                  {c}
                  <span className="ml-4 text-base">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="bg-yellow-400 text-neutral-950 px-5 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center sm:items-end justify-between gap-10 text-center sm:text-left">
          <h2
            className="m-0 uppercase leading-[0.95] tracking-tight text-4xl sm:text-6xl"
            style={{ fontFamily: "'Anton', Impact, sans-serif", fontWeight: 400 }}
          >
            <span className="block">Your city.</span>
            <span className="block">Your sport.</span>
            <span className="block">Your partner.</span>
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

      {/* FOOTER */}
      <footer className="bg-white text-neutral-600 px-5 py-12 border-t border-neutral-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-10">
            <div className="max-w-xs">
              <img src="/logo.webp" alt="NearPair" className="h-12 sm:h-14 w-auto" />
              <p className="mt-3 mb-0 text-sm leading-relaxed">
                Match with people nearby who share your sport, hobby, or skill
                level — then chat, schedule a session, and go do it together.
              </p>
            </div>

            <div>
              <h3 className="m-0 text-xs font-bold uppercase tracking-widest text-neutral-900">
                Product
              </h3>
              <ul className="list-none p-0 mt-4 mb-0 flex flex-col gap-3 text-sm">
                <li>
                  <a href="#how-it-works" className="text-neutral-600 hover:text-neutral-900 transition-colors no-underline">
                    How it works
                  </a>
                </li>
                <li>
                  <Link to="/register" className="text-neutral-600 hover:text-neutral-900 transition-colors no-underline">
                    Get started
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-neutral-600 hover:text-neutral-900 transition-colors no-underline">
                    Log in
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-center sm:text-left">
            <p className="m-0">© {new Date().getFullYear()} NearPair. Never go solo.</p>
            <p className="m-0">Made for people who'd rather show up together.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
