import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-neutral-950 text-neutral-400 px-5 py-12 border-t border-neutral-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-10">
          <div className="max-w-xs">
            <img src="/logo-footer.webp" alt="NearPair" className="h-10 sm:h-12 w-auto object-contain" />
            <p className="mt-3 mb-0 text-sm leading-relaxed text-neutral-400">
              Match with people nearby who share your sport, hobby, or skill
              level — then chat, schedule a session, and go do it together.
            </p>
          </div>

          <div className="flex flex-wrap gap-10 sm:gap-16">
            <div>
              <h3 className="m-0 text-xs font-bold uppercase tracking-widest text-white">
                Product
              </h3>
              <ul className="list-none p-0 mt-4 mb-0 flex flex-col gap-3 text-sm">
                <li>
                  <a href="/#how-it-works" className="text-neutral-400 hover:text-yellow-400 transition-colors no-underline">
                    How it works
                  </a>
                </li>
                <li>
                  <Link to="/about" className="text-neutral-400 hover:text-yellow-400 transition-colors no-underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-neutral-400 hover:text-yellow-400 transition-colors no-underline">
                    Get started
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-neutral-400 hover:text-yellow-400 transition-colors no-underline">
                    Log in
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="m-0 text-xs font-bold uppercase tracking-widest text-white">
                Support
              </h3>
              <ul className="list-none p-0 mt-4 mb-0 flex flex-col gap-3 text-sm">
                <li>
                  <Link to="/faq" className="text-neutral-400 hover:text-yellow-400 transition-colors no-underline">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/safety" className="text-neutral-400 hover:text-yellow-400 transition-colors no-underline">
                    Safety &amp; Trust
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-neutral-400 hover:text-yellow-400 transition-colors no-underline">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="m-0 text-xs font-bold uppercase tracking-widest text-white">
                Legal
              </h3>
              <ul className="list-none p-0 mt-4 mb-0 flex flex-col gap-3 text-sm">
                <li>
                  <Link to="/privacy" className="text-neutral-400 hover:text-yellow-400 transition-colors no-underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-neutral-400 hover:text-yellow-400 transition-colors no-underline">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-neutral-400 hover:text-yellow-400 transition-colors no-underline">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-center sm:text-left text-neutral-500">
          <p className="m-0">© {new Date().getFullYear()} NearPair. Never go solo.</p>
          <p className="m-0">Made for people who'd rather show up together.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
