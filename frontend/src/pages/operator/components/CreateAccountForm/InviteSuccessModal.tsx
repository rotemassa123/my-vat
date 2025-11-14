import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface InviteSuccessModalProps {
  open: boolean;
  accountName: string;
  invitedEmails: string[];
  onClose: () => void;
}

const InviteSuccessModal: React.FC<InviteSuccessModalProps> = ({
  open,
  accountName,
  invitedEmails,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
          color: '#132465',
        }}
      >
        Invitations Sent
      </DialogTitle>
      <DialogContent dividers>
        <Typography
          sx={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 14,
            color: '#2c3e50',
            mb: 2,
          }}
        >
          The following users were invited to{' '}
          <strong>{accountName || 'this account'}</strong> as admin users.
        </Typography>
        <List>
          {invitedEmails.map((email) => (
            <ListItem key={email} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <CheckCircleOutlineIcon sx={{ color: '#2e7d32' }} />
              </ListItemIcon>
              <ListItemText
                primary={email}
                primaryTypographyProps={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 14,
                }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteSuccessModal;

