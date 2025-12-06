import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import { Close as CloseIcon, AutoAwesome, Help as SupportIcon } from '@mui/icons-material';
import ChatInterface from './ChatInterface';
import styles from './ChatPanel.module.scss';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <Box
      ref={panelRef}
      className={`${styles.chatPanel} ${isResizing ? styles.resizing : ''}`}
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <Box className={styles.header}>
        <Box className={styles.headerLeft}>
          <IconComponent className={styles.icon} />
          <Box className={styles.title}>{title}</Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          className={styles.closeButton}
        >
          <CloseIcon />
        </IconButton>
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

      {/* Chat Content */}
      <Box className={styles.content}>
        <ChatInterface mode={mode} />
      </Box>
    </Box>
  );
};

export default ChatPanel;

