import { useLocation, Link, Outlet } from 'react-router-dom';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import UserAvatarMenu from '../UserAvatarMenu';
import FloatingActionButton from '../FloatingActionButton/FloatingActionButton';
import UploadModal from '../UploadModal/UploadModal';
import UploadProgressManager from '../UploadProgressManager/UploadProgressManager';
import ChatPanel from '../Chat/ChatPanel';
import { UploadProvider } from '../../contexts/UploadContext';
import RouteGuard from '../RouteGuard';
import styles from './AppLayout.module.scss';
import { CLOUDINARY_IMAGES } from '../../consts/cloudinary';
import { getNavigationItems, getUserTypeIndicator } from '../../consts/navigationItems';
import { useAppBootstrapContext } from '../../contexts/AppBootstrapContext';

export default function AppLayout() {
  const location = useLocation();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'ai' | 'support'>('ai');
  const [chatPanelWidth, setChatPanelWidth] = useState(() => {
    // Initialize to 15% of screen width
    if (typeof window !== 'undefined') {
      return window.innerWidth * 0.15;
    }
    return 300;
  });
  const { user } = useAuthStore();
  const {
    mandatoryStatus,
    mandatoryError,
    refresh: refreshBootstrap,
  } = useAppBootstrapContext();

  const handleFabClick = () => {
    setChatMode('ai');
    setIsChatPanelOpen(true);
  };

  const handleSupportClick = () => {
    setChatMode('support');
    setIsChatPanelOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleCloseChatPanel = () => {
    setIsChatPanelOpen(false);
  };

  const navigationItems = getNavigationItems(user?.userType);
  const userTypeIndicator = getUserTypeIndicator(user?.userType);

  if (mandatoryStatus === 'loading' || mandatoryStatus === 'idle') {
    return (
      <Box className={styles.bootstrapContainer}>
        <CircularProgress size={48} />
        <Typography variant="h6" mt={2}>
          Preparing your workspace…
        </Typography>
      </Box>
    );
  }

  if (mandatoryStatus === 'error') {
    return (
      <Box className={styles.bootstrapContainer}>
        <Typography variant="h6" color="error" mb={2}>
          {mandatoryError ?? 'Failed to load required data.'}
        </Typography>
        <Button variant="contained" onClick={refreshBootstrap}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box className={styles.appContainer}>
      <RouteGuard />
      {/* Header */}
      <Box className={styles.header}>
        {/* Logo */}
        <Box className={styles.logo}>
          <img 
            src={CLOUDINARY_IMAGES.LOGO.MAIN}
            alt="MyVAT Logo"
            style={{ height: '40px', width: 'auto' }}
          />
          {userTypeIndicator && (
            <Typography className={styles[userTypeIndicator.className]}>
              {userTypeIndicator.text}
            </Typography>
          )}
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
        <UserAvatarMenu onSupportClick={handleSupportClick} />
      </Box>

      {/* Body Container */}
      <Box className={styles.bodyContainer}>
        {/* Sidebar */}
        <Box className={styles.sidebar}>
          <Box className={styles.navigation}>
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`${styles.navItem} ${
                        location.pathname === item.path ? styles.active : ''
                      }`}
                    >
                      <IconComponent className={styles.icon} />
                      <Typography className={styles.label}>{item.label}</Typography>
                    </Link>
                  );
                })}
          </Box>
        </Box>

        {/* Main Content */}
        <Box 
          className={`${styles.mainContent} ${isChatPanelOpen ? styles.chatOpen : ''}`}
          style={{ marginRight: isChatPanelOpen ? `${chatPanelWidth}px` : 0 }}
        >
          {/* Content Area */}
          <Box className={`${styles.content} ${isChatPanelOpen ? styles.chatOpen : ''}`}>
            <Outlet />
          </Box>
        </Box>
      </Box>

      {/* Floating Action Button - Hide when chat panel is open */}
      {!isChatPanelOpen && (
        <FloatingActionButton onClick={handleFabClick} />
      )}

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={handleCloseChatPanel}
        width={chatPanelWidth}
        onWidthChange={setChatPanelWidth}
        mode={chatMode}
      />

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