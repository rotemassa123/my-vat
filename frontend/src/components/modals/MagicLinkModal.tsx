import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useMagicLinkModalStore } from '../../store/modalStore';

const TEXT = {
  TITLE: 'Magic link ready',
  DESCRIPTION:
    'Open this link in an incognito window to avoid replacing your current session. It signs you in exactly as the selected user.',
  ACCOUNT_LABEL: 'Account',
  USER_LABEL: 'User',
  EMAIL_LABEL: 'Email',
  ENTITY_LABEL: 'Entity',
  LINK_LABEL: 'Magic link URL',
  EXPIRY_LABEL: 'Expires',
  COPY_TOOLTIP: 'Copy link to clipboard',
  CLOSE_BUTTON: 'Close',
  OPEN_BUTTON: 'Open link in new tab',
  COPY_SUCCESS: 'Link copied to clipboard.',
  COPY_FAILURE: 'Unable to copy link. Please copy it manually.',
  EMPTY_PLACEHOLDER: 'Magic link unavailable. Generate a new link to continue.',
} as const;

type SnackbarState =
  | {
      severity: 'success' | 'error';
      message: string;
    }
  | null;

const MagicLinkModal: React.FC = () => {
  const isOpen = useMagicLinkModalStore((state) => state.isOpen);
  const payload = useMagicLinkModalStore((state) => state.payload);
  const closeModal = useMagicLinkModalStore((state) => state.closeModal);

  const [snackbar, setSnackbar] = useState<SnackbarState>(null);

  const formattedExpiry = useMemo(() => {
    if (!payload?.expiresAt) {
      return null;
    }
    const date = new Date(payload.expiresAt);
    return Number.isNaN(date.getTime()) ? payload.expiresAt : date.toLocaleString();
  }, [payload?.expiresAt]);

  const handleClose = () => {
    closeModal();
    setSnackbar(null);
  };

  const handleCopyLink = async () => {
    if (!payload?.link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(payload.link);
      setSnackbar({
        severity: 'success',
        message: TEXT.COPY_SUCCESS,
      });
    } catch (error) {
      console.error('Failed to copy link', error);
      setSnackbar({
        severity: 'error',
        message: TEXT.COPY_FAILURE,
      });
    }
  };

  const handleOpenLink = () => {
    if (!payload?.link) {
      return;
    }
    window.open(payload.link, '_blank', 'noopener,noreferrer');
  };

  const handleSnackbarClose = () => {
    setSnackbar(null);
  };

  return (
    <>
      <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{TEXT.TITLE}</DialogTitle>
        <DialogContent dividers>
          {payload?.link ? (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {TEXT.DESCRIPTION}
              </Typography>

              <Stack spacing={1.5}>
                {payload.accountName ? (
                  <Stack spacing={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      {TEXT.ACCOUNT_LABEL}
                    </Typography>
                    <Typography variant="body2">{payload.accountName}</Typography>
                  </Stack>
                ) : null}

                {payload.userName ? (
                  <Stack spacing={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      {TEXT.USER_LABEL}
                    </Typography>
                    <Typography variant="body2">{payload.userName}</Typography>
                  </Stack>
                ) : null}

                {payload.userEmail ? (
                  <Stack spacing={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      {TEXT.EMAIL_LABEL}
                    </Typography>
                    <Typography variant="body2">{payload.userEmail}</Typography>
                  </Stack>
                ) : null}

                {payload.entityName ? (
                  <Stack spacing={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      {TEXT.ENTITY_LABEL}
                    </Typography>
                    <Typography variant="body2">{payload.entityName}</Typography>
                  </Stack>
                ) : null}
                {formattedExpiry ? (
                  <Stack spacing={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      {TEXT.EXPIRY_LABEL}
                    </Typography>
                    <Typography variant="body2">{formattedExpiry}</Typography>
                  </Stack>
                ) : null}
              </Stack>

              <Divider />

              <TextField
                label={TEXT.LINK_LABEL}
                value={payload.link}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={TEXT.COPY_TOOLTIP}>
                        <span>
                          <IconButton onClick={handleCopyLink} edge="end">
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />

              {payload.isImpersonating ? (
                <Typography variant="body1" sx={{ color: 'error.main', fontWeight: 500 }}>
                  You are about to impersonate the user. All your actions would be indescernible from the user you are impersonating. proceed with caution.
                </Typography>
              ) : null}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {TEXT.EMPTY_PLACEHOLDER}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{TEXT.CLOSE_BUTTON}</Button>
          <Button
            onClick={handleOpenLink}
            startIcon={<OpenInNewIcon />}
            disabled={!payload?.link}
          >
            {TEXT.OPEN_BUTTON}
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar ? (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={handleSnackbarClose}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      ) : null}
    </>
  );
};

export default MagicLinkModal;

