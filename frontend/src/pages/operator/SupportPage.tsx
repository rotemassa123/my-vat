import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  Chip,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import { Support as SupportIcon } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { ticketsApi, type Ticket } from '../../services/tickets.service';
import { useAuthStore } from '../../store/authStore';
import { useTicketStore } from '../../store/ticketStore';
import TicketDetailModal from '../../components/modals/TicketDetailModal';
import { format } from 'date-fns';
import styles from './SupportPage.module.scss';

const SupportPage: React.FC = () => {
  const { user } = useAuthStore();
  const tickets = useTicketStore((state) => state.tickets);
  const setTickets = useTicketStore((state) => state.setTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const assignMutation = useMutation({
    mutationFn: (ticketId: string) => ticketsApi.assignTicket(ticketId),
    onSuccess: (updatedTicket) => {
      // Update ticket in Zustand store
      const currentTickets = useTicketStore.getState().tickets;
      const updatedTickets = currentTickets.map((t) => 
        t.id === updatedTicket.id ? updatedTicket : t
      );
      setTickets(updatedTickets);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (ticketId: string) => ticketsApi.unassignTicket(ticketId),
    onSuccess: (updatedTicket) => {
      // Update ticket in Zustand store
      const currentTickets = useTicketStore.getState().tickets;
      const updatedTickets = currentTickets.map((t) => 
        t.id === updatedTicket.id ? updatedTicket : t
      );
      setTickets(updatedTickets);
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
    e.preventDefault();
    await assignMutation.mutateAsync(ticketId);
  };

  const handleUnassign = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await unassignMutation.mutateAsync(ticketId);
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

  // Filter tickets from Zustand store based on current tab
  const allTickets = tickets;
  const assignedToMeTickets = tickets.filter((ticket) => ticket.handlerId === user?._id);
  const unassignedTickets = tickets.filter((ticket) => !ticket.handlerId);
  
  const getDisplayedTickets = () => {
    switch (tabValue) {
      case 0:
        return allTickets;
      case 1:
        return assignedToMeTickets;
      case 2:
        return unassignedTickets;
      default:
        return allTickets;
    }
  };
  
  const displayedTickets = getDisplayedTickets();
  
  const getEmptyStateMessage = () => {
    switch (tabValue) {
      case 0:
        return 'No tickets';
      case 1:
        return 'No tickets assigned to you';
      case 2:
        return 'No unassigned tickets';
      default:
        return 'No tickets';
    }
  };

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
            <Tab label={`All Tickets (${allTickets.length})`} />
            <Tab label={`Assigned to Me (${assignedToMeTickets.length})`} />
            <Tab label={`Unassigned (${unassignedTickets.length})`} />
          </Tabs>

          {displayedTickets.length === 0 ? (
            <Box className={styles.emptyState}>
              <SupportIcon className={styles.emptyIcon} />
              <Typography variant="body1" className={styles.emptyText}>
                {getEmptyStateMessage()}
              </Typography>
            </Box>
          ) : (
            <List className={styles.ticketList}>
              {displayedTickets.map((ticket) => {
                const isAssignedToMe = ticket.handlerId === user?._id;
                const canAssign = !isAssignedToMe && ticket.status !== 'closed';
                const canUnassign = isAssignedToMe && ticket.status !== 'closed';

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
                            {isAssignedToMe && (
                              <Chip
                                label="Assigned to Me"
                                size="small"
                                color="primary"
                                sx={{
                                  borderRadius: '16px',
                                  fontSize: '0.75rem',
                                  height: '24px',
                                  ml: 0.5,
                                }}
                              />
                            )}
                            {canAssign && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleAssignToSelf(ticket.id, e);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                disabled={assignMutation.isPending || unassignMutation.isPending}
                                className={styles.assignButton}
                                sx={{
                                  borderRadius: '24px',
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                  padding: '4px 16px',
                                  ml: 0.5,
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                    borderColor: '#1976d2',
                                  },
                                }}
                              >
                                Assign to Me
                              </Button>
                            )}
                            {canUnassign && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleUnassign(ticket.id, e);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                disabled={assignMutation.isPending || unassignMutation.isPending}
                                className={styles.assignButton}
                                sx={{
                                  borderRadius: '24px',
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                  padding: '4px 16px',
                                  ml: 0.5,
                                  '&:hover': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.08)',
                                    borderColor: '#d32f2f',
                                  },
                                }}
                              >
                                Unassign
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
