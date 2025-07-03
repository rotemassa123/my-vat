import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useLogin } from '../hooks/auth/useLogin';
import { useAuthStore } from '../store/authStore';
import { type LoginCredentials } from '../lib/authApi';
import styles from '../components/Login.module.scss';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { login, isLoading, error, isSuccess } = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<LoginCredentials>({ 
    email: '', 
    password: '' 
  });

  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(form);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Redirect if already authenticated or login successful
  useEffect(() => {
    if (isAuthenticated || isSuccess) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isSuccess, navigate]);

  // Handle OAuth callback success/error
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login');
    const authError = urlParams.get('error');
    
    if (loginSuccess === 'success') {
      navigate('/dashboard');
    } else if (authError) {
      console.error('OAuth login failed:', authError);
    }
  }, [navigate]);

  const handleGoogleLogin = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const GoogleIcon = () => (
    <svg className={styles.googleIcon} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <Box className={styles.loginContainer}>
      <Box className={styles.loginCard}>
        {/* Logo Section */}
        <Box className={styles.logo}>
          <Typography className={styles.logoMy}>MY</Typography>
          <Typography className={styles.logoVat}>VAT</Typography>
        </Box>

        {/* Tagline */}
        <Box className={styles.tagline}>
          <Typography className={styles.taglineText}>
            All your claims. <span className={styles.highlight}>One place.</span>
          </Typography>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity="error" className={styles.errorMessage}>
            {error.message || 'Login failed. Please try again.'}
          </Alert>
        )}

        {/* Form Container */}
        <Box className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Box className={styles.inputGroup}>
              {/* Email Field */}
              <Box className={styles.inputWrapper}>
                <TextField
                  className={styles.inputField}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  variant="outlined"
                  fullWidth
                  required
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#40578c' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Password Field */}
              <Box className={styles.inputWrapper}>
                <TextField
                  className={styles.inputField}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  variant="outlined"
                  fullWidth
                  required
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#40578c' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Login'}
            </Button>

            {/* Divider */}
            <Box className={styles.divider}>
              <Typography className={styles.dividerText}>or</Typography>
            </Box>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="outlined"
              className={styles.googleButton}
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <GoogleIcon />
              Continue with Google
            </Button>
          </form>
        </Box>
      </Box>
    </Box>
  );
} 