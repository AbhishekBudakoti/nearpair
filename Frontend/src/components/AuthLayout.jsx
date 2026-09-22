const FEATURES = [
  { icon: "🎯", title: "Real activities", body: "Sports, hobbies, study groups — not just chat." },
  { icon: "📍", title: "Matched nearby", body: "Ranked by distance, availability, and skill level." },
  { icon: "🆓", title: "Free to join", body: "Browsing, matching, and requests always cost nothing." },
];

/**
 * Split-screen shell shared by Login and Register: a dark brand/marketing
 * panel (hidden below lg, mirrors Landing.jsx's hero styling) plus a centered
 * slot on the right for the actual form card.
 */
const AuthLayout = ({ children }) => {
  return (
    <div className="lg:flex lg:min-h-[640px]">
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-950 text-white flex-col justify-center px-12 xl:px-16 py-16">
        <span className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-400/10 px-4 py-2 text-xs font-bold tracking-widest text-yellow-400 uppercase font-mono w-fit">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Partners near you
        </span>

        <h2
          className="mt-6 mb-0 uppercase leading-[0.95] tracking-tight text-5xl"
          style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
        >
          <span className="block">Real activities.</span>
          <span className="inline-block -rotate-1 bg-yellow-400 text-neutral-950 px-3 my-1 rounded-md">
            Real people.
          </span>
        </h2>

        <p className="mt-6 mb-0 text-base text-neutral-400 max-w-md">
          Match with people nearby who share your sport, hobby, or skill
          level — then chat, schedule a session, and go do it together.
        </p>

        <div className="mt-12 flex flex-col gap-6 max-w-md">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3.5">
              <span className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-lg shrink-0">
                {f.icon}
              </span>
              <div>
                <p className="m-0 text-sm font-bold text-white">{f.title}</p>
                <p className="mt-0.5 mb-0 text-sm text-neutral-400">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center px-4 py-12 sm:py-16">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
