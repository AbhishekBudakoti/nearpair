import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Route guard: renders its nested routes only when GET /auth/me (via
 * AuthContext) resolved to a logged-in user. Otherwise redirects to /login,
 * remembering where the user was headed so they can be sent back after login.
 */
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="text-center text-sm text-slate-500 py-16">
        Checking authentication...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
