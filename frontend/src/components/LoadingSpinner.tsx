import { Box, CircularProgress } from '@mui/material';

export default function LoadingSpinner() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f3faff',
      }}
    >
      <CircularProgress size={48} sx={{ color: '#0131ff' }} />
    </Box>
  );
} 