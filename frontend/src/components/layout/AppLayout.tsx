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
import UserAvatarMenu from '../UserAvatarMenu';
import styles from './AppLayout.module.scss';

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

  return (
    <Box className={styles.appContainer}>
      {/* Header */}
      <Box className={styles.header}>
        {/* Logo */}
        <Box className={styles.logo}>
          <Typography className={styles.logoText}>
            MY<span className={styles.highlight}>VAT</span>
          </Typography>
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
    </Box>
  );
} 