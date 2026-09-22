import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import AuthBar from "../components/AuthBar";
import Footer from "../components/Footer";
import NotificationPanel from "../components/NotificationPanel";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/requests", label: "Requests" },
  { to: "/sessions", label: "Sessions" },
  { to: "/history", label: "History" },
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

const Layout = () => {
  const { user } = useAuth();
  const { connected } = useSocket() || {};
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = user?.role === "admin" ? [...NAV_ITEMS, { to: "/admin", label: "Admin" }] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
          {/* Left section: Mobile menu toggle + Logo */}
          <div className="flex items-center gap-3 shrink-0">
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

            <Link to="/" className="flex items-center no-underline shrink-0">
              <img src="/logo.webp" alt="NearPair" className="h-10 sm:h-12 w-auto shrink-0 hover:opacity-90 transition-opacity" />
            </Link>
          </div>

          {/* Center section: Navbar links in the middle */}
          {user && (
            <nav className="hidden sm:flex items-center justify-center gap-1 sm:gap-2 flex-1 mx-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={navLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}
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

        {user && menuOpen && (
          <nav className="sm:hidden flex flex-col gap-1 px-4 pb-3 pt-1 border-t border-slate-100">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={mobileNavLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="pb-10 flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
