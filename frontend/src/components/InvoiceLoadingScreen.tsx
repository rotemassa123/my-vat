import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  Paper,
  Button,
  Alert
} from '@mui/material';
import { Download, Refresh, Cancel } from '@mui/icons-material';

interface InvoiceLoadingScreenProps {
  isLoading: boolean;
  progress: number;
  totalLoaded: number;
  error: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

export default function InvoiceLoadingScreen({
  isLoading,
  progress,
  totalLoaded,
  error,
  onRetry,
  onCancel
}: InvoiceLoadingScreenProps) {
  const getStatusText = () => {
    if (error) return 'Loading failed';
    if (!isLoading && progress === 100) return 'Loading complete!';
    if (isLoading) return 'Loading your invoices...';
    return 'Preparing to load invoices';
  };

  const getSubtitleText = () => {
    if (error) return error;
    if (!isLoading && progress === 100) return `Successfully loaded ${totalLoaded.toLocaleString()} invoices`;
    if (isLoading && totalLoaded > 0) return `${totalLoaded.toLocaleString()} invoices loaded so far`;
    return 'This will only take a moment';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f3faff 0%, #e8f4fd 100%)',
        padding: 3
      }}
    >
      <Paper
        elevation={0}
        sx={{
          padding: 6,
          borderRadius: 3,
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Icon/Animation */}
        <Box sx={{ mb: 4 }}>
          {error ? (
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: '#ffebee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2
              }}
            >
              <Typography sx={{ fontSize: 40 }}>⚠️</Typography>
            </Box>
          ) : (
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant={isLoading ? "indeterminate" : "determinate"}
                value={progress}
                size={80}
                thickness={3}
                sx={{
                  color: '#0131ff',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Download sx={{ color: '#0131ff', fontSize: 32 }} />
              </Box>
            </Box>
          )}
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: error ? '#d32f2f' : '#1a1a1a',
            mb: 1
          }}
        >
          {getStatusText()}
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, lineHeight: 1.6 }}
        >
          {getSubtitleText()}
        </Typography>

        {/* Progress Bar */}
        {(isLoading || progress > 0) && !error && (
          <Box sx={{ mb: 4 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e3f2fd',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: '#0131ff'
                }
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, fontWeight: 500 }}
            >
              {progress}% complete
            </Typography>
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, textAlign: 'left' }}
          >
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        {(error || (!isLoading && onRetry)) && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {onRetry && (
              <Button
                variant="contained"
                onClick={onRetry}
                startIcon={<Refresh />}
                sx={{
                  backgroundColor: '#0131ff',
                  '&:hover': {
                    backgroundColor: '#0128cc'
                  }
                }}
              >
                {error ? 'Try Again' : 'Reload Invoices'}
              </Button>
            )}
            {isLoading && onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                startIcon={<Cancel />}
                sx={{
                  borderColor: '#ccc',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#999',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                Cancel
              </Button>
            )}
          </Box>
        )}

        {/* Loading tips */}
        {isLoading && !error && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 3,
              display: 'block',
              fontStyle: 'italic'
            }}
          >
            💡 We're loading all your invoices for lightning-fast filtering and searching
          </Typography>
        )}
      </Paper>
    </Box>
  );
} 