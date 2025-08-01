import React, { useState } from 'react';
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
  onRoleChange: (userId: string, newRole: string, newUserType: number) => void;
  isLoading?: boolean;
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
  onRoleChange,
  isLoading = false
}) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!isLoading) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRoleSelect = (newRole: string, userType: number) => {
    if (newRole !== selectedRole) {
      setSelectedRole(newRole);
      onRoleChange(userId, newRole, userType);
    }
    handleClose();
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
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          minWidth: '100px',
          height: '36px',
          '&:hover': {
            backgroundColor: isLoading ? '#fff' : '#f5f5f5',
            borderColor: isLoading ? '#e0e0e0' : '#ccc',
          }
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: "'Roboto', sans-serif",
            color: isLoading ? '#999' : '#333',
          }}
        >
          {isLoading ? 'Updating...' : selectedRole}
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
            disabled={option.value === selectedRole || isLoading}
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