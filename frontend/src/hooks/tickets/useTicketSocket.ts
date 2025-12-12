import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { type TicketMessage, type Attachment } from '../../services/tickets.service';

interface UseTicketSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (content: string, attachments?: Attachment[]) => void;
}

export const useTicketSocket = (
  ticketId: string,
  userId: string,
  onNewMessage?: (message: TicketMessage) => void,
  onTicketUpdated?: (ticket: any) => void,
): UseTicketSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Use refs to store latest callbacks without triggering re-renders
  const onNewMessageRef = useRef(onNewMessage);
  const onTicketUpdatedRef = useRef(onTicketUpdated);

  // Update refs when callbacks change
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onTicketUpdatedRef.current = onTicketUpdated;
  }, [onNewMessage, onTicketUpdated]);

  useEffect(() => {
    if (!ticketId || !userId) return;

    console.log('Connecting to tickets WebSocket...');
    const newSocket = io(`${import.meta.env.VITE_WS_URL || 'http://localhost:8000'}/tickets`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Join ticket room
    newSocket.emit('join-ticket', { ticketId, userId });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to tickets server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from tickets server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Tickets WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Listen for new messages
    newSocket.on('new-message', (data: { ticketId: string; message: TicketMessage }) => {
      console.log('New message received:', data);
      if (onNewMessageRef.current) {
        onNewMessageRef.current(data.message);
      }
    });

    // Listen for ticket updates
    newSocket.on('ticket-updated', (data: { ticketId: string; ticket: any }) => {
      console.log('Ticket updated:', data);
      if (onTicketUpdatedRef.current) {
        onTicketUpdatedRef.current(data.ticket);
      }
    });

    // Listen for message errors
    newSocket.on('message-error', (data: { ticketId: string; error: string }) => {
      console.error('Message error:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [ticketId, userId]);

  const sendMessage = useCallback(
    (content: string, attachments?: Attachment[]) => {
      // Allow sending if there's content OR attachments (or both)
      const hasContent = content?.trim() || false;
      const hasAttachments = attachments && attachments.length > 0;
      
      if (socket && (hasContent || hasAttachments) && ticketId && userId) {
        socket.emit('send-message', {
          ticketId,
          userId,
          content: content || '',
          attachments: attachments || [],
        });
      }
    },
    [socket, ticketId, userId],
  );

  return {
    socket,
    isConnected,
    sendMessage,
  };
};

