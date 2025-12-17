import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { lazy } from "react";
import Root from "./Root";

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
const LandingPage = lazy(() => import("../components/LandingPage/landing-page"));
// Ticket pages
const TicketsPage = lazy(() => import("../pages/TicketsPage"));
const TicketDetailPage = lazy(() => import("../pages/TicketDetailPage"));
const CreateTicketPage = lazy(() => import("../pages/CreateTicketPage"));
// Operator pages
const MagicLinkPage = lazy(() => import("../pages/operator/MagicLinkPage"));
const TriggerJobsPage = lazy(() => import("../pages/operator/TriggerJobsPage"));
const CreateAccountsPage = lazy(() => import("../pages/operator/CreateAccountsPage"));
const SupportPage = lazy(() => import("../pages/operator/SupportPage"));
const OperatorTicketsPage = lazy(() => import("../pages/operator/OperatorTicketsPage"));
const ManageClientPage = lazy(() => import("../pages/operator/ManageClientPage"));

function Router() {
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
          {/* Ticket Routes */}
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          {/* Operator Routes */}
          <Route path="/magic-link" element={<MagicLinkPage />} />
          <Route path="/trigger-jobs" element={<TriggerJobsPage />} />
          <Route path="/create-accounts" element={<CreateAccountsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/operator/tickets" element={<OperatorTicketsPage />} />
          <Route path="/manage-client" element={<ManageClientPage />} />
        </Route>
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

export default Router;
