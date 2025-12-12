import React from 'react';
import { Box, Typography } from '@mui/material';
import styles from './SettingsHeader.module.scss';

interface SettingsHeaderProps {
  title?: string;
  subtitle?: string;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title = 'Settings',
}) => {
  return (
    <Box className={styles.header}>
      <Typography variant="h4" className={styles.title}>
        {title}
      </Typography>
    </Box>
  );
};

export default SettingsHeader; 