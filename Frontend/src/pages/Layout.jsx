import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import AuthBar from "../components/AuthBar";
import Footer from "../components/Footer";
import NotificationPanel from "../components/NotificationPanel";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

// Requests/Sessions/History all deal with your ongoing activity with
// partners, so they live together under one "Activity" dropdown instead of
// crowding the top-level nav.
const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/chat", label: "Chat" },
  {
    label: "Activity",
    children: [
      { to: "/requests", label: "Requests" },
      { to: "/sessions", label: "Sessions" },
      { to: "/history", label: "History" },
    ],
  },
  { to: "/profile", label: "Profile" },
];

const navLinkClass = ({ isActive }) =>
  `text-sm transition-all duration-150 py-1.5 px-3 rounded-lg ${
    isActive
      ? "text-yellow-600 font-bold bg-yellow-50/80 border-b-2 border-yellow-400"
      : "text-slate-700 font-medium hover:text-amber-500 hover:font-bold hover:bg-yellow-50/50"
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm transition-all ${
    isActive
      ? "bg-yellow-100 text-yellow-800 font-bold"
      : "text-slate-700 font-medium hover:bg-yellow-50 hover:text-amber-500 hover:font-bold"
  }`;

const RequestBadge = ({ count, className }) =>
  count > 0 ? (
    <span className={`rounded-full bg-red-500 text-white font-bold flex items-center justify-center leading-none ${className}`}>
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

/** Desktop-only dropdown trigger for a nav item with children. */
const NavDropdown = ({ item, pendingRequestCount }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const isActive = item.children.some((c) => location.pathname === c.to);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`relative flex items-center gap-1 cursor-pointer ${navLinkClass({ isActive })}`}
      >
        {item.label}
        <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        <RequestBadge
          count={pendingRequestCount}
          className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px]"
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={() => setOpen(false)}
              className={({ isActive: childActive }) =>
                `flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                  childActive ? "text-yellow-600 font-bold bg-yellow-50" : "text-slate-700 font-medium hover:bg-yellow-50/50"
                }`
              }
            >
              {child.label}
              {child.to === "/requests" && (
                <RequestBadge count={pendingRequestCount} className="min-w-[16px] h-4 px-1 text-[10px]" />
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const Layout = () => {
  const { user } = useAuth();
  const { connected, pendingRequestCount } = useSocket() || {};
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = user?.role === "admin" ? [...NAV_ITEMS, { to: "/admin", label: "Admin" }] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-2 sm:gap-4">
          {/* Left section: Mobile menu toggle + Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            {user && (
              <button
                type="button"
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            )}

            <Link to="/" className="flex items-center no-underline shrink-0 min-w-0">
              <img src="/logo.webp" alt="NearPair" className="h-8 sm:h-12 w-auto max-w-[45vw] sm:max-w-none shrink-0 hover:opacity-90 transition-opacity" />
            </Link>
          </div>

          {/* Center section: Navbar links in the middle */}
          {user && (
            <nav className="hidden sm:flex items-center justify-center gap-1 sm:gap-2 flex-1 mx-2">
              {navItems.map((item) =>
                item.children ? (
                  <NavDropdown key={item.label} item={item} pendingRequestCount={pendingRequestCount} />
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) => `relative ${navLinkClass({ isActive })}`}
                  >
                    {item.label}
                  </NavLink>
                )
              )}
              <span
                title={connected ? "Live updates connected" : "Live updates reconnecting..."}
                className={`w-2 h-2 rounded-full ml-1 shrink-0 ${connected ? "bg-emerald-500" : "bg-slate-300"}`}
              />
            </nav>
          )}

          {/* Right section: Auth & Notifications */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <AuthBar />
            {user && <NotificationPanel />}
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {user && menuOpen && (
          <nav className="sm:hidden flex flex-col gap-1 px-4 pb-4 pt-2 border-t border-slate-100 bg-white animate-in slide-in-from-top duration-200">
            {/* User header inside mobile drawer */}
            <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-9 h-9 rounded-full bg-yellow-400 text-neutral-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                {(user.name || user.email || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 m-0 truncate">{user.name || "User"}</p>
                <p className="text-xs text-slate-500 m-0 truncate">{user.email}</p>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`}
                title={connected ? "Connected" : "Disconnected"}
              />
            </div>

            {navItems.map((item) =>
              item.children ? (
                <div key={item.label} className="mt-1">
                  <div className="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span>⚡</span> {item.label}
                  </div>
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) => `flex items-center justify-between ml-2 ${mobileNavLinkClass({ isActive })}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>
                        {child.to === "/requests" ? "📩 " : child.to === "/sessions" ? "📅 " : "📜 "}
                        {child.label}
                      </span>
                      {child.to === "/requests" && (
                        <RequestBadge count={pendingRequestCount} className="min-w-[18px] h-[18px] px-1 text-[11px]" />
                      )}
                    </NavLink>
                  ))}
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => `flex items-center justify-between ${mobileNavLinkClass({ isActive })}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>
                    {item.to === "/" ? "🏠 " : item.to === "/discover" ? "🔍 " : item.to === "/chat" ? "💬 " : item.to === "/profile" ? "👤 " : "⚙️ "}
                    {item.label}
                  </span>
                </NavLink>
              )
            )}
          </nav>
        )}
      </header>

      <main className="pb-20 sm:pb-10 flex-1">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar for logged-in users */}
      {user && (
        <nav
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex justify-around items-center shadow-lg sm:hidden"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-[10px] font-semibold transition-colors no-underline ${
                isActive ? "text-yellow-600 font-bold" : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            <span className="text-base leading-none">🏠</span>
            <span className="mt-1">Home</span>
          </NavLink>

          <NavLink
            to="/discover"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-[10px] font-semibold transition-colors no-underline ${
                isActive ? "text-yellow-600 font-bold" : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            <span className="text-base leading-none">🔍</span>
            <span className="mt-1">Discover</span>
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-[10px] font-semibold transition-colors no-underline ${
                isActive ? "text-yellow-600 font-bold" : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            <span className="text-base leading-none">💬</span>
            <span className="mt-1">Chat</span>
          </NavLink>

          <NavLink
            to="/requests"
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center text-[10px] font-semibold transition-colors no-underline ${
                isActive ? "text-yellow-600 font-bold" : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            <span className="text-base leading-none">📩</span>
            <span className="mt-1">Requests</span>
            {pendingRequestCount > 0 && (
              <span className="absolute -top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-[10px] font-semibold transition-colors no-underline ${
                isActive ? "text-yellow-600 font-bold" : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            <span className="text-base leading-none">👤</span>
            <span className="mt-1">Profile</span>
          </NavLink>
        </nav>
      )}

      <Footer />
    </div>
  );
};

export default Layout;
