import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuth } from "../hooks/auth/useAuth";
import Root from "./Root";
import ProtectedRoute from "../components/ProtectedRoute";

// Lazy load components for better performance
const AppLayout = lazy(() => import("../components/layout/AppLayout"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const AnalysisPage = lazy(() => import("../pages/AnalysisPage"));
const ReportingPage = lazy(() => import("../pages/ReportingPage"));
const ManagePage = lazy(() => import("../pages/ManagePage"));
const AuthTestPage = lazy(() => import("../pages/AuthTestPage"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-lg">Loading...</div>
  </div>
);

function Router() {
  // Initialize auth check
  useAuth();

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        {/* Public Routes */}
        <Route path="/login" element={
          <Suspense fallback={<LoadingSpinner />}>
            <LoginPage />
          </Suspense>
        } />
        <Route path="/auth-test" element={
          <Suspense fallback={<LoadingSpinner />}>
            <AuthTestPage />
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
            <Route path="/manage" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ManagePage />
              </Suspense>
            } />
          </Route>
        </Route>
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

export default Router; 