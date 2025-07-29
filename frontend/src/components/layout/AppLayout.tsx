import { useLocation, Link, Outlet } from 'react-router-dom';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  AccountCircle,
} from '@mui/icons-material';
import { useState } from 'react';
import UserAvatarMenu from '../UserAvatarMenu';
import FloatingActionButton from '../FloatingActionButton/FloatingActionButton';
import UploadModal from '../UploadModal/UploadModal';
import UploadProgressManager from '../UploadProgressManager/UploadProgressManager';
import { UploadProvider } from '../../contexts/UploadContext';
import styles from './AppLayout.module.scss';
import { CLOUDINARY_IMAGES } from '../../consts/cloudinary';

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
    path: '/manage-account',
    label: 'Manage account',
    icon: <AccountCircle className={styles.icon} />,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: <SettingsIcon className={styles.icon} />,
  },
];

export default function AppLayout() {
  const location = useLocation();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleFabClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

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
            {navigationItems.map((item) => (
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
            ))}
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