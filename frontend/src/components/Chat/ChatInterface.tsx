import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useChatWebSocket } from '../../hooks/chat/useChatWebSocket';
import { useAuthStore } from '../../store/authStore';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean; // Optional error flag for styling
}

const ChatInterface: React.FC = () => {
  const { user } = useAuthStore();
  const { messages, sendMessage, isConnected, isLoading } = useChatWebSocket(user?._id || 'demo-user');
  const [inputMessage, setInputMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add initial AI greeting only if no messages exist (first time user)
  useEffect(() => {
    if (messages.length === 0 && localMessages.length === 0 && isConnected) {
      const greetingMessage: ChatMessage = {
        id: 'greeting',
        content: `Good morning ${user?.fullName || 'there'}! I am your MyVAT personal assistant. I can help with your invoices and data, or general VAT rules. How can I help?`,
        isUser: false,
        timestamp: new Date(),
      };
      setLocalMessages([greetingMessage]);
    }
  }, [isConnected, user?.fullName, messages.length]);

  // Combine local messages with WebSocket messages (localMessages is just for greeting)
  const allMessages = [...messages, ...localMessages];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && !isLoading) {
      sendMessage(inputMessage);
      setInputMessage('');
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
          {allMessages.length === 0 ? (
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
                {isConnected ? 'Start a conversation with your VAT assistant!' : 'Connecting to AI assistant...'}
              </Typography>
            </Box>
          ) : (
            allMessages.map((message: ChatMessage) => (
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
            placeholder="Ask me about your invoices, VAT rules, or anything else..."
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
