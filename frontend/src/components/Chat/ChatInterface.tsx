import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useChat } from '../../hooks/chat/useChat';
import { useAuthStore } from '../../store/authStore';

export type ChatMode = 'ai' | 'support';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean; // Optional error flag for styling
}

interface ChatInterfaceProps {
  mode?: ChatMode;
  conversationId?: string;
  onMessageSent?: () => void;
  onConversationCreated?: (conversationId: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode = 'ai', conversationId, onMessageSent, onConversationCreated }) => {
  const { user } = useAuthStore();
  const isSupportMode = mode === 'support';
  const { messages, sendMessage, isConnected, isLoading, conversationId: currentConversationId } = useChat(conversationId);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() && !isLoading) {
      await sendMessage(inputMessage);
      setInputMessage('');
      
      // Notify parent if a new conversation was created
      if (currentConversationId && !conversationId && onConversationCreated) {
        onConversationCreated(currentConversationId);
      }
      
      // Notify parent to refresh conversations
      if (onMessageSent) {
        onMessageSent();
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        px: 2,
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
              }}
            >
              <Typography variant="body1">
                {isConnected 
                  ? (isSupportMode 
                      ? 'How can we help you today?' 
                      : 'Start a conversation with your VAT assistant!')
                  : (isSupportMode 
                      ? 'Connecting to support...' 
                      : 'Connecting to AI assistant...')}
              </Typography>
            </Box>
          ) : (
            messages.map((message: ChatMessage) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '80%',
                    p: 2,
                    borderRadius: '12px',
                    background: message.isError 
                      ? '#fee2e2'
                      : message.isUser 
                        ? '#3b82f6'
                        : '#f0f9ff',
                    color: message.isError 
                      ? '#dc2626'
                      : message.isUser 
                        ? 'white'
                        : '#1e40af',
                    border: message.isError 
                      ? '1px solid #fecaca'
                      : message.isUser 
                        ? 'none'
                        : '1px solid #dbeafe',
                  }}
                >
                  <Typography variant="body1" sx={{ wordBreak: 'break-word', lineHeight: 1.6 }}>
                    {message.content}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
          
          {isLoading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  background: '#f0f9ff',
                  color: '#1e40af',
                  border: '1px solid #dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={16} sx={{ color: '#1e40af' }} />
                <Typography variant="body1">
                  AI is thinking...
                </Typography>
              </Box>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          py: 3,
          px: 2,
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={isSupportMode 
              ? "Describe your issue or question..." 
              : "Ask me about your invoices, VAT rules, or anything else..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected || isLoading}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#3b82f6',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3b82f6',
                },
                '& .MuiInputBase-input': {
                  color: '#374151',
                  '&::placeholder': {
                    color: '#9ca3af',
                  }
                }
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected || isLoading}
            sx={{ 
              minWidth: 'auto', 
              px: 2, 
              py: 1.5,
              borderRadius: '12px',
              background: '#3b82f6',
              color: 'white',
              '&:hover': {
                background: '#2563eb',
              },
              '&:disabled': {
                background: '#d1d5db',
                color: '#9ca3af',
              },
            }}
            size="small"
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface;
