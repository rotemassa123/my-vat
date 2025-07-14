import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import Root from "./Root";
import ProtectedRoute from "../components/ProtectedRoute";

// Lazy load components for better performance
const AppLayout = lazy(() => import("../components/layout/AppLayout"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const AnalysisPage = lazy(() => import("../pages/AnalysisPage"));
const ReportingPage = lazy(() => import("../pages/ReportingPage"));
const ManagePage = lazy(() => import("../pages/ManagePage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-lg">Loading...</div>
  </div>
);

// Create router once, outside component
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Root />}>
      {/* Public Routes */}
      <Route path="/login" element={
        <Suspense fallback={<LoadingSpinner />}>
          <LoginPage />
        </Suspense>
      } />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={
          <Suspense fallback={<LoadingSpinner />}>
            <AppLayout />
          </Suspense>
        }>
          <Route index element={
            <Suspense fallback={<LoadingSpinner />}>
              <DashboardPage />
            </Suspense>
          } />
          <Route path="/dashboard" element={
            <Suspense fallback={<LoadingSpinner />}>
              <DashboardPage />
            </Suspense>
          } />
          <Route path="/analysis" element={
            <Suspense fallback={<LoadingSpinner />}>
              <AnalysisPage />
            </Suspense>
          } />
          <Route path="/reporting" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ReportingPage />
            </Suspense>
          } />
          <Route path="/manage-account" element={
            <Suspense fallback={<LoadingSpinner />}>
              <ManagePage />
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<LoadingSpinner />}>
              <SettingsPage />
            </Suspense>
          } />
        </Route>
      </Route>
    </Route>
  )
);

function Router() {
  return <RouterProvider router={router} />;
}

export default Router; 