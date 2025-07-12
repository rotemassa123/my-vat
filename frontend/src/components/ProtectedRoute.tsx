import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/auth/useAuth';
import { useProfileStore } from '../store/profileStore';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { loading: isProfileLoading } = useProfileStore();

  const isAppBusy = isAuthLoading || isProfileLoading;

  // Show a full-screen loader while auth state is resolving or the
  // initial profile is being fetched.
  if (isAppBusy) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f3faff',
        }}
      >
        <CircularProgress size={48} sx={{ color: '#0131ff' }} />
      </Box>
    );
  }

  // If the app is no longer busy but the user is not authenticated, redirect.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the protected content.
  return <Outlet />;
} 