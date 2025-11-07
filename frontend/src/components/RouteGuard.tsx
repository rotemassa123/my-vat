import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getNavigationItems } from '../consts/navigationItems';

/**
 * RouteGuard component that ensures users can only access routes
 * that are in their navigation items based on their user type
 */
export default function RouteGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Don't check if still loading or not authenticated
    if (loading || !isAuthenticated || !user) {
      return;
    }

    // Get allowed routes for this user type
    const allowedRoutes = getNavigationItems(user.userType);
    const allowedPaths = allowedRoutes.map(item => item.path);

    // Check if current path is allowed
    const currentPath = location.pathname;
    const isAllowed = allowedPaths.some(path => {
      // Exact match
      if (currentPath === path) {
        return true;
      }
      // Path starts with the allowed path (for nested routes)
      // But make sure it's not just a partial match (e.g., /operator should not match /operator/magic-link)
      if (currentPath.startsWith(path + '/')) {
        return true;
      }
      return false;
    });

    // If not allowed, redirect to first allowed route
    if (!isAllowed && allowedPaths.length > 0) {
      navigate(allowedPaths[0], { replace: true });
    }
  }, [user, loading, isAuthenticated, location.pathname, navigate]);

  return null;
}

