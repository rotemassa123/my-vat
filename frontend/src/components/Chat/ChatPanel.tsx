import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, TextField, InputAdornment, Typography, Paper, List, ListItem, ListItemButton, ListItemText, Tooltip, Menu, MenuItem } from '@mui/material';
import { Close as CloseIcon, AutoAwesome, Help as SupportIcon, Add as AddIcon, Search as SearchIcon, History as HistoryIcon, MoreVert as MoreVertIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ChatInterface from './ChatInterface';
import styles from './ChatPanel.module.scss';
import { chatApi } from '../../services/chat.service';
import type { Conversation } from '../../services/chat.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type ChatMode = 'ai' | 'support';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  mode?: ChatMode;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, width, onWidthChange, mode = 'ai' }) => {
  const isSupportMode = mode === 'support';
  const title = isSupportMode ? 'Chat with support' : 'AI Assistant';
  const IconComponent = isSupportMode ? SupportIcon : AutoAwesome;
  const [isResizing, setIsResizing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [overflowMenuAnchor, setOverflowMenuAnchor] = useState<null | HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.listConversations(50),
    enabled: isOpen,
  });

  // Create new conversation mutation - removed, conversations are created on first message

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = window.innerWidth * 0.1; // 10% minimum
      const maxWidth = window.innerWidth * 0.5; // 50% maximum

      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onWidthChange]);

  // Filter conversations by search query
  const filteredConversations = conversationsData?.conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    !searchQuery
  ) || [];

  // Sort by last message date (most recent first)
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
    const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  // Limit visible conversations and show overflow menu
  const MAX_VISIBLE_CONVERSATIONS = 8;
  const visibleConversations = sortedConversations.slice(0, MAX_VISIBLE_CONVERSATIONS);
  const overflowConversations = sortedConversations.slice(MAX_VISIBLE_CONVERSATIONS);

  const handleNewConversation = () => {
    // Clear current conversation - new conversation will be created on first message
    setSelectedConversationId(null);
    setShowHistory(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowHistory(false);
  };

  const handleOpenOverflowMenu = (event: React.MouseEvent<HTMLElement>) => {
    setOverflowMenuAnchor(event.currentTarget);
  };

  const handleCloseOverflowMenu = () => {
    setOverflowMenuAnchor(null);
  };

  const handleSelectFromOverflow = (conversationId: string) => {
    handleSelectConversation(conversationId);
    handleCloseOverflowMenu();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overflow Menu */}
      <Menu
        anchorEl={overflowMenuAnchor}
        open={Boolean(overflowMenuAnchor)}
        onClose={handleCloseOverflowMenu}
        PaperProps={{
          sx: {
            maxHeight: '300px',
            width: '280px',
            mt: 0.5,
          },
        }}
      >
        {overflowConversations.map((conversation) => (
          <MenuItem
            key={conversation.id}
            selected={selectedConversationId === conversation.id}
            onClick={() => handleSelectFromOverflow(conversation.id)}
            sx={{
              '&.Mui-selected': {
                bgcolor: '#eff6ff',
              },
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: selectedConversationId === conversation.id ? 600 : 400,
                  color: '#1f2937',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.25,
                }}
              >
                {conversation.title || 'New Conversation'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#6b7280',
                  fontSize: '0.7rem',
                }}
              >
                {conversation.lastMessageAt
                  ? new Date(conversation.lastMessageAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : new Date(conversation.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      <Box
        ref={panelRef}
        className={`${styles.chatPanel} ${isResizing ? styles.resizing : ''}`}
        style={{ width: `${width}px` }}
      >
        {/* Header */}
        <Box className={styles.header}>
          <Box className={styles.headerLeft}>
            {showHistory ? (
              <>
                <Tooltip title="Back to chat" arrow>
                  <IconButton
                    onClick={() => setShowHistory(false)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
                <HistoryIcon className={styles.icon} />
                <Box className={styles.title}>Conversations</Box>
              </>
            ) : (
              <>
                <IconComponent className={styles.icon} />
                <Box className={styles.title}>{title}</Box>
              </>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {!showHistory && (
              <Tooltip title="New conversation" arrow>
                <IconButton
                  onClick={handleNewConversation}
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            )}
            {!showHistory && (
              <Tooltip title="Conversation history" arrow>
                <IconButton
                  onClick={() => setShowHistory(true)}
                  size="small"
                >
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Close" arrow>
              <IconButton
                onClick={onClose}
                size="small"
                className={styles.closeButton}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Resize Handle */}
        <Box
          ref={resizeRef}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className={styles.resizeHandle}
        />

        {/* Content - Chat or Conversations */}
        <Box className={styles.content}>
          {showHistory ? (
            <>
              {/* Search Bar */}
              <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb', bgcolor: '#f9fafb' }}>
                <TextField
                  size="small"
                  placeholder="Search conversations..."
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: '#6b7280' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                  }}
                />
              </Box>

              {/* Conversation List */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {conversationsLoading ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Loading...
                    </Typography>
                  </Box>
                ) : sortedConversations.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ py: 0 }}>
                    {visibleConversations.map((conversation) => (
                      <ListItem
                        key={conversation.id}
                        disablePadding
                        sx={{
                          '&:hover': {
                            bgcolor: '#f3f4f6',
                          },
                        }}
                      >
                        <ListItemButton
                          selected={selectedConversationId === conversation.id}
                          onClick={() => handleSelectConversation(conversation.id)}
                          sx={{
                            py: 1.5,
                            px: 2,
                            '&.Mui-selected': {
                              bgcolor: '#eff6ff',
                              borderLeft: '3px solid #3b82f6',
                              '&:hover': {
                                bgcolor: '#dbeafe',
                              },
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: selectedConversationId === conversation.id ? 600 : 400,
                                  color: '#1f2937',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {conversation.title || 'New Conversation'}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#6b7280',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {conversation.lastMessageAt
                                  ? new Date(conversation.lastMessageAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })
                                  : new Date(conversation.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                    
                    {/* Three-dots overflow menu */}
                    {overflowConversations.length > 0 && (
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={handleOpenOverflowMenu}
                          sx={{
                            py: 0.75,
                            px: 2,
                            justifyContent: 'center',
                            '&:hover': {
                              bgcolor: '#f3f4f6',
                            },
                          }}
                        >
                          <MoreVertIcon sx={{ fontSize: '16px', color: '#6b7280' }} />
                        </ListItemButton>
                      </ListItem>
                    )}
                  </List>
                )}
              </Box>
            </>
          ) : (
            <ChatInterface 
              mode={mode} 
              conversationId={selectedConversationId || undefined}
              onMessageSent={() => {
                // Refresh conversations after a short delay to allow title generation
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['conversations'] });
                }, 2000);
              }}
              onConversationCreated={(conversationId) => {
                setSelectedConversationId(conversationId);
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
              }}
            />
          )}
        </Box>
      </Box>
    </>
  );
};

export default ChatPanel;

