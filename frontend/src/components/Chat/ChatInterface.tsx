import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useChatWebSocket } from '../../hooks/chat/useChatWebSocket';
import { useAuth } from '../../hooks/useAuth';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean; // Optional error flag for styling
}

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const { messages, sendMessage, isConnected, isLoading } = useChatWebSocket(user?.email || 'demo-user');
  const [inputMessage, setInputMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add initial AI greeting if no messages
  useEffect(() => {
    if (localMessages.length === 0 && isConnected) {
      const greetingMessage: ChatMessage = {
        id: 'greeting',
        content: `Good morning ${user?.name || 'there'}! I am your MyVAT personal assistant. I can help with your invoices and data, or general VAT rules. How can I help?`,
        isUser: false,
        timestamp: new Date(),
      };
      setLocalMessages([greetingMessage]);
    }
  }, [isConnected, user?.name]);

  // Combine local messages with WebSocket messages
  const allMessages = [...localMessages, ...messages];

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

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box
      sx={{
        height: '100%', // Take full available height
        display: 'flex',
        flexDirection: 'column',
        width: '100%', // Take full width
        padding: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: 3,
      }}
    >
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 4, // Much more rounded
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ChatIcon sx={{ fontSize: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            MyVAT AI Assistant
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
            {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
          </Typography>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Paper
        elevation={2}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          mb: 2,
          borderRadius: 4, // Much more rounded
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {allMessages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.secondary',
              }}
            >
              <Typography variant="body2"> {/* Smaller text */}
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
                  mb: 1,
                }}
              >
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    maxWidth: '80%',
                    borderRadius: 4, // Much more rounded
                    background: message.isError 
                      ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' // Red gradient for errors
                      : message.isUser 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    boxShadow: message.isError
                      ? '0 4px 15px rgba(255, 107, 107, 0.4)' // Red shadow for errors
                      : message.isUser 
                        ? '0 4px 15px rgba(102, 126, 234, 0.3)' 
                        : '0 4px 15px rgba(240, 147, 251, 0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}> {/* Smaller text */}
                    {message.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.25, // Smaller margin
                      opacity: 0.7,
                      fontSize: '0.7rem', // Smaller font
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Typography>
                </Paper>
              </Box>
            ))
          )}
          
          {isLoading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                mb: 1,
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  borderRadius: 4, // Much more rounded
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  AI is thinking...
                </Typography>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>
      </Paper>

      {/* Input Area */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          borderRadius: 4, // Much more rounded
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Ask me about your invoices, VAT rules, or anything else..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected || isLoading}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.9)',
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(255,255,255,0.8)',
                },
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
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                boxShadow: '0 6px 20px rgba(240, 147, 251, 0.6)',
              },
              '&:disabled': {
                background: 'rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.5)',
              }
            }}
            size="small"
          >
            <SendIcon fontSize="small" />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;
