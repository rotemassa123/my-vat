import { useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuthStore();
  const navigate = useNavigate();
  const publicRoutes = ["/landing-page", "/signup", "/forgot-password", "/accept-invitation"];

  useEffect(() => {
    const currentPath = window.location.pathname;
    const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route));
    
    if (loading || isPublicRoute) return;
    
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    
    // Only redirect to dashboard if user is on login page or root
    if (currentPath === "/login" || currentPath === "/") {
      navigate("/dashboard", { replace: true });
    }
    
    // Don't redirect if user is already on a valid authenticated page
  }, [isAuthenticated, loading, navigate]);

  return <Fragment />;
}
