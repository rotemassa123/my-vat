import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Block,
  Cancel,
} from '@mui/icons-material';
import styles from './EntityManagement.module.scss';

interface Entity {
  id: string;
  name: string;
  type: string;
  registrationNumber: string;
  status: string;
  location: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface EntityRowProps {
  entity: Entity;
  onActionClick: (event: React.MouseEvent<HTMLElement>, entityId: string) => void;
  isEditing?: boolean;
  editingName?: string;
  onNameChange?: (name: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
}

const EntityRow: React.FC<EntityRowProps> = ({ 
  entity, 
  onActionClick,
  isEditing = false,
  editingName = '',
  onNameChange,
  onSave,
  onCancel
}) => {
  const [isInitialMount, setIsInitialMount] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Track when editing starts to prevent immediate blur
  React.useEffect(() => {
    if (isEditing) {
      setIsInitialMount(true);
      // Select all text when editing starts
      if (inputRef.current) {
        inputRef.current.select();
      }
      // Allow blur to work after a short delay
      const timer = setTimeout(() => {
        setIsInitialMount(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleBlur = () => {
    // Prevent blur during initial mount
    if (!isInitialMount && onSave) {
      onSave();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#4CAF50';
      case 'Inactive':
        return '#FF9800';
      case 'Dissolved':
        return '#D32F2F';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle sx={{ fontSize: 16, color: '#4CAF50' }} />;
      case 'Inactive':
        return <Block sx={{ fontSize: 16, color: '#FF9800' }} />;
      case 'Dissolved':
        return <Cancel sx={{ fontSize: 16, color: '#D32F2F' }} />;
      default:
        return <CheckCircle sx={{ fontSize: 16, color: '#9E9E9E' }} />;
    }
  };

  return (
    <Box key={entity.id} className={styles.tableRow}>
      <Box className={styles.userCell} style={{ width: '25%' }}>
        {isEditing ? (
          <TextField
            inputRef={inputRef}
            value={editingName}
            onChange={(e) => onNameChange?.(e.target.value)}
            onBlur={handleBlur}
            variant="outlined"
            size="small"
            autoFocus
            fullWidth
            className={styles.editInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSave?.();
              } else if (e.key === 'Escape') {
                onCancel?.();
              }
            }}
          />
        ) : (
          <Typography variant="body1" className={styles.userName}>
            {entity.name}
          </Typography>
        )}
      </Box>
      <Box className={styles.roleCell} style={{ width: '15%' }}>
        <Typography variant="body2" className={styles.typeText}>
          {entity.type}
        </Typography>
      </Box>
      <Box className={styles.entityCell} style={{ width: '15%' }}>
        <Typography variant="body2" className={styles.regNumberText}>
          {entity.registrationNumber}
        </Typography>
      </Box>
      <Box className={styles.statusCell} style={{ width: '12%' }}>
        <Box className={styles.statusContainer}>
          {getStatusIcon(entity.status)}
          <Typography 
            variant="body2" 
            className={styles.statusText}
            sx={{ color: getStatusColor(entity.status) }}
          >
            {entity.status}
          </Typography>
        </Box>
      </Box>
      <Box className={styles.lastLoginCell} style={{ width: '20%' }}>
        <Typography variant="body2" className={styles.locationText}>
          {entity.location}
        </Typography>
      </Box>
      <Box className={styles.createdCell} style={{ width: '9%' }}>
        <Typography variant="body2" className={styles.createdText}>
          {entity.createdAt}
        </Typography>
      </Box>
      <Box className={styles.actionCell} style={{ width: '4%' }}>
        {!isEditing && (
          <IconButton
            onClick={(e: React.MouseEvent<HTMLElement>) => onActionClick(e, entity.id)}
            className={styles.actionButton}
          >
            <MoreVert />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default EntityRow;

