import { useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuthStore();
  const navigate = useNavigate();
  const publicRoutes = ["/login", "/landing-page", "/signup", "/forgot-password"];

  useEffect(() => {    
    if (loading || publicRoutes.includes(window.location.pathname)) return;
    
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  return <Fragment />;
}
