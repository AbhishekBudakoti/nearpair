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
      <Link
        to="/login"
        className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 no-underline"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="hidden sm:inline text-sm font-medium text-slate-800">
        👤 {user.name || user.email}
      </span>
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
