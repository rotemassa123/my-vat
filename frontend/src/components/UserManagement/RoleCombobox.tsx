import React, { useState, useEffect } from 'react';
import {
  Chip,
  Menu,
  MenuItem,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  KeyboardArrowDown as ChevronDownIcon,
} from '@mui/icons-material';

interface RoleComboboxProps {
  currentRole: string;
  userId: string;
  onRoleChange: (userId: string, newRole: string, newUserType: number) => Promise<void>;
}

const roleOptions = [
  { label: 'Admin', value: 'Admin', userType: 1 },
  { label: 'Member', value: 'Member', userType: 2 },
  { label: 'Viewer', value: 'Viewer', userType: 3 },
  { label: 'Guest', value: 'Guest', userType: 4 },
];

const RoleCombobox: React.FC<RoleComboboxProps> = ({ 
  currentRole, 
  userId,
  onRoleChange
}) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  // Update selectedRole when currentRole prop changes
  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRoleSelect = async (newRole: string, userType: number) => {
    if (newRole !== selectedRole) {
      setSelectedRole(newRole);
      handleClose(); // Close menu immediately
      
      try {
        await onRoleChange(userId, newRole, userType);
        // Success - role is updated
      } catch (error) {
        // Revert to original role on failure
        setSelectedRole(currentRole);
        console.error('Role update failed:', error);
      }
    } else {
      handleClose();
    }
  };

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
                 }}
               >
                 {selectedRole}
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
                         {roleOptions.map((option) => (
                   <MenuItem 
                     key={option.value}
                     onClick={() => handleRoleSelect(option.value, option.userType)}
                     disabled={option.value === selectedRole}
                   >
            <Typography variant="body2">
              {option.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default RoleCombobox; 