import React from 'react';
import { Box, Typography } from '@mui/material';
import styles from './SettingsHeader.module.scss';

interface SettingsHeaderProps {
  title?: string;
  subtitle?: string;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title = 'Settings',
  subtitle = 'Manage your account preferences and security settings'
}) => {
  return (
    <Box className={styles.header}>
      <Typography variant="h4" className={styles.title}>
        {title}
      </Typography>
      <Typography variant="body1" className={styles.subtitle}>
        {subtitle}
      </Typography>
    </Box>
  );
};

export default SettingsHeader; 