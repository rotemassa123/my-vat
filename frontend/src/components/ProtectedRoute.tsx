import { useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuthStore();
  const navigate = useNavigate();  

  useEffect(() => {    
    if (loading) return;
    
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  return <Fragment />;
}
