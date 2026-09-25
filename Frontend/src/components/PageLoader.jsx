/**
 * Suspense fallback while a lazily-loaded page (or the Discover map) is
 * fetched. Takes some vertical space so the footer doesn't jump up and back.
 */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[40vh]" role="status" aria-live="polite">
    <span className="w-8 h-8 rounded-full border-4 border-yellow-200 border-t-yellow-400 animate-spin" />
    <span className="sr-only">Loading…</span>
  </div>
);

export default PageLoader;
