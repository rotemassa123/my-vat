import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ExitToApp as LogoutIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import Login from './Login';

export default function TestLoginComponent() {
  const { user, loading, logout, isAuthenticated } = useAuth();

  if (loading) {
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

  if (isAuthenticated && user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f3faff',
          py: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 480,
            width: '100%',
            mx: 2,
            p: 4,
            borderRadius: 3,
            textAlign: 'center'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 64, 
                color: '#4caf50', 
                mb: 2 
              }} 
            />
            <Typography 
              variant="h4" 
              sx={{ 
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                color: '#4caf50',
                mb: 2
              }}
            >
              🎉 Login Successful!
            </Typography>
          </Box>
          
          <Box sx={{ mb: 4, textAlign: 'left' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Name
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {user.name}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Email
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {user.email}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Account ID
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: 'monospace',
                  backgroundColor: '#f5f5f5',
                  p: 1,
                  borderRadius: 1
                }}
              >
                {user.account_id}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Permissions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {user.permissions.map((permission, index) => (
                  <Chip 
                    key={index}
                    label={permission}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Auth Providers
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {user.auth_providers.map((provider, index) => (
                  <Chip 
                    key={index}
                    label={provider}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Button
            onClick={logout}
            variant="contained"
            color="error"
            fullWidth
            startIcon={<LogoutIcon />}
            sx={{
              mb: 3,
              py: 1.5,
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
              textTransform: 'none'
            }}
          >
            Logout
          </Button>
          
          <Paper 
            variant="outlined"
            sx={{ 
              p: 2, 
              backgroundColor: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <SecurityIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ textAlign: 'center', lineHeight: 1.4 }}
            >
              This demonstrates successful cookie-based authentication!
              <br />
              Your auth token is stored securely in an HTTP-only cookie.
            </Typography>
          </Paper>
        </Paper>
      </Box>
    );
  }

  return <Login />;
} 