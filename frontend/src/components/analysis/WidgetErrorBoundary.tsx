import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Alert, Button } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Widget error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            p: 2,
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <ErrorOutline color="error" sx={{ fontSize: 48 }} />
          <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
            Widget failed to render
            {this.state.error && (
              <Box component="div" sx={{ mt: 1, fontSize: '0.875rem', opacity: 0.8 }}>
                {this.state.error.message}
              </Box>
            )}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={this.handleRetry}
          >
            Retry
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

