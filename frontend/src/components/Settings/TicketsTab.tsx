import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Support as SupportIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi, type Ticket } from '../../services/tickets.service';
import { useAuthStore } from '../../store/authStore';
import CreateTicketModal from '../modals/CreateTicketModal';
import TicketDetailModal from '../modals/TicketDetailModal';
import styles from './TicketsTab.module.scss';
import { format } from 'date-fns';

const TicketsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-tickets'],
    queryFn: () => ticketsApi.getUserTickets(),
    staleTime: Infinity, // Data is only loaded on startup, never refetch
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsDetailModalOpen(true);
  };

  const handleCreateTicket = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTicketId(null);
  };

  const handleTicketCreated = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsDetailModalOpen(true);
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
      <Card className={styles.card}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.card}>
        <CardContent>
          <Typography color="error">
            Failed to load tickets. Please try again.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const tickets = data?.tickets || [];

  return (
    <Card className={styles.card}>
      <CardContent>
        <Box className={styles.header}>
          <Box className={styles.titleSection}>
            <SupportIcon className={styles.icon} />
            <Typography variant="h6" className={styles.title}>
              My Tickets
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateTicket}
            className={styles.createButton}
          >
            Open New Ticket
          </Button>
        </Box>

        {tickets.length === 0 ? (
          <Box className={styles.emptyState}>
            <SupportIcon className={styles.emptyIcon} />
            <Typography variant="body1" className={styles.emptyText}>
              You don't have any tickets yet.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateTicket}
              className={styles.emptyButton}
            >
              Create Your First Ticket
            </Button>
          </Box>
        ) : (
          <List className={styles.ticketList}>
            {tickets.map((ticket) => (
              <ListItem
                key={ticket.id}
                disablePadding
                className={styles.ticketItem}
              >
                <ListItemButton
                  onClick={() => handleTicketClick(ticket.id)}
                  selected={selectedTicketId === ticket.id}
                >
                  <ListItemText
                    primary={
                      <Box className={styles.ticketHeader}>
                        <Typography variant="subtitle1" className={styles.ticketTitle}>
                          {ticket.title}
                        </Typography>
                        <Chip
                          label={ticket.status}
                          size="small"
                          color={getStatusColor(ticket.status) as any}
                          className={styles.statusChip}
                        />
                      </Box>
                    }
                    secondary={
                      <Box className={styles.ticketMeta}>
                        <Typography variant="body2" color="text.secondary">
                          {ticket.handlerName
                            ? `Handled by ${ticket.handlerName}`
                            : 'Unassigned'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last updated: {format(new Date(ticket.lastMessageAt), 'MMM d, yyyy HH:mm')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      <CreateTicketModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />

      {selectedTicketId && (
        <TicketDetailModal
          open={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          ticketId={selectedTicketId}
        />
      )}
    </Card>
  );
};

export default TicketsTab;

