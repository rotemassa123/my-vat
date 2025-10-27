import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { lazy } from "react";
import Root from "./Root";
import { useAuth } from "../hooks/auth/useAuth";

// Lazy load components for better performance
const AppLayout = lazy(() => import("../components/layout/AppLayout"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const AcceptInvitationPage = lazy(() => import("../pages/AcceptInvitationPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const AnalysisPage = lazy(() => import("../pages/AnalysisPage"));
const ReportingPage = lazy(() => import("../pages/ReportingPage"));
const ManagePage = lazy(() => import("../pages/ManagePage"));
const EntitiesPage = lazy(() => import("../pages/EntitiesPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const ChatPage = lazy(() => import("../pages/ChatPage"));
const LandingPage = lazy(() => import("../components/LandingPage/landing-page"));

function Router() {
  useAuth();

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        {/* Public Routes */}
        <Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
          <Route path="/landing-page" element={<LandingPage />} />
        </Route>

        {/* Private Routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/reporting" element={<ReportingPage />} />
          <Route path="/users" element={<ManagePage />} />
          <Route path="/entities" element={<EntitiesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

export default Router;
