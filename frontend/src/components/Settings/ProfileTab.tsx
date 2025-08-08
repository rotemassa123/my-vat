import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  CircularProgress,
} from '@mui/material';

import { useAuthStore } from '../../store/authStore';
import { useMutation } from '@tanstack/react-query';
import { profileApi } from '../../lib/profileApi';
import styles from './ProfileTab.module.scss';

const ProfileTab: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { user, setUser } = useAuthStore();
  
  // Debug what we're rendering
  const currentImageSrc = profileImage || user?.profile_image_url;
  console.log('ProfileTab render - Image source:', currentImageSrc, {
    profileImage,
    userProfileImageUrl: user?.profile_image_url
  });

  const { mutate: uploadImage, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await profileApi.uploadProfileImage(formData);
      return response.profileImageUrl;
    },
    onSuccess: (imageUrl) => {
      console.log('Upload success - received imageUrl:', imageUrl);
      setProfileImage(imageUrl);
      // Update user in auth store
      if (user) {
        setUser({ ...user, profile_image_url: imageUrl });
        console.log('Updated user store with new image URL');
      }
    },
    onError: (error) => {
      console.error('Failed to upload profile image:', error);
      // TODO: Add toast notification for error
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleSaveChanges = () => {
    // TODO: Implement save changes
    console.log('Save changes clicked');
  };

  return (
    <Card className={styles.card}>
      <CardContent>
        <Typography variant="h6" className={styles.sectionTitle}>
          Profile Information
        </Typography>
        
        <Box className={styles.mainContent}>
          {/* Profile Picture Section */}
          <Box className={styles.profilePictureSection}>
            <Box className={styles.avatarContainer}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-image-upload"
                type="file"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <label htmlFor="profile-image-upload" style={{ cursor: 'pointer' }}>
                <Box className={styles.clickableAvatar}>
                  <Avatar
                    src={profileImage || user?.profile_image_url}
                    className={styles.avatar}
                    sx={{ 
                      width: 120, 
                      height: 120,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        filter: 'brightness(0.7)',
                        transform: 'scale(1.05)',
                      }
                    }}
                  />
                  {isUploading && (
                    <Box className={styles.loadingOverlay}>
                      <CircularProgress size={40} sx={{ color: 'white' }} />
                    </Box>
                  )}
                </Box>
              </label>
            </Box>
            <Typography variant="body2" color="text.secondary" className={styles.uploadHint}>
              Click the profile picture to upload a new one
            </Typography>
          </Box>

          {/* Form Fields Section */}
          <Box className={styles.formSection}>
            <TextField
              fullWidth
              label="Full Name"
              defaultValue={user?.fullName}
              className={styles.textField}
              disabled={isUploading}
            />
            <TextField
              fullWidth
              label="Email"
              defaultValue={user?.email}
              disabled
              className={styles.textField}
              helperText="Contact support to change your email"
            />
            <TextField
              fullWidth
              label="Phone Number (Optional)"
              className={styles.textField}
              disabled={isUploading}
            />
          </Box>
        </Box>

        {/* Bottom Section with Account Info and Save Button */}
        <Box className={styles.bottomSection}>
          <Box className={styles.accountInfo}>
            <Typography variant="caption" color="text.secondary">
              Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>
                    <Button
            variant="contained"
            color="primary"
            onClick={handleSaveChanges}
            className={styles.saveButton}
            disabled={isUploading}
          >
            Save Changes
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileTab; 