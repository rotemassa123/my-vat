import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/auth/useAuth';
import { useInvoiceLoader } from '../hooks/useInvoiceLoader';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Kick-off invoice loading as soon as the user is authenticated.
  // We don't block the UI here; the hook will populate the cache in the background.
  useInvoiceLoader({ autoLoad: true });

  // Show loading spinner while checking authentication
  if (authLoading) {
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content when authenticated
  return <Outlet />;
} 