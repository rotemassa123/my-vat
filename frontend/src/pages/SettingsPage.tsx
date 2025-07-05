import { Box, Typography } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

export default function SettingsPage() {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      textAlign: 'center',
      padding: 3 
    }}>
      <SettingsIcon sx={{ fontSize: 64, color: '#0131ff', mb: 2 }} />
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600, color: '#001441' }}>
        Settings
      </Typography>
      <Typography variant="body1" sx={{ color: '#40578c' }}>
        Settings page coming soon...
      </Typography>
    </Box>
  );
} 