import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import styles from './JobTriggerButton.module.scss';

interface JobTriggerButtonProps {
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}

const JobTriggerButton: React.FC<JobTriggerButtonProps> = ({
  isLoading,
  disabled,
  onClick,
}) => {
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={onClick}
      disabled={disabled}
      startIcon={isLoading ? <CircularProgress size={16} className={styles.loader} /> : null}
      className={styles.triggerButton}
    >
      {isLoading ? 'Processing...' : 'Trigger'}
    </Button>
  );
};

export default JobTriggerButton;

