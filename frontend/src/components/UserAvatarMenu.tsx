import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountCircle,
  Settings,
  Logout,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/auth/useLogout';
import styles from './UserAvatarMenu.module.scss';

export default function UserAvatarMenu() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleProfile = () => {
    // Navigate to profile/account settings
    navigate('/manage-account');
    handleClose();
  };

  const handleSettings = () => {
    // Navigate to settings
    navigate('/settings');
    handleClose();
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.fullName || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const initials = getInitials(displayName);

  return (
    <Box className={styles.userProfileContainer}>
      <IconButton
        onClick={handleClick}
        className={styles.profileButton}
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Box className={styles.userProfile}>
          <Avatar
            className={styles.avatar}
            sx={{ bgcolor: '#0131ff' }}
            src={user?.profile_image_url}
          >
            {initials}
          </Avatar>
          <Box className={styles.userInfo}>
            <Typography className={styles.userName}>{displayName}</Typography>
            <Typography className={styles.userEmail}>{displayEmail}</Typography>
          </Box>
          <KeyboardArrowDown 
            className={`${styles.dropdownIcon} ${open ? styles.rotated : ''}`}
            sx={{ color: '#40578c' }}
          />
        </Box>
      </IconButton>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        className={styles.menu}
        PaperProps={{
          className: styles.menuPaper,
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box className={styles.menuHeader}>
          <Avatar
            className={styles.menuAvatar}
            sx={{ bgcolor: '#0131ff' }}
            src={user?.profile_image_url}
          >
            {initials}
          </Avatar>
          <Box className={styles.menuUserInfo}>
            <Typography className={styles.menuUserName}>{displayName}</Typography>
            <Typography className={styles.menuUserEmail}>{displayEmail}</Typography>
          </Box>
        </Box>

        <Divider className={styles.divider} />

        {/* Menu Items */}
        <MenuItem onClick={handleProfile} className={styles.menuItem}>
          <ListItemIcon className={styles.menuIcon}>
            <AccountCircle sx={{ color: '#40578c' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Manage account" 
            primaryTypographyProps={{ className: styles.menuText }}
          />
        </MenuItem>

        <MenuItem onClick={handleSettings} className={styles.menuItem}>
          <ListItemIcon className={styles.menuIcon}>
            <Settings sx={{ color: '#40578c' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Settings" 
            primaryTypographyProps={{ className: styles.menuText }}
          />
        </MenuItem>

        <Divider className={styles.divider} />

        <MenuItem onClick={handleLogout} className={styles.menuItem}>
          <ListItemIcon className={styles.menuIcon}>
            <Logout sx={{ color: '#40578c' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Sign out" 
            primaryTypographyProps={{ className: styles.menuText }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
} 