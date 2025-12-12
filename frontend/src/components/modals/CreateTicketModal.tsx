import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import { Close, Send, AttachFile } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../../services/tickets.service';
import apiClient from '../../lib/apiClient';
import { useNavigate } from 'react-router-dom';
import styles from './CreateTicketModal.module.scss';

interface CreateTicketModalProps {
  open: boolean;
  onClose: () => void;
  onTicketCreated?: (ticketId: string) => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ open, onClose, onTicketCreated }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; files?: File[] }) => {
      // First create the ticket
      const ticket = await ticketsApi.createTicket({
        title: data.title,
        content: data.content,
      });

      // Then upload files to ticket-specific path if any
      if (data.files && data.files.length > 0) {
        const attachments: Array<{ url: string; fileName: string }> = [];
        for (const file of data.files) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await apiClient.post(`/files/tickets/${ticket.id}/upload`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            attachments.push({
              url: response.data.fileUrl,
              fileName: file.name,
            });
          } catch (error) {
            console.error('File upload failed:', error);
          }
        }

        // Update ticket with attachments
        if (attachments.length > 0) {
          await ticketsApi.updateTicketAttachments(ticket.id, attachments);
          return { ...ticket, attachments };
        }
      }

      return ticket;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
      onClose();
      if (onTicketCreated) {
        onTicketCreated(ticket.id);
      } else {
        navigate(`/tickets/${ticket.id}`);
      }
    },
    onError: (error) => {
      console.error('Failed to create ticket:', error);
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setContent('');
      setAttachmentFiles([]);
      createMutation.reset();
    }
  }, [open]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setAttachmentFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (title.trim() && content.trim()) {
      createMutation.mutate({
        title: title.trim(),
        content: content.trim(),
        files: attachmentFiles.length > 0 ? attachmentFiles : undefined,
      });
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      onClose();
    }
  };

  const isFormValid = title.trim() && content.trim();
  const errorMessage = createMutation.isError
    ? createMutation.error instanceof Error
      ? createMutation.error.message
      : 'Unknown error'
    : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: styles.dialogPaper,
      }}
    >
      <Box className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>
          Create New Ticket
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={createMutation.isPending}
          className={styles.closeButton}
        >
          <Close />
        </IconButton>
      </Box>

      <Box className={styles.modalContent}>
        {errorMessage && (
          <Alert severity="error" className={styles.errorAlert}>
            Failed to create ticket: {errorMessage}
          </Alert>
        )}

        <Box className={styles.formContainer}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={createMutation.isPending}
            variant="outlined"
            className={styles.textField}
          />

          <TextField
            fullWidth
            multiline
            rows={5}
            label="Description"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Describe your issue or question..."
            disabled={createMutation.isPending}
            variant="outlined"
            className={styles.textField}
          />

          <Box className={styles.fileUploadSection}>
            <input
              accept="image/*,video/*"
              className={styles.hiddenInput}
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={createMutation.isPending}
            />
            <label htmlFor="file-upload">
              <Button
                component="span"
                variant="outlined"
                startIcon={<AttachFile />}
                disabled={createMutation.isPending}
                className={styles.attachButton}
              >
                Attach Files
              </Button>
            </label>
            {attachmentFiles.length > 0 && (
              <Box className={styles.attachmentsContainer}>
                {attachmentFiles.map((file, idx) => (
                  <Chip
                    key={idx}
                    label={file.name}
                    onDelete={() => removeAttachment(idx)}
                    size="small"
                    disabled={createMutation.isPending}
                    className={styles.attachmentChip}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Box className={styles.modalFooter}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={createMutation.isPending}
          className={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isFormValid || createMutation.isPending}
          size="large"
          className={styles.submitButton}
          endIcon={
            createMutation.isPending ? (
              <CircularProgress size={16} className={styles.loader} />
            ) : (
              <Send />
            )
          }
        >
          {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
        </Button>
      </Box>
    </Dialog>
  );
};

export default CreateTicketModal;

