import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useBulkInvoiceLoader } from '../hooks/useBulkInvoiceLoader';
import InvoiceLoadingScreen from './InvoiceLoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    isLoading: invoicesLoading,
    loadingProgress,
    error: invoiceError,
    totalLoaded,
    resetAndReload,
    cancelLoading
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

  // Show invoice loading screen while invoices are being loaded
  if (invoicesLoading || (loadingProgress < 100 && totalLoaded === 0)) {
    return (
      <InvoiceLoadingScreen
        isLoading={invoicesLoading}
        progress={loadingProgress}
        totalLoaded={totalLoaded}
        error={invoiceError}
        onRetry={resetAndReload}
        onCancel={invoicesLoading ? cancelLoading : undefined}
      />
    );
  }

  // Render protected content if authenticated and invoices are loaded
  return <>{children}</>;
} 