import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import AuthBar from "../components/AuthBar";
import NotificationPanel from "../components/NotificationPanel";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const NAV_ITEMS = [
  { to: "/discover", label: "Discover" },
  { to: "/requests", label: "Requests" },
  { to: "/sessions", label: "Sessions" },
  { to: "/history", label: "History" },
  { to: "/profile", label: "Profile" },
];

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-blue-600 font-semibold" : "text-slate-600 hover:text-slate-900"
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-600 hover:bg-slate-50"
  }`;

const Layout = () => {
  const { user } = useAuth();
  const { connected } = useSocket() || {};
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = user?.role === "admin" ? [...NAV_ITEMS, { to: "/admin", label: "Admin" }] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-xs">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
          <div className="flex items-center gap-5 min-w-0">
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

            <Link to="/" className="flex items-center gap-1.5 no-underline min-w-0">
              <span className="text-lg shrink-0">🤝</span>
              <h1 className="m-0 text-lg sm:text-xl font-bold text-slate-900 truncate">
                NearPair
              </h1>
            </Link>

            {user && (
              <nav className="hidden sm:flex items-center gap-4">
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className={navLinkClass}>
                    {item.label}
                  </NavLink>
                ))}
                {/* Live-connection indicator — a dot rather than a persistent
                    "Disconnected" banner, since brief drops during navigation
                    are normal and shouldn't read as an error state. */}
                <span
                  title={connected ? "Live updates connected" : "Live updates reconnecting..."}
                  className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`}
                />
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <AuthBar />
            {user && <NotificationPanel />}
          </div>
        </div>

        {user && menuOpen && (
          <nav className="sm:hidden flex flex-col gap-1 px-4 pb-3 pt-1 border-t border-slate-100">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={mobileNavLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="pb-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
