import React, { useState, useEffect } from 'react';
import {
  Menu,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import {
  KeyboardArrowDown as ChevronDownIcon,
} from '@mui/icons-material';

interface Entity {
  _id: string;
  name: string;
}

interface EntityComboboxProps {
  currentEntity: string;
  userId: string;
  userRole: string; // To check if user is admin
  entities: Entity[];
  onEntityChange: (userId: string, newEntityId: string) => Promise<void>;
}

const EntityCombobox: React.FC<EntityComboboxProps> = ({ 
  currentEntity, 
  userId,
  userRole,
  entities,
  onEntityChange
}) => {
  const [selectedEntity, setSelectedEntity] = useState(currentEntity);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Update selectedEntity when currentEntity prop changes
  useEffect(() => {
    setSelectedEntity(currentEntity);
  }, [currentEntity]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    // Don't allow entity changes for admin users
    if (userRole === 'Admin') {
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEntitySelect = async (newEntityId: string, newEntityName: string) => {
    if (newEntityId !== selectedEntity) {
      setSelectedEntity(newEntityName);
      handleClose(); // Close menu immediately
      
      try {
        await onEntityChange(userId, newEntityId);
        // Success - entity is updated
      } catch (error) {
        // Revert to original entity on failure
        setSelectedEntity(currentEntity);
        console.error('Entity update failed:', error);
      }
    } else {
      handleClose();
    }
  };

  // If user is admin, show "No Entity" and don't allow changes
  if (userRole === 'Admin') {
    return (
      <Typography
        variant="body2"
        sx={{
          fontSize: '14px',
          fontWeight: 500,
          fontFamily: "'Roboto', sans-serif",
          color: '#999',
        }}
      >
        No Entity
      </Typography>
    );
  }

  return (
    <Box>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          minWidth: '100px',
          height: '36px',
          '&:hover': {
            backgroundColor: '#f5f5f5',
            borderColor: '#ccc',
          }
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: "'Roboto', sans-serif",
            color: '#333',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '80px', // Leave space for chevron
          }}
        >
          {selectedEntity || 'Select Entity'}
        </Typography>
        <ChevronDownIcon 
          fontSize="small" 
          sx={{ 
            fontSize: '18px',
            color: '#666',
            ml: 0.5
          }} 
        />
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {entities.map((entity) => (
          <MenuItem 
            key={entity._id}
            onClick={() => handleEntitySelect(entity._id, entity.entity_name || 'Unnamed Entity')}
            disabled={(entity.entity_name || 'Unnamed Entity') === selectedEntity}
          >
            <Typography variant="body2">
              {entity.entity_name || 'Unnamed Entity'}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default EntityCombobox; 