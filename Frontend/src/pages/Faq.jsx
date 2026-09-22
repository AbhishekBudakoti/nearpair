import { Link } from "react-router-dom";

const FAQ_GROUPS = [
  {
    group: "General",
    items: [
      {
        q: "Is NearPair free?",
        a: "Yes. Browsing, matching, sending requests, and chatting are all free.",
      },
      {
        q: "Do you sell my data?",
        a: "No. We don't sell personal information or share it with advertisers — see our Privacy Policy for the full picture.",
      },
      {
        q: "Do I need to download an app?",
        a: "No, NearPair runs in your browser.",
      },
    ],
  },
  {
    group: "Matching",
    items: [
      {
        q: "How does matching work?",
        a: "Every candidate gets a weighted score based on shared activity, distance, availability overlap, skill level, your rating, and — once you've completed a few sessions — what's worked well for you before.",
      },
      {
        q: "Can I have more than one activity?",
        a: "Yes. Add as many activities as you like from your Profile page, each with its own skill level.",
      },
      {
        q: "How accurate is the location shown to others?",
        a: "Matches only ever see an approximate location, rounded to roughly a kilometer — never your exact coordinates or address.",
      },
      {
        q: "How do I set my availability?",
        a: "On your Profile page: pick days with the Every day / Weekdays / Weekend presets (or select individual days), then add one or more time slots that apply to all of them.",
      },
    ],
  },
  {
    group: "Safety",
    items: [
      {
        q: "How do I report or block someone?",
        a: "Open their profile or your chat with them and use the menu to block or report — no need to dig through settings.",
      },
      {
        q: "What happens after I report someone?",
        a: "It goes into a moderation queue for review. Depending on what's found, the account can be warned or suspended.",
      },
      {
        q: "What if a match doesn't show up?",
        a: "It happens. You can leave that out of your review, and repeated no-shows reported to us are taken into account during moderation.",
      },
    ],
  },
  {
    group: "Account",
    items: [
      {
        q: "How do I delete my account?",
        a: "Contact us and we'll take care of it for you.",
      },
      {
        q: "I forgot my password — what do I do?",
        a: "Contact us with the email your account uses and we'll help you get back in.",
      },
      {
        q: "Can I sign in with Google?",
        a: "Where it's enabled, yes — look for the \"Continue with Google\" option on the login or register page.",
      },
    ],
  },
];

const Faq = () => {
  return (
    <div className="max-w-3xl mx-auto px-5 py-14">
      <span className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-2 text-xs font-bold tracking-widest text-yellow-700 uppercase font-mono">
        FAQ
      </span>
      <h1
        className="mt-5 mb-3 uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl text-neutral-950"
        style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
      >
        Questions, answered.
      </h1>
      <p className="text-base text-neutral-600 mb-10">
        Can't find what you're looking for?{" "}
        <Link to="/contact" className="text-neutral-900 font-semibold underline decoration-yellow-400 decoration-2">
          Contact us
        </Link>
        .
      </p>

      <div className="flex flex-col gap-10">
        {FAQ_GROUPS.map((g) => (
          <div key={g.group}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-yellow-700 mb-3">
              {g.group}
            </h2>
            <div className="flex flex-col gap-2.5">
              {g.items.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-neutral-200 open:border-yellow-400 px-4 py-3"
                >
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-sm font-semibold text-neutral-900">
                    {item.q}
                    <span className="shrink-0 text-neutral-400 transition-transform group-open:rotate-45 text-lg leading-none">
                      +
                    </span>
                  </summary>
                  <p className="mt-2.5 mb-0 text-sm text-neutral-600 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Faq;
