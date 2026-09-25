import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Layout from "./pages/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Landing/Login/Register are where nearly every visit starts, so they ship in
// the main bundle above. Every other page is its own chunk, fetched on first
// visit while Layout's (or AdminLayout's) <Suspense> shows a spinner.
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Safety = lazy(() => import("./pages/Safety"));
const Faq = lazy(() => import("./pages/Faq"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Profile = lazy(() => import("./pages/Profile"));
const Discover = lazy(() => import("./pages/Discover"));
const Requests = lazy(() => import("./pages/Requests"));
const Sessions = lazy(() => import("./pages/Sessions"));
const ActivityHistory = lazy(() => import("./pages/ActivityHistory"));
const ChatList = lazy(() => import("./pages/ChatList"));
const Chat = lazy(() => import("./pages/Chat"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminActivities = lazy(() => import("./pages/admin/AdminActivities"));
const AdminSessions = lazy(() => import("./pages/admin/AdminSessions"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/history" element={<ActivityHistory />} />
            <Route path="/chat" element={<ChatList />} />
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
