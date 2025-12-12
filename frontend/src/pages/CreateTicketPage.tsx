import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { ticketsApi } from '../services/tickets.service';
import api from '../lib/api';
import styles from './CreateTicketPage.module.scss';

const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; attachments?: string[] }) =>
      ticketsApi.createTicket(data),
    onSuccess: (ticket) => {
      navigate(`/tickets/${ticket.id}`);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileUrls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileUrls.push(response.data.fileUrl);
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
    setAttachments([...attachments, ...fileUrls]);
  };

  const handleSubmit = () => {
    if (title.trim() && content.trim()) {
      createMutation.mutate({
        title: title.trim(),
        content: content.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    }
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tickets')}
          className={styles.backButton}
        >
          Back to Tickets
        </Button>
        <Typography variant="h4" className={styles.title}>
          Create New Ticket
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box className={styles.form}>
            <TextField
              fullWidth
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.field}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Description"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.field}
              required
              placeholder="Describe your issue or question..."
            />
            <Box className={styles.uploadSection}>
              <input
                accept="image/*,video/*"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  className={styles.uploadButton}
                >
                  Attach Files
                </Button>
              </label>
              {attachments.length > 0 && (
                <Box className={styles.attachmentsPreview}>
                  {attachments.map((url, idx) => (
                    <Chip
                      key={idx}
                      label={`Attachment ${idx + 1}`}
                      onDelete={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
            <Box className={styles.actions}>
              <Button
                variant="outlined"
                onClick={() => navigate('/tickets')}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                endIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={
                  !title.trim() ||
                  !content.trim() ||
                  createMutation.isPending
                }
              >
                {createMutation.isPending ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Creating...
                  </>
                ) : (
                  'Create Ticket'
                )}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateTicketPage;

