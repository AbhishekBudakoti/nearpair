import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Layout from "./pages/Layout";
import Landing from "./pages/Landing";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Requests from "./pages/Requests";
import Sessions from "./pages/Sessions";
import Chat from "./pages/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminReports from "./pages/AdminReports";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminActivities from "./pages/admin/AdminActivities";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminReviews from "./pages/admin/AdminReviews";

/** Signed-in visitors skip the marketing page and land straight in the app. */
const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/discover" replace /> : <Landing />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/chat/:userId" element={<Chat />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<AdminOverview />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="activities" element={<AdminActivities />} />
                <Route path="sessions" element={<AdminSessions />} />
                <Route path="reviews" element={<AdminReviews />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Home />} />
          <Route
            path="*"
            element={
              <div className="max-w-md mx-auto text-center px-4 py-16">
                <p className="text-sm text-slate-500 m-0">Page not found.</p>
                <a href="/" className="text-sm text-blue-600 font-medium">
                  Go home
                </a>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
