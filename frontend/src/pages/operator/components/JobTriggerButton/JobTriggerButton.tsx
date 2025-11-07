import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import type { JobTriggerButtonProps } from '../../types';
import { TEXT_CONSTANTS } from '../../consts';
import styles from './JobTriggerButton.module.scss';

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
      {isLoading ? TEXT_CONSTANTS.BUTTON_PROCESSING : TEXT_CONSTANTS.BUTTON_TRIGGER}
    </Button>
  );
};

export default JobTriggerButton;

