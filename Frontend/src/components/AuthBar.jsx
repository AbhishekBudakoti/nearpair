import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

/**
 * Displays the current login state in the navbar: a Login link when signed
 * out, or the user's name plus a Logout button when signed in. Auth state
 * itself lives in AuthContext (backed by GET /auth/me); the actual login
 * form lives on the /login page.
 */
export const AuthBar = () => {
  const { user, loading, logout } = useAuth();
  const { disconnectSocket } = useSocket() || {};

  const handleLogout = async () => {
    await logout();
    if (disconnectSocket) disconnectSocket();
  };

  if (loading) {
    return <span className="text-sm text-slate-500">Checking auth status...</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/register"
          className="px-3 py-1.5 text-sm font-semibold text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-100 no-underline"
        >
          Sign up
        </Link>
        <Link
          to="/login"
          className="px-3 py-1.5 text-sm font-bold text-neutral-950 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors no-underline"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <Link
        to="/profile"
        className="hidden sm:inline text-sm font-medium text-slate-800 hover:text-amber-500 hover:font-bold transition-all no-underline"
      >
        👤 {user.name || user.email}
      </Link>
      <button
        onClick={handleLogout}
        className="px-2.5 sm:px-3 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer whitespace-nowrap"
      >
        Logout
      </button>
    </div>
  );
};

export default AuthBar;
