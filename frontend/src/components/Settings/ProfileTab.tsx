import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  IconButton,
  Grid,
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import styles from './ProfileTab.module.scss';

const ProfileTab: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { user } = useAuthStore();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
              <Avatar
                src={profileImage || user?.profile_image_url}
                className={styles.avatar}
                sx={{ width: 120, height: 120 }}
              />
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-image-upload"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="profile-image-upload">
                <IconButton
                  component="span"
                  className={styles.uploadButton}
                  size="large"
                >
                  <PhotoCameraIcon />
                </IconButton>
              </label>
            </Box>
            <Typography variant="body2" color="text.secondary" className={styles.uploadHint}>
              Click the camera icon to upload a new profile picture
            </Typography>
          </Box>

          {/* Form Fields Section */}
          <Box className={styles.formSection}>
            <TextField
              fullWidth
              label="Full Name"
              defaultValue={user?.fullName}
              className={styles.textField}
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
          >
            Save Changes
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileTab; 