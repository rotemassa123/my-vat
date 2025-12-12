import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Avatar,
  IconButton,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, type Ticket, type TicketMessage } from '../services/tickets.service';
import { useTicketSocket } from '../hooks/tickets/useTicketSocket';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import styles from './TicketDetailPage.module.scss';
import api from '../lib/api';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getTicketById(id!),
    enabled: !!id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; attachments?: string[] }) =>
      ticketsApi.sendMessage(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
      setMessage('');
      setAttachments([]);
    },
  });

  const handleNewMessage = (newMessage: TicketMessage) => {
    queryClient.setQueryData(['ticket', id], (old: Ticket | undefined) => {
      if (!old) return old;
      return {
        ...old,
        messages: [...old.messages, newMessage],
        lastMessageAt: newMessage.createdAt,
      };
    });
    queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
  };

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    queryClient.setQueryData(['ticket', id], updatedTicket);
    queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
  };

  const { sendMessage: sendSocketMessage, isConnected } = useTicketSocket(
    id || '',
    user?._id || '',
    handleNewMessage,
    handleTicketUpdate,
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendMessage = () => {
    if (message.trim() || attachments.length > 0) {
      sendSocketMessage(message, attachments);
      sendMessageMutation.mutate({
        content: message,
        attachments,
      });
    }
  };

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

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'primary';
      case 'waiting':
        return 'warning';
      case 'closed':
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box className={styles.container}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error || !ticket) {
    return (
      <Box className={styles.container}>
        <Typography color="error">Failed to load ticket. Please try again.</Typography>
        <Button onClick={() => navigate('/tickets')}>Back to Tickets</Button>
      </Box>
    );
  }

  const isUser = (senderId: string) => senderId === user?._id;

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
        <Box className={styles.ticketInfo}>
          <Typography variant="h5" className={styles.title}>
            {ticket.title}
          </Typography>
          <Chip
            label={ticket.status}
            size="small"
            color={getStatusColor(ticket.status) as any}
            className={styles.statusChip}
          />
        </Box>
        {ticket.handlerName && (
          <Typography variant="body2" color="text.secondary">
            Handled by: {ticket.handlerName}
          </Typography>
        )}
      </Box>

      <Card className={styles.messagesCard}>
        <CardContent className={styles.messagesContent}>
          <Box className={styles.messagesList}>
            {ticket.messages.map((msg, index) => (
              <Box
                key={index}
                className={`${styles.messageBubble} ${
                  isUser(msg.senderId) ? styles.userMessage : styles.operatorMessage
                }`}
              >
                <Box className={styles.messageHeader}>
                  <Typography variant="caption" className={styles.senderName}>
                    {msg.senderType === 'user' ? 'You' : ticket.handlerName || 'Support'}
                  </Typography>
                  <Typography variant="caption" className={styles.messageTime}>
                    {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                  </Typography>
                </Box>
                <Typography variant="body1" className={styles.messageContent}>
                  {msg.content}
                </Typography>
                {msg.attachments && msg.attachments.length > 0 && (
                  <Box className={styles.attachments}>
                    {msg.attachments.map((url, idx) => (
                      <Box key={idx} className={styles.attachment}>
                        {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={url} alt={`Attachment ${idx + 1}`} className={styles.attachmentImage} />
                        ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video src={url} controls className={styles.attachmentVideo} />
                        ) : (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            View Attachment
                          </a>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        </CardContent>
      </Card>

      <Paper className={styles.inputArea}>
        <Box className={styles.inputContainer}>
          <input
            accept="image/*,video/*"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <IconButton component="span" size="small">
              <AttachFileIcon />
            </IconButton>
          </label>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className={styles.messageInput}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={(!message.trim() && attachments.length === 0) || sendMessageMutation.isPending}
          >
            Send
          </Button>
        </Box>
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
        {!isConnected && (
          <Typography variant="caption" color="warning" className={styles.connectionStatus}>
            Connecting...
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default TicketDetailPage;

