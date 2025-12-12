import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Dialog,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Chip,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Close,
  AttachFile,
  Image as ImageIcon,
  VideoFile,
  PictureAsPdf,
  InsertDriveFile,
  Description,
  ArrowUpward,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, type Ticket, type TicketMessage } from '../../services/tickets.service';
import { useTicketSocket } from '../../hooks/tickets/useTicketSocket';
import { useAuthStore } from '../../store/authStore';
import { useTicketStore } from '../../store/ticketStore';
import { format } from 'date-fns';
import apiClient from '../../lib/apiClient';
import styles from './TicketDetailModal.module.scss';

interface TicketDetailModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ open, onClose, ticketId }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const tickets = useTicketStore((state) => state.tickets);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Array<{ url: string; fileName: string }>>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get ticket from Zustand store first (reactive)
  const cachedTicket = tickets.find((t) => t.id === ticketId);

  // Only fetch if ticket not found in store
  const { data: fetchedTicket, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketsApi.getTicketById(ticketId),
    enabled: open && !!ticketId && !cachedTicket,
    staleTime: Infinity,
  });

  // Use cached ticket if available, otherwise use fetched ticket
  const ticket = cachedTicket || fetchedTicket;

  // Note: We don't need a REST API mutation here since WebSocket handles the message sending
  // The socket gateway will save to MongoDB and broadcast updates

  const handleNewMessage = (newMessage: TicketMessage) => {
    // Update individual ticket cache
    queryClient.setQueryData(['ticket', ticketId], (old: Ticket | undefined) => {
      if (!old) return old;
      return {
        ...old,
        messages: [...old.messages, newMessage],
        lastMessageAt: newMessage.createdAt,
      };
    });
    
    // Update ticket in Zustand store
    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (currentTicket) {
      const newTicket: Ticket = {
        ...currentTicket,
        messages: [...currentTicket.messages, newMessage],
        lastMessageAt: newMessage.createdAt,
      };
      useTicketStore.getState().setTickets(
        tickets.map((t) => (t.id === ticketId ? newTicket : t))
      );
    }
  };

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    // Update individual ticket cache
    queryClient.setQueryData(['ticket', ticketId], updatedTicket);
    
    // Update ticket in Zustand store
    useTicketStore.getState().setTickets(
      tickets.map((t) => (t.id === ticketId ? updatedTicket : t))
    );
  };

  const { sendMessage: sendSocketMessage, isConnected } = useTicketSocket(
    open ? ticketId : '',
    user?._id || '',
    handleNewMessage,
    handleTicketUpdate,
  );

  useEffect(() => {
    if (open && ticket?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.messages, open]);

  useEffect(() => {
    if (!open) {
      setMessage('');
      setAttachments([]);
    }
  }, [open]);

  const handleSendMessage = () => {
    if (message.trim() || attachments.length > 0) {
      setIsSending(true);
      // Send via WebSocket - the gateway will save to MongoDB
      // Send attachments with both URL and fileName
      sendSocketMessage(message || '', attachments);
      // Clear local state immediately for better UX
      setMessage('');
      setAttachments([]);
      // Reset sending state after a short delay (message will be confirmed via socket events)
      setTimeout(() => setIsSending(false), 500);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Array<{ url: string; fileName: string }> = [];
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/files/tickets/${ticketId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        newAttachments.push({
          url: response.data.fileUrl,
          fileName: file.name,
        });
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (url: string | undefined) => {
    if (!url) return InsertDriveFile;
    
    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i);
    const isVideo = url.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv)$/i);
    const isPdf = url.match(/\.(pdf)$/i);
    const isDocument = url.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$/i);

    if (isImage) return ImageIcon;
    if (isVideo) return VideoFile;
    if (isPdf) return PictureAsPdf;
    if (isDocument) return Description;
    return InsertDriveFile;
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

  const isUser = (senderId: string) => senderId === user?._id;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: styles.dialogPaper,
      }}
    >
      {isLoading ? (
        <Box className={styles.loadingContainer}>
          <CircularProgress />
        </Box>
      ) : error || !ticket ? (
        <Box className={styles.errorContainer}>
          <Typography color="error">Failed to load ticket. Please try again.</Typography>
          <Button onClick={onClose}>Close</Button>
        </Box>
      ) : (
        <>
          <Box className={styles.modalHeader}>
            <Box className={styles.headerContent}>
              <Typography variant="h4" className={styles.modalTitle}>{ticket.title}</Typography>
              <Chip
                label={ticket.status}
                size="small"
                color={getStatusColor(ticket.status) as any}
                className={styles.statusChip}
              />
            </Box>
            <IconButton onClick={onClose} className={styles.closeButton}>
              <Close />
            </IconButton>
          </Box>

          <Box className={styles.modalContent}>
            {/* Conversation History */}
            <Box className={styles.conversationSection}>
              <Box className={styles.messagesList}>
                {/* Initial ticket description as first message */}
                <Box className={`${styles.messageRow} ${styles.userMessageRow}`}>
                  <Box className={styles.messageContentWrapper}>
                    <Typography variant="body2" className={styles.messageContent}>
                      {ticket.content}
                    </Typography>
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <Box className={styles.messageAttachments}>
                        {ticket.attachments.map((attachment, idx) => {
                          // Handle backward compatibility: attachment might be a string (old format) or object (new format)
                          const attachmentAny = attachment as any;
                          const attachmentUrl = typeof attachmentAny === 'string' ? attachmentAny : attachmentAny?.url;
                          const fileName = typeof attachmentAny === 'string' 
                            ? attachmentAny.split('/').pop() || 'file' 
                            : attachmentAny?.fileName || 'file';
                          
                          if (!attachmentUrl) return null;
                          
                          const FileIcon = getFileIcon(attachmentUrl);
                          const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
                          return (
                            <a
                              key={idx}
                              href={attachmentUrl}
                              download={fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.attachmentLink}
                            >
                              <Box className={styles.attachmentItem}>
                                <Box className={styles.attachmentIconContainer}>
                                  <FileIcon className={styles.attachmentIcon} />
                                  <Typography variant="caption" className={styles.attachmentIconText}>
                                    {fileExtension.length > 4 ? fileExtension.substring(0, 4) : fileExtension}
                                  </Typography>
                                </Box>
                                <Box className={styles.attachmentInfo}>
                                  <Typography variant="body2" className={styles.attachmentFileName}>
                                    {fileName}
                                  </Typography>
                                  <Typography variant="caption" className={styles.attachmentFileDetails}>
                                    {fileExtension.toLowerCase()}
                                  </Typography>
                                </Box>
                              </Box>
                            </a>
                          );
                        })}
                      </Box>
                    )}
                    <Typography variant="caption" className={styles.messageTime}>
                      {format(new Date(ticket.createdAt), 'MMM d, HH:mm')}
                    </Typography>
                  </Box>
                  <Avatar
                    className={styles.messageAvatar}
                    sx={{ bgcolor: '#2563eb' }}
                    src={user?.profile_image_url}
                  >
                    {user?.fullName
                      ?.split(' ')
                      .map((word) => word[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'U'}
                  </Avatar>
                </Box>

                {/* Rest of the messages */}
                {ticket.messages.map((msg, index) => {
                  const isUserMessage = isUser(msg.senderId);
                  return (
                    <Box
                      key={index}
                      className={`${styles.messageRow} ${
                        isUserMessage ? styles.userMessageRow : styles.operatorMessageRow
                      }`}
                    >
                      {!isUserMessage && (
                        <Avatar
                          className={styles.messageAvatar}
                          sx={{ bgcolor: '#6b7280' }}
                        >
                          {ticket.handlerName
                            ?.split(' ')
                            .map((word) => word[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || 'S'}
                        </Avatar>
                      )}
                      <Box className={styles.messageContentWrapper}>
                        <Typography variant="body2" className={styles.messageContent}>
                          {msg.content}
                        </Typography>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <Box className={styles.messageAttachments}>
                            {msg.attachments.map((attachment, idx) => {
                              // Handle backward compatibility: attachment might be a string (old format) or object (new format)
                              const attachmentAny = attachment as any;
                              const attachmentUrl = typeof attachmentAny === 'string' ? attachmentAny : attachmentAny?.url;
                              const fileName = typeof attachmentAny === 'string' 
                                ? attachmentAny.split('/').pop() || 'file' 
                                : attachmentAny?.fileName || 'file';
                              
                              if (!attachmentUrl) return null;
                              
                              const FileIcon = getFileIcon(attachmentUrl);
                              const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
                              return (
                                <a
                                  key={idx}
                                  href={attachmentUrl}
                                  download={fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.attachmentLink}
                                >
                                  <Box className={styles.attachmentItem}>
                                    <Box className={styles.attachmentIconContainer}>
                                      <FileIcon className={styles.attachmentIcon} />
                                      <Typography variant="caption" className={styles.attachmentIconText}>
                                        {fileExtension.length > 4 ? fileExtension.substring(0, 4) : fileExtension}
                                      </Typography>
                                    </Box>
                                    <Box className={styles.attachmentInfo}>
                                      <Typography variant="body2" className={styles.attachmentFileName}>
                                        {fileName}
                                      </Typography>
                                      <Typography variant="caption" className={styles.attachmentFileDetails}>
                                        {fileExtension.toLowerCase()}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </a>
                              );
                            })}
                          </Box>
                        )}
                        <Typography variant="caption" className={styles.messageTime}>
                          {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                        </Typography>
                      </Box>
                      {isUserMessage && (
                        <Avatar
                          className={styles.messageAvatar}
                          sx={{ bgcolor: '#2563eb' }}
                          src={user?.profile_image_url}
                        >
                          {user?.fullName
                            ?.split(' ')
                            .map((word) => word[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || 'U'}
                        </Avatar>
                      )}
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Box>
            </Box>

            {/* Message Input */}
            <Paper className={styles.inputArea}>
              <Box className={styles.inputWrapper}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={6}
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending || !isConnected}
                  className={styles.messageInput}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <Box className={styles.inputEndAdornment}>
                        {attachments.length > 0 && (
                          <Box className={styles.attachmentsPreview}>
                            {attachments.map((attachment, idx) => (
                              <Chip
                                key={idx}
                                label={attachment.fileName}
                                onDelete={() => removeAttachment(idx)}
                                size="small"
                                disabled={isSending || !isConnected}
                                className={styles.attachmentChip}
                              />
                            ))}
                          </Box>
                        )}
                        <input
                          accept="image/*,video/*"
                          className={styles.hiddenInput}
                          id={`file-upload-${ticketId}`}
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          disabled={isSending || !isConnected}
                        />
                        <label htmlFor={`file-upload-${ticketId}`}>
                          <IconButton component="span" size="small" className={styles.attachButton} disabled={isSending || !isConnected}>
                            <AttachFile />
                          </IconButton>
                        </label>
                        <IconButton
                          onClick={handleSendMessage}
                          disabled={(!message.trim() && attachments.length === 0) || isSending || !isConnected}
                          className={styles.sendButton}
                          size="small"
                        >
                          <ArrowUpward />
                        </IconButton>
                      </Box>
                    ),
                  }}
                />
              </Box>
              {!isConnected && (
                <Typography variant="caption" className={styles.connectionStatus}>
                  Connecting...
                </Typography>
              )}
            </Paper>
          </Box>
        </>
      )}
    </Dialog>
  );
};

export default TicketDetailModal;

