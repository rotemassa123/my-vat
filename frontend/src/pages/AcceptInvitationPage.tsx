import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
  ErrorOutline,
  PhotoCamera,
  Email,
} from '@mui/icons-material';
import { useValidateInvitation, useValidateInvitationToken, useCompleteSignup } from '../hooks/invitation/useInviteUsers';
import type { ValidateInvitationRequest, CompleteSignupRequest } from '../lib/invitationApi';
import styles from './AcceptInvitationPage.module.scss';

interface SignupFormData {
  fullName: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  profile_image_url?: string;
}

const SIGNUP_STEPS = [
  {
    id: 1,
    label: 'Basic Information',
  },
  {
    id: 2,
    label: 'Security Setup',
  },
  {
    id: 3,
    label: 'Optional Details',
  },
];

const AcceptInvitationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordComplexityError, setPasswordComplexityError] = useState<string>('');
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    password: '',
    confirmPassword: '',
    phone: '',
    profile_image_url: '',
  });

  // Extract invitation parameters from URL (support both token and legacy parameters)
  const { invitationParams, invitationToken } = React.useMemo(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // New secure token-based invitation
      return { invitationParams: undefined, invitationToken: token };
    } else {
      // Legacy parameter-based invitation
      const email = searchParams.get('email');
      const accountId = searchParams.get('accountId');
      const role = searchParams.get('role');
      const entityId = searchParams.get('entityId');

      if (!email || !accountId || !role) {
        return { invitationParams: undefined, invitationToken: undefined };
      }

      return {
        invitationParams: {
          email,
          accountId,
          role,
          entityId: entityId || undefined,
        },
        invitationToken: undefined
      };
    }
  }, [searchParams]);

  // Validate invitation (use token-based validation if available, otherwise fallback to legacy)
  const {
    data: legacyValidationData,
    isLoading: isLegacyValidating,
    error: legacyValidationError,
  } = useValidateInvitation(invitationParams);

  const {
    data: tokenValidationData,
    isLoading: isTokenValidating,
    error: tokenValidationError,
  } = useValidateInvitationToken(invitationToken);

  // Use token validation if available, otherwise use legacy
  const validationData = tokenValidationData || legacyValidationData;
  const isValidating = isTokenValidating || isLegacyValidating;
  const validationError = tokenValidationError || legacyValidationError;

  // Complete signup mutation
  const {
    completeSignup,
    isLoading: isCompletingSignup,
    error: signupError,
    data: signupData,
  } = useCompleteSignup();

  // Redirect if no invitation parameters
  useEffect(() => {
    if (!invitationParams && !invitationToken) {
      navigate('/login?error=invalid_invitation_link');
    }
  }, [invitationParams, invitationToken, navigate]);

  // Handle form updates
  const updateFormData = (updates: Partial<SignupFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Validate password complexity
  const validatePasswordComplexity = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`At least ${minLength} characters`);
    }
    if (!hasUpperCase) {
      errors.push('One uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('One lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('One number');
    }
    if (!hasSpecialChar) {
      errors.push('One special character');
    }
    
    return errors;
  };

  // Validate passwords match
  const validatePasswords = () => {
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  };

  // Update password validation when either password field changes
  useEffect(() => {
    validatePasswords();
    
    // Validate password complexity
    if (formData.password) {
      const complexityErrors = validatePasswordComplexity(formData.password);
      if (complexityErrors.length > 0) {
        setPasswordComplexityError(complexityErrors.join(', '));
      } else {
        setPasswordComplexityError('');
      }
    } else {
      setPasswordComplexityError('');
    }
  }, [formData.password, formData.confirmPassword]);

  // Handle profile image upload
  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (currentStep < SIGNUP_STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validationData?.isValid || !validationData.user) return;

    // Additional security: For legacy invitations, ensure the email matches
    if (invitationParams) {
      const invitationEmail = invitationParams.email.toLowerCase().trim();
      const validationEmail = validationData.user.email.toLowerCase().trim();
      
      if (invitationEmail !== validationEmail) {
        console.error('Email mismatch detected during signup');
        return;
      }
    }

    try {
      // TODO: Upload profile image to cloud storage if selected
      // For now, we'll just pass the image data
      const signupRequest: CompleteSignupRequest = {
        email: validationData.user.email, // Use the validated email from the backend
        fullName: formData.fullName,
        password: formData.password,
        phone: formData.phone || undefined,
        profile_image_url: profileImage ? profileImagePreview : undefined,
      };

      await completeSignup(signupRequest);
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  // Render loading state
  if (isValidating) {
    return (
      <Box className={styles.container}>
        <Box className={styles.card}>
          <Box className={styles.loadingContainer}>
            <CircularProgress size={48} sx={{ color: '#004DFF' }} />
            <Typography className={styles.loadingText}>
              Validating your invitation...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Render validation error
  if (validationError || !validationData?.isValid) {
    return (
      <Box className={styles.container}>
        <Box className={styles.card}>
          <Box className={styles.errorContainer}>
            <ErrorOutline className={styles.errorIcon} />
            <Typography className={styles.errorTitle}>
              Invalid Invitation
            </Typography>
            <Typography className={styles.errorMessage}>
              {validationData?.error || validationError?.message || 'This invitation link is not valid.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              className={styles.errorButton}
            >
              Go to Login
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // Render success state
  if (signupData?.success) {
    return (
      <Box className={styles.container}>
        <Box className={styles.card}>
          <Box className={styles.successContainer}>
            <CheckCircle className={styles.successIcon} />
            <Typography className={styles.successTitle}>
              Welcome to MyVAT!
            </Typography>
            <Typography className={styles.successMessage}>
              Your account has been successfully created. You can now start using MyVAT.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              className={styles.successButton}
            >
              Continue to Login
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // Render main signup flow
  return (
    <Box className={styles.container}>
      <Box className={styles.card}>
        {/* Logo Section */}
        <Box className={styles.logo}>
          <Typography className={styles.logoMy}>MY</Typography>
          <Typography className={styles.logoVat}>VAT</Typography>
        </Box>

        {/* Tagline */}
        <Box className={styles.tagline}>
          <Typography className={styles.taglineText}>
            Join <span className={styles.highlight}>{validationData.account?.company_name}</span>
          </Typography>
        </Box>

        {/* Progress Dots */}
        <Box className={styles.progressContainer}>
          {SIGNUP_STEPS.map((step) => (
            <Box
              key={step.id}
              className={`${styles.progressDot} ${
                currentStep > step.id ? styles.completed : 
                currentStep === step.id ? styles.active : styles.inactive
              }`}
            />
          ))}
        </Box>

        {/* Step Indicator */}
        <Box className={styles.stepIndicator}>
          <Typography className={styles.stepText}>
            Step {currentStep} of {SIGNUP_STEPS.length}
          </Typography>
          <Typography className={styles.stepLabel}>
            {SIGNUP_STEPS[currentStep - 1]?.label}
          </Typography>
        </Box>

        {/* Error Message */}
        {signupError && (
          <Alert severity="error" className={styles.errorAlert}>
            {signupError.message || 'Failed to complete signup. Please try again.'}
          </Alert>
        )}

        {/* Form Content */}
        <Box className={styles.formContainer}>
          {currentStep === 1 && (
            <Box className={styles.stepContent}>
              <Typography className={styles.stepTitle}>
                Let's get started
              </Typography>
              <Typography className={styles.stepDescription}>
                Enter your basic information to create your account
              </Typography>
              
              <Box className={styles.inputGroup}>
                <TextField
                  className={styles.inputField}
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateFormData({ fullName: e.target.value })}
                  placeholder="Enter your full name"
                  variant="outlined"
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#40578c' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  className={styles.inputField}
                  type="email"
                  value={validationData.user?.email || ''}
                  variant="outlined"
                  fullWidth
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#9CA3AF' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Button
                variant="contained"
                className={styles.nextButton}
                onClick={handleNextStep}
                disabled={!formData.fullName.trim()}
              >
                Continue
              </Button>
            </Box>
          )}

          {currentStep === 2 && (
            <Box className={styles.stepContent}>
              <Typography className={styles.stepTitle}>
                Create your password
              </Typography>
              <Typography className={styles.stepDescription}>
                Choose a strong password to secure your account
              </Typography>
              
              <Box className={styles.inputGroup}>
                <TextField
                  className={styles.inputField}
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateFormData({ password: e.target.value })}
                  placeholder="Enter your password"
                  variant="outlined"
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#40578c' }} />
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
                
                {/* Password Complexity Error Message */}
                {passwordComplexityError && (
                  <Typography className={styles.passwordComplexityError}>
                    {passwordComplexityError}
                  </Typography>
                )}
                
                <TextField
                  className={styles.inputField}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  variant="outlined"
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#40578c' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
                
                {/* Password Error Message */}
                {passwordError && (
                  <Typography className={styles.passwordError}>
                    {passwordError}
                  </Typography>
                )}
              </Box>

              <Box className={styles.buttonGroup}>
                <Button
                  variant="outlined"
                  className={styles.backButton}
                  onClick={handlePrevStep}
                >
                  Back
                </Button>
                                  <Button
                    variant="contained"
                    className={styles.nextButton}
                    onClick={handleNextStep}
                    disabled={!formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword || !!passwordComplexityError}
                  >
                    Continue
                  </Button>
              </Box>
            </Box>
          )}

                      {currentStep === 3 && (
              <Box className={styles.stepContent}>
                <Typography className={styles.stepTitle}>
                  Optional details
                </Typography>
                <Typography className={styles.stepDescription}>
                  Add your phone number and profile picture (optional)
                </Typography>
                
                <Box className={styles.inputGroup}>
                  <TextField
                    className={styles.inputField}
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData({ phone: e.target.value })}
                    placeholder="Enter your phone number (optional)"
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: '#40578c' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  {/* Profile Picture Upload */}
                  <Box className={styles.profileImageContainer}>
                    <Typography className={styles.profileImageLabel}>
                      Profile Picture (optional)
                    </Typography>
                    
                    <Box className={styles.profileImageUpload}>
                      {profileImagePreview ? (
                        <Box className={styles.profileImagePreview}>
                          <img 
                            src={profileImagePreview} 
                            alt="Profile preview" 
                            className={styles.profileImage}
                          />
                          <Button
                            className={styles.changeImageButton}
                            onClick={() => {
                              setProfileImage(null);
                              setProfileImagePreview('');
                            }}
                          >
                            Change
                          </Button>
                        </Box>
                      ) : (
                        <Box className={styles.uploadArea}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageChange}
                            className={styles.fileInput}
                            id="profile-image-input"
                          />
                          <label htmlFor="profile-image-input" className={styles.uploadLabel}>
                            <PhotoCamera className={styles.uploadIcon} />
                            <Typography className={styles.uploadText}>
                              Click to upload profile picture
                            </Typography>
                            <Typography className={styles.uploadSubtext}>
                              JPG, PNG or GIF (max 5MB)
                            </Typography>
                          </label>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box className={styles.buttonGroup}>
                  <Button
                    variant="outlined"
                    className={styles.backButton}
                    onClick={handlePrevStep}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    className={styles.submitButton}
                    onClick={handleSubmit}
                    disabled={isCompletingSignup}
                  >
                    {isCompletingSignup ? <CircularProgress size={24} /> : 'Complete Signup'}
                  </Button>
                </Box>
              </Box>
            )}
        </Box>
      </Box>
    </Box>
  );
};

export default AcceptInvitationPage; 