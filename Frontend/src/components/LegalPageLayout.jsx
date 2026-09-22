import { Link } from "react-router-dom";

/**
 * Shared shell for the legal pages (Privacy, Terms, Cookies) — title block
 * plus a consistent place to drop <Section> children.
 */
const LegalPageLayout = ({ title, updated, children }) => {
  return (
    <div className="max-w-3xl mx-auto px-5 py-14">
      <span className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-2 text-xs font-bold tracking-widest text-yellow-700 uppercase font-mono">
        Legal
      </span>
      <h1
        className="mt-5 mb-2 uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl text-neutral-950"
        style={{ fontFamily: "'Anton', Impact, 'Arial Narrow', sans-serif", fontWeight: 400 }}
      >
        {title}
      </h1>
      <p className="text-sm text-neutral-500 mb-10">Last updated {updated}</p>

      <div className="flex flex-col gap-8">{children}</div>

      <div className="mt-12 pt-6 border-t border-neutral-200 text-sm text-neutral-600">
        Questions about this page?{" "}
        <Link to="/contact" className="text-neutral-900 font-semibold hover:text-yellow-600 underline decoration-yellow-400 decoration-2 underline-offset-2">
          Contact us
        </Link>
        .
      </div>
    </div>
  );
};

// `boxed` wraps the body in a bordered card — opt in per page (currently
// just Terms) rather than the default, so Privacy/Cookies stay plain prose.
export const Section = ({ heading, boxed = false, children }) => (
  <section>
    <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-extrabold text-neutral-900 mb-3 mt-0">
      <span className="w-1 h-6 sm:h-7 rounded-full bg-yellow-400 shrink-0" />
      {heading}
    </h2>
    <div
      className={`text-sm text-neutral-700 leading-relaxed flex flex-col gap-2.5 ${
        boxed ? "rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs" : ""
      }`}
    >
      {children}
    </div>
  </section>
);

export const legalListClass = "list-disc pl-5 flex flex-col gap-1.5";

export default LegalPageLayout;
