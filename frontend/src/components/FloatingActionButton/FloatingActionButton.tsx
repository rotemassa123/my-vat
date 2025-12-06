import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import styles from './FloatingActionButton.module.scss';

interface FloatingActionButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  disabled = false
}) => {
  return (
    <div className={styles.fabContainer}>
      <Tooltip title="AI Assistant" placement="left" arrow>
        <Fab
          color="primary"
          aria-label="open AI assistant"
          onClick={onClick}
          disabled={disabled}
          className={styles.fab}
          size="large"
        >
          <AutoAwesome className={styles.uploadIcon} />
        </Fab>
      </Tooltip>
    </div>
  );
};

export default FloatingActionButton; 