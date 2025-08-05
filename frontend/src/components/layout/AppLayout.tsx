import { useLocation, Link, Outlet } from 'react-router-dom';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Assessment as ReportIcon,
  Settings,
  AdminPanelSettings,
  People as PeopleIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import UserAvatarMenu from '../UserAvatarMenu';
import FloatingActionButton from '../FloatingActionButton/FloatingActionButton';
import UploadModal from '../UploadModal/UploadModal';
import UploadProgressManager from '../UploadProgressManager/UploadProgressManager';
import { UploadProvider } from '../../contexts/UploadContext';
import styles from './AppLayout.module.scss';
import { CLOUDINARY_IMAGES } from '../../consts/cloudinary';



export default function AppLayout() {
  const location = useLocation();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);
  const { user } = useAuthStore();

  const handleFabClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleAdminMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchor(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchor(null);
  };

  // Navigation items with dynamic icon based on user type
  const navigationItems = [
    {
      path: '/dashboard',
      label: 'Overall Dashboard',
      icon: <DashboardIcon className={styles.icon} />,
    },
    {
      path: '/analysis',
      label: 'Analysis',
      icon: <AnalyticsIcon className={styles.icon} />,
    },
    {
      path: '/reporting',
      label: 'Reporting',
      icon: <ReportIcon className={styles.icon} />,
    },
    {
      path: user?.userType === 1 ? '/manage-account' : '/settings',
      label: user?.userType === 1 ? 'Administration' : 'Settings',
      icon: user?.userType === 1 ? <AdminPanelSettings className={styles.icon} /> : <Settings className={styles.icon} />,
    },
  ];

  return (
    <Box className={styles.appContainer}>
      {/* Header */}
      <Box className={styles.header}>
        {/* Logo */}
        <Box className={styles.logo}>
          <img 
            src={CLOUDINARY_IMAGES.LOGO.MAIN}
            alt="MyVAT Logo"
            style={{ height: '40px', width: 'auto' }}
          />
        </Box>

        {/* Search Bar */}
        <Box className={styles.searchBar}>
          <TextField
            className={styles.searchInput}
            placeholder="Search"
            variant="outlined"
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#40578c' }} />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#e5f2fb',
                borderRadius: '100px',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: '2px solid #0131ff',
                },
              },
            }}
          />
        </Box>

        {/* User Avatar Menu */}
        <UserAvatarMenu />
      </Box>

      {/* Body Container */}
      <Box className={styles.bodyContainer}>
        {/* Sidebar */}
        <Box className={styles.sidebar}>
          <Box className={styles.navigation}>
            {navigationItems.map((item) => {
              // Special handling for Administration item (admin/operator only)
              if (item.path === '/manage-account' && user?.userType === 1) {
                return (
                  <Box
                    key={item.path}
                    className={`${styles.navItem} ${
                      location.pathname === item.path ? styles.active : ''
                    }`}
                    onClick={handleAdminMenuOpen}
                    sx={{ cursor: 'pointer' }}
                  >
                    {item.icon}
                    <Typography className={styles.label}>{item.label}</Typography>
                  </Box>
                );
              }
              
              // Regular navigation items (including Settings for member/viewer)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${styles.navItem} ${
                    location.pathname === item.path ? styles.active : ''
                  }`}
                >
                  {item.icon}
                  <Typography className={styles.label}>{item.label}</Typography>
                </Link>
              );
            })}
          </Box>
        </Box>

        {/* Main Content */}
        <Box className={styles.mainContent}>
          {/* Content Area */}
          <Box className={styles.content}>
            <Outlet />
          </Box>
        </Box>
      </Box>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleFabClick} />

      {/* Administration Menu */}
      <Menu
        anchorEl={adminMenuAnchor}
        open={Boolean(adminMenuAnchor)}
        onClose={handleAdminMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPaper-root': {
            marginLeft: '4px',
          },
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2,
          },
        }}
      >
        <MenuItem onClick={handleAdminMenuClose} component={Link} to="/manage-account">
          <ListItemIcon>
            <PeopleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>User Management</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAdminMenuClose} component={Link} to="/entity-management">
          <ListItemIcon>
            <BusinessIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Entity Management</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAdminMenuClose} component={Link} to="/settings">
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
      </Menu>

      {/* Upload Components with Provider */}
      <UploadProvider>
        {/* Upload Modal */}
        <UploadModal 
          open={isUploadModalOpen} 
          onClose={handleCloseUploadModal} 
        />

        {/* Upload Progress Manager */}
        <UploadProgressManager />
      </UploadProvider>
    </Box>
  );
} 