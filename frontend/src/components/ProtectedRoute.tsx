import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../hooks/auth/useAuth';
import { useBulkInvoiceLoader } from '../hooks/useBulkInvoiceLoader';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    isLoading: invoicesLoading,
    totalLoaded
  } = useBulkInvoiceLoader();

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f3faff'
        }}
      >
        <CircularProgress 
          size={48} 
          sx={{ color: '#0131ff' }}
        />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show simple spinner while invoices are being loaded
  if (invoicesLoading || totalLoaded === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f3faff 0%, #e8f4fd 100%)',
          gap: 3
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ 
            color: '#0131ff',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#333', 
              fontWeight: 500,
              mb: 1
            }}
          >
            Loading your invoices...
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#666',
              fontSize: '14px'
            }}
          >
            {totalLoaded > 0 ? `${totalLoaded.toLocaleString()} loaded` : 'This will only take a moment'}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Render protected content if authenticated and invoices are loaded
  return <Outlet />;
} 