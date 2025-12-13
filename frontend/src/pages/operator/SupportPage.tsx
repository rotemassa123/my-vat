import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import { Support as SupportIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, type Ticket } from '../../services/tickets.service';
import { useAuthStore } from '../../store/authStore';
import { useTicketStore } from '../../store/ticketStore';
import TicketDetailModal from '../../components/modals/TicketDetailModal';
import { format } from 'date-fns';
import styles from './SupportPage.module.scss';

const SupportPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const tickets = useTicketStore((state) => state.tickets);
  const setTickets = useTicketStore((state) => state.setTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Get all tickets (for operators, getUserTickets returns all tickets)
  const { data: allTicketsData, isLoading: isLoadingAll, error } = useQuery({
    queryKey: ['user-tickets'],
    queryFn: () => ticketsApi.getUserTickets(),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const assignMutation = useMutation({
    mutationFn: (ticketId: string) => ticketsApi.assignTicket(ticketId),
    onSuccess: (updatedTicket) => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] });
      // Update ticket in Zustand store
      const updatedTickets = tickets.map((t) => 
        t.id === updatedTicket.id ? updatedTicket : t
      );
      setTickets(updatedTickets);
      // Update individual ticket cache
      queryClient.setQueryData(['ticket', updatedTicket.id], updatedTicket);
    },
  });

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTicketId(null);
  };

  const handleAssignToSelf = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await assignMutation.mutateAsync(ticketId);
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

  if (isLoadingAll) {
    return (
      <Box className={styles.container}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={styles.container}>
        <Card>
          <CardContent>
            <Typography color="error">
              Failed to load tickets. Please try again.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const allTickets = allTicketsData?.tickets || [];
  const unhandledTickets = allTickets.filter((ticket) => ticket.status === 'open');
  const displayedTickets = tabValue === 0 ? unhandledTickets : allTickets;

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Box className={styles.titleSection}>
          <SupportIcon className={styles.icon} />
          <Typography variant="h4" className={styles.title}>
            Support Tickets
          </Typography>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} className={styles.tabs}>
            <Tab label={`Unhandled (${unhandledTickets.length})`} />
            <Tab label={`All Tickets (${allTickets.length})`} />
          </Tabs>

          {displayedTickets.length === 0 ? (
            <Box className={styles.emptyState}>
              <SupportIcon className={styles.emptyIcon} />
              <Typography variant="body1" className={styles.emptyText}>
                {tabValue === 0 ? 'No unhandled tickets' : 'No tickets'}
              </Typography>
            </Box>
          ) : (
            <List className={styles.ticketList}>
              {displayedTickets.map((ticket) => {
                const isAssignedToMe = ticket.handlerId === user?._id;
                const canAssign = !isAssignedToMe && ticket.status !== 'closed';

                return (
                  <ListItem
                    key={ticket.id}
                    disablePadding
                    className={styles.ticketItem}
                  >
                    <ListItemButton
                      onClick={() => handleTicketClick(ticket.id)}
                      selected={selectedTicketId === ticket.id}
                      className={styles.ticketButton}
                    >
                      <Box className={styles.ticketContent}>
                        <Box className={styles.ticketHeader}>
                          <Typography variant="subtitle1" className={styles.ticketTitle}>
                            {ticket.title}
                          </Typography>
                          <Box className={styles.ticketActions}>
                            <Chip
                              label={ticket.status}
                              size="small"
                              color={getStatusColor(ticket.status) as any}
                              className={styles.statusChip}
                            />
                            {canAssign && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => handleAssignToSelf(ticket.id, e)}
                                disabled={assignMutation.isPending}
                                className={styles.assignButton}
                                sx={{
                                  borderRadius: '24px',
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                  padding: '4px 16px',
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                    borderColor: '#1976d2',
                                  },
                                }}
                              >
                                Assign to Me
                              </Button>
                            )}
                          </Box>
                        </Box>
                        <Box className={styles.ticketMeta}>
                          <Typography variant="body2" color="text.secondary">
                            {ticket.handlerName
                              ? `Handled by ${ticket.handlerName}${isAssignedToMe ? ' (You)' : ''}`
                              : 'Unassigned'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last updated: {format(new Date(ticket.lastMessageAt), 'MMM d, yyyy HH:mm')}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {selectedTicketId && (
        <TicketDetailModal
          open={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          ticketId={selectedTicketId}
        />
      )}
    </Box>
  );
};

export default SupportPage;
