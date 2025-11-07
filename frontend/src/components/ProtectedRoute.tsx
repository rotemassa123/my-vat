import { useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getNavigationItems } from "../consts/navigationItems";

export default function ProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuthStore();
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
    
    if (currentPath === "/login" || currentPath === "/") {
      if (user) {
        const allowedRoutes = getNavigationItems(user.userType);
        navigate(allowedRoutes[0].path);
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
    
    // Don't redirect if user is already on a valid authenticated page
  }, [isAuthenticated, loading, user, navigate]);

  return <Fragment />;
}
