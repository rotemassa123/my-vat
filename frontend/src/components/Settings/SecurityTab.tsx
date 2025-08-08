import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
} from '@mui/material';
import styles from './SecurityTab.module.scss';

const SecurityTab: React.FC = () => {
  const handleChangePassword = () => {
    // TODO: Implement password change
    console.log('Change password clicked');
  };

  return (
    <Card className={styles.card}>
      <CardContent>
        <Typography variant="h6" className={styles.sectionTitle}>
          Security Settings
        </Typography>

        <Box className={styles.securitySection}>
          <Typography variant="subtitle1" className={styles.subsectionTitle}>
            Password Management
          </Typography>
          
          <Box className={styles.passwordSection}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              className={styles.textField}
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              className={styles.textField}
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              className={styles.textField}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleChangePassword}
              className={styles.actionButton}
            >
              Change Password
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SecurityTab; 